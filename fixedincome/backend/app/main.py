from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.finance.black_scholes import FinanceError, OptionInput
from app.finance.engine import analyze_option, analyze_portfolio, full_simulation
from app.finance.hedging import rebalance_recommendation
from app.finance.strategies import strategy_payoff
from app.sample_data import DEFAULT_OPTION, SAMPLE_PORTFOLIO


class OptionSchema(BaseModel):
    stock_price: float = Field(gt=0)
    strike_price: float = Field(gt=0)
    time_to_maturity: float = Field(gt=0)
    volatility: float = Field(gt=0)
    risk_free_rate: float
    dividend_yield: float = 0.0
    option_type: str = "call"
    contracts: int = 1
    multiplier: int = Field(default=1, gt=0)

    def to_engine(self) -> OptionInput:
        return OptionInput(**self.model_dump())


class SimulationRequest(BaseModel):
    option: OptionSchema
    strategy: str = "long_call"
    rebalancing_mode: str = "price"
    threshold: float = 25


class PortfolioRequest(BaseModel):
    positions: list[OptionSchema]


class StrategyRequest(BaseModel):
    strategy: str
    stock_price: float
    strike: float
    premium: float
    multiplier: int = 1


class RebalanceRequest(BaseModel):
    previous_hedge: float
    new_required_hedge: float
    threshold: float = 25
    mode: str = "price"


app = FastAPI(title="Options Greeks & Delta-Hedging Simulator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/sample-data")
def sample_data() -> dict:
    return {
        "label": "Illustrative Data - Not Live Market Data",
        "default_option": DEFAULT_OPTION.__dict__,
        "portfolio": [position.__dict__ for position in SAMPLE_PORTFOLIO],
    }


@app.post("/analyze")
def analyze(request: OptionSchema) -> dict:
    try:
        return analyze_option(request.to_engine())
    except FinanceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/simulate")
def simulate(request: SimulationRequest) -> dict:
    try:
        return full_simulation(request.option.to_engine(), request.strategy, request.rebalancing_mode, request.threshold)
    except (FinanceError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/portfolio")
def portfolio(request: PortfolioRequest) -> dict:
    try:
        return analyze_portfolio([position.to_engine() for position in request.positions])
    except FinanceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/strategy")
def strategy(request: StrategyRequest) -> dict:
    try:
        return strategy_payoff(request.strategy, request.stock_price, request.strike, request.premium, request.multiplier)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/rebalance")
def rebalance(request: RebalanceRequest) -> dict:
    return rebalance_recommendation(request.previous_hedge, request.new_required_hedge, request.threshold, request.mode)
