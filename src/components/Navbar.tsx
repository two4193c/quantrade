import React from "react";
import { Activity, Cpu, Database, ShieldAlert, LineChart, Terminal, TrendingUp, Layers, Globe } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  circuitBreakerActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, circuitBreakerActive }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LineChart },
    { id: "strategy_lab", label: "Strategy Lab", icon: Cpu },
    { id: "data_explorer", label: "Data & Features", icon: Database },
    { id: "macro_alt", label: "Macro & Alt Data", icon: Globe },
    { id: "projections", label: "Forecast Cone & Meta", icon: TrendingUp },
    { id: "paper_trading", label: "Paper Trading", icon: Activity },
    { id: "docker", label: "Docker & Cloud Run", icon: Layers }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold tracking-wider">
              QT
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg tracking-tight text-slate-100">QuantTrade</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Dockerized
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">FTSE 100 Algorithmic Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* System & Circuit Breaker Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-mono">LSE Open</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono border ${
                circuitBreakerActive
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{circuitBreakerActive ? "DD HALTED (>10%)" : "CB ARMED"}</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-2 scrollbar-none border-t border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs whitespace-nowrap ${
                  isActive ? "bg-slate-800 text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
