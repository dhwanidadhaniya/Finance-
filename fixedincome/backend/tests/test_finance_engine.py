from dataclasses import replace
from math import exp

import pytest

from app.finance.black_scholes import FinanceError, OptionInput, call_price, option_price, put_price, validate_option
from app.finance.engine import analyze_option, analyze_portfolio, full_simulation
from app.finance.greeks import delta, gamma, rho, theta, vega
from app.finance.hedging import delta_hedge
from app.finance.payoff import payoff_at_price, payoff_summary
from app.finance.scenarios import scenario_analysis, stress_test


BASE = OptionInput(100, 100, 1, 0.20, 0.05, 0.0, "call", 1, 1)


def test_black_scholes_known_values():
    assert call_price(BASE) == pytest.approx(10.4506, abs=1e-4)
    assert put_price(replace(BASE, option_type="put")) == pytest.approx(5.5735, abs=1e-4)


def test_put_call_parity():
    call = call_price(BASE)
    put = put_price(replace(BASE, option_type="put"))
    parity = BASE.stock_price * exp(-BASE.dividend_yield * BASE.time_to_maturity) - BASE.strike_price * exp(
        -BASE.risk_free_rate * BASE.time_to_maturity
    )
    assert call - put == pytest.approx(parity, abs=1e-8)


def test_greeks_known_values():
    assert delta(BASE) == pytest.approx(0.6368, abs=1e-4)
    assert gamma(BASE) == pytest.approx(0.0188, abs=1e-4)
    assert vega(BASE) == pytest.approx(0.3752, abs=1e-4)
    assert theta(BASE) == pytest.approx(-0.0176, abs=1e-4)
    assert rho(BASE) == pytest.approx(0.5323, abs=1e-4)


def test_payoff_and_breakeven():
    option = OptionInput(100, 100, 1, 0.2, 0.05, 0, "call", 2, 1)
    summary = payoff_summary(option)
    assert summary["breakeven"] == pytest.approx(110.4506, abs=1e-4)
    assert payoff_at_price(option, 120)["profit_loss"] == pytest.approx((20 - call_price(option)) * 2)


def test_delta_hedge_offsets_position_delta():
    option = OptionInput(100, 100, 1, 0.2, 0.05, 0, "call", 10, 1)
    hedge = delta_hedge(option)
    assert hedge["required_hedge"] == pytest.approx(-delta(option) * 10)
    assert hedge["post_hedge_delta"] == pytest.approx(0)


def test_portfolio_greeks_sum_positions():
    call = OptionInput(100, 100, 1, 0.2, 0.05, 0, "call", 10, 1)
    put = OptionInput(100, 100, 1, 0.2, 0.05, 0, "put", 5, 1)
    result = analyze_portfolio([call, put])
    assert len(result["positions"]) == 2
    assert result["totals"]["delta"] == pytest.approx(delta(call) * 10 + delta(put) * 5)


def test_scenario_and_stress_outputs():
    scenarios = scenario_analysis(BASE)
    stress = stress_test(BASE)
    assert [row["scenario"] for row in scenarios] == ["Bear", "Base", "Bull"]
    assert len(stress) == 5
    assert stress[0]["stock_move"] == -0.15


def test_full_simulation_contains_main_sections():
    result = full_simulation(BASE, "long_call", "price", 1)
    assert "hedge_simulation" in result
    assert "strategy" in result
    assert result["hedge"]["post_hedge_delta"] == pytest.approx(0)


def test_input_validation_edge_cases():
    with pytest.raises(FinanceError):
        validate_option(replace(BASE, stock_price=0))
    with pytest.raises(FinanceError):
        validate_option(replace(BASE, volatility=-0.1))

    short = replace(BASE, time_to_maturity=1 / 365)
    high_vol = replace(BASE, volatility=1.25)
    deep_itm = replace(BASE, stock_price=180)
    deep_otm = replace(BASE, stock_price=50)
    for option in [short, high_vol, deep_itm, deep_otm]:
        assert option_price(option) >= 0
        assert analyze_option(option)["option_premium"] >= 0
