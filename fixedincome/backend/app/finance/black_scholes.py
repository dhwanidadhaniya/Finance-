from __future__ import annotations

from dataclasses import dataclass
from math import exp, isfinite, log, sqrt

from scipy.stats import norm


class FinanceError(ValueError):
    pass


@dataclass(frozen=True)
class OptionInput:
    stock_price: float
    strike_price: float
    time_to_maturity: float
    volatility: float
    risk_free_rate: float
    dividend_yield: float = 0.0
    option_type: str = "call"
    contracts: int = 1
    multiplier: int = 1


def validate_option(option: OptionInput) -> None:
    if option.stock_price <= 0:
        raise FinanceError("Stock price must be positive.")
    if option.strike_price <= 0:
        raise FinanceError("Strike price must be positive.")
    if option.time_to_maturity <= 0:
        raise FinanceError("Time to maturity must be greater than zero.")
    if option.volatility <= 0:
        raise FinanceError("Volatility must be positive.")
    if option.volatility > 5:
        raise FinanceError("Volatility is outside a reasonable educational range.")
    if not isfinite(option.risk_free_rate) or not isfinite(option.dividend_yield):
        raise FinanceError("Rates must be finite numbers.")
    if option.option_type.lower() not in {"call", "put"}:
        raise FinanceError("Option type must be call or put.")
    if option.contracts == 0:
        raise FinanceError("Number of contracts cannot be zero.")
    if option.multiplier <= 0:
        raise FinanceError("Contract multiplier must be positive.")


def d1(option: OptionInput) -> float:
    validate_option(option)
    numerator = log(option.stock_price / option.strike_price) + (
        option.risk_free_rate - option.dividend_yield + 0.5 * option.volatility**2
    ) * option.time_to_maturity
    return numerator / (option.volatility * sqrt(option.time_to_maturity))


def d2(option: OptionInput) -> float:
    return d1(option) - option.volatility * sqrt(option.time_to_maturity)


def call_price(option: OptionInput) -> float:
    validate_option(option)
    first = option.stock_price * exp(-option.dividend_yield * option.time_to_maturity) * norm.cdf(d1(option))
    second = option.strike_price * exp(-option.risk_free_rate * option.time_to_maturity) * norm.cdf(d2(option))
    return float(first - second)


def put_price(option: OptionInput) -> float:
    validate_option(option)
    first = option.strike_price * exp(-option.risk_free_rate * option.time_to_maturity) * norm.cdf(-d2(option))
    second = option.stock_price * exp(-option.dividend_yield * option.time_to_maturity) * norm.cdf(-d1(option))
    return float(first - second)


def option_price(option: OptionInput) -> float:
    return call_price(option) if option.option_type.lower() == "call" else put_price(option)


def intrinsic_value(option: OptionInput) -> float:
    validate_option(option)
    if option.option_type.lower() == "call":
        return max(option.stock_price - option.strike_price, 0.0)
    return max(option.strike_price - option.stock_price, 0.0)


def time_value(option: OptionInput) -> float:
    return max(option_price(option) - intrinsic_value(option), 0.0)


def position_value(option: OptionInput) -> float:
    return option_price(option) * option.contracts * option.multiplier
