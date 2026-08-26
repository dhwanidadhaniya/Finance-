"""
data_fetch.py
-------------
Owns all communication with yfinance. Nothing outside this file should ever
call `yfinance` directly — that keeps the rest of the app source-agnostic,
so swapping in Alpha Vantage or Financial Modeling Prep later only means
adding a new fetch function here and pointing `utils.DATA_SOURCE` at it.

Public API used by app.py / ratios.py / dupont.py:
    get_normalized_financials(ticker, frequency="annual") -> pd.DataFrame

That DataFrame has one row per reporting period (most recent first) and a
fixed set of normalized column names (see NORMALIZED_COLUMNS below), so
downstream code never has to think about yfinance's raw label quirks.
"""

from __future__ import annotations
import functools
import pandas as pd
import yfinance as yf

from src.utils import find_row

# ---------------------------------------------------------------------------
# yfinance uses slightly different row labels depending on the ticker /
# exchange / filing style. Each entry below is a normalized field name
# mapped to a priority-ordered list of the raw labels we've seen in
# practice. find_row() tries each alias in order and returns the first hit.
# ---------------------------------------------------------------------------
INCOME_STATEMENT_ALIASES = {
    "revenue": ["Total Revenue", "Operating Revenue"],
    "cogs": ["Cost Of Revenue", "Reconciled Cost Of Revenue"],
    "gross_profit": ["Gross Profit"],
    "operating_income": ["Operating Income", "Total Operating Income As Reported"],
    "interest_expense": ["Interest Expense", "Interest Expense Non Operating"],
    "pretax_income": ["Pretax Income", "Income Before Tax"],
    "tax_provision": ["Tax Provision", "Income Tax Expense"],
    "net_income": ["Net Income", "Net Income Common Stockholders"],
}

BALANCE_SHEET_ALIASES = {
    "total_assets": ["Total Assets"],
    "current_assets": ["Current Assets", "Total Current Assets"],
    "inventory": ["Inventory"],
    "current_liabilities": ["Current Liabilities", "Total Current Liabilities"],
    "total_liabilities": ["Total Liabilities Net Minority Interest", "Total Liab"],
    "total_equity": ["Stockholders Equity", "Total Stockholder Equity", "Common Stock Equity"],
    "total_debt": ["Total Debt"],
}

NORMALIZED_COLUMNS = list(INCOME_STATEMENT_ALIASES.keys()) + list(BALANCE_SHEET_ALIASES.keys())


@functools.lru_cache(maxsize=32)
def _get_ticker_object(ticker: str) -> yf.Ticker:
    """
    Cached construction of the yfinance Ticker object. lru_cache is enough
    here (no TTL) because financial statements only update quarterly and
    this app is a short-lived dashboard session, not a long-running server.
    """
    return yf.Ticker(ticker.upper().strip())


def _get_raw_statements(ticker: str, frequency: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Returns (income_statement, balance_sheet) raw DataFrames from yfinance
    for the given frequency ("annual" or "quarterly"). Rows = line items,
    columns = period-end dates (most recent first, per yfinance convention).
    """
    tk = _get_ticker_object(ticker)
    if frequency == "quarterly":
        income = tk.quarterly_income_stmt
        balance = tk.quarterly_balance_sheet
    else:
        income = tk.income_stmt
        balance = tk.balance_sheet
    return income, balance


def get_normalized_financials(ticker: str, frequency: str = "annual") -> pd.DataFrame:
    """
    Fetch and normalize financial statement data for `ticker`.

    Parameters
    ----------
    ticker : str
        Stock ticker, e.g. "AAPL".
    frequency : str
        "annual" or "quarterly".

    Returns
    -------
    pd.DataFrame
        Index = period end date (most recent first).
        Columns = normalized line items (see NORMALIZED_COLUMNS).
        Missing line items are filled with NaN rather than raising —
        callers (ratios.py, dupont.py) must handle NaN gracefully via
        utils.safe_divide.

    Raises
    ------
    ValueError
        If the ticker returns no data at all (e.g. invalid/delisted ticker),
        since that's a genuine user-input error worth surfacing distinctly
        from "this one line item is missing".
    """
    income, balance = _get_raw_statements(ticker, frequency)

    if (income is None or income.empty) and (balance is None or balance.empty):
        raise ValueError(
            f"No financial statement data returned for ticker '{ticker}'. "
            "It may be delisted, invalid, or not covered by yfinance."
        )

    # Union of period columns from both statements, sorted most-recent-first.
    periods = sorted(
        set(income.columns if income is not None else [])
        | set(balance.columns if balance is not None else []),
        reverse=True,
    )

    rows = {}
    for field, aliases in INCOME_STATEMENT_ALIASES.items():
        series = find_row(income, aliases)
        rows[field] = series
    for field, aliases in BALANCE_SHEET_ALIASES.items():
        series = find_row(balance, aliases)
        rows[field] = series

    data = {}
    for period in periods:
        period_row = {}
        for field, series in rows.items():
            if series is not None and period in series.index:
                period_row[field] = series[period]
            else:
                period_row[field] = float("nan")  # graceful: missing line item
        data[period] = period_row

    df = pd.DataFrame.from_dict(data, orient="index")
    df = df.reindex(columns=NORMALIZED_COLUMNS)  # stable column order
    df.index.name = "period_end"
    return df


def get_available_line_items_report(ticker: str, frequency: str = "annual") -> dict:
    """
    Diagnostic helper: reports which normalized fields were successfully
    found vs. missing for a ticker. Handy for the Streamlit UI to show a
    "data quality" note (e.g. "Inventory not reported — quick ratio ==
    current ratio for this company") instead of silently showing blank
    charts.
    """
    df = get_normalized_financials(ticker, frequency)
    return {
        col: bool(df[col].notna().any())
        for col in df.columns
    }
