from __future__ import annotations

from app.finance.black_scholes import OptionInput, option_price, position_value
from app.finance.greeks import position_greeks


def portfolio_greeks(positions: list[OptionInput]) -> dict:
    rows = []
    totals = {"value": 0.0, "delta": 0.0, "gamma": 0.0, "vega": 0.0, "theta": 0.0, "rho": 0.0}
    for index, position in enumerate(positions, start=1):
        greeks = position_greeks(position)
        value = position_value(position)
        row = {
            "position": f"Position {index}",
            "type": position.option_type,
            "strike": position.strike_price,
            "expiry_years": position.time_to_maturity,
            "quantity": position.contracts,
            "option_value": option_price(position),
            "market_value": value,
            **greeks,
        }
        rows.append(row)
        totals["value"] += value
        for key in ["delta", "gamma", "vega", "theta", "rho"]:
            totals[key] += greeks[key]
    return {"positions": rows, "totals": totals}
