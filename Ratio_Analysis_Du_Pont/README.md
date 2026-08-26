# 📒 The Ratio Ledger — Ratio Analysis & DuPont Dashboard

A full-stack dashboard that pulls historical financial statements for any
stock ticker, computes standard financial ratios, and breaks down Return on
Equity (ROE) using both the classic 3-step and extended 5-step DuPont
decompositions — with trend charts you reveal on demand, and side-by-side
comparison across 2–3 tickers.

Built as a portfolio project for a Finance minor + CS/Mech Eng background:
a Flask JSON API on top of an already-tested calculation engine, and a
hand-built frontend (no template, no component library) styled as an
old-fashioned accounting ledger.

---

## Stack

```
Data source (yfinance)
        │
        ▼
src/                     ← the engine: pure functions, unit tested, framework-agnostic
        │
        ▼
backend/server.py         ← Flask API: JSON endpoints over the engine, serves frontend/
        │
        ▼
frontend/                 ← hand-built HTML/CSS/JS ledger UI, talks to the API, charts via Chart.js
```

`src/` never imports Flask, and `backend/` never imports Chart.js or touches
HTML — each layer only knows about the one below it, which is what keeps
this splittable between two people and testable without a browser.

---

## Quick start

```bash
# 1. Clone and enter the repo
git clone <your-repo-url>
cd dupont-dashboard

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app — one process serves the API and the frontend
cd backend
python server.py
```

Then open **http://localhost:5000** — enter a ticker (e.g. `AAPL`) and
press **Post to ledger**.

> If you'd rather serve the frontend separately (e.g. `npx serve frontend`
> on a different port), set `API_BASE` at the top of `frontend/app.js` to
> wherever `backend/server.py` is running — CORS is already open for this.

### Running tests

```bash
pytest tests/ -v
```

Tests only cover `src/` (the engine) — that's deliberate. It's the part
with actual formulas to get wrong; the API and UI are thin enough to check
by eye.

---

## Features

- **Data pull**: historical Income Statement + Balance Sheet via `yfinance`, annual or quarterly, for *any* ticker it covers.
- **Ratios**: Liquidity (current, quick), Profitability (gross margin, net margin, ROA, ROE), Leverage (debt-to-equity, interest coverage), Efficiency (asset turnover, inventory turnover).
- **DuPont decomposition**:
  - 3-step: `ROE = Net Margin × Asset Turnover × Equity Multiplier`
  - 5-step: `ROE = Tax Burden × Interest Burden × Operating Margin × Asset Turnover × Equity Multiplier`
- **Reconciliation stamp**: a live check that a ticker's DuPont components actually multiply back to its directly-computed ROE — the same identity `tests/test_dupont.py` asserts, surfaced in the UI instead of buried in CI.
- **Charts on demand**: every chart lives behind a "reveal chart" card, not rendered until you ask for it — keeps a first load fast and a screen from turning into a wall of charts nobody asked for.
- **Compare mode**: put 2–3 tickers side by side, same ratios, same period window.
- **Graceful missing-data handling**: a ticker that doesn't report a line item (e.g. no `Inventory` for a services company) shows blank for the affected ratio instead of crashing — with an on-screen note listing what's missing.

---

## Project Structure

```
dupont-dashboard/
├── backend/
│   ├── server.py              # Flask API — /api/bundle, /api/compare, serves frontend/
│   └── requirements.txt       # points at the root requirements.txt
├── frontend/
│   ├── index.html             # ledger layout: index-card sidebar + ledger sheet
│   ├── styles.css             # design tokens, ledger paper, stamp, chart cards
│   └── app.js                 # fetches from the API, tabs, lazy Chart.js rendering
├── src/                        # the engine — untouched, still framework-agnostic
│   ├── data_fetch.py            # yfinance integration, caching, missing-data handling
│   ├── ratios.py                 # ratio calculation functions
│   ├── dupont.py                  # 3-step & 5-step DuPont decomposition
│   └── utils.py                    # safe_divide, line-item lookup, averaging helpers
├── tests/
│   ├── test_ratios.py
│   └── test_dupont.py
├── legacy/
│   ├── streamlit_app.py         # the original Streamlit prototype, kept for reference
│   └── requirements-legacy.txt
├── notebooks/
│   └── exploration.ipynb
├── requirements.txt
└── .github/workflows/tests.yml  # CI: runs pytest on every push/PR to main
```

---

## API Reference

All endpoints live under `backend/server.py`.

| Endpoint | Params | Returns |
|---|---|---|
| `GET /api/bundle` | `ticker`, `frequency` (`annual`\|`quarterly`), `periods` (2–8) | Normalized financials, every ratio, both DuPont breakdowns, and a data-quality report for one ticker, oldest period first. |
| `GET /api/compare` | `tickers` (comma-separated, 2–3), `frequency`, `periods` | The same bundle for each ticker, keyed by ticker, plus per-ticker errors for anything that failed. |
| `GET /api/health` | — | `{"status": "ok"}` |

A ticker that yfinance can't find returns `404` with an `error` message
rather than a stack trace; `/api/compare` isolates failures per ticker so
two good tickers still render even if the third is a typo.

---

## Formula Reference

Every ratio and DuPont component is documented as a docstring in
[`src/ratios.py`](src/ratios.py) and [`src/dupont.py`](src/dupont.py),
naming the exact normalized line item(s) it pulls from the Income
Statement / Balance Sheet. Quick reference:

| Ratio | Formula | Line items |
|---|---|---|
| Current Ratio | Current Assets / Current Liabilities | Balance Sheet |
| Quick Ratio | (Current Assets − Inventory) / Current Liabilities | Balance Sheet |
| Gross Margin | Gross Profit / Revenue | Income Statement |
| Net Margin | Net Income / Revenue | Income Statement |
| ROA | Net Income / Avg Total Assets | Both |
| ROE | Net Income / Avg Total Equity | Both |
| Debt-to-Equity | Total Liabilities / Total Equity | Balance Sheet |
| Interest Coverage | Operating Income / Interest Expense | Income Statement |
| Asset Turnover | Revenue / Avg Total Assets | Both |
| Inventory Turnover | COGS / Avg Inventory | Both |

**DuPont (3-step):** `ROE = Net Margin × Asset Turnover × Equity Multiplier`

**DuPont (5-step):** `ROE = Tax Burden × Interest Burden × Operating Margin × Asset Turnover × Equity Multiplier`
where `Tax Burden = Net Income / Pretax Income`, `Interest Burden = Pretax Income / EBIT`,
`Operating Margin = EBIT / Revenue` (EBIT approximated as Operating Income — see docstring in `dupont.py` for why).

Both decompositions are algebraic identities of the ROE formula —
`tests/test_dupont.py` asserts the components multiply back to the same
ROE the direct formula produces, and the frontend's reconciliation stamp
checks the same thing per-ticker at runtime.

---

## Validation

> _Pick one real company (e.g. Apple or Reliance Industries), pull its
> actual 10-K/10-Q, and confirm each ratio the dashboard computes matches
> (or explain any variance — e.g. this project uses Total Liabilities for
> D/E rather than only interest-bearing debt). This section is the
> strongest interview talking point in the repo — it shows you didn't just
> trust the code, you checked it against a primary source._

**Company checked:** _TBD_
**Period:** _TBD_
**Findings:** _TBD_

---

## Known Limitations

- `yfinance` line-item labels vary slightly by ticker/exchange; `data_fetch.py`
  handles the common aliases seen in practice, but an unusual filer could
  still show up with a missing field.
- 5-step DuPont uses **Operating Income as an EBIT proxy** since `yfinance`
  doesn't always expose a distinct EBIT line.
- Averaging (for ROA/ROE/turnover ratios) falls back to the single ending
  balance for the oldest period in the dataset, since there's no prior
  period to average against.
- No server-side persistence — every request re-fetches from `yfinance`
  (with a 1-hour in-memory cache in the frontend's browser session via
  the API itself being cheap to re-call; there's no database here on purpose).

---

## Git Workflow

- **Branch naming**: `feature/backend-api` (Ashish), `feature/frontend-ui` (Dhwani). Use `fix/<short-description>` for bugfixes.
- **Commit cadence**: small, working commits — one commit per endpoint or per component, not one giant "add everything" commit. Makes the PR reviewable and gives you a clean history to point to in interviews.
- **PRs**: each partner opens a PR from their feature branch into `main`. Review each other's PR before merging — this is also where you catch formula/contract disagreements early (e.g. a ratio the frontend expects that the API doesn't send yet).
- **CI**: `.github/workflows/tests.yml` runs `pytest` automatically on every push/PR to `main`, so a broken ratio or DuPont formula can't silently merge.

---

## Contributors & Division of Work

| | Ashish — Backend / Data / Engine (CS) | Dhwani — Frontend / Dashboard / Finance Validation (Mech Eng) |
|---|---|---|
| **Owns** | `src/data_fetch.py`, `src/ratios.py`, `src/dupont.py`, `backend/server.py`, `tests/`, CI | `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`, README validation section |
| **Key contributions** | `yfinance` integration with graceful missing-data handling; all ratio & DuPont formulas with unit tests; the Flask API contract (`/api/bundle`, `/api/compare`); CI setup | The ledger UI/UX and design system, Chart.js chart rendering, compare mode, reconciliation stamp, real-10-K sanity check |
| **Interview talking point** | "Here's the identity test that proves the DuPont components multiply back to ROE, and here's how I handle a company that doesn't report inventory without crashing." | "Here's why the design isn't a default template, here's the API contract I built the UI against, and here's the real 10-K I checked the numbers against." |

Both partners paired on: the final ratio list, the DuPont breakdown
structure, the `/api/bundle` JSON shape (agree on this *before* building
against it — it's the seam between your two halves), and integration
testing before merging to `main`.
