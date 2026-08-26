"""
dupont.py
---------
3-step and 5-step DuPont decomposition of Return on Equity (ROE).

3-step DuPont:
    ROE = Net Margin  x  Asset Turnover  x  Equity Multiplier
        = (Net Income / Revenue) x (Revenue / Avg Total Assets) x (Avg Total Assets / Avg Total Equity)

    Notice the Revenue and Total Assets terms cancel algebraically, leaving
    ROE = Net Income / Avg Total Equity, which is exactly the ROE formula
    in ratios.py — this decomposition is an identity, not an approximation,
    so the three components should multiply back to (very close to) the
    directly-computed ROE. Our tests assert this.

5-step DuPont (extended / "Bea" DuPont):
    ROE = Tax Burden x Interest Burden x Operating Margin x Asset Turnover x Equity Multiplier
        = (Net Income / Pretax Income)
        x (Pretax Income / EBIT)
        x (EBIT / Revenue)
        x (Revenue / Avg Total Assets)
        x (Avg Total Assets / Avg Total Equity)

    This further splits the 3-step "Net Margin" term into three pieces so
    you can see how much of profitability comes from tax efficiency,
    interest/leverage cost, and core operating performance separately.

    EBIT is approximated as Operating Income (Income Statement ->
    "Operating Income"), which is the standard proxy when a company
    doesn't separately report a clean EBIT line. Because interest_expense
    can be 0/NaN for unlevered companies, the "Interest Burden" term is
    safe_divide-protected like every other ratio in this project.
"""

from __future__ import annotations
import pandas as pd
from src.utils import safe_divide, average_of_periods


def dupont_3_step(net_income: float, revenue: float, avg_total_assets: float, avg_total_equity: float) -> dict:
    """
    Returns the 3-step DuPont components and their product for one period.

    Components
    ----------
    net_margin        : Net Income / Revenue
    asset_turnover     : Revenue / Avg Total Assets
    equity_multiplier  : Avg Total Assets / Avg Total Equity
    roe (reconstructed): product of the three components above
    """
    net_margin = safe_divide(net_income, revenue)
    asset_turnover = safe_divide(revenue, avg_total_assets)
    equity_multiplier = safe_divide(avg_total_assets, avg_total_equity)

    roe = net_margin * asset_turnover * equity_multiplier if pd.notna(
        net_margin) and pd.notna(asset_turnover) and pd.notna(equity_multiplier) else float("nan")

    return {
        "net_margin": net_margin,
        "asset_turnover": asset_turnover,
        "equity_multiplier": equity_multiplier,
        "roe": roe,
    }


def dupont_5_step(
    net_income: float,
    pretax_income: float,
    operating_income: float,  # used as EBIT proxy
    revenue: float,
    avg_total_assets: float,
    avg_total_equity: float,
) -> dict:
    """
    Returns the 5-step (extended) DuPont components and their product for
    one period.

    Components
    ----------
    tax_burden         : Net Income / Pretax Income        (higher = less eroded by taxes)
    interest_burden     : Pretax Income / EBIT               (higher = less eroded by interest)
    operating_margin     : EBIT / Revenue
    asset_turnover        : Revenue / Avg Total Assets
    equity_multiplier      : Avg Total Assets / Avg Total Equity
    roe (reconstructed)     : product of the five components above
    """
    ebit = operating_income  # proxy, documented above

    tax_burden = safe_divide(net_income, pretax_income)
    interest_burden = safe_divide(pretax_income, ebit)
    operating_margin = safe_divide(ebit, revenue)
    asset_turnover = safe_divide(revenue, avg_total_assets)
    equity_multiplier = safe_divide(avg_total_assets, avg_total_equity)

    components = [tax_burden, interest_burden, operating_margin, asset_turnover, equity_multiplier]
    roe = 1.0
    for c in components:
        if pd.isna(c):
            roe = float("nan")
            break
        roe *= c

    return {
        "tax_burden": tax_burden,
        "interest_burden": interest_burden,
        "operating_margin": operating_margin,
        "asset_turnover": asset_turnover,
        "equity_multiplier": equity_multiplier,
        "roe": roe,
    }


def compute_dupont_timeseries(df: pd.DataFrame) -> pd.DataFrame:
    """
    Given a normalized financials DataFrame from
    data_fetch.get_normalized_financials() (most-recent-period first),
    compute both the 3-step and 5-step DuPont breakdowns for every period.

    Returns a DataFrame indexed the same way as `df`, with columns:
        net_margin, asset_turnover_3s, equity_multiplier_3s, roe_3step,
        tax_burden, interest_burden, operating_margin, asset_turnover_5s,
        equity_multiplier_5s, roe_5step
    (asset_turnover / equity_multiplier are duplicated with _3s/_5s suffixes
    since they're identical between the two decompositions, but kept
    separate columns so the app can display either table independently.)
    """
    results = []
    n = len(df)
    for i in range(n):
        row = df.iloc[i]
        prior = df.iloc[i + 1] if i + 1 < n else None

        avg_assets = average_of_periods(row["total_assets"], prior["total_assets"] if prior is not None else None)
        avg_equity = average_of_periods(row["total_equity"], prior["total_equity"] if prior is not None else None)

        step3 = dupont_3_step(row["net_income"], row["revenue"], avg_assets, avg_equity)
        step5 = dupont_5_step(
            row["net_income"], row["pretax_income"], row["operating_income"],
            row["revenue"], avg_assets, avg_equity,
        )

        results.append({
            "net_margin": step3["net_margin"],
            "asset_turnover_3s": step3["asset_turnover"],
            "equity_multiplier_3s": step3["equity_multiplier"],
            "roe_3step": step3["roe"],
            "tax_burden": step5["tax_burden"],
            "interest_burden": step5["interest_burden"],
            "operating_margin": step5["operating_margin"],
            "asset_turnover_5s": step5["asset_turnover"],
            "equity_multiplier_5s": step5["equity_multiplier"],
            "roe_5step": step5["roe"],
        })

    result_df = pd.DataFrame(results, index=df.index)
    result_df.index.name = "period_end"
    return result_df
