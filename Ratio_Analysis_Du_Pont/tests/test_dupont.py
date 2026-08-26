"""
test_dupont.py
---------------
Unit tests for src/dupont.py. The key property under test is the DuPont
*identity*: the 3-step and 5-step components must multiply back to the
same ROE (within floating point tolerance) since the decomposition is an
algebraic identity, not an approximation. We also check that 3-step ROE
and 5-step ROE agree with each other, since they decompose the same ROE
two different ways.
"""

import math
import pandas as pd
from src import dupont


def test_dupont_3_step_multiplies_to_roe():
    result = dupont.dupont_3_step(
        net_income=20, revenue=200, avg_total_assets=400, avg_total_equity=100
    )
    expected_roe = 20 / 100  # net_income / avg_total_equity
    assert math.isclose(result["roe"], expected_roe, rel_tol=1e-9)
    # cross-check the identity holds via direct multiplication
    product = result["net_margin"] * result["asset_turnover"] * result["equity_multiplier"]
    assert math.isclose(product, expected_roe, rel_tol=1e-9)


def test_dupont_5_step_multiplies_to_roe():
    result = dupont.dupont_5_step(
        net_income=20,
        pretax_income=25,
        operating_income=30,  # EBIT proxy
        revenue=200,
        avg_total_assets=400,
        avg_total_equity=100,
    )
    expected_roe = 20 / 100
    assert math.isclose(result["roe"], expected_roe, rel_tol=1e-9)


def test_3_step_and_5_step_agree_on_same_inputs():
    """
    Both decompositions describe the same company/period, so their
    reconstructed ROE values must match each other, not just the textbook
    formula independently.
    """
    inputs = dict(
        net_income=20,
        pretax_income=25,
        operating_income=30,
        revenue=200,
        avg_total_assets=400,
        avg_total_equity=100,
    )
    step3 = dupont.dupont_3_step(
        inputs["net_income"], inputs["revenue"], inputs["avg_total_assets"], inputs["avg_total_equity"]
    )
    step5 = dupont.dupont_5_step(**inputs)
    assert math.isclose(step3["roe"], step5["roe"], rel_tol=1e-9)


def test_dupont_5_step_no_debt_interest_burden_is_one():
    """
    Edge case: a company with zero interest expense should have
    pretax_income == operating_income (EBIT), so interest_burden == 1.0
    (no earnings eroded by interest).
    """
    result = dupont.dupont_5_step(
        net_income=15,
        pretax_income=20,
        operating_income=20,  # equals pretax_income since no interest expense
        revenue=200,
        avg_total_assets=400,
        avg_total_equity=100,
    )
    assert math.isclose(result["interest_burden"], 1.0, rel_tol=1e-9)


def test_dupont_missing_data_propagates_nan_not_crash():
    result = dupont.dupont_3_step(
        net_income=float("nan"), revenue=200, avg_total_assets=400, avg_total_equity=100
    )
    assert math.isnan(result["roe"])


def test_compute_dupont_timeseries_two_periods():
    df = pd.DataFrame(
        {
            "revenue": [110, 100],
            "operating_income": [22, 20],
            "pretax_income": [20, 18],
            "net_income": [16, 14.4],
            "total_assets": [220, 200],
            "total_equity": [100, 100],
        },
        index=pd.to_datetime(["2024-12-31", "2023-12-31"]),
    )
    result = dupont.compute_dupont_timeseries(df)
    assert len(result) == 2
    assert set(["roe_3step", "roe_5step"]).issubset(result.columns)
    # both decompositions should agree with each other per period
    for i in range(len(result)):
        assert math.isclose(result.iloc[i]["roe_3step"], result.iloc[i]["roe_5step"], rel_tol=1e-6)
