import React, { useState, useEffect } from "react";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
  Shield,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  RefreshCw,
  Clock,
  Zap,
  BarChart3,
  Percent,
  CheckCircle2
} from "lucide-react";
import {
  FredMacroResponse,
  OnsCpihResponse,
  FcaShortRegisterResponse,
  QuandlCommodityResponse,
  AdrImpliedOpenResponse
} from "../types";

export const MacroAlternativeDataTab: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<"all" | "fred" | "cpih" | "fca" | "quandl" | "adr">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [fredData, setFredData] = useState<FredMacroResponse | null>(null);
  const [cpihData, setCpihData] = useState<OnsCpihResponse | null>(null);
  const [fcaData, setFcaData] = useState<FcaShortRegisterResponse | null>(null);
  const [quandlData, setQuandlData] = useState<QuandlCommodityResponse | null>(null);
  const [adrData, setAdrData] = useState<AdrImpliedOpenResponse | null>(null);

  const [customFxRate, setCustomFxRate] = useState<number>(1.3120);

  const fetchAllMacroData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fredRes, cpihRes, fcaRes, quandlRes, adrRes] = await Promise.all([
        fetch("/api/macro/fred").then((r) => r.json()),
        fetch("/api/macro/ons-cpih").then((r) => r.json()),
        fetch("/api/alternative/fca-shorts").then((r) => r.json()),
        fetch("/api/commodities/quandl").then((r) => r.json()),
        fetch("/api/adr/implied-opens").then((r) => r.json())
      ]);

      setFredData(fredRes);
      setCpihData(cpihRes);
      setFcaData(fcaRes);
      setQuandlData(quandlRes);
      setAdrData(adrRes);
      if (adrRes?.fx_rate_gbp_usd) {
        setCustomFxRate(adrRes.fx_rate_gbp_usd);
      }
    } catch (err: any) {
      console.error("Failed to load macro & alternative data:", err);
      setError("Unable to retrieve macro feeds. Using cached institutional figures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMacroData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Macro & Alternative Alpha Engine</h1>
                <p className="text-xs text-slate-400 font-mono">
                  FRED Macro • ONS UK CPIH • FCA Short Register • Quandl Commodities • ADR Implied Opens
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="refresh-macro-data-btn"
              onClick={fetchAllMacroData}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              <span>Refresh Feeds</span>
            </button>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Overall Bias: {fredData?.macro_bias?.replace(/_/g, " ") || "RISK ON"}</span>
            </div>
          </div>
        </div>

        {/* Sub-View Navigation Chips */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/80 text-xs font-medium">
          {[
            { id: "all", label: "All Feeds Overview" },
            { id: "fred", label: "FRED Macro (Gilts & VIX)" },
            { id: "cpih", label: "ONS UK CPIH Inflation" },
            { id: "fca", label: "FCA Short Register" },
            { id: "quandl", label: "Quandl Commodities" },
            { id: "adr", label: "ADR Implied Opens" }
          ].map((tab) => (
            <button
              key={tab.id}
              id={`macro-filter-${tab.id}`}
              onClick={() => setActiveSubView(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-mono ${
                activeSubView === tab.id
                  ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: FRED Macro Indicators */}
      {(activeSubView === "all" || activeSubView === "fred") && fredData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
              <h2 className="text-base font-semibold text-slate-100">FRED Macroeconomic Monitor</h2>
              <span className="text-xs text-slate-500 font-mono">Source: Federal Reserve Economic Data (FRED)</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Macro Score: <span className="text-emerald-400 font-bold">{fredData.overall_macro_score}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {fredData.indicators.map((ind) => {
              const isPositiveChange = ind.change_1m >= 0;
              return (
                <div
                  key={ind.id}
                  id={`fred-card-${ind.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-mono text-[11px] text-indigo-400">{ind.fred_series}</span>
                    <span
                      className={`flex items-center font-mono ${
                        isPositiveChange ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isPositiveChange ? "+" : ""}
                      {ind.change_1m} {ind.unit} (1m)
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-200 line-clamp-1 mb-2">{ind.name}</div>
                  <div className="flex items-baseline space-x-1.5 mb-2">
                    <span className="text-2xl font-bold font-mono text-slate-100">{ind.value}</span>
                    <span className="text-xs text-slate-400 font-mono">{ind.unit}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {ind.regime_signal.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Historic Trend mini-table */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 mb-2">FRED Multi-Month Macro Evolution:</div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
              {fredData.history.map((h) => (
                <div key={h.date} className="p-2 rounded bg-slate-800/40 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">{h.date}</div>
                  <div className="text-slate-200 mt-1">Gilt: {h.uk10y}%</div>
                  <div className="text-emerald-400">BoE: {h.boeRate}%</div>
                  <div className="text-indigo-400">VIX: {h.vix}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ONS UK CPIH Inflation */}
      {(activeSubView === "all" || activeSubView === "cpih") && cpihData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <h2 className="text-base font-semibold text-slate-100">ONS UK CPIH Inflation Monitor</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Series {cpihData.series_id}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Public Open Data (Keyless)
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">{cpihData.latest_month} Release</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Headline CPIH (Annual)</div>
              <div className="text-2xl font-mono font-bold text-emerald-400">{cpihData.headline_cpih_pct}%</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Prev: {cpihData.previous_cpih_pct}% (-0.2%)</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Core CPIH (ex Food & Energy)</div>
              <div className="text-2xl font-mono font-bold text-indigo-400">{cpihData.core_cpih_pct}%</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Stickier services component</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Owner Occupier Housing (OOH)</div>
              <div className="text-2xl font-mono font-bold text-slate-200">{cpihData.owner_occupier_housing_pct}%</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Key differentiator vs CPI</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Bank of England Target (2.0%)</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-mono font-bold text-amber-400">+{cpihData.target_deviation_pct}%</span>
                <span className="text-xs text-slate-400 font-mono">spread</span>
              </div>
              <div className="text-xs text-emerald-400 mt-1 font-mono">{cpihData.status}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p><span className="font-semibold text-slate-100">FTSE 100 Impact:</span> {cpihData.impact_on_ftse}</p>
          </div>
        </div>
      )}

      {/* SECTION 3: FCA Net Short Positions Register */}
      {(activeSubView === "all" || activeSubView === "fca") && fcaData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-rose-400"></span>
              <h2 className="text-base font-semibold text-slate-100">FCA Net Short Register (Institutional Sentiment)</h2>
              <span className="text-xs font-mono text-slate-400">Positions ≥ 0.50%</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Total Disclosed FTSE Short Capital:{" "}
              <span className="text-rose-400 font-bold font-mono">£{fcaData.total_ftse_shorted_capital_gbp_bn}B</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-400 bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Ticker / Company</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3">Disclosed Short %</th>
                  <th className="py-2.5 px-3">Active Funds</th>
                  <th className="py-2.5 px-3">Leading Short Seller</th>
                  <th className="py-2.5 px-3">30D Delta</th>
                  <th className="py-2.5 px-3 text-center">Squeeze Risk Score</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {fcaData.disclosures.map((d) => (
                  <tr key={d.ticker} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-200">{d.ticker}</span>
                      <div className="text-[11px] text-slate-400">{d.name}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{d.sector}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-rose-400">{d.disclosed_short_pct}%</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{d.number_of_funds} funds</td>
                    <td className="py-3 px-3 text-indigo-300">{d.leading_fund}</td>
                    <td className="py-3 px-3">
                      <span className={d.change_30d > 0 ? "text-rose-400" : "text-emerald-400"}>
                        {d.change_30d > 0 ? "+" : ""}
                        {d.change_30d}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          d.squeeze_risk_score >= 70
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : d.squeeze_risk_score >= 40
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {d.squeeze_risk_score} / 100
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: Quandl Commodities */}
      {(activeSubView === "all" || activeSubView === "quandl") && quandlData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <h2 className="text-base font-semibold text-slate-100">Quandl (Nasdaq Data Link) Commodities</h2>
              <span className="text-xs font-mono text-slate-400">FTSE Energy & Miner Beta</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Energy Momentum Index: <span className="text-emerald-400 font-bold">{quandlData.energy_momentum_index}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quandlData.commodities.map((c) => {
              const isUp = c.change_pct >= 0;
              return (
                <div key={c.symbol} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-slate-400">{c.quandl_code}</span>
                    <span className={`flex items-center font-mono font-semibold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                      {isUp ? "+" : ""}{c.change_pct}%
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100">{c.name}</div>
                  <div className="text-2xl font-bold font-mono text-slate-100 my-1">
                    ${c.price} <span className="text-xs font-normal text-slate-400">{c.currency}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <div>{c.ftse_impact_sector}</div>
                    <div className="font-mono text-indigo-400 mt-0.5">Correlation: {c.correlation > 0 ? "+" : ""}{c.correlation}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: ADR Implied Opens (08:00 BST LSE Market Open Engine) */}
      {(activeSubView === "all" || activeSubView === "adr") && adrData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <h2 className="text-base font-semibold text-slate-100">ADR Implied Opens (08:00 BST LSE Open Engine)</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Predicts London opening price (GBX) based on overnight US ADR close & GBP/USD rate
              </p>
            </div>

            {/* Live FX Rate adjuster */}
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-xs font-mono text-slate-400">GBP/USD:</span>
              <input
                id="adr-custom-fx-input"
                type="number"
                step="0.001"
                value={customFxRate}
                onChange={(e) => setCustomFxRate(parseFloat(e.target.value) || 1.3120)}
                className="w-20 px-1.5 py-0.5 text-xs font-mono font-bold bg-slate-900 border border-slate-700 rounded text-emerald-400 text-center"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-400 bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">FTSE Ticker</th>
                  <th className="py-2.5 px-3">US ADR Ticker</th>
                  <th className="py-2.5 px-3 text-center">ADR Ratio</th>
                  <th className="py-2.5 px-3">US ADR Close ($)</th>
                  <th className="py-2.5 px-3">Prev LSE Close (GBX)</th>
                  <th className="py-2.5 px-3">Implied LSE Open (GBX)</th>
                  <th className="py-2.5 px-3 text-center">Predicted Gap %</th>
                  <th className="py-2.5 px-3 text-right">08:00 Auction Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {adrData.adrs.map((a) => {
                  // Dynamically recalculate if customFxRate is adjusted
                  const dynamicImpliedGbx = (a.adr_close_usd * 100.0) / (a.adr_ratio * customFxRate);
                  const dynamicGapPct = ((dynamicImpliedGbx - a.prev_lse_close_gbx) / a.prev_lse_close_gbx) * 100.0;
                  const isBullish = dynamicGapPct > 0.35;
                  const isBearish = dynamicGapPct < -0.35;

                  return (
                    <tr key={a.ftse_ticker} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200">{a.ftse_ticker}</span>
                        <div className="text-[11px] text-slate-400">{a.name}</div>
                      </td>
                      <td className="py-3 px-3 text-indigo-300 font-semibold">{a.adr_ticker}</td>
                      <td className="py-3 px-3 text-center text-slate-400">1 : {a.adr_ratio}</td>
                      <td className="py-3 px-3 text-slate-200">${a.adr_close_usd.toFixed(2)}</td>
                      <td className="py-3 px-3 text-slate-400">{a.prev_lse_close_gbx.toFixed(1)}p</td>
                      <td className="py-3 px-3 font-bold text-slate-100">{dynamicImpliedGbx.toFixed(1)}p</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            isBullish
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : isBearish
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {dynamicGapPct >= 0 ? "+" : ""}
                          {dynamicGapPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-1 rounded text-[11px] font-bold ${
                            isBullish
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : isBearish
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {isBullish ? "🟢 BULLISH GAP" : isBearish ? "🔴 BEARISH GAP" : "⚪ NEUTRAL"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>Formula: Implied_GBX = (ADR_USD × 100) / (Ratio × GBP_USD)</span>
            <span className="text-emerald-400">Arbitrage Window: 07:50 - 08:00 BST Auction</span>
          </div>
        </div>
      )}
    </div>
  );
};
