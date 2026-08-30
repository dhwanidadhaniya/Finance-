from __future__ import annotations

from dataclasses import replace

from app.finance.black_scholes import OptionInput, option_price
from app.finance.greeks import delta


def scenario_analysis(option: OptionInput) -> list[dict[str, float | str]]:
    cases = [("Bear", -0.10), ("Base", 0.0), ("Bull", 0.10)]
    base_value = option_price(option) * option.contracts * option.multiplier
    rows = []
    for name, move in cases:
        shocked = replace(option, stock_price=option.stock_price * (1 + move))
        value = option_price(shocked) * option.contracts * option.multiplier
        portfolio_delta = delta(shocked) * option.contracts * option.multiplier
        rows.append(
            {
                "scenario": name,
                "stock_move": move,
                "stock_price": shocked.stock_price,
                "option_value": value,
                "portfolio_pnl": value - base_value,
                "delta": portfolio_delta,
                "hedge_requirement": -portfolio_delta,
            }
        )
    return rows


def stress_test(option: OptionInput) -> list[dict[str, float]]:
    base_value = option_price(option) * option.contracts * option.multiplier
    rows = []
    for move in [-0.15, -0.10, 0.0, 0.10, 0.15]:
        shocked = replace(option, stock_price=option.stock_price * (1 + move))
        value = option_price(shocked) * option.contracts * option.multiplier
        rows.append(
            {
                "stock_move": move,
                "stock_price": shocked.stock_price,
                "option_value": value,
                "portfolio_pnl": value - base_value,
                "delta": delta(shocked) * option.contracts * option.multiplier,
            }
        )
    return rows
