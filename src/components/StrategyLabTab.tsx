import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { Play, Sliders, Shield, AlertTriangle, Cpu, CheckCircle2, RefreshCw } from "lucide-react";
import { BacktestResult, UniverseConstituent } from "../types";

interface StrategyLabTabProps {
  universe: UniverseConstituent[];
  backtestResult: BacktestResult | null;
  onRunBacktest: (params: any) => Promise<void>;
  loading: boolean;
}

export const StrategyLabTab: React.FC<StrategyLabTabProps> = ({
  universe,
  backtestResult,
  onRunBacktest,
  loading
}) => {
  const [ticker, setTicker] = useState("AZN.L");
  const [engine, setEngine] = useState("OPTUNA_GENETIC");
  const [fastSma, setFastSma] = useState(20);
  const [slowSma, setSlowSma] = useState(50);
  const [volTarget, setVolTarget] = useState(15);
  const [includeStampDuty, setIncludeStampDuty] = useState(true);
  const [circuitBreakerDd, setCircuitBreakerDd] = useState(10);

  const handleExecute = async () => {
    await onRunBacktest({
      ticker,
      strategyEngine: engine,
      fastSma,
      slowSma,
      volTarget: volTarget / 100,
      stampDutyRate: includeStampDuty ? 0.005 : 0.0,
      circuitBreakerDd: circuitBreakerDd / 100
    });
  };

  const chartData = (backtestResult?.equityCurve || []).map((d) => ({
    date: d.date.slice(5),
    Equity: d.equity,
    Drawdown: -Math.abs(d.drawdownPct)
  }));

  return (
    <div className="space-y-6">
      {/* Strategy Engine Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">Multi-Modal Strategy Discovery & Backtester</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Module 3
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict Walk-Forward validation (60/20/20 train-val-holdout) and realistic UK market friction
            </p>
          </div>

          <button
            onClick={handleExecute}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{loading ? "Optimizing & Simulating..." : "Run Multi-Engine Backtest"}</span>
          </button>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          {/* Universe Selector */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">FTSE 100 Constituent</label>
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {universe.map((u) => (
                <option key={u.ticker} value={u.ticker}>
                  {u.ticker} - {u.name} ({u.sector})
                </option>
              ))}
            </select>
          </div>

          {/* Discovery Engine */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Discovery Engine</label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="OPTUNA_GENETIC">Optuna / Genetic Algorithm</option>
              <option value="XGBOOST_ML">Supervised ML (XGBoost Classifier)</option>
              <option value="RL_PPO">Reinforcement Learning (PPO Agent)</option>
            </select>
          </div>

          {/* Parametric Windows */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Fast / Slow SMA Windows</span>
              <span className="text-emerald-400 font-mono">{fastSma}d / {slowSma}d</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="5"
                max="50"
                value={fastSma}
                onChange={(e) => setFastSma(Number(e.target.value))}
                className="w-1/2 accent-emerald-500"
              />
              <input
                type="range"
                min="30"
                max="200"
                value={slowSma}
                onChange={(e) => setSlowSma(Number(e.target.value))}
                className="w-1/2 accent-emerald-500"
              />
            </div>
          </div>

          {/* Risk & Friction Settings */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Vol Target & Circuit Breaker</span>
              <span className="text-slate-200 font-mono">{volTarget}% / -{circuitBreakerDd}% DD</span>
            </div>
            <div className="flex items-center space-x-3 pt-1">
              <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStampDuty}
                  onChange={(e) => setIncludeStampDuty(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="text-[11px]">0.5% Stamp Duty</span>
              </label>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-amber-400 flex items-center">
                <Shield className="w-3 h-3 mr-0.5" /> Circuit 10%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tearsheet Breakdown */}
      {backtestResult && (
        <div className="space-y-6">
          {/* Key Backtest Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-mono">Final Equity</span>
              <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                £{backtestResult.metrics.finalEquity.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                +{backtestResult.metrics.cumulativeReturnPct}% Total
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-mono">Sharpe Ratio</span>
              <div className="text-lg font-bold font-mono text-blue-400 mt-1">
                {backtestResult.metrics.sharpeRatio}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Sortino: {backtestResult.metrics.sortinoRatio}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-mono">Max Drawdown</span>
              <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                -{backtestResult.metrics.maxDrawdownPct}%
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                Under 10% CB Cap
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-mono">Win Rate</span>
              <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                {backtestResult.metrics.winRatePct}%
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Profit Factor: {backtestResult.metrics.profitFactor}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-mono">Total Trades</span>
              <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                {backtestResult.metrics.totalTrades}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Next-day Open Fills</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-mono">UK Stamp Duty Paid</span>
              <div className="text-lg font-bold font-mono text-amber-300 mt-1">
                £{backtestResult.metrics.stampDutyPaidGbp}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">0.5% SDRT Accounted</span>
            </div>
          </div>

          {/* Equity & Underwater Drawdown Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Out of Sample Equity Curve */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-100">Walk-Forward Out-Of-Sample Equity</h3>
                <span className="text-xs text-slate-400 font-mono">{ticker}</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="labEquityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis
                      stroke="#64748b"
                      domain={["dataMin - 1000", "dataMax + 1000"]}
                      tickFormatter={(val) => `£${(val / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                      formatter={(val: any) => [`£${Number(val).toLocaleString()}`, "Equity"]}
                    />
                    <Area type="monotone" dataKey="Equity" stroke="#10b981" strokeWidth={2} fill="url(#labEquityGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Underwater Drawdown Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-100">Underwater Drawdown & Circuit Breaker</h3>
                <span className="text-xs text-rose-400 font-mono">Limit: -10% Max</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.0} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis
                      stroke="#64748b"
                      domain={[-15, 0]}
                      tickFormatter={(val) => `${val}%`}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                      formatter={(val: any) => [`${val}%`, "Drawdown"]}
                    />
                    <Area type="monotone" dataKey="Drawdown" stroke="#f43f5e" strokeWidth={1.5} fill="url(#ddGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Trade Execution Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Verified Trade Execution Log</h3>
                <p className="text-xs text-slate-400">Next-bar market fills with slippage and Stamp Duty Reserve Tax</p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Displaying last {backtestResult.trades.length} simulated trades
              </span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase font-mono text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Shares</th>
                    <th className="py-2.5 px-4">Fill Price (£)</th>
                    <th className="py-2.5 px-4">0.5% Stamp Duty</th>
                    <th className="py-2.5 px-4 text-right">P&L / Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {backtestResult.trades.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{t.date}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            t.action === "BUY"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : t.action.includes("CIRCUIT")
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {t.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono">{t.shares}</td>
                      <td className="py-2.5 px-4 font-mono">£{t.priceGbp?.toFixed(2) ?? t.price?.toFixed(2)}</td>
                      <td className="py-2.5 px-4 font-mono text-amber-300">
                        {t.stampDutyGbp ? `£${t.stampDutyGbp.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-right">
                        {t.pnlGbp !== undefined ? (
                          <span className={t.pnlGbp >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {t.pnlGbp >= 0 ? "+" : ""}£{t.pnlGbp.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
