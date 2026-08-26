"""
backend/server.py
------------------
Flask API for the Ratio Analysis & DuPont Ledger.

This file owns HTTP concerns only. Every actual number is computed by the
existing, already-tested engine in src/ (data_fetch.py, ratios.py,
dupont.py, utils.py) — nothing here recomputes a formula, it just calls
that engine and shapes the result into JSON the frontend can chart.

Run with:
    cd backend
    python server.py
Then open http://localhost:5000 — this process serves both the API
(under /api/...) and the static frontend/ folder, so there's only one
thing to run.

Endpoints
---------
GET /api/bundle?ticker=AAPL&frequency=annual&periods=6
    Full data for one ticker: normalized financials, every ratio, both
    DuPont breakdowns, and a data-quality report — oldest period first
    so the frontend can plot left-to-right without re-sorting.

GET /api/compare?tickers=AAPL,MSFT,GOOGL&frequency=annual&periods=4
    Same bundle for 2-3 tickers at once, keyed by ticker, plus a
    `latest` block per ticker for quick side-by-side bars.

GET /api/health
    Trivial liveness check.
"""

from __future__ import annotations

import os
import sys
import math

from flask import Flask, jsonify, request, send_from_directory

# --- make src/ (repo_root/src) importable regardless of where this is run from ---
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from src.data_fetch import get_normalized_financials, get_available_line_items_report  # noqa: E402
from src.ratios import compute_ratio_timeseries  # noqa: E402
from src.dupont import compute_dupont_timeseries  # noqa: E402

FRONTEND_DIR = os.path.join(REPO_ROOT, "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

MAX_TICKERS_COMPARE = 3
VALID_FREQUENCIES = {"annual", "quarterly"}


# ---------------------------------------------------------------------------
# JSON-safety helpers
# ---------------------------------------------------------------------------

def _clean(value):
    """Convert NaN/None-ish numeric values into JSON `null` instead of the
    invalid literal `NaN`, and everything else into a plain python float."""
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(f) or math.isinf(f) else f


def _series_to_list(df, column):
    return [_clean(v) for v in df[column].tolist()]


def build_bundle(ticker: str, frequency: str, periods: int) -> dict:
    """
    Fetches + computes everything for one ticker and reshapes it into a
    chart-friendly JSON bundle, oldest period first (left-to-right on a
    time axis is the natural reading direction for a trend chart).
    """
    financials = get_normalized_financials(ticker, frequency)
    financials = financials.head(periods)          # most-recent-first slice
    financials = financials.sort_index()             # -> oldest first for charting

    ratio_df = compute_ratio_timeseries(financials.sort_index(ascending=False)).sort_index()
    dupont_df = compute_dupont_timeseries(financials.sort_index(ascending=False)).sort_index()
    quality = get_available_line_items_report(ticker, frequency)

    period_labels = [str(p.date()) if hasattr(p, "date") else str(p) for p in financials.index]

    bundle = {
        "ticker": ticker,
        "frequency": frequency,
        "periods": period_labels,
        "financials": {col: _series_to_list(financials, col) for col in financials.columns},
        "ratios": {col: _series_to_list(ratio_df, col) for col in ratio_df.columns},
        "dupont": {col: _series_to_list(dupont_df, col) for col in dupont_df.columns},
        "quality": quality,
    }

    if len(ratio_df) and len(dupont_df):
        bundle["latest"] = {
            "period": period_labels[-1],
            "ratios": {col: _clean(ratio_df[col].iloc[-1]) for col in ratio_df.columns},
            "dupont": {col: _clean(dupont_df[col].iloc[-1]) for col in dupont_df.columns},
        }
    return bundle


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/bundle")
def bundle():
    ticker = (request.args.get("ticker") or "").upper().strip()
    frequency = request.args.get("frequency", "annual")
    periods = request.args.get("periods", "6")

    if not ticker:
        return jsonify({"error": "Query param 'ticker' is required, e.g. ?ticker=AAPL"}), 400
    if frequency not in VALID_FREQUENCIES:
        return jsonify({"error": f"'frequency' must be one of {sorted(VALID_FREQUENCIES)}"}), 400
    try:
        periods = max(2, min(8, int(periods)))
    except ValueError:
        periods = 6

    try:
        return jsonify(build_bundle(ticker, frequency, periods))
    except ValueError as e:
        return jsonify({"error": str(e), "ticker": ticker}), 404
    except Exception as e:  # yfinance / network hiccups shouldn't 500 silently
        return jsonify({"error": f"Unexpected error fetching '{ticker}': {e}"}), 502


@app.get("/api/compare")
def compare():
    raw = request.args.get("tickers", "")
    frequency = request.args.get("frequency", "annual")
    periods = request.args.get("periods", "4")

    tickers = [t.strip().upper() for t in raw.split(",") if t.strip()][:MAX_TICKERS_COMPARE]
    if not tickers:
        return jsonify({"error": "Query param 'tickers' is required, e.g. ?tickers=AAPL,MSFT"}), 400
    if frequency not in VALID_FREQUENCIES:
        return jsonify({"error": f"'frequency' must be one of {sorted(VALID_FREQUENCIES)}"}), 400
    try:
        periods = max(2, min(8, int(periods)))
    except ValueError:
        periods = 4

    results, errors = {}, {}
    for t in tickers:
        try:
            results[t] = build_bundle(t, frequency, periods)
        except ValueError as e:
            errors[t] = str(e)
        except Exception as e:
            errors[t] = f"Unexpected error: {e}"

    return jsonify({"tickers": tickers, "results": results, "errors": errors})


# ---------------------------------------------------------------------------
# Serve the custom frontend (single-process dev setup)
# ---------------------------------------------------------------------------

@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.after_request
def add_cors_headers(resp):
    # Permissive CORS so the frontend can also be opened separately / served
    # from a different port (e.g. `npx serve frontend`) during development.
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


if __name__ == "__main__":
    app.run(debug=True, port=5000)
