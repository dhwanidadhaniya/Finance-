import numpy as np
from typing import Optional, Dict, List
from models import FinancialStatement


def safe_divide(numerator: Optional[float], denominator: Optional[float]) -> Optional[float]:
    """Safely divide two numbers, handling None and zero denominators."""
    if numerator is None or denominator is None:
        return None
    if denominator == 0:
        return None
    return numerator / denominator

def safe_percentage(value: Optional[float]) -> Optional[float]:
    """Convert decimal to percentage or return None."""
    if value is None:
        return None
    return value * 100

def calculate_growth_rate(current: Optional[float], previous: Optional[float]) -> Optional[float]:
    """Calculate growth rate between two periods."""
    if current is None or previous is None:
        return None
    if previous == 0:
        return None
    return ((current - previous) / previous) * 100

def calculate_fundamental_metrics(statements: List[FinancialStatement]) -> Dict:
    """Calculate all fundamental metrics from financial statements."""
    if len(statements) < 2:
        return {}
    
    current = statements[0]
    previous = statements[1]
    
    metrics = {}
    
    # Growth metrics
    metrics['revenue_growth'] = calculate_growth_rate(current.revenue, previous.revenue)
    metrics['ebitda_growth'] = calculate_growth_rate(current.ebitda, previous.ebitda)
    metrics['ebit_growth'] = calculate_growth_rate(current.ebit, previous.ebit)
    metrics['net_income_growth'] = calculate_growth_rate(current.net_income, previous.net_income)
    metrics['eps_growth'] = calculate_growth_rate(current.eps, previous.eps)
    
    # Profitability margins
    metrics['gross_margin'] = safe_percentage(safe_divide(current.gross_profit, current.revenue))
    metrics['ebitda_margin'] = safe_percentage(safe_divide(current.ebitda, current.revenue))
    metrics['ebit_margin'] = safe_percentage(safe_divide(current.ebit, current.revenue))
    metrics['net_profit_margin'] = safe_percentage(safe_divide(current.net_income, current.revenue))
    
    # Return metrics
    metrics['roe'] = safe_percentage(safe_divide(current.net_income, current.shareholders_equity))
    metrics['roa'] = safe_percentage(safe_divide(current.net_income, current.total_assets))
    
    # ROCE = EBIT / (Total Assets - Current Liabilities)
    if current.total_assets is not None and current.current_liabilities is not None:
        capital_employed = current.total_assets - current.current_liabilities
    elif current.total_assets is not None:
        capital_employed = current.total_assets
    else:
        capital_employed = None
    metrics['roce'] = safe_percentage(safe_divide(current.ebit, capital_employed))
    
    # Liquidity ratios
    metrics['current_ratio'] = safe_divide(current.current_assets, current.current_liabilities)
    
    # Quick ratio = (Cash + Receivables) / Current Liabilities or (Current Assets - Inventory) / Current Liabilities
    if current.cash is not None and current.current_liabilities:
        quick_assets = current.cash
        metrics['quick_ratio'] = safe_divide(quick_assets, current.current_liabilities)
    elif current.current_assets is not None:
        metrics['quick_ratio'] = safe_divide(current.current_assets * 0.7, current.current_liabilities)
    else:
        metrics['quick_ratio'] = None
    
    # Leverage ratios
    metrics['debt_equity'] = safe_divide(current.total_debt, current.shareholders_equity)
    metrics['debt_ebitda'] = safe_divide(current.total_debt, current.ebitda)
    
    # Net debt = Total Debt - Cash
    if current.total_debt is not None or current.cash is not None:
        net_debt = (current.total_debt or 0) - (current.cash or 0)
        metrics['net_debt_ebitda'] = safe_divide(net_debt, current.ebitda)
    else:
        metrics['net_debt_ebitda'] = None
    
    # Interest coverage = EBIT / Interest Expense
    metrics['interest_coverage'] = safe_divide(current.ebit, current.interest_expense)
    
    # Cash flow metrics
    metrics['fcf_margin'] = safe_percentage(safe_divide(current.free_cash_flow, current.revenue))
    metrics['fcf_conversion'] = safe_percentage(safe_divide(current.free_cash_flow, current.net_income))
    metrics['capex_intensity'] = safe_percentage(safe_divide(current.capex, current.revenue))

    
    # Efficiency metrics
    metrics['asset_turnover'] = safe_divide(current.revenue, current.total_assets)
    
    return metrics

def normalize_financial_value(value: str, unit: str = "millions") -> Optional[float]:
    """Normalize financial values from various formats to a standard unit."""
    if value is None or value == "":
        return None
    
    # Remove currency symbols, commas, and parentheses
    cleaned = value.replace('$', '').replace('₹', '').replace(',', '').replace('(', '-').replace(')', '').strip()
    
    try:
        num_value = float(cleaned)
        
        # Convert to millions based on unit
        unit_lower = unit.lower()
        if 'billion' in unit_lower or 'bn' in unit_lower:
            return num_value * 1000
        elif 'crore' in unit_lower:
            return num_value * 10  # 1 crore = 10 million
        elif 'lakh' in unit_lower or 'lac' in unit_lower:
            return num_value * 0.1  # 1 lakh = 0.1 million (100,000)
        elif 'thousand' in unit_lower or unit_lower.strip() == 'k':
            return num_value / 1000
        else:
            return num_value  # Assume millions

    except (ValueError, AttributeError):
        return None

def parse_percentage(value: str) -> Optional[float]:
    """Parse percentage string to decimal."""
    if value is None or value == "":
        return None
    
    cleaned = value.replace('%', '').replace(',', '').strip()
    
    try:
        num_value = float(cleaned)
        # Only divide by 100 if the original string had a % sign
        if '%' in value:
            return num_value / 100
        return num_value
    except (ValueError, AttributeError):
        return None
