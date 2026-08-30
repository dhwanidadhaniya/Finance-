# Finance Methodology

This project is an educational options risk simulator. It uses the Black-Scholes-Merton model for European calls and puts, then shows how option value and Greeks change when market assumptions change.

## Black-Scholes Assumptions

The model assumes a European option, no early exercise, constant volatility, constant risk-free rate, continuous dividend yield, frictionless markets, and lognormally distributed underlying prices. These assumptions make the model useful for learning, but they are simplifications.

## Option Pricing

Call price:

`C = S e^(-qT) N(d1) - K e^(-rT) N(d2)`

Put price:

`P = K e^(-rT) N(-d2) - S e^(-qT) N(-d1)`

where:

`d1 = [ln(S/K) + (r - q + sigma^2 / 2)T] / [sigma sqrt(T)]`

`d2 = d1 - sigma sqrt(T)`

## Greeks

Delta estimates the rupee change in option value for a one rupee change in the underlying.

Gamma estimates the change in delta for a one rupee change in the underlying.

Vega estimates the option value change for a one percentage-point change in implied volatility.

Theta estimates daily time decay.

Rho estimates the option value change for a one percentage-point change in interest rates.

## Delta Hedging

Portfolio delta is the sum of each position's option delta multiplied by contracts and contract multiplier.

`Required Hedge = Target Delta - Portfolio Delta`

For a target of zero, a portfolio delta of +250 means the user should sell about 250 units of the underlying to become approximately delta-neutral. This hedge is approximate because delta changes as the stock price, volatility, and time to expiry change.

## Portfolio Greeks

Portfolio Greeks are calculated by scaling each option Greek by quantity and multiplier, then summing across positions. This keeps the portfolio section simple and transparent.

## Payoff Calculations

Long call payoff at expiry:

`max(S - K, 0) - premium`

Long put payoff at expiry:

`max(K - S, 0) - premium`

The simulator also includes covered calls, protective puts, bull call spreads, and bear put spreads using simple expiry payoff logic.

## Scenario Analysis

The scenario page uses three cases: underlying -10%, unchanged, and +10%. For each case, the app recalculates option value, P&L, delta, and hedge requirement.

## Stress Testing

The stress table checks underlying moves of -15%, -10%, 0%, +10%, and +15%. It is a basic sensitivity exercise, not a VaR model or institutional stress engine.

## Limitations

This project does not include live market data, transaction costs, bid-ask spreads, discrete dividends, early exercise, stochastic volatility, volatility surfaces, Monte Carlo simulation, VaR, CVaR, or trading execution. It is for education only and is not financial advice.
