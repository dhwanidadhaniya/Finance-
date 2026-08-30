from fastapi import APIRouter
from typing import Dict, List, Optional
from pydantic import BaseModel
from models import FinancialStatement, FundamentalMetrics, InvestmentScore, InvestmentView
from finance import calculate_fundamental_metrics

router = APIRouter()

class ScoreRequest(BaseModel):
    statements: List[FinancialStatement]
    dcf_upside: Optional[float] = 5.0
    rsi: Optional[float] = 58.0
    macd_bullish: Optional[bool] = True

@router.post("/fundamentals")
async def calculate_fundamentals(statements: List[FinancialStatement]) -> FundamentalMetrics:
    """Calculate fundamental metrics from financial statements."""
    metrics_dict = calculate_fundamental_metrics(statements)
    return FundamentalMetrics(**metrics_dict)

@router.post("/metrics")
async def calculate_custom_metrics(statements: List[FinancialStatement], metric_names: List[str]) -> Dict:
    """Calculate specific custom metrics."""
    all_metrics = calculate_fundamental_metrics(statements)
    return {k: v for k, v in all_metrics.items() if k in metric_names}

@router.post("/score")
async def calculate_investment_score(req: ScoreRequest) -> InvestmentView:
    """Calculate dynamic investment score, recommendation, thesis, and risks."""
    fm = calculate_fundamental_metrics(req.statements)
    
    rev_growth = fm.get("revenue_growth") or 10.0
    ebitda_margin = fm.get("ebitda_margin") or 20.0
    roce = fm.get("roce") or 15.0
    debt_ebitda = fm.get("debt_ebitda") or 2.0
    
    # Fundamental Score (0 - 100)
    growth_score = min(25, max(0, (rev_growth / 15.0) * 25))
    profit_score = min(25, max(0, (ebitda_margin / 25.0) * 25))
    roce_score = min(25, max(0, (roce / 20.0) * 25))
    leverage_score = min(25, max(0, (1 - (debt_ebitda / 5.0)) * 25))
    fundamental_score = round(growth_score + profit_score + roce_score + leverage_score, 1)

    # Valuation Score (0 - 100)
    upside = req.dcf_upside or 0.0
    val_score = min(100, max(0, 50 + upside * 2.5))
    valuation_score = round(val_score, 1)

    # Technical Score (0 - 100)
    rsi = req.rsi or 50.0
    rsi_score = 30 if (30 <= rsi <= 70) else 15
    macd_score = 35 if req.macd_bullish else 15
    trend_score = 35
    technical_score = round(rsi_score + macd_score + trend_score, 1)

    overall = round((fundamental_score * 0.45) + (valuation_score * 0.35) + (technical_score * 0.20), 1)

    if overall >= 75:
        rec = "BUY"
    elif overall >= 55:
        rec = "HOLD"
    elif overall >= 40:
        rec = "WATCH"
    else:
        rec = "AVOID"

    thesis = [
        f"Solid revenue growth rate of {rev_growth:.1f}% demonstrating healthy demand.",
        f"Robust EBITDA margin of {ebitda_margin:.1f}% providing margin buffer.",
        f"Return on Capital Employed (ROCE) at {roce:.1f}% indicates strong capital allocation.",
        f"Manageable leverage profile with Debt/EBITDA of {debt_ebitda:.1f}x.",
        f"DCF valuation yields {upside:+.1f}% upside to current market price."
    ]

    risks = [
        "Potential macroeconomic headwinds affecting top-line growth.",
        "Input cost pressures that could compress gross and EBITDA margins.",
        "Competitive actions or market share erosion from sector peers.",
        "Refinancing or interest rate risks if debt levels escalate."
    ]

    catalysts = [
        "New product line expansion and operational scale efficiencies.",
        "Deleveraging and interest expense reduction.",
        "Margin expansion through technological automation."
    ]

    what_changed = [
        f"Revenue growth dropping below {max(0, rev_growth - 5):.1f}% for two quarters.",
        f"EBITDA margin compressing below {max(0, ebitda_margin - 4):.1f}%.",
        f"Debt/EBITDA expanding beyond {debt_ebitda + 1.5:.1f}x."
    ]

    scores = InvestmentScore(
        fundamental_score=fundamental_score,
        valuation_score=valuation_score,
        technical_score=technical_score,
        overall_score=overall,
        fundamental_breakdown={
            "growth": round(growth_score, 1),
            "profitability": round(profit_score, 1),
            "roce": round(roce_score, 1),
            "leverage": round(leverage_score, 1)
        },
        valuation_breakdown={
            "dcf_upside": round(valuation_score * 0.5, 1),
            "multiples": round(valuation_score * 0.5, 1)
        },
        technical_breakdown={
            "rsi": round(rsi_score, 1),
            "macd": round(macd_score, 1),
            "trend": round(trend_score, 1)
        }
    )

    return InvestmentView(
        recommendation=rec,
        overall_score=overall,
        thesis=thesis,
        risks=risks,
        catalysts=catalysts,
        what_would_change_mind=what_changed,
        scores=scores
    )

