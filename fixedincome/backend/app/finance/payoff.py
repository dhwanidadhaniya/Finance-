from __future__ import annotations

import numpy as np

from app.finance.black_scholes import OptionInput, option_price, validate_option


def payoff_at_price(option: OptionInput, underlying_price: float) -> dict[str, float]:
    validate_option(option)
    if underlying_price <= 0:
        raise ValueError("Underlying price must be positive.")
    premium = option_price(option)
    scale = option.contracts * option.multiplier
    intrinsic = max(underlying_price - option.strike_price, 0) if option.option_type.lower() == "call" else max(option.strike_price - underlying_price, 0)
    profit_loss = (intrinsic - premium) * scale
    return {"underlying_price": underlying_price, "payoff": intrinsic * scale, "profit_loss": profit_loss}


def payoff_curve(option: OptionInput, steps: int = 41) -> list[dict[str, float]]:
    validate_option(option)
    low = max(1.0, option.stock_price * 0.65)
    high = option.stock_price * 1.35
    return [payoff_at_price(option, float(price)) for price in np.linspace(low, high, steps)]


def payoff_summary(option: OptionInput) -> dict[str, float | str]:
    premium = option_price(option)
    scale = option.contracts * option.multiplier
    if option.option_type.lower() == "call":
        breakeven = option.strike_price + premium
        upside = "Unlimited in theory as the stock price rises."
    else:
        breakeven = option.strike_price - premium
        upside = f"Limited because the underlying price cannot fall below zero."
    return {
        "breakeven": breakeven,
        "maximum_loss": premium * scale,
        "potential_upside": upside,
    }
