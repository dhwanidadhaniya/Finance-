from fastapi import APIRouter
from typing import List, Dict
from models import TechnicalIndicators
from technical import calculate_technical_indicators, generate_sample_price_data

router = APIRouter()

@router.post("/indicators")
async def calculate_technical_endpoint(price_data: List[Dict]) -> TechnicalIndicators:
    """Calculate technical indicators from price data."""
    return calculate_technical_indicators(price_data)

@router.get("/sample/{base_price}")
async def get_sample_price_data(base_price: float, days: int = 252) -> List[Dict]:
    """Generate sample price data for demo purposes."""
    return generate_sample_price_data(base_price, days)
