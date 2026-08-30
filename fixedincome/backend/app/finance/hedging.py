from __future__ import annotations

from dataclasses import replace

from app.finance.black_scholes import OptionInput, option_price
from app.finance.greeks import delta, gamma, position_greeks


def delta_hedge(option: OptionInput, current_hedge: float = 0.0, target_delta: float = 0.0) -> dict[str, float | str]:
    greeks = position_greeks(option)
    portfolio_delta = greeks["delta"]
    required_hedge = target_delta - portfolio_delta
    recommended_trade = required_hedge - current_hedge
    post_hedge_delta = portfolio_delta + required_hedge
    action = "sell" if recommended_trade < 0 else "buy"
    units = abs(recommended_trade)
    return {
        "portfolio_delta": portfolio_delta,
        "current_hedge": current_hedge,
        "target_delta": target_delta,
        "required_hedge": required_hedge,
        "recommended_trade": recommended_trade,
        "post_hedge_delta": post_hedge_delta,
        "explanation": f"To move toward delta-neutral, {action} {units:.2f} units of the underlying.",
    }


def hedge_simulation(option: OptionInput, prices: list[float] | None = None) -> list[dict[str, float]]:
    prices = prices or [
        option.stock_price * 0.98,
        option.stock_price,
        option.stock_price * 1.02,
        option.stock_price * 1.04,
        option.stock_price * 1.06,
    ]
    rows = []
    previous_hedge = 0.0
    for price in prices:
        shocked = replace(option, stock_price=price)
        option_delta = delta(shocked)
        portfolio_delta = option_delta * shocked.contracts * shocked.multiplier
        required_hedge = -portfolio_delta
        rows.append(
            {
                "stock_price": price,
                "option_value": option_price(shocked),
                "option_delta": option_delta,
                "gamma": gamma(shocked),
                "portfolio_delta": portfolio_delta,
                "required_hedge": required_hedge,
                "hedge_adjustment": required_hedge - previous_hedge,
            }
        )
        previous_hedge = required_hedge
    return rows


def rebalance_recommendation(previous_hedge: float, new_required_hedge: float, threshold: float, mode: str) -> dict[str, float | bool | str]:
    adjustment = new_required_hedge - previous_hedge
    should_rebalance = mode == "daily" or (mode == "price" and abs(adjustment) >= threshold)
    if mode == "none":
        should_rebalance = False
    executed_trade = adjustment if should_rebalance else 0.0
    updated_hedge = previous_hedge + executed_trade
    return {
        "previous_hedge": previous_hedge,
        "new_hedge": updated_hedge,
        "shares_bought_sold": executed_trade,
        "should_rebalance": should_rebalance,
        "note": "Frequent rebalancing can reduce directional exposure but may increase transaction costs.",
    }
