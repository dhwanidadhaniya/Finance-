from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import company, extraction, analysis, valuation, technical, scenarios

app = FastAPI(title="EquityLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(company.router, prefix="/api/company", tags=["company"])
app.include_router(extraction.router, prefix="/api/extraction", tags=["extraction"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(valuation.router, prefix="/api/valuation", tags=["valuation"])
app.include_router(technical.router, prefix="/api/technical", tags=["technical"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["scenarios"])

@app.get("/")
async def root():
    return {"message": "EquityLens API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)

