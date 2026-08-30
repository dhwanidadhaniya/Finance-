import pytest
import sys
sys.path.append('.')

from models import FinancialStatement, DCFInputs, ForecastAssumptions
from finance.ratios import safe_divide, safe_percentage, calculate_growth_rate, normalize_financial_value, calculate_fundamental_metrics
from valuation.dcf import calculate_dcf, calculate_relative_valuation
from extraction.pdf_extractor import parse_financial_number



def test_edge_case_1_wacc_less_than_or_equal_terminal_growth():
    """1. WACC <= terminal growth must raise ValueError / block DCF calculation."""
    statement = FinancialStatement(year=2023, revenue=1000, ebitda=200, ebit=150, net_income=100, cash=50, total_debt=100, shares_outstanding=10)
    assumptions = ForecastAssumptions(revenue_growth=5, ebitda_margin=20, ebit_margin=15, tax_rate=25, depreciation_amortization_pct=4, capex_pct_revenue=5, working_capital_pct_revenue=8)
    
    # WACC == terminal_growth
    dcf_inputs_equal = DCFInputs(wacc=2.5, terminal_growth=2.5, assumptions=assumptions)
    with pytest.raises(ValueError, match="WACC"):
        calculate_dcf([statement], dcf_inputs_equal, current_price=10.0)

    # WACC < terminal_growth
    dcf_inputs_less = DCFInputs(wacc=2.0, terminal_growth=2.5, assumptions=assumptions)
    with pytest.raises(ValueError, match="WACC"):
        calculate_dcf([statement], dcf_inputs_less, current_price=10.0)

def test_edge_case_2_missing_revenue():
    """2. Missing revenue should be handled cleanly without NaN."""
    statement = FinancialStatement(year=2023, revenue=None, ebitda=200, ebit=150, net_income=100)
    assumptions = ForecastAssumptions(revenue_growth=5, ebitda_margin=20, ebit_margin=15, tax_rate=25, depreciation_amortization_pct=4, capex_pct_revenue=5, working_capital_pct_revenue=8)
    dcf_inputs = DCFInputs(wacc=10.0, terminal_growth=2.0, assumptions=assumptions)
    
    result = calculate_dcf([statement], dcf_inputs, current_price=10.0)
    assert not any(np_isnan(val) for val in result.fcf_forecasts)
    assert result.enterprise_value >= 0

def test_edge_case_3_missing_debt():
    """3. Missing debt should default debt to 0, net debt = -cash."""
    statement = FinancialStatement(year=2023, revenue=1000, ebitda=200, total_debt=None, cash=50, shares_outstanding=10)
    assumptions = ForecastAssumptions(revenue_growth=5, ebitda_margin=20, ebit_margin=15, tax_rate=25, depreciation_amortization_pct=4, capex_pct_revenue=5, working_capital_pct_revenue=8)
    dcf_inputs = DCFInputs(wacc=10.0, terminal_growth=2.0, assumptions=assumptions)
    
    result = calculate_dcf([statement], dcf_inputs, current_price=10.0)
    assert result.net_debt == -50.0
    assert result.equity_value == result.enterprise_value - (-50.0)

def test_edge_case_4_missing_cash():
    """4. Missing cash should default cash to 0, net debt = debt."""
    statement = FinancialStatement(year=2023, revenue=1000, ebitda=200, total_debt=100, cash=None, shares_outstanding=10)
    assumptions = ForecastAssumptions(revenue_growth=5, ebitda_margin=20, ebit_margin=15, tax_rate=25, depreciation_amortization_pct=4, capex_pct_revenue=5, working_capital_pct_revenue=8)
    dcf_inputs = DCFInputs(wacc=10.0, terminal_growth=2.0, assumptions=assumptions)
    
    result = calculate_dcf([statement], dcf_inputs, current_price=10.0)
    assert result.net_debt == 100.0
    assert result.equity_value == result.enterprise_value - 100.0

def test_edge_case_5_missing_shares():
    """5. Missing shares should return 0.0 intrinsic per share, no silent fallback to 1 share."""
    statement = FinancialStatement(year=2023, revenue=1000, ebitda=200, shares_outstanding=None)
    assumptions = ForecastAssumptions(revenue_growth=5, ebitda_margin=20, ebit_margin=15, tax_rate=25, depreciation_amortization_pct=4, capex_pct_revenue=5, working_capital_pct_revenue=8)
    dcf_inputs = DCFInputs(wacc=10.0, terminal_growth=2.0, assumptions=assumptions)
    
    result = calculate_dcf([statement], dcf_inputs, current_price=10.0)
    assert result.intrinsic_value_per_share == 0.0

def test_edge_case_6_zero_denominator():
    """6. Zero denominator handling in safe_divide."""
    assert safe_divide(100.0, 0.0) is None
    assert safe_divide(0.0, 0.0) is None
    assert calculate_growth_rate(100.0, 0.0) is None

def test_edge_case_7_negative_ebitda():
    """7. Negative EBITDA should render EV/EBITDA multiple as None (not meaningful)."""
    statement = FinancialStatement(year=2023, revenue=1000, ebitda=-50.0, eps=2.0)
    rel = calculate_relative_valuation([statement], current_price=20.0, shares=10.0)
    assert rel['ev_ebitda'] is None

def test_edge_case_8_negative_fcf():
    """8. Negative FCF should calculate correctly in DCF without crashing."""
    statement = FinancialStatement(year=2023, revenue=1000, ebitda=200, free_cash_flow=-100.0)
    assumptions = ForecastAssumptions(revenue_growth=-5, ebitda_margin=-10, ebit_margin=-15, tax_rate=25, depreciation_amortization_pct=4, capex_pct_revenue=15, working_capital_pct_revenue=8)
    dcf_inputs = DCFInputs(wacc=10.0, terminal_growth=2.0, assumptions=assumptions)
    
    result = calculate_dcf([statement], dcf_inputs, current_price=10.0)
    assert isinstance(result.enterprise_value, float)

def test_edge_case_9_missing_peer_data():
    """9. Missing peer metrics should safely return None without crashing."""
    statement = FinancialStatement(year=2023, revenue=1000)
    rel = calculate_relative_valuation([statement], current_price=10.0, shares=0)
    assert rel['pe_ratio'] is None
    assert rel['ev_ebitda'] is None
    assert rel['pb_ratio'] is None

def test_edge_case_10_different_units():
    """10. Unit normalization (thousands, millions, billions, crore, lakh)."""
    assert normalize_financial_value("100", "millions") == 100.0
    assert normalize_financial_value("1", "billion") == 1000.0
    assert normalize_financial_value("500", "thousand") == 0.5
    assert normalize_financial_value("2", "crore") == 20.0
    assert normalize_financial_value("5", "lakh") == 0.5

def test_edge_case_11_different_currencies():
    """11. Currency symbols handling in numbers."""
    assert parse_financial_number("$1,234.56") == 1234.56
    assert parse_financial_number("₹ 50,000") == 50000.0

def test_edge_case_12_negative_numbers_in_parentheses():
    """12. Negative numbers in parentheses e.g. (1,500) -> -1500.0."""
    assert parse_financial_number("(1,500.50)") == -1500.50
    assert parse_financial_number(" ( 250 ) ") == -250.0

def np_isnan(val):
    import math
    return math.isnan(val)
