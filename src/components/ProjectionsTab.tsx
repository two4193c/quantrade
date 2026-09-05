import React, { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { TrendingUp, ShieldAlert, CheckCircle2, XCircle, Sliders, Play, BrainCircuit, Activity } from "lucide-react";
import { ForecastResponse } from "../types";

interface ProjectionsTabProps {
  forecastData: ForecastResponse | null;
  onRefreshForecast: (equity: number, ret: number, vol: number) => Promise<void>;
  loading: boolean;
}

export const ProjectionsTab: React.FC<ProjectionsTabProps> = ({
  forecastData,
  onRefreshForecast,
  loading
}) => {
  const [currentEquity, setCurrentEquity] = useState(100000);
  const [expectedReturn, setExpectedReturn] = useState(14);
  const [volatility, setVolatility] = useState(16);

  // Meta-Labeling Simulator state
  const [metaTicker, setMetaTicker] = useState("AZN.L");
  const [metaSignal, setMetaSignal] = useState("BUY");
  const [metaRsi, setMetaRsi] = useState(62);
  const [metaHurst, setMetaHurst] = useState(0.58);
  const [metaRegime, setMetaRegime] = useState("STEADY_BULL");
  const [vetoResult, setVetoResult] = useState<any>({
    predictedWinProbability: 72.5,
    metaDecision: "APPROVED",
    filterAction: "DISPATCH_TO_BROKER",
    reason: "High regime concurrence and strong Hurst persistence (H > 0.55)."
  });
  const [evaluatingVeto, setEvaluatingVeto] = useState(false);

  const handleSimulateCone = async () => {
    await onRefreshForecast(currentEquity, expectedReturn / 100, volatility / 100);
  };

  const handleEvaluateMetaModel = async () => {
    setEvaluatingVeto(true);
    try {
      const res = await fetch("/api/meta-labeling/veto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: metaTicker,
          baseSignal: metaSignal,
          rsi: metaRsi,
          hurst: metaHurst,
          regime: metaRegime
        })
      });
      const data = await res.json();
      setVetoResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluatingVeto(false);
    }
  };

  const coneData = forecastData?.forecastCone || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">Continuous Learning & Forward Projection Engine</h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Module 4
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Monte Carlo Geometric Brownian Motion + GARCH volatility forecast cone paired with Lopez de Prado trade veto meta-classifier
        </p>
      </div>

      {/* 30-Day Probabilistic Forecast Cone */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">30-Day Forward Probabilistic Equity Cone</h3>
            <p className="text-xs text-slate-400">1,000 Monte Carlo paths showing 5th, 25th, Median, 75th, and 95th confidence bounds</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSimulateCone}
              disabled={loading}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Simulate Forecast Cone</span>
            </button>
          </div>
        </div>

        {/* Forecast Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Current Capital (£)</label>
            <input
              type="number"
              value={currentEquity}
              onChange={(e) => setCurrentEquity(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Expected Annual Return (%)</label>
            <input
              type="number"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Projected Annual Volatility (%)</label>
            <input
              type="number"
              value={volatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs"
            />
          </div>
        </div>

        {/* Monte Carlo Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={coneData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="coneOuterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="coneInnerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis
                stroke="#64748b"
                tickFormatter={(val) => `£${(val / 1000).toFixed(0)}k`}
                domain={["dataMin - 2000", "dataMax + 2000"]}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                formatter={(val: any) => [`£${Number(val).toLocaleString()}`, "Valuation"]}
              />
              <Area type="monotone" dataKey="p95" stroke="#38bdf8" strokeDasharray="3 3" fill="url(#coneOuterGrad)" />
              <Area type="monotone" dataKey="p75" stroke="#10b981" strokeWidth={1.5} fill="url(#coneInnerGrad)" />
              <Area type="monotone" dataKey="p50_median" stroke="#10b981" strokeWidth={2.5} fill="none" />
              <Area type="monotone" dataKey="p25" stroke="#10b981" strokeWidth={1.5} fill="none" />
              <Area type="monotone" dataKey="p5" stroke="#38bdf8" strokeDasharray="3 3" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Probabilities & VaR Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <span className="text-slate-400 font-mono text-[11px]">95% Value at Risk (1M)</span>
            <div className="text-base font-bold font-mono text-rose-400 mt-1">
              {forecastData?.riskMetrics.var95Pct ?? -4.8}%
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Max loss at 95% conf.</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <span className="text-slate-400 font-mono text-[11px]">Expected Shortfall (CVaR)</span>
            <div className="text-base font-bold font-mono text-rose-400 mt-1">
              {forecastData?.riskMetrics.cvar95Pct ?? -6.9}%
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Tail risk beyond VaR</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <span className="text-slate-400 font-mono text-[11px]">Prob. Hit +5% Profit Target</span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-1">
              {forecastData?.riskMetrics.probHitProfitTarget5Pct ?? 62.4}%
            </div>
            <span className="text-[10px] text-emerald-500/80 font-mono">Favorable target odds</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <span className="text-slate-400 font-mono text-[11px]">Prob. Hit -3% Stop Loss</span>
            <div className="text-base font-bold font-mono text-amber-300 mt-1">
              {forecastData?.riskMetrics.probHitStopLoss3Pct ?? 21.8}%
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Controlled risk bound</span>
          </div>
        </div>
      </div>

      {/* Lopez de Prado Meta-Labeling Veto Gate */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Trade Log Meta-Labeling Veto Gate</h3>
              <p className="text-xs text-slate-400">
                Secondary classifier trained on historical trade logs to veto false-positive trade signals
              </p>
            </div>
          </div>
          <button
            onClick={handleEvaluateMetaModel}
            disabled={evaluatingVeto}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Evaluate Signal with Meta-Model</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Simulation Inputs */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Ticker</label>
                <input
                  type="text"
                  value={metaTicker}
                  onChange={(e) => setMetaTicker(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Base Signal</label>
                <select
                  value={metaSignal}
                  onChange={(e) => setMetaSignal(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">RSI (14)</label>
                <input
                  type="number"
                  value={metaRsi}
                  onChange={(e) => setMetaRsi(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Hurst Exponent</label>
                <input
                  type="number"
                  step="0.01"
                  value={metaHurst}
                  onChange={(e) => setMetaHurst(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Market Regime</label>
                <select
                  value={metaRegime}
                  onChange={(e) => setMetaRegime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono text-[11px]"
                >
                  <option value="STEADY_BULL">STEADY_BULL</option>
                  <option value="HIGH_VOL_CHOPPY">HIGH_VOL_CHOPPY</option>
                  <option value="DEFENSIVE_BEAR">DEFENSIVE_BEAR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Veto Decision Box */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Meta-Model Classification</span>
                <span
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-bold ${
                    vetoResult.metaDecision === "APPROVED"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {vetoResult.metaDecision === "APPROVED" ? (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  <span>{vetoResult.metaDecision}</span>
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Predicted Win Probability (Secondary Classifier)</span>
                  <span className="font-mono font-bold text-slate-100">
                    {vetoResult.predictedWinProbability}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      vetoResult.predictedWinProbability >= 50 ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${vetoResult.predictedWinProbability}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-700/50">
              <strong>Veto Logic:</strong> {vetoResult.reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
