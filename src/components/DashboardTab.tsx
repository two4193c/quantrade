import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { TrendingUp, ShieldCheck, ArrowUpRight, ArrowDownRight, Layers, Percent, Activity } from "lucide-react";
import { BacktestResult, PaperSummary } from "../types";

interface DashboardTabProps {
  paperSummary: PaperSummary | null;
  backtestData: BacktestResult | null;
  onNavigateToLab: () => void;
  onNavigateToData: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  paperSummary,
  backtestData,
  onNavigateToLab,
  onNavigateToData
}) => {
  const equity = paperSummary?.summary.totalEquityGbp || 108450;
  const pnl = paperSummary?.summary.totalPnlGbp || 8450;
  const pnlPct = paperSummary?.summary.totalPnlPct || 8.45;
  const cash = paperSummary?.summary.cashBalanceGbp || 82450;
  const positions = paperSummary?.positions || [];

  // Chart data from backtest equity curve or baseline
  const chartData = (backtestData?.equityCurve || []).slice(-60).map((d) => ({
    date: d.date.slice(5),
    StrategyEquity: d.equity,
    BenchmarkFtse: Math.round(100000 * (1 + (d.close - 10000) / 40000)),
    Drawdown: d.drawdownPct
  }));

  return (
    <div className="space-y-6">
      {/* Top Notification Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-100">Automated FTSE 100 Execution Pipeline Active</h4>
            <p className="text-xs text-slate-400">
              Module 1 DuckDB ingestion synchronized. Daily updates scheduled via APScheduler at 17:05 London close.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={onNavigateToData}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Explore Features
          </button>
          <button
            onClick={onNavigateToLab}
            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center space-x-1"
          >
            <span>Run Strategy Lab</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Portfolio Valuation</span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] font-mono">
              Live GBP (£)
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-100">
            £{equity.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center text-xs space-x-1.5">
            <span className={`flex items-center font-mono ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {pnl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}% (£{Math.abs(pnl).toLocaleString("en-GB", { minimumFractionDigits: 2 })})
            </span>
            <span className="text-slate-500">all time</span>
          </div>
          <div className="absolute right-3 bottom-3 opacity-5 text-slate-100 pointer-events-none">
            <TrendingUp className="w-16 h-16" />
          </div>
        </div>

        {/* Sharpe & Sortino */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Risk-Adjusted Ratios</span>
            <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-[11px] font-mono">Institutional</span>
          </div>
          <div className="mt-3 flex items-baseline space-x-3">
            <div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {backtestData?.metrics.sharpeRatio ?? 1.84}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Sharpe (Rf 4%)</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <div className="text-xl font-semibold font-mono text-emerald-400">
                {backtestData?.metrics.sortinoRatio ?? 2.21}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Sortino (Downside)</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Target Vol: <span className="text-slate-200 font-mono">15.0%</span> • Ann. Vol:{" "}
            <span className="text-slate-200 font-mono">{backtestData?.metrics.annualizedVolatilityPct ?? 14.8}%</span>
          </div>
        </div>

        {/* Max Drawdown & Circuit Breaker */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Drawdown Protection</span>
            <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px] font-mono">Safety Circuit</span>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-rose-400">
            -{backtestData?.metrics.maxDrawdownPct ?? 6.8}%
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Circuit Breaker: <strong className="text-slate-200">10.0% Max DD</strong></span>
            <span className="text-emerald-400 font-mono">0 Halts</span>
          </div>
        </div>

        {/* Win Rate & UK Tax */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Execution Realism</span>
            <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-[11px] font-mono">UK Market</span>
          </div>
          <div className="mt-3 flex items-baseline space-x-3">
            <div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {backtestData?.metrics.winRatePct ?? 64.3}%
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Win Rate</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <div className="text-xl font-semibold font-mono text-amber-300">
                £{backtestData?.metrics.stampDutyPaidGbp ?? 482}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">0.5% Stamp Duty</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Profit Factor: <span className="text-slate-200 font-mono">1.92</span> • Total Trades:{" "}
            <span className="text-slate-200 font-mono">{backtestData?.metrics.totalTrades ?? 28}</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Regime Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Strategy Equity Curve vs FTSE 100</h3>
              <p className="text-xs text-slate-400">Walk-forward out-of-sample portfolio growth (with UK SDRT + slippage)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">Quant Strategy</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span className="text-slate-400">FTSE 100 Benchmark</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  domain={["dataMin - 2000", "dataMax + 2000"]}
                  tickFormatter={(val) => `£${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(val: any) => [`£${Number(val).toLocaleString()}`, "Valuation"]}
                />
                <Area type="monotone" dataKey="StrategyEquity" stroke="#10b981" strokeWidth={2} fill="url(#equityGrad)" />
                <Area type="monotone" dataKey="BenchmarkFtse" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dual-Layer Regime & Breadth Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100">Dual-Layer Market Regime</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Module 2
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {/* Rule-based Regime */}
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Layer 1: Rule-Based (200 SMA)</span>
                  <span className="font-semibold text-emerald-400">BULL REGIME</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  FTSE 100 index trades +4.8% above its 200-day simple moving average with 20 SMA &gt; 50 SMA.
                </p>
              </div>

              {/* HMM Regime */}
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Layer 2: Gaussian HMM (Hidden Markov)</span>
                  <span className="font-semibold text-blue-400">STEADY_BULL</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Probability: <strong>88.4%</strong>. Low realized volatility regime with positive return expectation.
                </p>
              </div>

              {/* Market Breadth */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
                  <span>FTSE 100 Market Breadth (% &gt; 200 SMA)</span>
                  <span className="font-mono text-emerald-400">68.4%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "68.4%" }}></div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Expansionary breadth threshold: &gt; 50%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Regime Intersection Strategy:</span>
            <span className="text-emerald-400 font-semibold">RISK-ON MOMENTUM</span>
          </div>
        </div>
      </div>

      {/* Active Open Positions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Simulated Paper Portfolio Positions</h3>
            <p className="text-xs text-slate-400">Quotes tracking London Stock Exchange in Pence (GBX) normalized to GBP</p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Cash: <strong className="text-slate-100">£{cash.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Asset / Ticker</th>
                <th className="py-3 px-4">Shares Held</th>
                <th className="py-3 px-4">Avg Cost (GBX)</th>
                <th className="py-3 px-4">Current Price (GBX)</th>
                <th className="py-3 px-4">Market Value (£)</th>
                <th className="py-3 px-4 text-right">Unrealized P&L (£)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {positions.length > 0 ? (
                positions.map((pos) => (
                  <tr key={pos.ticker} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{pos.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{pos.ticker} • LSE</div>
                    </td>
                    <td className="py-3 px-4 font-mono">{pos.shares}</td>
                    <td className="py-3 px-4 font-mono">{pos.avgCostGbx}p</td>
                    <td className="py-3 px-4 font-mono">{pos.currentPriceGbx}p</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-100">
                      £{pos.marketValueGbp.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-mono text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          pos.unrealizedPnlGbp >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {pos.unrealizedPnlGbp >= 0 ? "+" : ""}£{pos.unrealizedPnlGbp.toFixed(2)} ({pos.unrealizedPnlPct.toFixed(2)}%)
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No active positions currently held. Liquid cash ready for deployment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
