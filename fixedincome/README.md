# Fixed Income Credit Analysis Workbook

## Problem

The application answers a fixed-income research question: is this bond fairly valued, and does its yield adequately compensate the investor for interest-rate and credit risk?

It is an educational finance project. Technology is the delivery mechanism.

## Objective

Users can enter bond data, generate cash-flow schedules, calculate price/YTM/current yield, measure duration and convexity, inspect the yield curve, calculate credit spread and simplified OAS, run interest-rate and credit-spread stresses, compare bonds, and produce an Attractive / Neutral / Unattractive investment view.

## Finance Methodology

The engine prices bonds as discounted cash flows, solves YTM by bisection, calculates current yield, accrued interest, clean/dirty price, Macaulay duration, modified duration, convexity, credit spread, curve classification, simplified OAS, stress scenarios, relative-value observations, and an investment view generated from model outputs.

## Key Formulas

`Price = sum(CF_t / (1 + y / m)^t)`

`Current Yield = Annual Coupon / Market Price`

`Credit Spread = Corporate Bond YTM - Comparable Benchmark Yield`

`Modified Duration = Macaulay Duration / (1 + y / m)`

`Duration + Convexity Price Approximation = P * (1 - ModifiedDuration * DeltaY + 0.5 * Convexity * DeltaY^2)`

Simplified OAS solves for one constant spread added to interpolated benchmark curve rates so discounted cash flows equal market price.

## Assumptions

Sample bonds are fictional and labelled "Illustrative Data - Not Live Market Data." Bonds are treated as non-callable. Cash flows use regular coupon intervals. Settlement accrual is simplified through a period fraction. The benchmark curve is editable and interpolated linearly.

## Example Analysis

The default sample compares premium, discount, shorter-maturity, longer-maturity, different-rating, and zero-coupon bonds. The app shows why the highest spread is not automatically best: additional spread must be weighed against duration, rating, maturity, and valuation.

## Results

Each analysis returns market price, benchmark model price, YTM, current yield, spread in percentage points and bps, cash-flow present values, duration, convexity, simplified OAS, stress tables, relative-value observations, and a dynamic investment view with reasons and risks.

## Limitations

This is not financial advice and does not use live market data. It does not model embedded options, stochastic interest rates, liquidity premiums, taxes, recovery rates, issuer fundamentals, exact calendars, or institutional day-count conventions.

## Technology

Frontend: React, TypeScript, Vite, Tailwind CSS, Recharts.

Backend: Python, FastAPI, NumPy, pandas. SciPy is included in requirements for the requested stack, but the finance solver uses an explicit bisection method for transparency and testability.

## Setup

Backend:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Testing

```powershell
cd backend
pytest
```

```powershell
cd frontend
npm run build
```

Tests cover price/yield inverse behavior, premium and discount bonds, duration sensitivity, convexity approximation improvement, spread stress, zero-coupon bonds, coupon frequencies, near-maturity cases, OAS convergence, OAS failure, and full dynamic investment-view generation.
