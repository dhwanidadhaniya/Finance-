import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [company, setCompany] = useState(null)
  const [financialData, setFinancialData] = useState(null)
  const [peersData, setPeersData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentView, setCurrentView] = useState('overview')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('equitylens_theme') === 'dark'
  })
  const [unitMode, setUnitMode] = useState('B') // 'M' or 'B'
  const [currencySymbol, setCurrencySymbol] = useState('$') // '$', '€', '£'
  const [toast, setToast] = useState(null)

  const API_BASE = 'http://localhost:8008/api'

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('equitylens_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('equitylens_theme', 'light')
    }
  }, [darkMode])

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadDemoCompany = useCallback(async (ticker) => {
    setLoading(true)
    setError(null)
    try {
      const compRes = await axios.get(`${API_BASE}/company/demo/${ticker}`)
      setCompany(compRes.data)

      try {
        const finRes = await axios.get(`${API_BASE}/company/demo/${ticker}/financials`)
        setFinancialData({ statements: finRes.data.statements, source: 'demo' })
      } catch (err) {
        setFinancialData(generateDemoFinancialData(compRes.data))
      }

      try {
        const peerRes = await axios.get(`${API_BASE}/company/demo/${ticker}/peers`)
        setPeersData(peerRes.data.peers)
      } catch (err) {
        setPeersData(null)
      }

      showToast(`Loaded ${compRes.data.name} (${compRes.data.ticker})`, 'success')
      return compRes.data
    } catch (err) {
      setError(err.message)
      showToast(`Failed to load company: ${err.message}`, 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [API_BASE, showToast])

  const uploadDocument = useCallback(async (file, type) => {
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const endpoint = type === 'pdf' ? '/extraction/pdf' : '/extraction/excel'
      const response = await axios.post(`${API_BASE}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showToast(`Extracted financial data from ${file.name}`, 'success')
      return response.data
    } catch (err) {
      setError(err.message)
      showToast(`Extraction failed: ${err.message}`, 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [API_BASE, showToast])

  const calculateFundamentals = useCallback(async (statements) => {
    try {
      const response = await axios.post(`${API_BASE}/analysis/fundamentals`, statements)
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [API_BASE])

  const calculateDCF = useCallback(async (statements, dcfInputs, currentPrice) => {
    try {
      const response = await axios.post(`${API_BASE}/valuation/dcf`, {
        statements,
        dcf_inputs: dcfInputs,
        current_price: currentPrice
      })
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [API_BASE])

  const calculateRelativeValuation = useCallback(async (statements, currentPrice, shares) => {
    try {
      const response = await axios.post(`${API_BASE}/valuation/relative`, {
        statements,
        current_price: currentPrice,
        shares
      })
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [API_BASE])

  const calculateTechnical = useCallback(async (priceData) => {
    try {
      const response = await axios.post(`${API_BASE}/technical/indicators`, priceData)
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [API_BASE])

  const generateScenarios = useCallback(async (statements, assumptions, dcfInputs, currentPrice) => {
    try {
      const response = await axios.post(`${API_BASE}/scenarios/generate`, {
        statements,
        base_assumptions: assumptions,
        base_dcf_inputs: dcfInputs,
        current_price: currentPrice
      })
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [API_BASE])

  const fetchInvestmentScore = useCallback(async (statements, dcfUpside = 5.0, rsi = 58.0, macdBullish = true) => {
    try {
      const response = await axios.post(`${API_BASE}/analysis/score`, {
        statements,
        dcf_upside: dcfUpside,
        rsi,
        macd_bullish: macdBullish
      })
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [API_BASE])

  const formatAmount = useCallback((amount) => {
    if (amount === null || amount === undefined) return '—'
    const divisor = unitMode === 'B' ? 1000 : 1
    const val = amount / divisor
    return `${currencySymbol}${val.toFixed(2)}${unitMode}`
  }, [unitMode, currencySymbol])

  const value = {
    company,
    setCompany,
    financialData,
    setFinancialData,
    peersData,
    setPeersData,
    loading,
    setLoading,
    error,
    setError,
    currentView,
    setCurrentView,
    commandPaletteOpen,
    setCommandPaletteOpen,
    darkMode,
    setDarkMode,
    unitMode,
    setUnitMode,
    currencySymbol,
    setCurrencySymbol,
    toast,
    showToast,
    formatAmount,
    loadDemoCompany,
    uploadDocument,
    calculateFundamentals,
    calculateDCF,
    calculateRelativeValuation,
    calculateTechnical,
    generateScenarios,
    fetchInvestmentScore
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Fallback helper function to generate demo financial data if backend fails
function generateDemoFinancialData(company) {
  const baseYear = 2023
  const statements = []
  
  for (let i = 0; i < 5; i++) {
    const year = baseYear - i
    const multiplier = Math.pow(0.9, i)
    
    statements.push({
      year,
      revenue: company.market_cap * 0.3 * multiplier,
      cogs: company.market_cap * 0.15 * multiplier,
      gross_profit: company.market_cap * 0.15 * multiplier,
      operating_expenses: company.market_cap * 0.08 * multiplier,
      ebitda: company.market_cap * 0.07 * multiplier,
      ebit: company.market_cap * 0.05 * multiplier,
      interest_expense: company.market_cap * 0.01 * multiplier,
      pre_tax_income: company.market_cap * 0.04 * multiplier,
      tax: company.market_cap * 0.008 * multiplier,
      net_income: company.market_cap * 0.032 * multiplier,
      eps: (company.current_price * 0.2) * multiplier,
      cash: company.market_cap * 0.1 * multiplier,
      current_assets: company.market_cap * 0.4 * multiplier,
      total_assets: company.market_cap * 0.8 * multiplier,
      current_liabilities: company.market_cap * 0.2 * multiplier,
      total_liabilities: company.market_cap * 0.35 * multiplier,
      total_debt: company.market_cap * 0.2 * multiplier,
      shareholders_equity: company.market_cap * 0.45 * multiplier,
      operating_cash_flow: company.market_cap * 0.04 * multiplier,
      capex: company.market_cap * 0.015 * multiplier,
      investing_cash_flow: -company.market_cap * 0.02 * multiplier,
      financing_cash_flow: -company.market_cap * 0.01 * multiplier,
      free_cash_flow: company.market_cap * 0.025 * multiplier,
      depreciation_amortization: company.market_cap * 0.02 * multiplier,
      shares_outstanding: company.shares_outstanding,
      working_capital: company.market_cap * 0.2 * multiplier,
      unit: 'millions',
      currency: 'USD',
      source: 'sample',
      confidence: 1.0
    })
  }
  
  return { statements }
}

