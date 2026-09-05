import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { DashboardTab } from "./components/DashboardTab";
import { StrategyLabTab } from "./components/StrategyLabTab";
import { DataExplorerTab } from "./components/DataExplorerTab";
import { ProjectionsTab } from "./components/ProjectionsTab";
import { PaperTradingTab } from "./components/PaperTradingTab";
import { DockerArchitectureTab } from "./components/DockerArchitectureTab";
import { MacroAlternativeDataTab } from "./components/MacroAlternativeDataTab";
import { UniverseConstituent, FeatureResponse, BacktestResult, ForecastResponse, PaperSummary } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [universe, setUniverse] = useState<UniverseConstituent[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("AZN.L");
  const [features, setFeatures] = useState<FeatureResponse | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [paperSummary, setPaperSummary] = useState<PaperSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        // 1. Fetch Universe
        const uRes = await fetch("/api/universe");
        const uData = await uRes.json();
        setUniverse(uData);

        // 2. Fetch Features for default ticker
        const fRes = await fetch(`/api/features/${selectedTicker}`);
        const fData = await fRes.json();
        setFeatures(fData);

        // 3. Run default backtest
        const bRes = await fetch("/api/strategy/backtest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker: selectedTicker,
            strategyEngine: "OPTUNA_GENETIC",
            fastSma: 20,
            slowSma: 50,
            initialCapital: 100000,
            volTarget: 0.15,
            stampDutyRate: 0.005
          })
        });
        const bData = await bRes.json();
        setBacktestResult(bData);

        // 4. Fetch 30-day forecast cone
        const fcRes = await fetch("/api/forward-projection/cone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentEquity: 100000,
            annualizedReturn: 0.14,
            annualizedVol: 0.16,
            daysAhead: 30
          })
        });
        const fcData = await fcRes.json();
        setForecastData(fcData);

        // 5. Fetch Paper Trading Summary
        const pRes = await fetch("/api/paper-trading/summary");
        const pData = await pRes.json();
        setPaperSummary(pData);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Handler: Change ticker & load features
  const handleSelectTicker = async (ticker: string) => {
    setSelectedTicker(ticker);
    setLoading(true);
    try {
      const res = await fetch(`/api/features/${ticker}`);
      const data = await res.json();
      setFeatures(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Ingestion trigger
  const handleTriggerIngestion = async (ticker: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ingestion/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker })
      });
      const data = await res.json();
      setStatusMessage(data.message);
      setTimeout(() => setStatusMessage(null), 4000);
      // reload features
      await handleSelectTicker(ticker);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Run Backtest
  const handleRunBacktest = async (params: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/strategy/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      setBacktestResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Refresh Forecast Cone
  const handleRefreshForecast = async (equity: number, ret: number, vol: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/forward-projection/cone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEquity: equity,
          annualizedReturn: ret,
          annualizedVol: vol,
          daysAhead: 30
        })
      });
      const data = await res.json();
      setForecastData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Place Paper Order
  const handlePlaceOrder = async (order: any): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch("/api/paper-trading/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });
      const data = await res.json();
      if (data.success) {
        // Refresh paper summary
        const pRes = await fetch("/api/paper-trading/summary");
        const pData = await pRes.json();
        setPaperSummary(pData);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handler: Send Alert Test
  const handleSendTestAlert = async (ticker: string, action: string, message: string) => {
    try {
      await fetch("/api/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, action, message })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const isCircuitBreakerTripped = (backtestResult?.haltEvents?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        circuitBreakerActive={isCircuitBreakerTripped}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Toast */}
        {statusMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* View Tabs */}
        {activeTab === "dashboard" && (
          <DashboardTab
            paperSummary={paperSummary}
            backtestData={backtestResult}
            onNavigateToLab={() => setActiveTab("strategy_lab")}
            onNavigateToData={() => setActiveTab("data_explorer")}
            onNavigateToMacro={() => setActiveTab("macro_alt")}
          />
        )}

        {activeTab === "strategy_lab" && (
          <StrategyLabTab
            universe={universe}
            backtestResult={backtestResult}
            onRunBacktest={handleRunBacktest}
            loading={loading}
          />
        )}

        {activeTab === "data_explorer" && (
          <DataExplorerTab
            universe={universe}
            features={features}
            selectedTicker={selectedTicker}
            onSelectTicker={handleSelectTicker}
            onTriggerIngestion={handleTriggerIngestion}
            loading={loading}
          />
        )}

        {activeTab === "macro_alt" && (
          <MacroAlternativeDataTab />
        )}

        {activeTab === "projections" && (
          <ProjectionsTab
            forecastData={forecastData}
            onRefreshForecast={handleRefreshForecast}
            loading={loading}
          />
        )}

        {activeTab === "paper_trading" && (
          <PaperTradingTab
            paperSummary={paperSummary}
            universe={universe}
            onPlaceOrder={handlePlaceOrder}
            onSendTestAlert={handleSendTestAlert}
            loading={loading}
          />
        )}

        {activeTab === "docker" && <DockerArchitectureTab />}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 mt-12 py-6 text-center text-xs text-slate-500 font-mono">
        <p>QuantTrade Algorithmic Trading Architecture • Google Cloud Run & Docker Ready • FTSE 100 Benchmark</p>
      </footer>
    </div>
  );
}
