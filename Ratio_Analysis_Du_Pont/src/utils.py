"""
utils.py
--------
Small shared helpers used across the data-fetch, ratio, and DuPont modules.
Keeping these in one place avoids duplicating "safe divide" / "find this
row under any of its possible names" logic in three different files.
"""

from __future__ import annotations
import pandas as pd
import numpy as np

# ---------------------------------------------------------------------------
# Config flag: which data source to use. Only "yfinance" is implemented in
# this project, but data_fetch.py is structured so a get_financials_<name>()
# function could be added later (e.g. Alpha Vantage, FMP) and switched on
# here without touching ratios.py / dupont.py / app.py.
# ---------------------------------------------------------------------------
DATA_SOURCE = "yfinance"  # options (future): "yfinance", "alpha_vantage", "fmp"


def safe_divide(numerator, denominator):
    """
    Divide two numbers (or pandas Series) while avoiding div-by-zero and
    NaN propagation crashes. Returns np.nan instead of raising when the
    denominator is zero, missing, or NaN.

    We use this everywhere instead of raw '/' because real financial
    statements frequently have zero or missing denominators (e.g. a company
    with no inventory has quick ratio == current ratio, and inventory
    turnover is undefined).
    """
    if isinstance(numerator, pd.Series) or isinstance(denominator, pd.Series):
        num = pd.Series(numerator) if not isinstance(numerator, pd.Series) else numerator
        den = pd.Series(denominator) if not isinstance(denominator, pd.Series) else denominator
        result = num / den
        result = result.replace([np.inf, -np.inf], np.nan)
        return result

    try:
        if denominator in (0, None) or pd.isna(denominator) or pd.isna(numerator):
            return np.nan
        return numerator / denominator
    except (TypeError, ZeroDivisionError):
        return np.nan


def find_row(df: pd.DataFrame, possible_labels: list[str]) -> pd.Series | None:
    """
    yfinance line-item labels are not fully standardized across tickers
    (e.g. 'Total Current Assets' vs 'Current Assets', 'Cost Of Revenue' vs
    'Reconciled Cost Of Revenue'). This function tries a list of known
    aliases, in priority order, and returns the first one that exists in
    the DataFrame's index. Returns None if no alias matches so callers can
    handle the missing line item gracefully instead of raising a KeyError.

    Parameters
    ----------
    df : pd.DataFrame
        A yfinance statement DataFrame (rows = line items, columns = period
        end dates).
    possible_labels : list[str]
        Candidate row labels to look for, in priority order.
    """
    if df is None or df.empty:
        return None
    for label in possible_labels:
        if label in df.index:
            return df.loc[label]
    return None


def average_of_periods(current: float, prior: float) -> float:
    """
    Many textbook ratio formulas (ROA, asset turnover, inventory turnover)
    use the *average* balance-sheet figure across two periods rather than
    the single point-in-time ending balance, since income-statement figures
    (like revenue or COGS) are flows accumulated over the whole period.

    If the prior-period figure isn't available (e.g. oldest period in our
    dataset, or missing data), we fall back to the current period's ending
    balance rather than failing.
    """
    if prior is None or pd.isna(prior):
        return current
    if current is None or pd.isna(current):
        return prior
    return (current + prior) / 2
