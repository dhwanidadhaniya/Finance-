import pytest
import sys
sys.path.append('.')
from valuation.dcf import calculate_dcf, calculate_relative_valuation
from models import FinancialStatement, DCFInputs, ForecastAssumptions


def test_calculate_dcf():
    """Test DCF calculation with valid inputs."""
    statements = [
        FinancialStatement(
            year=2023,
            revenue=1000,
            ebitda=250,
            ebit=200,
            net_income=144,
            cash=100,
            total_debt=200,
            shares_outstanding=57.6,
            unit="millions",
            currency="USD",
            source="sample"
        )
    ]
    
    assumptions = ForecastAssumptions(
        revenue_growth=10,
        ebitda_margin=25,
        ebit_margin=20,
        tax_rate=25,
        depreciation_amortization_pct=4,
        capex_pct_revenue=5,
        working_capital_pct_revenue=8,
        years=5
    )
    
    dcf_inputs = DCFInputs(
        wacc=10,
        terminal_growth=2.5,
        forecast_years=5,
        assumptions=assumptions
    )
    
    result = calculate_dcf(statements, dcf_inputs, current_price=150)
    
    # Check that result is not None
    assert result is not None
    
    # Check that FCF forecasts are generated
    assert len(result.fcf_forecasts) == 5
    assert all(fcf > 0 for fcf in result.fcf_forecasts)
    
    # Check that discount factors are decreasing
    assert result.discount_factors == sorted(result.discount_factors, reverse=True)
    
    # Check that terminal value is positive
    assert result.terminal_value > 0
    
    # Check that enterprise value is positive
    assert result.enterprise_value > 0
    
    # Check that intrinsic value is calculated
    assert result.intrinsic_value_per_share > 0
    
    # Check that upside/downside is calculated
    assert result.upside_downside is not None

def test_calculate_dcf_invalid_wacc():
    """Test DCF calculation with invalid WACC (<= terminal growth)."""
    statements = [
        FinancialStatement(
            year=2023,
            revenue=1000,
            ebitda=250,
            ebit=200,
            net_income=144,
            cash=100,
            total_debt=200,
            shares_outstanding=57.6,
            unit="millions",
            currency="USD",
            source="sample"
        )
    ]
    
    assumptions = ForecastAssumptions(
        revenue_growth=10,
        ebitda_margin=25,
        ebit_margin=20,
        tax_rate=25,
        depreciation_amortization_pct=4,
        capex_pct_revenue=5,
        working_capital_pct_revenue=8,
        years=5
    )
    
    dcf_inputs = DCFInputs(
        wacc=2,  # Less than terminal growth
        terminal_growth=2.5,
        forecast_years=5,
        assumptions=assumptions
    )
    
    with pytest.raises(ValueError, match="WACC .* must be greater than terminal growth"):
        calculate_dcf(statements, dcf_inputs, current_price=150)

def test_calculate_dcf_equal_wacc_terminal_growth():
    """Test DCF calculation with WACC equal to terminal growth."""
    statements = [
        FinancialStatement(
            year=2023,
            revenue=1000,
            ebitda=250,
            ebit=200,
            net_income=144,
            cash=100,
            total_debt=200,
            shares_outstanding=57.6,
            unit="millions",
            currency="USD",
            source="sample"
        )
    ]
    
    assumptions = ForecastAssumptions(
        revenue_growth=10,
        ebitda_margin=25,
        ebit_margin=20,
        tax_rate=25,
        depreciation_amortization_pct=4,
        capex_pct_revenue=5,
        working_capital_pct_revenue=8,
        years=5
    )
    
    dcf_inputs = DCFInputs(
        wacc=2.5,  # Equal to terminal growth
        terminal_growth=2.5,
        forecast_years=5,
        assumptions=assumptions
    )
    
    with pytest.raises(ValueError, match="WACC .* must be greater than terminal growth"):
        calculate_dcf(statements, dcf_inputs, current_price=150)

def test_calculate_relative_valuation():
    """Test relative valuation multiples calculation."""
    statements = [
        FinancialStatement(
            year=2023,
            revenue=1000,
            ebitda=250,
            ebit=200,
            net_income=144,
            eps=2.5,
            cash=100,
            total_debt=200,
            shareholders_equity=450,
            free_cash_flow=130,
            unit="millions",
            currency="USD",
            source="sample"
        )
    ]
    
    current_price = 150
    shares = 57.6
    
    result = calculate_relative_valuation(statements, current_price, shares)
    
    # Check that P/E is calculated
    assert 'pe_ratio' in result
    if result['pe_ratio'] is not None:
        assert result['pe_ratio'] > 0
    
    # Check that EV/EBITDA is calculated
    assert 'ev_ebitda' in result
    if result['ev_ebitda'] is not None:
        assert result['ev_ebitda'] > 0
    
    # Check that EV/Revenue is calculated
    assert 'ev_revenue' in result
    if result['ev_revenue'] is not None:
        assert result['ev_revenue'] > 0
    
    # Check that P/B is calculated
    assert 'pb_ratio' in result
    if result['pb_ratio'] is not None:
        assert result['pb_ratio'] > 0
    
    # Check that FCF yield is calculated
    assert 'fcf_yield' in result
    if result['fcf_yield'] is not None:
        assert result['fcf_yield'] >= 0

def test_calculate_relative_valuation_zero_eps():
    """Test relative valuation with zero EPS."""
    statements = [
        FinancialStatement(
            year=2023,
            revenue=1000,
            ebitda=250,
            ebit=200,
            net_income=0,
            eps=0,
            cash=100,
            total_debt=200,
            shareholders_equity=450,
            free_cash_flow=130,
            unit="millions",
            currency="USD",
            source="sample"
        )
    ]
    
    current_price = 150
    shares = 57.6
    
    result = calculate_relative_valuation(statements, current_price, shares)
    
    # P/E should be None when EPS is zero
    assert result['pe_ratio'] is None

def test_calculate_relative_valuation_negative_ebitda():
    """Test relative valuation with negative EBITDA."""
    statements = [
        FinancialStatement(
            year=2023,
            revenue=1000,
            ebitda=-50,
            ebit=-100,
            net_income=-150,
            eps=-2.5,
            cash=100,
            total_debt=200,
            shareholders_equity=450,
            free_cash_flow=-50,
            unit="millions",
            currency="USD",
            source="sample"
        )
    ]
    
    current_price = 150
    shares = 57.6
    
    result = calculate_relative_valuation(statements, current_price, shares)
    
    # EV/EBITDA should be None when EBITDA is negative
    assert result['ev_ebitda'] is None

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
