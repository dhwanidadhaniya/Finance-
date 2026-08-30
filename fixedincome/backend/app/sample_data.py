from app.finance.black_scholes import OptionInput


DEFAULT_OPTION = OptionInput(
    stock_price=2500,
    strike_price=2600,
    time_to_maturity=90 / 365,
    volatility=0.28,
    risk_free_rate=0.065,
    dividend_yield=0.01,
    option_type="call",
    contracts=50,
    multiplier=1,
)

SAMPLE_PORTFOLIO = [
    OptionInput(2500, 2600, 90 / 365, 0.28, 0.065, 0.01, "call", 10, 1),
    OptionInput(2500, 2450, 90 / 365, 0.28, 0.065, 0.01, "put", 5, 1),
    OptionInput(2500, 2700, 180 / 365, 0.31, 0.065, 0.01, "call", -4, 1),
]
