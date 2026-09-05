import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { Database, CheckCircle, AlertTriangle, RefreshCw, Eye, Tag, BarChart3, Binary } from "lucide-react";
import { FeatureResponse, UniverseConstituent } from "../types";

interface DataExplorerTabProps {
  universe: UniverseConstituent[];
  features: FeatureResponse | null;
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  onTriggerIngestion: (ticker: string) => Promise<void>;
  loading: boolean;
}

export const DataExplorerTab: React.FC<DataExplorerTabProps> = ({
  universe,
  features,
  selectedTicker,
  onSelectTicker,
  onTriggerIngestion,
  loading
}) => {
  const [currencyMode, setCurrencyMode] = useState<"GBX" | "GBP">("GBX");
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [showSma200, setShowSma200] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);

  const priceMultiplier = currencyMode === "GBP" ? 0.01 : 1.0;
  const currencySymbol = currencyMode === "GBP" ? "£" : "p";

  const chartData = (features?.bars || []).map((b) => ({
    date: b.date.slice(5),
    Close: Math.round(b.close * priceMultiplier * 100) / 100,
    SMA20: b.sma20 ? Math.round(b.sma20 * priceMultiplier * 100) / 100 : null,
    SMA50: b.sma50 ? Math.round(b.sma50 * priceMultiplier * 100) / 100 : null,
    SMA200: b.sma200 ? Math.round(b.sma200 * priceMultiplier * 100) / 100 : null,
    BBUpper: b.bbUpper ? Math.round(b.bbUpper * priceMultiplier * 100) / 100 : null,
    BBLower: b.bbLower ? Math.round(b.bbLower * priceMultiplier * 100) / 100 : null,
    RSI: b.rsi,
    Hurst: b.hurst,
    ZScore: b.zScore
  }));

  return (
    <div className="space-y-6">
      {/* Ingestion & Provider Status Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">Data Ingestion, Validation & Feature Store</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Module 1 & 2
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              DuckDB columnar storage engine with Snappy-compressed Parquet partitions in <code>/data/storage</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Currency Mode Toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs font-mono">
              <button
                onClick={() => setCurrencyMode("GBX")}
                className={`px-2.5 py-1 rounded transition ${
                  currencyMode === "GBX" ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "text-slate-400"
                }`}
              >
                Pence (GBX)
              </button>
              <button
                onClick={() => setCurrencyMode("GBP")}
                className={`px-2.5 py-1 rounded transition ${
                  currencyMode === "GBP" ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "text-slate-400"
                }`}
              >
                Pounds (£)
              </button>
            </div>

            {/* Ingestion Trigger Button */}
            <button
              onClick={() => onTriggerIngestion(selectedTicker)}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              <span>Validate & Ingest New Bars</span>
            </button>
          </div>
        </div>

        {/* Validation Checks Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs font-mono">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Gap Check (&lt;20% max)</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Non-Zero Daily Volume</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Split/Dividend Adjusted</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Staleness &lt; 5d OK</span>
          </div>
        </div>
      </div>

      {/* Ticker Selector & Regime Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        {/* Ticker Selector Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {universe.slice(0, 7).map((u) => (
            <button
              key={u.ticker}
              onClick={() => onSelectTicker(u.ticker)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center space-x-1 whitespace-nowrap ${
                selectedTicker === u.ticker
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold"
                  : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50"
              }`}
            >
              <span>{u.ticker.replace(".L", "")}</span>
              <span className="text-[10px] text-slate-500">({u.currency})</span>
            </button>
          ))}
        </div>

        {/* Current Regime Badges */}
        {features && (
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Active Regimes:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Rule: {features.regimes.ruleRegime}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              HMM: {features.regimes.hmmRegime}
            </span>
          </div>
        )}
      </div>

      {/* Main Indicator Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <span>{features?.name || selectedTicker}</span>
              <span className="text-xs font-mono text-emerald-400">
                {currencySymbol}
                {currencyMode === "GBP" ? features?.latestCloseGbp : features?.latestCloseGbx}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {features?.sector} • London Stock Exchange • Normalized {currencyMode}
            </p>
          </div>

          {/* Indicator Overlay Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setShowSma20(!showSma20)}
              className={`px-2 py-0.5 rounded text-[11px] border transition ${
                showSma20 ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              SMA 20
            </button>
            <button
              onClick={() => setShowSma50(!showSma50)}
              className={`px-2 py-0.5 rounded text-[11px] border transition ${
                showSma50 ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              SMA 50
            </button>
            <button
              onClick={() => setShowSma200(!showSma200)}
              className={`px-2 py-0.5 rounded text-[11px] border transition ${
                showSma200 ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              SMA 200
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-0.5 rounded text-[11px] border transition ${
                showBollinger ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              Bollinger Bands
            </button>
          </div>
        </div>

        {/* Price & Moving Averages Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis
                stroke="#64748b"
                domain={["dataMin - 50", "dataMax + 50"]}
                tickFormatter={(val) => `${currencySymbol}${val}`}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString()}`, "Price"]}
              />
              <Line type="monotone" dataKey="Close" stroke="#10b981" strokeWidth={2} dot={false} />
              {showSma20 && <Line type="monotone" dataKey="SMA20" stroke="#f59e0b" strokeWidth={1.5} dot={false} />}
              {showSma50 && <Line type="monotone" dataKey="SMA50" stroke="#38bdf8" strokeWidth={1.5} dot={false} />}
              {showSma200 && <Line type="monotone" dataKey="SMA200" stroke="#a855f7" strokeWidth={1.5} dot={false} />}
              {showBollinger && (
                <>
                  <Line type="monotone" dataKey="BBUpper" stroke="#475569" strokeDasharray="3 3" dot={false} />
                  <Line type="monotone" dataKey="BBLower" stroke="#475569" strokeDasharray="3 3" dot={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sub-Charts: RSI & Hurst Exponent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RSI 14 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-200">RSI (14 Periods)</h4>
            <span className="text-xs font-mono text-emerald-400">
              {features?.indicators.rsi14}
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} ticks={[30, 50, 70]} tick={{ fontSize: 9 }} />
                <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="RSI" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hurst Exponent & Z-Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Hurst Exponent (Regime Persistence)</h4>
              <span className="text-[10px] text-slate-400 font-mono">
                H &gt; 0.50 (Trending) | H &lt; 0.50 (Mean-Reverting)
              </span>
            </div>
            <span className="text-xs font-mono text-purple-400">
              H = {features?.indicators.hurstExponent}
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" domain={[0.3, 0.7]} ticks={[0.4, 0.5, 0.6]} tick={{ fontSize: 9 }} />
                <ReferenceLine y={0.5} stroke="#e2e8f0" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="Hurst" stroke="#a855f7" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
