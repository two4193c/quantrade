"""
MODULE 6: PAPER TRADING, ALERTING & BROKER EXECUTION BRIDGE
- Core Paper Trading Mode: Simulated portfolio with realistic fills, stamp duty, and slippage
- Alert Dispatcher: Telegram Bot & Webhook notification when signals trigger
- Pluggable Broker Interface: BaseBroker abstraction ready for Interactive Brokers / Trading 212
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import logging

logger = logging.getLogger("quanttrade.paper_trading")

class BaseBroker(ABC):
    """Execution Bridge Interface for live and paper brokers"""
    @abstractmethod
    def submit_order(self, ticker: str, action: str, shares: int, order_type: str = "MARKET", limit_price: Optional[float] = None) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_positions(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_account_summary(self) -> Dict[str, Any]:
        pass


class PaperTradingEngine(BaseBroker):
    """Simulated Paper Broker tracking orders and virtual capital"""

    def __init__(self, initial_capital: float = 100000.0, stamp_duty_rate: float = 0.005, slippage_bps: float = 5.0):
        self.cash = initial_capital
        self.initial_capital = initial_capital
        self.stamp_duty_rate = stamp_duty_rate
        self.slippage_rate = slippage_bps / 10000.0
        self.positions: Dict[str, Dict[str, Any]] = {}
        self.order_history: List[Dict[str, Any]] = []

    def submit_order(
        self,
        ticker: str,
        action: str,  # BUY or SELL
        shares: int,
        order_type: str = "MARKET",
        limit_price: Optional[float] = None,
        market_price: Optional[float] = None
    ) -> Dict[str, Any]:
        ref_price = market_price or 2450.0  # Default GBX quote if not provided
        exec_price = ref_price * (1 + self.slippage_rate) if action == "BUY" else ref_price * (1 - self.slippage_rate)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if action == "BUY":
            gross = shares * exec_price
            stamp_duty = gross * self.stamp_duty_rate
            total_cost = gross + stamp_duty
            
            if total_cost > self.cash:
                return {
                    "success": False,
                    "reason": f"Insufficient funds: Required £{total_cost/100:.2f}, Available £{self.cash/100:.2f}"
                }

            self.cash -= total_cost
            if ticker in self.positions:
                prev = self.positions[ticker]
                new_shares = prev["shares"] + shares
                avg_cost = ((prev["shares"] * prev["avg_price"]) + gross) / new_shares
                self.positions[ticker] = {"shares": new_shares, "avg_price": avg_cost, "current_price": ref_price}
            else:
                self.positions[ticker] = {"shares": shares, "avg_price": exec_price, "current_price": ref_price}

            order_record = {
                "order_id": f"ORD-{len(self.order_history) + 1:04d}",
                "timestamp": timestamp,
                "ticker": ticker,
                "action": "BUY",
                "shares": shares,
                "execution_price": round(exec_price, 2),
                "order_type": order_type,
                "stamp_duty_pence": round(stamp_duty, 2),
                "status": "FILLED"
            }
            self.order_history.append(order_record)
            return {"success": True, "order": order_record}

        elif action == "SELL":
            if ticker not in self.positions or self.positions[ticker]["shares"] < shares:
                return {"success": False, "reason": f"Insufficient shares held for {ticker}"}

            gross = shares * exec_price
            self.cash += gross
            
            self.positions[ticker]["shares"] -= shares
            if self.positions[ticker]["shares"] == 0:
                del self.positions[ticker]

            order_record = {
                "order_id": f"ORD-{len(self.order_history) + 1:04d}",
                "timestamp": timestamp,
                "ticker": ticker,
                "action": "SELL",
                "shares": shares,
                "execution_price": round(exec_price, 2),
                "order_type": order_type,
                "stamp_duty_pence": 0.0,
                "status": "FILLED"
            }
            self.order_history.append(order_record)
            return {"success": True, "order": order_record}

        return {"success": False, "reason": "Invalid action"}

    def get_positions(self) -> List[Dict[str, Any]]:
        result = []
        for ticker, pos in self.positions.items():
            market_val = pos["shares"] * pos["current_price"]
            cost_basis = pos["shares"] * pos["avg_price"]
            unrealized_pnl = market_val - cost_basis
            unrealized_pnl_pct = (unrealized_pnl / cost_basis) * 100 if cost_basis > 0 else 0
            result.append({
                "ticker": ticker,
                "shares": pos["shares"],
                "avg_cost_pence": round(pos["avg_price"], 2),
                "current_price_pence": round(pos["current_price"], 2),
                "market_value_gbp": round(market_val / 100.0, 2),
                "unrealized_pnl_gbp": round(unrealized_pnl / 100.0, 2),
                "unrealized_pnl_pct": round(unrealized_pnl_pct, 2)
            })
        return result

    def get_account_summary(self) -> Dict[str, Any]:
        positions = self.get_positions()
        equity_pence = self.cash + sum(p["shares"] * p["current_price_pence"] for p in positions)
        total_pnl_pence = equity_pence - self.initial_capital
        total_pnl_pct = (total_pnl_pence / self.initial_capital) * 100

        return {
            "initial_capital_gbp": round(self.initial_capital / 100.0, 2),
            "cash_balance_gbp": round(self.cash / 100.0, 2),
            "total_equity_gbp": round(equity_pence / 100.0, 2),
            "total_pnl_gbp": round(total_pnl_pence / 100.0, 2),
            "total_pnl_pct": round(total_pnl_pct, 2),
            "open_positions_count": len(positions),
            "total_orders_count": len(self.order_history)
        }


class AlertDispatcher:
    """Dispatches trade signal alerts via Telegram Bot or HTTP Webhook"""
    
    @staticmethod
    def send_telegram_alert(bot_token: str, chat_id: str, message: str) -> Dict[str, Any]:
        if not bot_token or not chat_id:
            logger.info("Telegram credentials omitted; simulation logging alert: %s", message)
            return {"status": "simulated", "message": message, "channel": "telegram_simulation"}
            
        import requests
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {"chat_id": chat_id, "text": message, "parse_mode": "Markdown"}
        try:
            res = requests.post(url, json=payload, timeout=5)
            return {"status": "sent" if res.status_code == 200 else "failed", "code": res.status_code}
        except Exception as e:
            return {"status": "error", "error": str(e)}
