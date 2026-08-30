from typing import List, Optional, Dict
from models import DCFInputs, DCFOutput, FinancialStatement, ForecastAssumptions



def calculate_dcf(
    statements: List[FinancialStatement],
    dcf_inputs: DCFInputs,
    current_price: float
) -> DCFOutput:
    """Calculate DCF valuation."""
    if not statements:
        raise ValueError("Financial statements list is empty. Cannot perform DCF valuation.")

    # Validate WACC > terminal growth
    if dcf_inputs.wacc <= dcf_inputs.terminal_growth:
        raise ValueError(
            f"WACC ({dcf_inputs.wacc}%) must be greater than terminal growth rate "
            f"({dcf_inputs.terminal_growth}%). DCF valuation is mathematically invalid."
        )
    
    assumptions = dcf_inputs.assumptions
    current = statements[0]
    
    # Calculate FCF forecasts
    fcf_forecasts = []
    revenue_forecasts = []
    
    base_revenue = current.revenue if current.revenue is not None else 0.0
    
    for year in range(assumptions.years):
        if year == 0:
            revenue = base_revenue * (1 + assumptions.revenue_growth / 100)
        else:
            revenue = revenue_forecasts[-1] * (1 + assumptions.revenue_growth / 100)
        
        revenue_forecasts.append(revenue)
        
        ebitda = revenue * (assumptions.ebitda_margin / 100)
        ebit = revenue * (assumptions.ebit_margin / 100)
        
        nopat = ebit * (1 - assumptions.tax_rate / 100)
        da = revenue * (assumptions.depreciation_amortization_pct / 100)
        capex = revenue * (assumptions.capex_pct_revenue / 100)
        
        # Simplified change in working capital
        change_wc = revenue * (assumptions.working_capital_pct_revenue / 100) * 0.1
        
        fcf = nopat + da - capex - change_wc
        fcf_forecasts.append(fcf)
    
    # Calculate discount factors
    discount_factors = []
    pv_fcf = []
    
    wacc_decimal = dcf_inputs.wacc / 100.0
    g_decimal = dcf_inputs.terminal_growth / 100.0

    for year, fcf in enumerate(fcf_forecasts):
        discount_factor = 1.0 / ((1.0 + wacc_decimal) ** (year + 1))
        discount_factors.append(discount_factor)
        pv_fcf.append(fcf * discount_factor)
    
    # Calculate terminal value using Gordon Growth Model
    final_fcf = fcf_forecasts[-1] if fcf_forecasts else 0.0
    denom = wacc_decimal - g_decimal
    terminal_value = (final_fcf * (1.0 + g_decimal)) / denom if denom > 0 else 0.0
    
    # PV of terminal value
    pv_terminal_value = terminal_value / ((1.0 + wacc_decimal) ** assumptions.years)
    
    # Enterprise value
    enterprise_value = sum(pv_fcf) + pv_terminal_value
    
    # Net debt
    total_debt = current.total_debt if current.total_debt is not None else 0.0
    cash = current.cash if current.cash is not None else 0.0
    net_debt = total_debt - cash
    
    # Equity value (Enterprise Value != Equity Value)
    equity_value = enterprise_value - net_debt
    
    # Intrinsic value per share
    shares = current.shares_outstanding if (current.shares_outstanding and current.shares_outstanding > 0) else None
    if shares:
        intrinsic_value_per_share = equity_value / shares
    else:
        intrinsic_value_per_share = 0.0
    
    # Upside/downside
    if current_price > 0 and intrinsic_value_per_share != 0.0:
        upside_downside = ((intrinsic_value_per_share - current_price) / current_price) * 100.0
    else:
        upside_downside = 0.0
    
    return DCFOutput(
        fcf_forecasts=fcf_forecasts,
        discount_factors=discount_factors,
        pv_fcf=pv_fcf,
        terminal_value=terminal_value,
        pv_terminal_value=pv_terminal_value,
        enterprise_value=enterprise_value,
        net_debt=net_debt,
        equity_value=equity_value,
        intrinsic_value_per_share=intrinsic_value_per_share,
        upside_downside=upside_downside,
        assumptions=dcf_inputs
    )

def calculate_relative_valuation(
    statements: List[FinancialStatement],
    current_price: float,
    shares: float
) -> Dict:
    """Calculate relative valuation multiples."""
    if not statements:
        return {}
    current = statements[0]
    
    valuation = {}
    total_debt = current.total_debt if current.total_debt is not None else 0.0
    cash = current.cash if current.cash is not None else 0.0
    net_debt = total_debt - cash
    market_cap = current_price * shares if shares > 0 else 0.0
    enterprise_value = market_cap + net_debt
    
    # P/E ratio
    if current.eps and current.eps > 0 and current_price > 0:
        valuation['pe_ratio'] = current_price / current.eps
    else:
        valuation['pe_ratio'] = None
    
    # EV/EBITDA
    if current.ebitda and current.ebitda > 0:
        valuation['ev_ebitda'] = enterprise_value / current.ebitda
    else:
        valuation['ev_ebitda'] = None  # Negative EBITDA is not meaningful for EV/EBITDA multiple
    
    # EV/Revenue
    if current.revenue and current.revenue > 0:
        valuation['ev_revenue'] = enterprise_value / current.revenue
    else:
        valuation['ev_revenue'] = None
    
    # P/B ratio
    if current.shareholders_equity and current.shareholders_equity > 0 and market_cap > 0:
        valuation['pb_ratio'] = market_cap / current.shareholders_equity
    else:
        valuation['pb_ratio'] = None
    
    # FCF Yield
    if current.free_cash_flow is not None and market_cap > 0:
        valuation['fcf_yield'] = (current.free_cash_flow / market_cap) * 100.0
    else:
        valuation['fcf_yield'] = None
    
    return valuation

