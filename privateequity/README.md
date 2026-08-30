# EquityLens - Equity Research & Investment Analytics Terminal

A professional equity research and investment analytics terminal that allows users to research companies, extract financial data from documents, perform fundamental and technical analysis, value companies using DCF and relative valuation methods, and generate transparent investment views.

## Features

- **Document Extraction**: Automatically extract financial data from PDF and Excel files
- **Fundamental Analysis**: Comprehensive ratios, margins, growth metrics, and financial health indicators
- **Financial Statements**: Interactive income statement, balance sheet, and cash flow visualization
- **Forecasting**: Multi-year financial projections with customizable assumptions
- **DCF Valuation**: Professional discounted cash flow modeling with sensitivity analysis
- **Relative Valuation**: P/E, EV/EBITDA, EV/Revenue, P/B, and FCF yield comparisons
- **Technical Analysis**: RSI, MACD, Bollinger Bands, moving averages, and momentum indicators
- **Peer Analysis**: Compare companies against industry peers with radar charts and rankings
- **Scenario Analysis**: Bull, Base, and Bear case modeling with live recalculation
- **Investment Scoring**: Transparent 0-100 scoring system with BUY/HOLD/WATCH/AVOID recommendations
- **Financial DNA Visualization**: Interactive radar chart showing company financial profile
- **Command Palette**: Quick navigation with Ctrl/Cmd+K

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Recharts
- Lucide Icons
- Framer Motion
- React Router

### Backend
- Python 3.8+
- FastAPI
- Pandas
- NumPy
- pdfplumber (PDF extraction)
- openpyxl (Excel extraction)

## Architecture

```
equitylens/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utility functions
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/              # Python backend
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── extraction/      # PDF/Excel extraction
│   ├── finance/         # Financial calculations
│   ├── valuation/       # DCF and relative valuation
│   ├── technical/       # Technical indicators
│   ├── models/          # Pydantic models
│   └── utils/           # Utility functions
├── sample_data/         # Demo financial data
├── tests/              # Automated tests
├── README.md
├── .gitignore
└── .env.example
```

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Start the backend server:
```bash
python main.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

### Quick Start

1. Start both the backend and frontend servers as described above
2. Open `http://localhost:5173` in your browser
3. Click "Load Demo Company" to explore the application with sample data
4. Use the command palette (Ctrl/Cmd+K) for quick navigation

### Main Workflow

1. **Company Selection**: Choose a demo company or upload financial documents
2. **Data Extraction**: Upload PDF or Excel files to extract financial data
3. **Review & Confirm**: Edit extracted data in the review interface
4. **Fundamentals**: Analyze growth, profitability, liquidity, and leverage metrics
5. **Financials**: View historical financial statements
6. **Forecast**: Create multi-year projections with custom assumptions
7. **Valuation**: Run DCF and relative valuation models
8. **Technicals**: Analyze price trends and technical indicators
9. **Peers**: Compare against industry competitors
10. **Scenarios**: Model Bull, Base, and Bear cases
11. **Investment View**: Review final recommendation with thesis, risks, and catalysts

## Financial Formulas

### DCF Valuation

The DCF model calculates the present value of future cash flows:

```
FCF = EBIT × (1 - Tax Rate) + D&A - Capex - Change in WC
PV(FCF) = FCF / (1 + WACC)^n
TV = Final FCF × (1 + g) / (WACC - g)
EV = Σ PV(FCF) + PV(TV)
Equity Value = EV - Net Debt
Intrinsic Value/Share = Equity Value / Shares Outstanding
```

### Key Ratios

- **ROE**: Net Income / Shareholders' Equity
- **ROCE**: EBIT / (Total Assets - Current Liabilities)
- **Debt/EBITDA**: Total Debt / EBITDA
- **Current Ratio**: Current Assets / Current Liabilities
- **FCF Margin**: Free Cash Flow / Revenue

### Technical Indicators

- **RSI**: Relative Strength Index (14-period)
- **MACD**: Moving Average Convergence Divergence
- **Bollinger Bands**: 20-period SMA ± 2 standard deviations

## PDF/Excel Extraction

The application uses:
- **pdfplumber** for PDF extraction with pattern matching for financial statement items
- **openpyxl** for Excel extraction with sheet detection and value parsing

Extraction identifies:
- Income statement items (Revenue, EBITDA, Net Income, etc.)
- Balance sheet items (Assets, Liabilities, Equity, Debt)
- Cash flow items (Operating CF, Capex, Free Cash Flow)

## Testing

Run automated tests for financial formulas:

```bash
# From project root
pytest tests/test_finance.py -v
pytest tests/test_valuation.py -v
```

## Limitations

- **Demo Data Only**: Current version uses sample/demo data. Real-time data requires API integration
- **Extraction Accuracy**: PDF/Excel extraction is pattern-based and may require manual review
- **Market Data**: Technical indicators use simulated price data for demo purposes
- **Currency Support**: Primarily supports USD with basic multi-currency handling
- **Disclaimer**: This is an educational/research tool, not financial advice

## Future Improvements

- Real-time market data integration (Alpha Vantage, Yahoo Finance)
- Machine learning for improved extraction accuracy
- Additional valuation models (APV, LBO, Sum-of-Parts)
- Enhanced peer database with automatic peer selection
- Portfolio management features
- Export to PDF/Excel for reports
- Multi-currency support with automatic conversion
- Advanced technical indicators and backtesting
- Collaborative features for team research

## Disclaimer

**IMPORTANT**: EquityLens is an analytical tool for educational and research purposes only. It does not constitute financial advice. All investment decisions should be made based on your own research and consultation with qualified financial advisors. The scores, recommendations, and valuations generated by this tool are based on historical data and assumptions that may not reflect future performance.

## License

This project is for educational purposes. Please ensure compliance with all applicable laws and regulations when using financial data.

## Contributing

This is a student project demonstrating full-stack development skills in finance and technology. Feel free to use it as a reference for your own projects.

## Contact

For questions or feedback about this project, please refer to the project repository.
