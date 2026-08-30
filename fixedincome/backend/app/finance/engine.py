from __future__ import annotations

from dataclasses import replace
from typing import Any

import numpy as np

from app.finance.black_scholes import (
    FinanceError,
    OptionInput,
    call_price,
    intrinsic_value,
    option_price,
    position_value,
    put_price,
    time_value,
    validate_option,
)
from app.finance.greeks import all_greeks, position_greeks
from app.finance.hedging import delta_hedge, hedge_simulation, rebalance_recommendation
from app.finance.payoff import payoff_curve, payoff_summary
from app.finance.portfolio import portfolio_greeks
from app.finance.scenarios import scenario_analysis, stress_test
from app.finance.strategies import strategy_payoff


GREEK_DEFINITIONS = {
    "delta": "Approximate change in option value for a one rupee change in the underlying.",
    "gamma": "Change in delta for a one rupee change in the underlying.",
    "vega": "Sensitivity of option value to a one percentage-point change in implied volatility.",
    "theta": "Approximate daily time decay, all else equal.",
    "rho": "Sensitivity of option value to a one percentage-point change in interest rates.",
}


def analyze_option(option: OptionInput) -> dict[str, Any]:
    validate_option(option)
    greeks = all_greeks(option)
    position = position_greeks(option)
    premium = option_price(option)
    return {
        "input": option.__dict__,
        "call_price": call_price(replace(option, option_type="call")),
        "put_price": put_price(replace(option, option_type="put")),
        "option_premium": premium,
        "position_value": position_value(option),
        "intrinsic_value": intrinsic_value(option),
        "time_value": time_value(option),
        "greeks": greeks,
        "position_greeks": position,
        "definitions": GREEK_DEFINITIONS,
        "payoff": {"curve": payoff_curve(option), "summary": payoff_summary(option)},
        "hedge": delta_hedge(option),
        "charts": greeks_charts(option),
        "scenarios": scenario_analysis(option),
        "stress": stress_test(option),
    }


def greeks_charts(option: OptionInput) -> dict[str, list[dict[str, float]]]:
    price_points = np.linspace(max(1, option.stock_price * 0.75), option.stock_price * 1.25, 41)
    vol_points = np.linspace(max(0.05, option.volatility * 0.45), option.volatility * 1.75, 35)
    expiry_points = np.linspace(max(1 / 365, option.time_to_maturity * 0.08), max(option.time_to_maturity * 1.5, 0.25), 35)
    rate_points = np.linspace(option.risk_free_rate - 0.03, option.risk_free_rate + 0.03, 35)

    return {
        "delta_vs_stock": [{"stock_price": float(s), "delta": all_greeks(replace(option, stock_price=float(s)))["delta"]} for s in price_points],
        "gamma_vs_stock": [{"stock_price": float(s), "gamma": all_greeks(replace(option, stock_price=float(s)))["gamma"]} for s in price_points],
        "vega_vs_volatility": [{"volatility": float(v), "vega": all_greeks(replace(option, volatility=float(v)))["vega"]} for v in vol_points],
        "theta_vs_time": [{"days_to_expiry": float(t * 365), "theta": all_greeks(replace(option, time_to_maturity=float(t)))["theta"]} for t in expiry_points],
        "rho_vs_rate": [{"risk_free_rate": float(r), "rho": all_greeks(replace(option, risk_free_rate=float(r)))["rho"]} for r in rate_points],
    }


def full_simulation(option: OptionInput, strategy: str = "long_call", rebalancing_mode: str = "price", threshold: float = 25) -> dict[str, Any]:
    analysis = analyze_option(option)
    simulation = hedge_simulation(
        option,
        [
            option.stock_price * 0.98,
            option.stock_price,
            option.stock_price * 1.02,
            option.stock_price * 1.04,
            option.stock_price * 1.06,
        ],
    )
    last_required = simulation[-1]["required_hedge"]
    rebalancing = rebalance_recommendation(
        previous_hedge=analysis["hedge"]["required_hedge"],
        new_required_hedge=last_required,
        threshold=threshold,
        mode=rebalancing_mode,
    )
    return {
        **analysis,
        "hedge_simulation": simulation,
        "rebalancing": rebalancing,
        "strategy": strategy_payoff(strategy, option.stock_price, option.strike_price, analysis["option_premium"], option.multiplier),
    }


def analyze_portfolio(positions: list[OptionInput]) -> dict:
    if not positions:
        raise FinanceError("At least one position is required.")
    return portfolio_greeks(positions)
