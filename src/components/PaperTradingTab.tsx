import React, { useState } from "react";
import { Send, Bell, DollarSign, Shield, ArrowRight, CheckCircle2, History, AlertCircle } from "lucide-react";
import { PaperSummary, UniverseConstituent } from "../types";

interface PaperTradingTabProps {
  paperSummary: PaperSummary | null;
  universe: UniverseConstituent[];
  onPlaceOrder: (order: any) => Promise<boolean>;
  onSendTestAlert: (ticker: string, action: string, message: string) => Promise<void>;
  loading: boolean;
}

export const PaperTradingTab: React.FC<PaperTradingTabProps> = ({
  paperSummary,
  universe,
  onPlaceOrder,
  onSendTestAlert,
  loading
}) => {
  const [ticker, setTicker] = useState("AZN.L");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [shares, setShares] = useState(100);
  const [orderType, setOrderType] = useState("MARKET");
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  const selectedConstituent = universe.find((u) => u.ticker === ticker) || universe[0];
  const refPriceGbx = selectedConstituent?.basePrice || 2500;
  const refPriceGbp = refPriceGbx / 100;
  const grossCostGbp = (shares * refPriceGbp);
  const stampDutyGbp = action === "BUY" ? grossCostGbp * 0.005 : 0;
  const totalCostGbp = grossCostGbp + stampDutyGbp;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPlaceOrder({
      ticker,
      action,
      shares,
      priceGbx: refPriceGbx,
      orderType
    });
  };

  const handleTriggerAlert = async () => {
    await onSendTestAlert(
      ticker,
      action,
      `🚨 Signal Trigger: ${action} ${shares} shares of ${ticker} at ${refPriceGbx}p (£${refPriceGbp.toFixed(2)}). Strategy: Trend Following in STEADY_BULL.`
    );
    setAlertFeedback("Telegram / Webhook alert successfully dispatched to notification bus!");
    setTimeout(() => setAlertFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">Paper Trading & Real-Time Alerting Engine</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Module 6
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulated order matching with zero real capital risk, strict 0.5% SDRT tax deduction, and broker execution bridge
            </p>
          </div>

          <button
            onClick={handleTriggerAlert}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Telegram / Webhook Alert</span>
          </button>
        </div>

        {alertFeedback && (
          <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{alertFeedback}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Order Ticket & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Ticket Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center space-x-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Simulated Order Ticket</span>
          </h3>

          <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs">
            {/* Action Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setAction("BUY")}
                className={`py-1.5 rounded font-medium transition ${
                  action === "BUY" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setAction("SELL")}
                className={`py-1.5 rounded font-medium transition ${
                  action === "SELL" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                SELL
              </button>
            </div>

            {/* Ticker Selection */}
            <div>
              <label className="block text-slate-400 mb-1">FTSE 100 Constituent</label>
              <select
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
              >
                {universe.map((u) => (
                  <option key={u.ticker} value={u.ticker}>
                    {u.ticker} ({u.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Order Type */}
            <div>
              <label className="block text-slate-400 mb-1">Order Execution Type</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
              >
                <option value="MARKET">Market Order (Next-Bar Fill)</option>
                <option value="LIMIT">Limit Order (Pullback Execution)</option>
                <option value="STOP">Stop Order (Breakout Entry)</option>
              </select>
            </div>

            {/* Shares Quantity */}
            <div>
              <label className="block text-slate-400 mb-1">Shares Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={shares}
                onChange={(e) => setShares(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Order Cost Breakdown */}
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Ref Quote:</span>
                <span className="text-slate-200">{refPriceGbx}p (£{refPriceGbp.toFixed(2)})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gross Value:</span>
                <span className="text-slate-200">£{grossCostGbp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>0.5% UK Stamp Duty:</span>
                <span className="text-amber-300">£{stampDutyGbp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-100 font-bold pt-1 border-t border-slate-700">
                <span>Estimated Total:</span>
                <span className="text-emerald-400">£{totalCostGbp.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white font-medium text-xs transition flex items-center justify-center space-x-1.5 shadow ${
                action === "BUY" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit {action} Order</span>
            </button>
          </form>
        </div>

        {/* Account Details & Execution Bridge */}
        <div className="lg:col-span-2 space-y-6">
          {/* Virtual Account Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-mono">Available Cash</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                £{paperSummary?.summary.cashBalanceGbp.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">100% Unleveraged</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-mono">Total Equity</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                £{paperSummary?.summary.totalEquityGbp.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Initial: £{paperSummary?.summary.initialCapitalGbp.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-mono">Total Paper P&L</span>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  (paperSummary?.summary.totalPnlGbp || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {(paperSummary?.summary.totalPnlGbp || 0) >= 0 ? "+" : ""}£
                {paperSummary?.summary.totalPnlGbp.toFixed(2)} ({paperSummary?.summary.totalPnlPct.toFixed(2)}%)
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Active Paper Account</span>
            </div>
          </div>

          {/* Broker Bridge Architecture Note */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <h4 className="text-xs font-semibold text-slate-200">Pluggable Execution Bridge Status</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                BaseBroker Active
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 font-mono">
              <div className="p-2.5 bg-slate-800/60 rounded border border-slate-700">
                <span className="text-slate-200 font-bold block">Paper Broker</span>
                <span className="text-emerald-400 text-[10px]">CONNECTED (Default)</span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded border border-slate-700">
                <span className="text-slate-200 font-bold block">Interactive Brokers</span>
                <span className="text-slate-400 text-[10px]">ib_insync Bridge Ready</span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded border border-slate-700">
                <span className="text-slate-200 font-bold block">Trading 212</span>
                <span className="text-slate-400 text-[10px]">REST API v0 Ready</span>
              </div>
            </div>
          </div>

          {/* Paper Orders History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-100 flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Simulated Order History</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                {paperSummary?.orders.length || 0} Orders
              </span>
            </div>

            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/50 text-slate-400 uppercase font-mono text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Ticker</th>
                    <th className="py-2 px-3">Side</th>
                    <th className="py-2 px-3">Shares</th>
                    <th className="py-2 px-3">Price (GBX)</th>
                    <th className="py-2 px-3">0.5% SDRT</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                  {paperSummary?.orders.map((ord) => (
                    <tr key={ord.orderId} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-400">{ord.orderId}</td>
                      <td className="py-2 px-3 text-slate-500">{ord.timestamp.slice(11)}</td>
                      <td className="py-2 px-3 font-semibold text-slate-100">{ord.ticker}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            ord.action === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {ord.action}
                        </span>
                      </td>
                      <td className="py-2 px-3">{ord.shares}</td>
                      <td className="py-2 px-3">{ord.priceGbx}p</td>
                      <td className="py-2 px-3 text-amber-300">
                        {ord.stampDutyGbp > 0 ? `£${ord.stampDutyGbp.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400">{ord.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
