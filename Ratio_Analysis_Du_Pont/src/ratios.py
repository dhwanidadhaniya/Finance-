"""
ratios.py
---------
Pure calculation functions for standard financial ratios. Every function
takes plain numbers (or pandas Series, for the batch version) and returns
a number — no yfinance or Streamlit dependency, so these are trivially
unit-testable and independently defensible line-by-line in an interview.

Formulas reference the exact normalized field names produced by
data_fetch.get_normalized_financials(), which map 1:1 onto standard
10-K/10-Q line items:

    revenue, cogs, gross_profit, operating_income, interest_expense,
    pretax_income, tax_provision, net_income                (income stmt)
    total_assets, current_assets, inventory, current_liabilities,
    total_liabilities, total_equity, total_debt              (balance sheet)

All divisions go through utils.safe_divide to avoid crashing on the
missing-data cases described in data_fetch.py.
"""

from __future__ import annotations
import pandas as pd
from src.utils import safe_divide, average_of_periods

# ---------------------------------------------------------------------------
# Liquidity ratios
# ---------------------------------------------------------------------------

def current_ratio(current_assets: float, current_liabilities: float) -> float:
    """
    Current Ratio = Current Assets / Current Liabilities

    Measures ability to cover short-term obligations with short-term
    assets. Line items: Balance Sheet -> "Total Current Assets" /
    "Total Current Liabilities".
    """
    return safe_divide(current_assets, current_liabilities)


def quick_ratio(current_assets: float, inventory: float, current_liabilities: float) -> float:
    """
    Quick Ratio (Acid-Test) = (Current Assets - Inventory) / Current Liabilities

    Stricter than the current ratio because inventory is the least liquid
    current asset (must be sold and collected before it becomes cash).
    Line items: same as current_ratio, plus Balance Sheet -> "Inventory".
    If a company reports no inventory line (e.g. a pure services business),
    inventory is treated as 0, so quick_ratio == current_ratio, which is
    financially correct behavior, not a data bug.
    """
    inv = 0.0 if pd.isna(inventory) else inventory
    return safe_divide(current_assets - inv, current_liabilities)


# ---------------------------------------------------------------------------
# Profitability ratios
# ---------------------------------------------------------------------------

def gross_margin(gross_profit: float, revenue: float) -> float:
    """
    Gross Margin = Gross Profit / Revenue
    Line items: Income Statement -> "Gross Profit" / "Total Revenue".
    """
    return safe_divide(gross_profit, revenue)


def net_margin(net_income: float, revenue: float) -> float:
    """
    Net Profit Margin = Net Income / Revenue
    Line items: Income Statement -> "Net Income" / "Total Revenue".
    This is also DuPont's first component ("profitability" driver of ROE).
    """
    return safe_divide(net_income, revenue)


def return_on_assets(net_income: float, avg_total_assets: float) -> float:
    """
    ROA = Net Income / Average Total Assets

    Uses the AVERAGE of beginning and ending total assets (see
    utils.average_of_periods) because Net Income is an income-statement
    flow accumulated over the whole period, while Total Assets is a
    balance-sheet snapshot — averaging matches the flow to a representative
    stock of assets over the same period.
    Line items: "Net Income" / average("Total Assets").
    """
    return safe_divide(net_income, avg_total_assets)


def return_on_equity(net_income: float, avg_total_equity: float) -> float:
    """
    ROE = Net Income / Average Total Equity
    Line items: "Net Income" / average("Stockholders Equity").
    This is the headline metric the DuPont decomposition breaks apart.
    """
    return safe_divide(net_income, avg_total_equity)


# ---------------------------------------------------------------------------
# Leverage ratios
# ---------------------------------------------------------------------------

def debt_to_equity(total_liabilities: float, total_equity: float) -> float:
    """
    Debt-to-Equity = Total Liabilities / Total Equity

    We use TOTAL liabilities (not just interest-bearing debt) because it's
    the standard textbook definition and is derivable for every ticker
    without relying on yfinance's narrower "Total Debt" field, which some
    filers omit. Line items: "Total Liabilities Net Minority Interest" /
    "Stockholders Equity".
    """
    return safe_divide(total_liabilities, total_equity)


def interest_coverage(operating_income: float, interest_expense: float) -> float:
    """
    Interest Coverage Ratio = Operating Income (EBIT) / Interest Expense

    Measures how many times over a company could pay its interest expense
    out of operating earnings. Line items: "Operating Income" /
    "Interest Expense". Undefined (NaN) if interest_expense is 0 or missing
    — i.e. the company carries no interest-bearing debt to cover, which
    safe_divide already handles.
    """
    return safe_divide(operating_income, interest_expense)


# ---------------------------------------------------------------------------
# Efficiency ratios
# ---------------------------------------------------------------------------

def asset_turnover(revenue: float, avg_total_assets: float) -> float:
    """
    Asset Turnover = Revenue / Average Total Assets

    How efficiently a company converts its asset base into sales. This is
    DuPont's second component ("efficiency" driver of ROE).
    Line items: "Total Revenue" / average("Total Assets").
    """
    return safe_divide(revenue, avg_total_assets)


def inventory_turnover(cogs: float, avg_inventory: float) -> float:
    """
    Inventory Turnover = COGS / Average Inventory

    We divide by COGS (not revenue) because inventory is carried at cost,
    so matching cost-of-goods-sold to average inventory gives a like-for-
    like measure of how many times inventory is sold and replaced per
    period. Line items: "Cost Of Revenue" / average("Inventory").
    """
    return safe_divide(cogs, avg_inventory)


# ---------------------------------------------------------------------------
# Batch computation across all periods in a normalized DataFrame
# ---------------------------------------------------------------------------

def compute_ratio_timeseries(df: pd.DataFrame) -> pd.DataFrame:
    """
    Given a normalized financials DataFrame from
    data_fetch.get_normalized_financials() (most-recent-period first),
    compute every ratio for every period and return a new DataFrame indexed
    the same way, one column per ratio.

    Periods requiring an "average" balance (ROA, ROE, asset turnover,
    inventory turnover) use the current and next-older period; the oldest
    period in the dataset falls back to its own ending balance (see
    utils.average_of_periods).
    """
    # df is most-recent-first; iterate with lookahead to the next (older) row
    results = []
    n = len(df)
    for i in range(n):
        row = df.iloc[i]
        prior = df.iloc[i + 1] if i + 1 < n else None

        avg_assets = average_of_periods(row["total_assets"], prior["total_assets"] if prior is not None else None)
        avg_equity = average_of_periods(row["total_equity"], prior["total_equity"] if prior is not None else None)
        avg_inventory = average_of_periods(row["inventory"], prior["inventory"] if prior is not None else None)

        results.append({
            "current_ratio": current_ratio(row["current_assets"], row["current_liabilities"]),
            "quick_ratio": quick_ratio(row["current_assets"], row["inventory"], row["current_liabilities"]),
            "gross_margin": gross_margin(row["gross_profit"], row["revenue"]),
            "net_margin": net_margin(row["net_income"], row["revenue"]),
            "roa": return_on_assets(row["net_income"], avg_assets),
            "roe": return_on_equity(row["net_income"], avg_equity),
            "debt_to_equity": debt_to_equity(row["total_liabilities"], row["total_equity"]),
            "interest_coverage": interest_coverage(row["operating_income"], row["interest_expense"]),
            "asset_turnover": asset_turnover(row["revenue"], avg_assets),
            "inventory_turnover": inventory_turnover(row["cogs"], avg_inventory),
        })

    result_df = pd.DataFrame(results, index=df.index)
    result_df.index.name = "period_end"
    return result_df
