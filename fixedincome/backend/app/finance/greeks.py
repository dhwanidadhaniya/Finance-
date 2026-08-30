from __future__ import annotations

from math import exp, sqrt

from scipy.stats import norm

from app.finance.black_scholes import OptionInput, d1, d2, validate_option


def delta(option: OptionInput) -> float:
    validate_option(option)
    carry = exp(-option.dividend_yield * option.time_to_maturity)
    if option.option_type.lower() == "call":
        return float(carry * norm.cdf(d1(option)))
    return float(carry * (norm.cdf(d1(option)) - 1))


def gamma(option: OptionInput) -> float:
    validate_option(option)
    numerator = exp(-option.dividend_yield * option.time_to_maturity) * norm.pdf(d1(option))
    denominator = option.stock_price * option.volatility * sqrt(option.time_to_maturity)
    return float(numerator / denominator)


def vega(option: OptionInput) -> float:
    validate_option(option)
    raw = option.stock_price * exp(-option.dividend_yield * option.time_to_maturity) * norm.pdf(d1(option)) * sqrt(
        option.time_to_maturity
    )
    return float(raw / 100)


def theta(option: OptionInput) -> float:
    validate_option(option)
    first = -(
        option.stock_price
        * exp(-option.dividend_yield * option.time_to_maturity)
        * norm.pdf(d1(option))
        * option.volatility
    ) / (2 * sqrt(option.time_to_maturity))
    if option.option_type.lower() == "call":
        annual = (
            first
            - option.risk_free_rate
            * option.strike_price
            * exp(-option.risk_free_rate * option.time_to_maturity)
            * norm.cdf(d2(option))
            + option.dividend_yield
            * option.stock_price
            * exp(-option.dividend_yield * option.time_to_maturity)
            * norm.cdf(d1(option))
        )
    else:
        annual = (
            first
            + option.risk_free_rate
            * option.strike_price
            * exp(-option.risk_free_rate * option.time_to_maturity)
            * norm.cdf(-d2(option))
            - option.dividend_yield
            * option.stock_price
            * exp(-option.dividend_yield * option.time_to_maturity)
            * norm.cdf(-d1(option))
        )
    return float(annual / 365)


def rho(option: OptionInput) -> float:
    validate_option(option)
    raw = option.strike_price * option.time_to_maturity * exp(-option.risk_free_rate * option.time_to_maturity)
    if option.option_type.lower() == "call":
        return float(raw * norm.cdf(d2(option)) / 100)
    return float(-raw * norm.cdf(-d2(option)) / 100)


def all_greeks(option: OptionInput) -> dict[str, float]:
    return {
        "delta": delta(option),
        "gamma": gamma(option),
        "vega": vega(option),
        "theta": theta(option),
        "rho": rho(option),
    }


def position_greeks(option: OptionInput) -> dict[str, float]:
    scale = option.contracts * option.multiplier
    return {name: value * scale for name, value in all_greeks(option).items()}
