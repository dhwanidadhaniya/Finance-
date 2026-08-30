import pytest
import sys
sys.path.append('.')
import httpx
from backend.main import app

pytestmark = pytest.mark.anyio

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture
async def async_client():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        yield client


async def test_api_health(async_client):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

async def test_api_company_demo(async_client):
    response = await async_client.get("/api/company/demo")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    assert data[0]["ticker"] == "TECH"

async def test_api_company_demo_single(async_client):
    response = await async_client.get("/api/company/demo/TECH")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "TechCorp Industries"

async def test_api_valuation_dcf_endpoint(async_client):
    payload = {
        "statements": [
            {
                "year": 2023,
                "revenue": 1000,
                "ebitda": 250,
                "ebit": 180,
                "net_income": 120,
                "cash": 100,
                "total_debt": 200,
                "shares_outstanding": 50
            }
        ],
        "dcf_inputs": {
            "wacc": 10.0,
            "terminal_growth": 2.5,
            "forecast_years": 5,
            "assumptions": {
                "revenue_growth": 10.0,
                "ebitda_margin": 25.0,
                "ebit_margin": 18.0,
                "tax_rate": 25.0,
                "depreciation_amortization_pct": 4.0,
                "capex_pct_revenue": 5.0,
                "working_capital_pct_revenue": 8.0,
                "years": 5
            }
        },
        "current_price": 40.0
    }
    response = await async_client.post("/api/valuation/dcf", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "enterprise_value" in data
    assert "equity_value" in data
    assert "intrinsic_value_per_share" in data
    assert data["enterprise_value"] != data["equity_value"]

async def test_api_valuation_dcf_invalid_wacc(async_client):
    payload = {
        "statements": [
            {"year": 2023, "revenue": 1000, "ebitda": 250, "shares_outstanding": 50}
        ],
        "dcf_inputs": {
            "wacc": 2.0,
            "terminal_growth": 2.5,
            "forecast_years": 5,
            "assumptions": {
                "revenue_growth": 10.0,
                "ebitda_margin": 25.0,
                "ebit_margin": 18.0,
                "tax_rate": 25.0,
                "depreciation_amortization_pct": 4.0,
                "capex_pct_revenue": 5.0,
                "working_capital_pct_revenue": 8.0,
                "years": 5
            }
        },
        "current_price": 40.0
    }
    response = await async_client.post("/api/valuation/dcf", json=payload)
    assert response.status_code == 400
    assert "WACC" in response.json()["detail"]

async def test_api_scenarios_generate(async_client):
    payload = {
        "statements": [
            {"year": 2023, "revenue": 1000, "ebitda": 250, "ebit": 180, "net_income": 120, "shares_outstanding": 50}
        ],
        "base_assumptions": {
            "revenue_growth": 10.0,
            "ebitda_margin": 25.0,
            "ebit_margin": 18.0,
            "tax_rate": 25.0,
            "depreciation_amortization_pct": 4.0,
            "capex_pct_revenue": 5.0,
            "working_capital_pct_revenue": 8.0,
            "years": 5
        },
        "base_dcf_inputs": {
            "wacc": 10.0,
            "terminal_growth": 2.5,
            "forecast_years": 5,
            "assumptions": {
                "revenue_growth": 10.0,
                "ebitda_margin": 25.0,
                "ebit_margin": 18.0,
                "tax_rate": 25.0,
                "depreciation_amortization_pct": 4.0,
                "capex_pct_revenue": 5.0,
                "working_capital_pct_revenue": 8.0,
                "years": 5
            }
        },
        "current_price": 40.0
    }
    response = await async_client.post("/api/scenarios/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert data[0]["name"] == "Bull"
    assert data[1]["name"] == "Base"
    assert data[2]["name"] == "Bear"

async def test_api_analysis_fundamentals(async_client):
    statements = [
        {"year": 2023, "revenue": 1000, "ebitda": 200, "net_income": 100, "total_assets": 800, "current_liabilities": 200},
        {"year": 2022, "revenue": 900, "ebitda": 180, "net_income": 85, "total_assets": 750, "current_liabilities": 180}
    ]
    response = await async_client.post("/api/analysis/fundamentals", json=statements)
    assert response.status_code == 200
    data = response.json()
    assert data["revenue_growth"] is not None
    assert data["ebitda_growth"] is not None

async def test_api_company_demo_financials(async_client):
    response = await async_client.get("/api/company/demo/TECH/financials")
    assert response.status_code == 200
    data = response.json()
    assert "statements" in data
    assert len(data["statements"]) == 5

async def test_api_company_demo_peers(async_client):
    response = await async_client.get("/api/company/demo/TECH/peers")
    assert response.status_code == 200
    data = response.json()
    assert "peers" in data
    assert len(data["peers"]) >= 3

async def test_api_analysis_score(async_client):
    payload = {
        "statements": [
            {"year": 2023, "revenue": 1000, "ebitda": 250, "ebit": 180, "net_income": 120, "shares_outstanding": 50, "total_debt": 200, "cash": 50, "total_assets": 800, "current_liabilities": 200},
            {"year": 2022, "revenue": 900, "ebitda": 220, "ebit": 160, "net_income": 100, "shares_outstanding": 50, "total_debt": 220, "cash": 40, "total_assets": 750, "current_liabilities": 190}
        ],
        "dcf_upside": 8.5,
        "rsi": 62.0,
        "macd_bullish": True
    }
    response = await async_client.post("/api/analysis/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendation" in data
    assert "overall_score" in data
    assert "thesis" in data


