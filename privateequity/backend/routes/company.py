from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models import Company
import json
import os

router = APIRouter()

DEMO_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'sample_data')

@router.get("/demo")
async def get_demo_companies() -> List[Company]:
    """Get list of demo companies."""
    demo_companies = [
        Company(
            name="TechCorp Industries",
            ticker="TECH",
            exchange="NASDAQ",
            industry="Technology",
            sector="Software",
            description="Leading enterprise software company specializing in cloud solutions and digital transformation.",
            current_price=150.00,
            currency="USD",
            market_cap=45000000000,
            shares_outstanding=300000000
        ),
        Company(
            name="GreenEnergy Solutions",
            ticker="GREEN",
            exchange="NYSE",
            industry="Renewable Energy",
            sector="Utilities",
            description="Solar and wind energy provider with operations across North America and Europe.",
            current_price=45.50,
            currency="USD",
            market_cap=12000000000,
            shares_outstanding=263736263
        ),
        Company(
            name="FinanceHub Inc",
            ticker="FINH",
            exchange="NYSE",
            industry="Financial Services",
            sector="Banking",
            description="Digital-first financial services company offering banking, investment, and insurance products.",
            current_price=85.25,
            currency="USD",
            market_cap=25000000000,
            shares_outstanding=293255813
        )
    ]
    return demo_companies

@router.get("/demo/{ticker}")
async def get_demo_company(ticker: str) -> Company:
    """Get specific demo company by ticker."""
    companies = await get_demo_companies()
    for company in companies:
        if company.ticker.lower() == ticker.lower():
            return company
    raise HTTPException(status_code=404, detail="Company not found")

@router.get("/demo/{ticker}/financials")
async def get_demo_financials(ticker: str):
    """Get multi-year financial statements for demo company."""
    company = await get_demo_company(ticker)
    base_year = 2023
    statements = []
    
    # Custom baseline parameters per ticker for realistic variations
    if ticker.upper() == "GREEN":
        growth_rate, margin, cap_mult = 0.08, 0.20, 0.8
    elif ticker.upper() == "FINH":
        growth_rate, margin, cap_mult = 0.10, 0.28, 0.9
    else: # TECH
        growth_rate, margin, cap_mult = 0.12, 0.25, 1.0

    for i in range(5):
        year = base_year - i
        decay = (1 - growth_rate) ** i
        rev = company.market_cap * 0.3 * cap_mult * decay
        ebitda_val = rev * margin
        ebit_val = rev * (margin - 0.05)
        net_inc = rev * (margin - 0.08)
        
        statements.append({
            "year": year,
            "revenue": round(rev, 2),
            "cogs": round(rev * 0.55, 2),
            "gross_profit": round(rev * 0.45, 2),
            "operating_expenses": round(rev * 0.20, 2),
            "ebitda": round(ebitda_val, 2),
            "ebit": round(ebit_val, 2),
            "interest_expense": round(rev * 0.015, 2),
            "pre_tax_income": round(ebit_val - (rev * 0.015), 2),
            "tax": round((ebit_val - (rev * 0.015)) * 0.21, 2),
            "net_income": round(net_inc, 2),
            "eps": round(net_inc / company.shares_outstanding, 2),
            "cash": round(company.market_cap * 0.12 * decay, 2),
            "current_assets": round(company.market_cap * 0.35 * decay, 2),
            "total_assets": round(company.market_cap * 0.75 * decay, 2),
            "current_liabilities": round(company.market_cap * 0.18 * decay, 2),
            "total_liabilities": round(company.market_cap * 0.32 * decay, 2),
            "total_debt": round(company.market_cap * 0.18 * decay, 2),
            "shareholders_equity": round(company.market_cap * 0.43 * decay, 2),
            "operating_cash_flow": round(ebitda_val * 0.85, 2),
            "capex": round(rev * 0.05, 2),
            "investing_cash_flow": round(-rev * 0.06, 2),
            "financing_cash_flow": round(-rev * 0.02, 2),
            "free_cash_flow": round((ebitda_val * 0.85) - (rev * 0.05), 2),
            "depreciation_amortization": round(rev * 0.05, 2),
            "shares_outstanding": company.shares_outstanding,
            "working_capital": round(company.market_cap * 0.17 * decay, 2),
            "unit": "millions",
            "currency": company.currency or "USD",
            "source": "demo",
            "confidence": 1.0
        })
    return {"statements": statements}

@router.get("/demo/{ticker}/peers")
async def get_demo_peers(ticker: str):
    """Get peer comparison data for demo company."""
    company = await get_demo_company(ticker)
    
    peers = [
        {
            "name": company.name,
            "ticker": company.ticker,
            "revenueGrowth": 12.3,
            "ebitdaMargin": 24.5,
            "netMargin": 18.2,
            "roe": 22.3,
            "roce": 18.5,
            "debtEbitda": 2.3,
            "pe": 24.5,
            "evEbitda": 14.2,
            "pb": 4.2,
            "fcfYield": 4.8
        },
        {
            "name": f"{company.industry} Peer Alpha",
            "ticker": f"{company.ticker[:3]}A",
            "revenueGrowth": 9.5,
            "ebitdaMargin": 21.8,
            "netMargin": 15.2,
            "roe": 18.2,
            "roce": 14.5,
            "debtEbitda": 3.0,
            "pe": 22.0,
            "evEbitda": 15.5,
            "pb": 4.8,
            "fcfYield": 3.8
        },
        {
            "name": f"{company.industry} Peer Beta",
            "ticker": f"{company.ticker[:3]}B",
            "revenueGrowth": 15.8,
            "ebitdaMargin": 27.2,
            "netMargin": 21.0,
            "roe": 26.0,
            "roce": 21.2,
            "debtEbitda": 1.6,
            "pe": 29.0,
            "evEbitda": 18.2,
            "pb": 6.0,
            "fcfYield": 3.2
        },
        {
            "name": f"{company.industry} Peer Gamma",
            "ticker": f"{company.ticker[:3]}C",
            "revenueGrowth": 7.2,
            "ebitdaMargin": 18.5,
            "netMargin": 13.5,
            "roe": 15.5,
            "roce": 12.0,
            "debtEbitda": 3.6,
            "pe": 19.8,
            "evEbitda": 12.8,
            "pb": 3.5,
            "fcfYield": 5.4
        }
    ]
    return {"peers": peers}

@router.post("/")
async def create_company(company: Company) -> Company:
    """Create a new company entry."""
    return company

@router.get("/search")
async def search_companies(query: str) -> List[Company]:
    """Search companies by name or ticker."""
    companies = await get_demo_companies()
    query_lower = query.lower()
    return [
        c for c in companies 
        if query_lower in c.name.lower() or query_lower in c.ticker.lower()
    ]

