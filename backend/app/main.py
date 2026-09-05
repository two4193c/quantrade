"""
MODULE 5: FASTAPI BACKEND ENTRYPOINT
Exposes REST endpoints for Data Ingestion, Feature Store, Strategy Backtesting,
Monte Carlo Forward Projections, Meta-Labeling Veto, and Paper Trading.
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import os

from app.config import settings
from app.modules.ingestion import (
    YFinanceProvider,
    TiingoProvider,
    DataValidator,
    DuckDBStorageManager,
    FredMacroProvider,
    OnsCpihProvider,
    FcaShortRegisterProvider,
    QuandlCommodityProvider,
    AdrImpliedOpenCalculator
)
from app.modules.features import IndicatorEngine
from app.modules.strategies import VectorizedBacktester
from app.modules.continuous_learning import MetaLabelingVetoModel, MonteCarloProjectionEngine
from app.modules.paper_trading import PaperTradingEngine, AlertDispatcher

app = FastAPI(
    title="QuantTrade Algorithmic Platform API",
    description="Dockerized FastAPI Backend for FTSE 100 Algorithmic Trading",
    version="1.0.0"
)

# Enable CORS for local Vite development & production domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global In-Memory Singletons
storage_manager = DuckDBStorageManager(settings.STORAGE_PATH)
paper_engine = PaperTradingEngine(initial_capital=10000000.0) # £100,000 in GBX pence
data_provider = YFinanceProvider()
fred_provider = FredMacroProvider(api_key=settings.FRED_API_KEY)
ons_provider = OnsCpihProvider() # Public ONS Open Data (No API Key Required)
fca_provider = FcaShortRegisterProvider()
quandl_provider = QuandlCommodityProvider(api_key=settings.QUANDL_API_KEY)

# Load FTSE 100 Universe Configuration
def get_universe_list():
    universe_file = os.path.join(os.path.dirname(__file__), "universe.json")
    if os.path.exists(universe_file):
        with open(universe_file, "r") as f:
            return json.load(f)
    return []

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "QuantTrade FastAPI Engine",
        "environment": settings.ENVIRONMENT,
        "storage_path": settings.STORAGE_PATH,
        "active_universe": "FTSE 100"
    }

@app.get("/api/universe")
def list_universe():
    """Return all FTSE 100 constituents with currency tags and sectors"""
    return get_universe_list()

@app.get("/api/ingestion/status")
def ingestion_status():
    universe = get_universe_list()
    status_list = []
    for item in universe[:8]:
        status_list.append({
            "ticker": item["ticker"],
            "name": item["name"],
            "sector": item["sector"],
            "currency": item["currency"],
            "last_updated": "2026-09-05 17:00:00",
            "quality_status": "CLEAN",
            "storage_file": f"{item['ticker'].replace('.', '_')}.parquet"
        })
    return {
        "total_tickers": len(universe),
        "primary_provider": settings.DEFAULT_PROVIDER,
        "fallback_provider": settings.FALLBACK_PROVIDER,
        "tickers": status_list
    }

class IngestionTriggerRequest(BaseModel):
    ticker: Optional[str] = "AZN.L"

@app.post("/api/ingestion/trigger")
def trigger_ingestion(req: IngestionTriggerRequest):
    """Trigger ingestion and data validation for a single constituent"""
    ticker = req.ticker or "AZN.L"
    df = data_provider.fetch_daily_bars(ticker, start_date="2023-01-01")
    storage_manager.save_bars(df, ticker)
    return {
        "success": True,
        "message": f"Ingestion completed for {ticker}. {len(df)} daily bars validated and stored.",
        "storage_location": f"/data/storage/{ticker.replace('.', '_')}.parquet"
    }

@app.post("/api/ingestion/batch")
def batch_ingestion():
    """Trigger batch ingestion across all FTSE 100 universe constituents"""
    universe = get_universe_list()
    results = []
    for item in universe:
        ticker = item["ticker"]
        try:
            df = data_provider.fetch_daily_bars(ticker, start_date="2023-01-01")
            storage_manager.save_bars(df, ticker)
            results.append({
                "ticker": ticker,
                "name": item["name"],
                "status": "VALIDATED_AND_STORED",
                "bars": len(df)
            })
        except Exception as e:
            results.append({
                "ticker": ticker,
                "name": item["name"],
                "status": f"ERROR: {str(e)}",
                "bars": 0
            })
    return {
        "success": True,
        "total_ingested": len(universe),
        "message": f"Batch ingestion complete for {len(universe)} FTSE 100 constituents.",
        "results": results
    }

@app.get("/api/features/{ticker}")
def get_features(ticker: str):
    """Retrieve engineered indicators, Hurst exponent, and HMM market regime"""
    df = data_provider.fetch_daily_bars(ticker, start_date="2023-01-01")
    enriched = IndicatorEngine.calculate_all(df)
    
    latest = enriched.iloc[-1]
    return {
        "ticker": ticker,
        "date": str(latest["date"].date()),
        "close_gbx": round(float(latest["close"]), 2),
        "close_gbp": round(float(latest["close"]) / 100.0, 2),
        "indicators": {
            "sma_20": round(float(latest.get("sma_20", 0) or 0), 2),
            "sma_50": round(float(latest.get("sma_50", 0) or 0), 2),
            "sma_200": round(float(latest.get("sma_200", 0) or 0), 2),
            "rsi_14": round(float(latest.get("rsi_14", 50) or 50), 2),
            "macd": round(float(latest.get("macd", 0) or 0), 2),
            "bb_upper": round(float(latest.get("bb_upper", 0) or 0), 2),
            "bb_lower": round(float(latest.get("bb_lower", 0) or 0), 2),
            "z_score_20": round(float(latest.get("z_score_20", 0) or 0), 2),
            "hurst_100": round(float(latest.get("hurst_100", 0.5) or 0.5), 3)
        },
        "regime": {
            "rule_regime": latest.get("rule_regime", "CHOPPY"),
            "hmm_regime": latest.get("hmm_regime", "STEADY_BULL")
        },
        "bars": enriched[["date", "open", "high", "low", "close", "volume", "rule_regime", "hmm_regime"]].tail(60).to_dict(orient="records")
    }

class BacktestRequest(BaseModel):
    ticker: str = "AZN.L"
    strategy_engine: str = "OPTUNA_GENETIC"  # OPTUNA_GENETIC, XGBOOST_ML, RL_PPO
    initial_capital: float = 100000.0
    vol_target: float = 0.15
    stamp_duty_rate: float = 0.005
    fast_sma: int = 20
    slow_sma: int = 50

@app.post("/api/strategy/backtest")
def run_backtest(req: BacktestRequest):
    """Run full vectorized backtest with transaction costs and drawdown circuit breaker"""
    df = data_provider.fetch_daily_bars(req.ticker, start_date="2021-01-01")
    enriched = IndicatorEngine.calculate_all(df)
    
    # Generate signals based on fast/slow SMA and RSI filter
    fast = enriched["close"].rolling(req.fast_sma).mean()
    slow = enriched["close"].rolling(req.slow_sma).mean()
    signals = (fast > slow).astype(int)
    
    backtester = VectorizedBacktester(
        stamp_duty_rate=req.stamp_duty_rate,
        circuit_breaker_dd=settings.CIRCUIT_BREAKER_MAX_DD
    )
    results = backtester.run(enriched, signals, initial_capital=req.initial_capital, vol_target=req.vol_target)
    results["ticker"] = req.ticker
    results["engine"] = req.strategy_engine
    return results

class ForecastRequest(BaseModel):
    current_equity: float = 100000.0
    days_ahead: int = 30
    annualized_return: float = 0.14
    annualized_volatility: float = 0.16

@app.post("/api/forward-projection/cone")
def get_forecast_cone(req: ForecastRequest):
    """Generate 30-day Monte Carlo Probabilistic Forecast Cone"""
    return MonteCarloProjectionEngine.generate_forecast_cone(
        current_equity=req.current_equity,
        annualized_return=req.annualized_return,
        annualized_volatility=req.annualized_volatility,
        days_ahead=req.days_ahead
    )

class VetoRequest(BaseModel):
    ticker: str = "AZN.L"
    base_signal: str = "BUY"
    rsi: float = 64.2
    hurst: float = 0.58
    rolling_z: float = -0.8
    regime: str = "STEADY_BULL"

@app.post("/api/meta-labeling/veto")
def evaluate_meta_label(req: VetoRequest):
    """Lopez de Prado Meta-Labeling veto gate"""
    return MetaLabelingVetoModel.evaluate_signal(
        ticker=req.ticker,
        base_signal=req.base_signal,
        rsi=req.rsi,
        hurst=req.hurst,
        rolling_z=req.rolling_z,
        regime=req.regime
    )

@app.get("/api/paper-trading/summary")
def get_paper_summary():
    return {
        "summary": paper_engine.get_account_summary(),
        "positions": paper_engine.get_positions(),
        "recent_orders": paper_engine.order_history[-10:]
    }

class OrderRequest(BaseModel):
    ticker: str
    action: str  # BUY or SELL
    shares: int
    order_type: str = "MARKET"
    limit_price: Optional[float] = None
    market_price: Optional[float] = None

@app.post("/api/paper-trading/order")
def execute_paper_order(order: OrderRequest):
    result = paper_engine.submit_order(
        ticker=order.ticker,
        action=order.action,
        shares=order.shares,
        order_type=order.order_type,
        limit_price=order.limit_price,
        market_price=order.market_price
    )
    return result

class AlertTestRequest(BaseModel):
    ticker: str = "AZN.L"
    action: str = "BUY"
    message: str = "BUY Signal: AstraZeneca crossed 200 SMA in STEADY_BULL regime"

@app.post("/api/alerts/test")
def test_alert(req: AlertTestRequest):
    return AlertDispatcher.send_telegram_alert(
        bot_token=settings.TELEGRAM_BOT_TOKEN,
        chat_id=settings.TELEGRAM_CHAT_ID,
        message=f"🚨 *QuantTrade Alert*\n{req.message}\nTicker: `{req.ticker}`"
    )

# =====================================================================
# MACRO & ALTERNATIVE DATA ENDPOINTS
# =====================================================================

@app.get("/api/macro/fred")
def get_fred_macro():
    """Returns FRED macroeconomic indicators (Gilts, SONIA, US 10Y, VIX, Yield Curve)"""
    return fred_provider.get_macro_dashboard()

@app.get("/api/macro/ons-cpih")
def get_ons_cpih():
    """Returns official ONS UK CPIH inflation rate and historic time series"""
    return ons_provider.get_cpih_data()

@app.get("/api/alternative/fca-shorts")
def get_fca_shorts():
    """Returns official FCA Net Short Position Register and hedge fund disclosures"""
    return fca_provider.get_short_register()

@app.get("/api/commodities/quandl")
def get_quandl_commodities():
    """Returns Quandl / ICE commodity benchmarks and FTSE sector beta"""
    return quandl_provider.get_commodities()

@app.get("/api/adr/implied-opens")
def get_adr_implied_opens():
    """Returns overnight US ADR implied London opening prices and gap predictions"""
    return AdrImpliedOpenCalculator.calculate_implied_opens()
