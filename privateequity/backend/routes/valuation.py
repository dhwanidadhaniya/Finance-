from fastapi import APIRouter, HTTPException
from typing import Dict
from models import FinancialStatement, DCFInputs, DCFOutput, DCFRequest, RelativeValuationRequest
from valuation import calculate_dcf, calculate_relative_valuation

router = APIRouter()

@router.post("/dcf")
async def calculate_dcf_endpoint(req: DCFRequest) -> DCFOutput:
    """Calculate DCF valuation."""
    try:
        dcf_result = calculate_dcf(req.statements, req.dcf_inputs, req.current_price)
        return dcf_result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DCF calculation failed: {str(e)}")

@router.post("/relative")
async def calculate_relative_valuation_endpoint(req: RelativeValuationRequest) -> Dict:
    """Calculate relative valuation multiples."""
    shares = req.shares
    if shares is None and req.statements and req.statements[0].shares_outstanding:
        shares = req.statements[0].shares_outstanding
    if not shares:
        shares = 1.0
    return calculate_relative_valuation(req.statements, req.current_price, shares)

