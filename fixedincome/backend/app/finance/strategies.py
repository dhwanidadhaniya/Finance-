from __future__ import annotations

import numpy as np


def strategy_payoff(strategy: str, stock_price: float, strike: float, premium: float, multiplier: int = 1) -> dict:
    strategy = strategy.lower().replace(" ", "_")
    prices = np.linspace(max(1, stock_price * 0.65), stock_price * 1.35, 41)
    upper = strike * 1.08
    lower = strike * 0.92

    def call(s: float, k: float, p: float) -> float:
        return max(s - k, 0) - p

    def put(s: float, k: float, p: float) -> float:
        return max(k - s, 0) - p

    rows = []
    for s in prices:
        if strategy == "long_call":
            pnl = call(float(s), strike, premium)
        elif strategy == "long_put":
            pnl = put(float(s), strike, premium)
        elif strategy == "covered_call":
            pnl = (float(s) - stock_price) - max(float(s) - strike, 0) + premium
        elif strategy == "protective_put":
            pnl = (float(s) - stock_price) + max(strike - float(s), 0) - premium
        elif strategy == "bull_call_spread":
            pnl = max(float(s) - lower, 0) - max(float(s) - upper, 0) - premium
        elif strategy == "bear_put_spread":
            pnl = max(upper - float(s), 0) - max(lower - float(s), 0) - premium
        else:
            raise ValueError("Unsupported strategy.")
        rows.append({"stock_price": float(s), "profit_loss": pnl * multiplier})

    summaries = {
        "long_call": {
            "components": "Buy one call option.",
            "maximum_profit": "Unlimited in theory.",
            "maximum_loss": premium * multiplier,
            "breakeven": strike + premium,
            "outlook": "Bullish: useful when expecting the underlying to rise.",
        },
        "long_put": {
            "components": "Buy one put option.",
            "maximum_profit": max(strike - premium, 0) * multiplier,
            "maximum_loss": premium * multiplier,
            "breakeven": strike - premium,
            "outlook": "Bearish: useful when expecting the underlying to fall.",
        },
        "covered_call": {
            "components": "Own the stock and sell one call.",
            "maximum_profit": (max(strike - stock_price, 0) + premium) * multiplier,
            "maximum_loss": "Large if the stock falls sharply.",
            "breakeven": stock_price - premium,
            "outlook": "Mildly bullish or neutral: income helps but upside is capped.",
        },
        "protective_put": {
            "components": "Own the stock and buy one put.",
            "maximum_profit": "Large if the stock rises.",
            "maximum_loss": (max(stock_price - strike, 0) + premium) * multiplier,
            "breakeven": stock_price + premium,
            "outlook": "Bullish with downside protection.",
        },
        "bull_call_spread": {
            "components": "Buy a lower-strike call and sell a higher-strike call.",
            "maximum_profit": ((upper - lower) - premium) * multiplier,
            "maximum_loss": premium * multiplier,
            "breakeven": lower + premium,
            "outlook": "Moderately bullish with capped risk and capped upside.",
        },
        "bear_put_spread": {
            "components": "Buy a higher-strike put and sell a lower-strike put.",
            "maximum_profit": ((upper - lower) - premium) * multiplier,
            "maximum_loss": premium * multiplier,
            "breakeven": upper - premium,
            "outlook": "Moderately bearish with capped risk and capped upside.",
        },
    }
    return {"strategy": strategy, "curve": rows, "summary": summaries[strategy]}
