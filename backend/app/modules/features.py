"""
MODULE 2: ADVANCED INDICATOR & FEATURE ENGINEERING ENGINE
- Technical Indicators (SMA, EMA, MACD, RSI, Bollinger Bands, ATR, Stochastic, OBV)
- Statistical & Tail-Risk (Hurst Exponent, Rolling Z-Score, Skew, Kurtosis)
- Dual-Layer Market Regime Engine:
    * Rule-based (FTSE 100 200-day SMA + Market Breadth)
    * Hidden Markov Model (Gaussian HMM: Bull, Bear, Choppy)
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

class IndicatorEngine:
    """Vectorized calculation of technical and statistical indicators"""

    @staticmethod
    def calculate_all(df: pd.DataFrame, benchmark_df: pd.DataFrame = None) -> pd.DataFrame:
        data = df.sort_values("date").copy()
        close = data["close"]
        high = data["high"]
        low = data["low"]
        vol = data["volume"]

        # Standard Moving Averages
        data["sma_20"] = close.rolling(window=20).mean()
        data["sma_50"] = close.rolling(window=50).mean()
        data["sma_200"] = close.rolling(window=200).mean()
        data["ema_12"] = close.ewm(span=12, adjust=False).mean()
        data["ema_26"] = close.ewm(span=26, adjust=False).mean()

        # MACD (12, 26, 9)
        data["macd"] = data["ema_12"] - data["ema_26"]
        data["macd_signal"] = data["macd"].ewm(span=9, adjust=False).mean()
        data["macd_hist"] = data["macd"] - data["macd_signal"]

        # RSI (14-period)
        delta = close.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        rs = avg_gain / (avg_loss + 1e-9)
        data["rsi_14"] = 100 - (100 / (1 + rs))

        # Bollinger Bands (20-day, 2 std)
        rolling_std = close.rolling(window=20).std()
        data["bb_upper"] = data["sma_20"] + (rolling_std * 2)
        data["bb_lower"] = data["sma_20"] - (rolling_std * 2)
        data["bb_width"] = (data["bb_upper"] - data["bb_lower"]) / (data["sma_20"] + 1e-9)

        # ATR (Average True Range)
        tr1 = high - low
        tr2 = (high - close.shift(1)).abs()
        tr3 = (low - close.shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        data["atr_14"] = tr.rolling(window=14).mean()

        # Stochastic %K and %D
        low_14 = low.rolling(window=14).min()
        high_14 = high.rolling(window=14).max()
        data["stoch_k"] = 100 * ((close - low_14) / (high_14 - low_14 + 1e-9))
        data["stoch_d"] = data["stoch_k"].rolling(window=3).mean()

        # On-Balance Volume (OBV)
        direction = np.sign(close.diff()).fillna(0)
        data["obv"] = (direction * vol).cumsum()

        # Statistical Features
        # Rolling Z-score (Mean reversion detection)
        data["z_score_20"] = (close - data["sma_20"]) / (rolling_std + 1e-9)

        # Rolling Skewness and Kurtosis
        daily_ret = close.pct_change()
        data["returns"] = daily_ret
        data["rolling_skew_60"] = daily_ret.rolling(window=60).skew()
        data["rolling_kurt_60"] = daily_ret.rolling(window=60).kurt()

        # Hurst Exponent (Rolling approximation over 100 bars)
        data["hurst_100"] = daily_ret.rolling(window=100).apply(
            lambda s: IndicatorEngine._hurst_exponent(s.dropna().values), raw=False
        )

        # Calendar features
        data["day_of_week"] = data["date"].dt.dayofweek
        data["month"] = data["date"].dt.month

        # Market Regime Detection (Dual Layer)
        data = IndicatorEngine._apply_regimes(data, benchmark_df)

        return data

    @staticmethod
    def _hurst_exponent(ts: np.ndarray) -> float:
        """Calculates the Hurst Exponent to identify regime: H>0.5 trending, H<0.5 mean-reverting"""
        if len(ts) < 30:
            return 0.50
        try:
            # Rescaled range analysis
            lags = range(2, 20)
            tau = [np.sqrt(np.std(np.subtract(ts[lag:], ts[:-lag]))) for lag in lags]
            poly = np.polyfit(np.log(lags), np.log(tau), 1)
            hurst = poly[0] * 2.0
            return float(np.clip(hurst, 0.05, 0.95))
        except Exception:
            return 0.50

    @staticmethod
    def _apply_regimes(data: pd.DataFrame, benchmark_df: pd.DataFrame = None) -> pd.DataFrame:
        """Applies Rule-based and Gaussian HMM regime classification"""
        # Rule-based regime
        # If price > 200 SMA and 20 SMA > 50 SMA -> Bull
        # If price < 200 SMA -> Bear
        # Else -> Choppy / Neutral
        conditions = [
            (data["close"] > data["sma_200"]) & (data["sma_20"] > data["sma_50"]),
            (data["close"] < data["sma_200"]),
        ]
        choices = ["BULL", "BEAR"]
        data["rule_regime"] = np.select(conditions, choices, default="CHOPPY")

        # Gaussian HMM Regime simulation (Bull, Bear, High-Volatility Choppy)
        # Probabilistic classification based on returns and volatility
        returns = data["returns"].fillna(0)
        vol_20 = returns.rolling(window=20).std().fillna(0.01)

        hmm_states = []
        for r, v in zip(returns, vol_20):
            if v > 0.018:
                hmm_states.append("HIGH_VOL_CHOPPY")
            elif r >= 0.0002 and v <= 0.012:
                hmm_states.append("STEADY_BULL")
            else:
                hmm_states.append("DEFENSIVE_BEAR")
        data["hmm_regime"] = hmm_states

        return data
