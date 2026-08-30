from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date

class Company(BaseModel):
    name: str
    ticker: str
    exchange: Optional[str] = None
    industry: Optional[str] = None
    sector: Optional[str] = None
    description: Optional[str] = None
    current_price: Optional[float] = None
    currency: str = "USD"
    market_cap: Optional[float] = None
    shares_outstanding: Optional[float] = None

class FinancialStatement(BaseModel):
    year: int
    revenue: Optional[float] = None
    cogs: Optional[float] = None
    gross_profit: Optional[float] = None
    operating_expenses: Optional[float] = None
    ebitda: Optional[float] = None
    ebit: Optional[float] = None
    interest_expense: Optional[float] = None
    pre_tax_income: Optional[float] = None
    tax: Optional[float] = None
    net_income: Optional[float] = None
    eps: Optional[float] = None
    cash: Optional[float] = None
    current_assets: Optional[float] = None
    total_assets: Optional[float] = None
    current_liabilities: Optional[float] = None
    total_liabilities: Optional[float] = None
    total_debt: Optional[float] = None
    shareholders_equity: Optional[float] = None
    operating_cash_flow: Optional[float] = None
    capex: Optional[float] = None
    investing_cash_flow: Optional[float] = None
    financing_cash_flow: Optional[float] = None
    free_cash_flow: Optional[float] = None
    depreciation_amortization: Optional[float] = None
    shares_outstanding: Optional[float] = None
    working_capital: Optional[float] = None
    unit: str = "millions"
    currency: str = "USD"
    source: str = "manual"  # extracted, manual, calculated, api, sample
    confidence: Optional[float] = None

class ExtractedData(BaseModel):
    company: Company
    statements: List[FinancialStatement]
    extraction_metadata: Dict[str, Any]

class FundamentalMetrics(BaseModel):
    revenue_growth: Optional[float] = None
    ebitda_growth: Optional[float] = None
    ebit_growth: Optional[float] = None
    net_income_growth: Optional[float] = None
    eps_growth: Optional[float] = None
    gross_margin: Optional[float] = None
    ebitda_margin: Optional[float] = None
    ebit_margin: Optional[float] = None
    net_profit_margin: Optional[float] = None
    roe: Optional[float] = None
    roa: Optional[float] = None
    roce: Optional[float] = None
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None
    debt_equity: Optional[float] = None
    debt_ebitda: Optional[float] = None
    net_debt_ebitda: Optional[float] = None
    interest_coverage: Optional[float] = None
    fcf_margin: Optional[float] = None
    fcf_conversion: Optional[float] = None
    capex_intensity: Optional[float] = None
    asset_turnover: Optional[float] = None

class ForecastAssumptions(BaseModel):
    revenue_growth: float
    ebitda_margin: float
    ebit_margin: float
    tax_rate: float
    depreciation_amortization_pct: float
    capex_pct_revenue: float
    working_capital_pct_revenue: float
    years: int = 5

class DCFInputs(BaseModel):
    wacc: float
    terminal_growth: float
    forecast_years: int = 5
    assumptions: ForecastAssumptions

class DCFOutput(BaseModel):
    fcf_forecasts: List[float]
    discount_factors: List[float]
    pv_fcf: List[float]
    terminal_value: float
    pv_terminal_value: float
    enterprise_value: float
    net_debt: float
    equity_value: float
    intrinsic_value_per_share: float
    upside_downside: float
    assumptions: DCFInputs

class RelativeValuation(BaseModel):
    pe_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None
    ev_revenue: Optional[float] = None
    pb_ratio: Optional[float] = None
    fcf_yield: Optional[float] = None
    implied_price_pe: Optional[float] = None
    implied_price_ev_ebitda: Optional[float] = None
    implied_price_ev_revenue: Optional[float] = None
    implied_price_pb: Optional[float] = None
    blended_value: Optional[float] = None

class TechnicalIndicators(BaseModel):
    price: float
    dma_20: Optional[float] = None
    dma_50: Optional[float] = None
    dma_200: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    bollinger_upper: Optional[float] = None
    bollinger_lower: Optional[float] = None
    bollinger_middle: Optional[float] = None
    volume: Optional[float] = None
    momentum: Optional[float] = None
    volatility: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    support: Optional[float] = None
    resistance: Optional[float] = None

class Scenario(BaseModel):
    name: str  # Bull, Base, Bear
    assumptions: ForecastAssumptions
    dcf_inputs: DCFInputs
    revenue: List[float]
    ebitda: List[float]
    eps: List[float]
    fcf: List[float]
    enterprise_value: float
    equity_value: float
    intrinsic_share_price: float
    upside_downside: float

class InvestmentScore(BaseModel):
    fundamental_score: float
    valuation_score: float
    technical_score: float
    overall_score: float
    fundamental_breakdown: Dict[str, float]
    valuation_breakdown: Dict[str, float]
    technical_breakdown: Dict[str, float]

class InvestmentView(BaseModel):
    recommendation: str  # BUY, HOLD, WATCH, AVOID
    overall_score: float
    thesis: List[str]
    risks: List[str]
    catalysts: List[str]
    what_would_change_mind: List[str]
    scores: InvestmentScore

class DCFRequest(BaseModel):
    statements: List[FinancialStatement]
    dcf_inputs: DCFInputs
    current_price: float

class RelativeValuationRequest(BaseModel):
    statements: List[FinancialStatement]
    current_price: float
    shares: Optional[float] = None

class ScenarioRequest(BaseModel):
    statements: List[FinancialStatement]
    base_assumptions: ForecastAssumptions
    base_dcf_inputs: DCFInputs
    current_price: float

