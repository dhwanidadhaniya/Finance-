"""
test_ratios.py
---------------
Unit tests for src/ratios.py. Each ratio function is tested with a simple,
hand-computable example (so the expected value in the assertion can be
verified with a calculator) plus at least one missing/zero-data edge case
to confirm we return NaN instead of crashing.
"""

import math
import pandas as pd
from src import ratios


def is_nan(x):
    return isinstance(x, float) and math.isnan(x)


# ---------------------------------------------------------------------------
# Liquidity
# ---------------------------------------------------------------------------

def test_current_ratio_basic():
    assert ratios.current_ratio(current_assets=200, current_liabilities=100) == 2.0


def test_current_ratio_zero_liabilities_returns_nan():
    assert is_nan(ratios.current_ratio(current_assets=200, current_liabilities=0))


def test_quick_ratio_basic():
    # (200 - 50) / 100 = 1.5
    assert ratios.quick_ratio(current_assets=200, inventory=50, current_liabilities=100) == 1.5


def test_quick_ratio_missing_inventory_equals_current_ratio():
    # Edge case: company with no reported inventory line (e.g. services co.)
    result = ratios.quick_ratio(current_assets=200, inventory=float("nan"), current_liabilities=100)
    assert result == ratios.current_ratio(current_assets=200, current_liabilities=100)


# ---------------------------------------------------------------------------
# Profitability
# ---------------------------------------------------------------------------

def test_gross_margin_basic():
    assert ratios.gross_margin(gross_profit=40, revenue=100) == 0.4


def test_net_margin_basic():
    assert ratios.net_margin(net_income=10, revenue=100) == 0.1


def test_return_on_assets_basic():
    assert ratios.return_on_assets(net_income=10, avg_total_assets=200) == 0.05


def test_return_on_equity_basic():
    assert ratios.return_on_equity(net_income=10, avg_total_equity=50) == 0.2


# ---------------------------------------------------------------------------
# Leverage
# ---------------------------------------------------------------------------

def test_debt_to_equity_basic():
    assert ratios.debt_to_equity(total_liabilities=300, total_equity=100) == 3.0


def test_interest_coverage_basic():
    assert ratios.interest_coverage(operating_income=50, interest_expense=10) == 5.0


def test_interest_coverage_no_debt_returns_nan():
    # A company with zero interest expense (no debt) has an undefined,
    # not infinite, coverage ratio for our purposes.
    assert is_nan(ratios.interest_coverage(operating_income=50, interest_expense=0))


# ---------------------------------------------------------------------------
# Efficiency
# ---------------------------------------------------------------------------

def test_asset_turnover_basic():
    assert ratios.asset_turnover(revenue=300, avg_total_assets=150) == 2.0


def test_inventory_turnover_basic():
    assert ratios.inventory_turnover(cogs=120, avg_inventory=30) == 4.0


def test_inventory_turnover_missing_inventory_returns_nan():
    assert is_nan(ratios.inventory_turnover(cogs=120, avg_inventory=float("nan")))


# ---------------------------------------------------------------------------
# Batch / timeseries computation
# ---------------------------------------------------------------------------

def test_compute_ratio_timeseries_two_periods():
    """
    Builds a tiny 2-period normalized DataFrame (most-recent-first, matching
    data_fetch's convention) and checks the batch function produces sane,
    correctly-averaged results without crashing on the oldest period.
    """
    df = pd.DataFrame(
        {
            "revenue": [110, 100],
            "cogs": [66, 60],
            "gross_profit": [44, 40],
            "operating_income": [22, 20],
            "interest_expense": [2, 2],
            "pretax_income": [20, 18],
            "tax_provision": [4, 3.6],
            "net_income": [16, 14.4],
            "total_assets": [220, 200],
            "current_assets": [80, 70],
            "inventory": [20, 18],
            "current_liabilities": [40, 35],
            "total_liabilities": [120, 100],
            "total_equity": [100, 100],
            "total_debt": [80, 70],
        },
        index=pd.to_datetime(["2024-12-31", "2023-12-31"]),
    )

    result = ratios.compute_ratio_timeseries(df)

    assert len(result) == 2
    # Most recent period: current_ratio = 80/40 = 2.0
    assert result.iloc[0]["current_ratio"] == 2.0
    # Oldest period has no "prior" so avg falls back to its own ending balance:
    # ROA = 14.4 / 200 = 0.072
    assert math.isclose(result.iloc[1]["roa"], 14.4 / 200, rel_tol=1e-9)
    # Most recent period ROA uses avg(220, 200) = 210: 16 / 210
    assert math.isclose(result.iloc[0]["roa"], 16 / 210, rel_tol=1e-9)
