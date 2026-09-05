"""
QuantTrade Platform Configuration & Settings
"""
import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "QuantTrade Platform"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_PREFIX: str = "/api"
    
    # Storage Engine Settings (DuckDB & Parquet)
    STORAGE_PATH: str = os.getenv("STORAGE_PATH", "./data/storage")
    FEATURE_STORE_PATH: str = os.getenv("FEATURE_STORE_PATH", "./data/features")
    DUCKDB_PATH: str = os.path.join(os.getenv("STORAGE_PATH", "./data/storage"), "quanttrade.duckdb")
    
    # API Providers & Keys
    TIINGO_API_KEY: str = os.getenv("TIINGO_API_KEY", "")
    FRED_API_KEY: str = os.getenv("FRED_API_KEY", "")
    QUANDL_API_KEY: str = os.getenv("QUANDL_API_KEY", os.getenv("NASDAQ_DATA_LINK_API_KEY", ""))
    ONS_API_KEY: str = os.getenv("ONS_API_KEY", "")
    DEFAULT_PROVIDER: str = "tiingo"
    FALLBACK_PROVIDER: str = "yfinance"
    
    # UK Market Realism & Transaction Costs
    UK_STAMP_DUTY_RATE: float = float(os.getenv("UK_STAMP_DUTY_RATE", "0.005"))  # 0.5% SDRT on UK equity purchases
    BROKER_COMMISSION_BPS: float = 5.0  # 5 bps
    DEFAULT_SLIPPAGE_BPS: float = 5.0    # 5 bps
    CIRCUIT_BREAKER_MAX_DD: float = 0.10  # 10% maximum drawdown halts new trades
    
    # Alerting
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    WEBHOOK_URL: str = os.getenv("WEBHOOK_URL", "")

settings = Settings()
