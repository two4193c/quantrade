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
