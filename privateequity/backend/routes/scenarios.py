from fastapi import APIRouter
from typing import List
from models import Scenario, FinancialStatement, DCFInputs, ForecastAssumptions, ScenarioRequest
from valuation import calculate_dcf

router = APIRouter()

@router.post("/generate")
async def generate_scenarios(req: ScenarioRequest) -> List[Scenario]:
    """Generate Bull, Base, and Bear scenarios."""
    statements = req.statements
    base_assumptions = req.base_assumptions
    base_dcf_inputs = req.base_dcf_inputs
    current_price = req.current_price

    
    # Bull scenario - optimistic
    bull_assumptions = ForecastAssumptions(
        revenue_growth=base_assumptions.revenue_growth + 5,
        ebitda_margin=base_assumptions.ebitda_margin + 2,
        ebit_margin=base_assumptions.ebit_margin + 2,
        tax_rate=base_assumptions.tax_rate - 2,
        depreciation_amortization_pct=base_assumptions.depreciation_amortization_pct,
        capex_pct_revenue=base_assumptions.capex_pct_revenue - 1,
        working_capital_pct_revenue=base_assumptions.working_capital_pct_revenue - 1,
        years=base_assumptions.years
    )
    
    bull_dcf_inputs = DCFInputs(
        wacc=base_dcf_inputs.wacc - 0.5,
        terminal_growth=base_dcf_inputs.terminal_growth + 0.5,
        forecast_years=base_dcf_inputs.forecast_years,
        assumptions=bull_assumptions
    )
    
    # Base scenario
    base_scenario = await calculate_single_scenario(
        statements, base_assumptions, base_dcf_inputs, current_price, "Base"
    )
    
    # Bear scenario - pessimistic
    bear_assumptions = ForecastAssumptions(
        revenue_growth=max(0, base_assumptions.revenue_growth - 5),
        ebitda_margin=max(0, base_assumptions.ebitda_margin - 3),
        ebit_margin=max(0, base_assumptions.ebit_margin - 3),
        tax_rate=min(40, base_assumptions.tax_rate + 3),
        depreciation_amortization_pct=base_assumptions.depreciation_amortization_pct,
        capex_pct_revenue=base_assumptions.capex_pct_revenue + 2,
        working_capital_pct_revenue=base_assumptions.working_capital_pct_revenue + 2,
        years=base_assumptions.years
    )
    
    bear_dcf_inputs = DCFInputs(
        wacc=base_dcf_inputs.wacc + 1,
        terminal_growth=max(0, base_dcf_inputs.terminal_growth - 0.5),
        forecast_years=base_dcf_inputs.forecast_years,
        assumptions=bear_assumptions
    )
    
    bull_scenario = await calculate_single_scenario(
        statements, bull_assumptions, bull_dcf_inputs, current_price, "Bull"
    )
    
    bear_scenario = await calculate_single_scenario(
        statements, bear_assumptions, bear_dcf_inputs, current_price, "Bear"
    )
    
    return [bull_scenario, base_scenario, bear_scenario]

async def calculate_single_scenario(
    statements: List[FinancialStatement],
    assumptions: ForecastAssumptions,
    dcf_inputs: DCFInputs,
    current_price: float,
    name: str
) -> Scenario:
    """Calculate a single scenario."""
    dcf_result = calculate_dcf(statements, dcf_inputs, current_price)
    
    # Calculate projected metrics
    current = statements[0]
    revenue_forecasts = []
    ebitda_forecasts = []
    eps_forecasts = []
    
    base_revenue = current.revenue or 0
    shares = current.shares_outstanding or 1
    
    for year in range(assumptions.years):
        if year == 0:
            revenue = base_revenue * (1 + assumptions.revenue_growth / 100)
        else:
            revenue = revenue_forecasts[-1] * (1 + assumptions.revenue_growth / 100)
        
        revenue_forecasts.append(revenue)
        ebitda_forecasts.append(revenue * (assumptions.ebitda_margin / 100))
        
        # Simplified EPS calculation
        net_income = revenue * (assumptions.ebit_margin / 100) * (1 - assumptions.tax_rate / 100)
        eps_forecasts.append(net_income / shares)
    
    return Scenario(
        name=name,
        assumptions=assumptions,
        dcf_inputs=dcf_inputs,
        revenue=revenue_forecasts,
        ebitda=ebitda_forecasts,
        eps=eps_forecasts,
        fcf=dcf_result.fcf_forecasts,
        enterprise_value=dcf_result.enterprise_value,
        equity_value=dcf_result.equity_value,
        intrinsic_share_price=dcf_result.intrinsic_value_per_share,
        upside_downside=dcf_result.upside_downside
    )
