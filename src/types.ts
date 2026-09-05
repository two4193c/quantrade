export interface UniverseConstituent {
  ticker: string;
  name: string;
  sector: string;
  currency: string;
  weight: number;
  primary_exchange: string;
  basePrice?: number;
}

export interface BarData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  bbUpper?: number;
  bbLower?: number;
  rsi?: number;
  zScore?: number;
  hurst?: number;
  ruleRegime?: string;
  hmmRegime?: string;
}

export interface IndicatorSummary {
  sma20: number;
  sma50: number;
  sma200: number;
  bbUpper: number;
  bbLower: number;
  rsi14: number;
  zScore: number;
  hurstExponent: number;
}

export interface FeatureResponse {
  ticker: string;
  name: string;
  sector: string;
  currency: string;
  latestCloseGbx: number;
  latestCloseGbp: number;
  indicators: IndicatorSummary;
  regimes: {
    ruleRegime: string;
    hmmRegime: string;
    marketBreadthPctAbove200Sma: number;
  };
  bars: BarData[];
}

export interface BacktestTrade {
  date: string;
  action: string;
  shares: number;
  priceGbp?: number;
  price?: number;
  stampDutyGbp?: number;
  commission?: number;
  pnlGbp?: number;
}

export interface BacktestResult {
  ticker: string;
  engine: string;
  parameters: {
    fastSma: number;
    slowSma: number;
    initialCapital: number;
    volTarget: number;
    stampDutyRate: number;
  };
  metrics: {
    initialCapital: number;
    finalEquity: number;
    cumulativeReturnPct: number;
    annualizedReturnPct: number;
    annualizedVolatilityPct: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdownPct: number;
    winRatePct: number;
    profitFactor: number;
    totalTrades: number;
    stampDutyPaidGbp: number;
    circuitBreakerHalts: number;
  };
  equityCurve: {
    date: string;
    equity: number;
    drawdownPct: number;
    close: number;
  }[];
  trades: BacktestTrade[];
  haltEvents: { date: string; drawdownPct?: number; reason?: string }[];
}

export interface ConePoint {
  day: string;
  p5: number;
  p25: number;
  p50_median: number;
  p75: number;
  p95: number;
}

export interface ForecastResponse {
  currentEquity: number;
  daysAhead: number;
  forecastCone: ConePoint[];
  riskMetrics: {
    var95Pct: number;
    cvar95Pct: number;
    probHitProfitTarget5Pct: number;
    probHitStopLoss3Pct: number;
  };
}

export interface PaperOrder {
  orderId: string;
  timestamp: string;
  ticker: string;
  action: string;
  shares: number;
  priceGbx: number;
  stampDutyGbp: number;
  status: string;
}

export interface PaperPosition {
  ticker: string;
  name: string;
  shares: number;
  avgCostGbx: number;
  currentPriceGbx: number;
  marketValueGbp: number;
  unrealizedPnlGbp: number;
  unrealizedPnlPct: number;
}

export interface PaperSummary {
  summary: {
    initialCapitalGbp: number;
    cashBalanceGbp: number;
    totalEquityGbp: number;
    totalPnlGbp: number;
    totalPnlPct: number;
    openPositionsCount: number;
  };
  positions: PaperPosition[];
  orders: PaperOrder[];
}

export interface FredMacroIndicator {
  id: string;
  name: string;
  fred_series: string;
  value: number;
  change_1m: number;
  unit: string;
  regime_signal: string;
  description: string;
}

export interface FredMacroResponse {
  source: string;
  last_updated: string;
  overall_macro_score: number;
  macro_bias: string;
  indicators: FredMacroIndicator[];
  history: {
    date: string;
    uk10y: number;
    boeRate: number;
    us10y: number;
    vix: number;
  }[];
}

export interface OnsCpihResponse {
  source: string;
  series_id: string;
  metric: string;
  latest_month: string;
  headline_cpih_pct: number;
  previous_cpih_pct: number;
  core_cpih_pct: number;
  owner_occupier_housing_pct: number;
  boe_target_pct: number;
  target_deviation_pct: number;
  status: string;
  impact_on_ftse: string;
  series_history: {
    period: string;
    cpih: number;
    core: number;
    target: number;
  }[];
}

export interface FcaShortDisclosure {
  ticker: string;
  name: string;
  sector: string;
  disclosed_short_pct: number;
  number_of_funds: number;
  leading_fund: string;
  change_30d: number;
  squeeze_risk_score: number;
  status: string;
}

export interface FcaShortRegisterResponse {
  source: string;
  threshold: string;
  date: string;
  total_ftse_shorted_capital_gbp_bn: number;
  disclosures: FcaShortDisclosure[];
}

export interface QuandlCommodity {
  symbol: string;
  name: string;
  quandl_code: string;
  price: number;
  change_pct: number;
  currency: string;
  ftse_impact_sector: string;
  correlation: number;
}

export interface QuandlCommodityResponse {
  source: string;
  last_updated: string;
  energy_momentum_index: number;
  commodities: QuandlCommodity[];
}

export interface AdrImpliedOpenItem {
  ftse_ticker: string;
  name: string;
  adr_ticker: string;
  adr_ratio: number;
  adr_close_usd: number;
  prev_lse_close_gbx: number;
  implied_lse_open_gbx: number;
  predicted_gap_pct: number;
  signal: "BULLISH_GAP" | "BEARISH_GAP" | "NEUTRAL_OPEN";
}

export interface AdrImpliedOpenResponse {
  market: string;
  fx_rate_gbp_usd: number;
  calculated_at: string;
  adrs: AdrImpliedOpenItem[];
}
