from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
import shutil
import os
from extraction import extract_financial_data_from_pdf, extract_financial_data_from_excel
from models import FinancialStatement, Company

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/pdf")
async def extract_pdf(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Extract financial data from uploaded PDF."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        extracted_data = extract_financial_data_from_pdf(file_path)
        
        # Clean up
        os.remove(file_path)
        
        return extracted_data
    
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.post("/excel")
async def extract_excel(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Extract financial data from uploaded Excel file."""
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        extracted_data = extract_financial_data_from_excel(file_path)
        
        # Clean up
        os.remove(file_path)
        
        return extracted_data
    
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.post("/normalize")
async def normalize_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize extracted financial data into standard format."""
    # This would merge extracted statements into a unified format
    # For now, return the data as-is with normalization metadata
    return {
        "normalized": True,
        "data": data,
        "metadata": {
            "unit": "millions",
            "currency": "USD",
            "confidence": data.get("metadata", {}).get("confidence", 0.5)
        }
    }
