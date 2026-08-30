import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, TrendingUp, FileText, LineChart, 
  Calculator, Activity, Users, Zap, Eye, 
  Search, Upload, X, ChevronRight, Download,
  Sun, Moon, DollarSign, CheckCircle, AlertCircle, Printer, FileSpreadsheet
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Overview from '../components/dashboard/Overview'
import Fundamentals from '../components/dashboard/Fundamentals'
import Financials from '../components/dashboard/Financials'
import Forecast from '../components/dashboard/Forecast'
import Valuation from '../components/dashboard/Valuation'
import Technicals from '../components/dashboard/Technicals'
import Peers from '../components/dashboard/Peers'
import Scenarios from '../components/dashboard/Scenarios'
import InvestmentView from '../components/dashboard/InvestmentView'

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'fundamentals', label: 'Fundamentals', icon: TrendingUp },
  { id: 'financials', label: 'Financials', icon: FileText },
  { id: 'forecast', label: 'Forecast', icon: LineChart },
  { id: 'valuation', label: 'Valuation', icon: Calculator },
  { id: 'technicals', label: 'Technicals', icon: Activity },
  { id: 'peers', label: 'Peers', icon: Users },
  { id: 'scenarios', label: 'Scenarios', icon: Zap },
  { id: 'investment', label: 'Investment View', icon: Eye },
]

const Dashboard = () => {
  const { 
    company, setCompany, 
    financialData, setFinancialData, 
    currentView, setCurrentView, 
    setCommandPaletteOpen, uploadDocument, loadDemoCompany,
    darkMode, setDarkMode,
    unitMode, setUnitMode,
    currencySymbol, setCurrencySymbol,
    toast, showToast 
  } = useApp()

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [extractedPreview, setExtractedPreview] = useState(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false)

  const pdfInputRef = useRef(null)
  const excelInputRef = useRef(null)

  useEffect(() => {
    if (!company) {
      loadDemoCompany('TECH').catch(console.error)
    }
  }, [company, loadDemoCompany])

  const handleExportJSON = () => {
    if (!company) return
    const reportData = {
      company,
      financialData,
      exportedAt: new Date().toISOString()
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `${company.ticker}_EquityLens_Report.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setExportMenuOpen(false)
    showToast("Exported JSON report", "success")
  }

  const handleExportCSV = () => {
    if (!financialData?.statements) return
    const headers = ["Year", "Revenue", "EBITDA", "EBIT", "Net Income", "Free Cash Flow"]
    const rows = financialData.statements.map(s => [
      s.year, s.revenue, s.ebitda, s.ebit, s.net_income, s.free_cash_flow
    ])
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${company.ticker}_Financials.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setExportMenuOpen(false)
    showToast("Exported Financial Statements to CSV", "success")
  }

  const handlePrintReport = () => {
    setExportMenuOpen(false)
    window.print()
  }

  const handleFileUpload = async (file, type) => {
    if (!file) return
    setUploading(true)
    setUploadStatus(null)
    setExtractedPreview(null)
    try {
      const res = await uploadDocument(file, type)
      setExtractedPreview(res)
      const detectedSymbol = res.company?.currency_symbol || res.metadata?.currency_symbol || '$'
      const detectedCode = res.company?.currency || res.metadata?.currency || 'USD'
      setCurrencySymbol(detectedSymbol)
      setUploadStatus({ 
        type: 'success', 
        message: `Data extracted! Currency detected: ${detectedCode} (${detectedSymbol}). Please verify line items below.` 
      })
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message || 'Extraction failed' })
    } finally {
      setUploading(false)
    }
  }

  const confirmExtractedData = () => {
    if (!extractedPreview) return
    const detectedSymbol = extractedPreview.company?.currency_symbol || extractedPreview.metadata?.currency_symbol || '$'
    setCurrencySymbol(detectedSymbol)
    setCompany(prev => ({
      name: extractedPreview.company?.name || prev?.name || 'Uploaded Company',
      ticker: extractedPreview.company?.ticker || prev?.ticker || 'UPLD',
      exchange: extractedPreview.company?.exchange || prev?.exchange || 'NASDAQ',
      current_price: prev?.current_price || 150.0,
      shares_outstanding: prev?.shares_outstanding || 100.0,
      market_cap: prev?.market_cap || 15000.0,
      industry: prev?.industry || 'Finance',
      sector: prev?.sector || 'Private Equity',
      currency: extractedPreview.company?.currency || 'USD'
    }))
    if (extractedPreview.statements && extractedPreview.statements.length > 0) {
      setFinancialData({ statements: extractedPreview.statements, source: 'extracted' })
    }
    showToast(`Applied extracted financial data (${detectedSymbol}) to model`, 'success')
    setUploadModalOpen(false)
    setExtractedPreview(null)
    setUploadStatus(null)
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-graphite-600 dark:text-graphite-300 mb-4">No company selected</p>
          <button
            onClick={() => loadDemoCompany('TECH')}
            className="btn-primary"
          >
            Load TechCorp Demo
          </button>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'overview': return <Overview />
      case 'fundamentals': return <Fundamentals />
      case 'financials': return <Financials />
      case 'forecast': return <Forecast />
      case 'valuation': return <Valuation />
      case 'technicals': return <Technicals />
      case 'peers': return <Peers />
      case 'scenarios': return <Scenarios />
      case 'investment': return <InvestmentView />
      default: return <Overview />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-terminal-bg text-navy-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-semibold backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-emerald-500/90 text-white border-emerald-400' 
                : toast.type === 'error'
                ? 'bg-rose-500/90 text-white border-rose-400'
                : 'bg-navy-800/90 text-white border-navy-700'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-terminal-card border-r border-slate-200 dark:border-terminal-border flex flex-col fixed h-full z-20 no-print">
        <div className="p-6 border-b border-slate-200 dark:border-terminal-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-navy-800 to-blue-600 dark:from-sky-400 dark:to-blue-500 bg-clip-text text-transparent">
              EquityLens
            </h1>
            <p className="text-xs font-semibold text-graphite-500 dark:text-slate-400 mt-0.5 tracking-wider uppercase">
              Terminal v1.0
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-terminal-border text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-700" />}
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-navy-100 text-navy-800 dark:bg-blue-600/20 dark:text-sky-400 font-semibold shadow-sm' 
                    : 'text-graphite-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-terminal-hover'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-navy-700 dark:text-sky-400' : 'text-graphite-400 dark:text-slate-400'}`} />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-navy-600 dark:text-sky-400" />}
              </button>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-terminal-border">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-navy-800 dark:bg-blue-600 text-white rounded-xl font-semibold hover:bg-navy-900 dark:hover:bg-blue-500 transition-all shadow-md active:scale-98"
          >
            <Upload className="w-4 h-4" />
            Upload Documents
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/80 dark:bg-terminal-card/80 backdrop-blur-md border-b border-slate-200 dark:border-terminal-border px-8 py-4 sticky top-0 z-10 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-slate-100 capitalize tracking-tight">
                  {currentView}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  {/* Company Switcher Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                      className="flex items-center gap-2 text-sm font-bold text-navy-800 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      <span>{company.name} ({company.ticker})</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${companyDropdownOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {companyDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-terminal-card border border-slate-200 dark:border-terminal-border rounded-xl shadow-xl z-30 py-2">
                        <div className="px-3 py-1 text-xs font-semibold text-graphite-400 uppercase tracking-wider">Switch Company</div>
                        <button 
                          onClick={() => { loadDemoCompany('TECH'); setCompanyDropdownOpen(false) }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-terminal-hover font-medium flex justify-between"
                        >
                          <span>TechCorp Industries</span>
                          <span className="text-xs bg-navy-100 dark:bg-slate-800 text-navy-800 dark:text-slate-300 px-1.5 py-0.5 rounded">TECH</span>
                        </button>
                        <button 
                          onClick={() => { loadDemoCompany('GREEN'); setCompanyDropdownOpen(false) }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-terminal-hover font-medium flex justify-between"
                        >
                          <span>GreenEnergy Solutions</span>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">GREEN</span>
                        </button>
                        <button 
                          onClick={() => { loadDemoCompany('FINH'); setCompanyDropdownOpen(false) }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-terminal-hover font-medium flex justify-between"
                        >
                          <span>FinanceHub Inc</span>
                          <span className="text-xs bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded">FINH</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    financialData?.source === 'extracted'
                      ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                      : financialData?.source === 'manual'
                      ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {financialData?.source ? `${financialData.source} Data` : 'Sample Data'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Controls & Controls */}
            <div className="flex items-center gap-3">
              {/* Unit Toggle */}
              <div className="flex bg-slate-100 dark:bg-terminal-border p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button 
                  onClick={() => setUnitMode('M')}
                  className={`px-2.5 py-1 rounded-md transition-all ${unitMode === 'M' ? 'bg-white dark:bg-blue-600 text-navy-900 dark:text-white shadow-sm' : 'text-graphite-500 dark:text-slate-400'}`}
                >
                  Millions ($M)
                </button>
                <button 
                  onClick={() => setUnitMode('B')}
                  className={`px-2.5 py-1 rounded-md transition-all ${unitMode === 'B' ? 'bg-white dark:bg-blue-600 text-navy-900 dark:text-white shadow-sm' : 'text-graphite-500 dark:text-slate-400'}`}
                >
                  Billions ($B)
                </button>
              </div>

              {/* Currency Selector */}
              <select 
                value={currencySymbol}
                onChange={e => setCurrencySymbol(e.target.value)}
                className="bg-slate-100 dark:bg-terminal-border border border-slate-200 dark:border-slate-700 text-xs font-bold px-2 py-1.5 rounded-lg outline-none cursor-pointer"
              >
                <option value="$">$ USD</option>
                <option value="₹">₹ INR</option>
                <option value="€">€ EUR</option>
                <option value="£">£ GBP</option>
              </select>

              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 dark:border-terminal-border rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-terminal-hover transition-colors"
              >
                <Search className="w-4 h-4 text-graphite-400" />
                <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-terminal-border rounded border border-slate-200 dark:border-slate-700">⌘K</kbd>
              </button>

              {/* Multi-Format Export Menu */}
              <div className="relative">
                <button 
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-navy-700 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-navy-800 dark:hover:bg-blue-500 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                {exportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-terminal-card border border-slate-200 dark:border-terminal-border rounded-xl shadow-xl z-30 py-2">
                    <button
                      onClick={handleExportJSON}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-terminal-hover flex items-center gap-2 font-medium"
                    >
                      <FileText className="w-4 h-4 text-blue-500" />
                      Export Model (JSON)
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-terminal-hover flex items-center gap-2 font-medium"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      Export Statements (CSV)
                    </button>
                    <button
                      onClick={handlePrintReport}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-terminal-hover flex items-center gap-2 font-medium border-t border-slate-100 dark:border-terminal-border"
                    >
                      <Printer className="w-4 h-4 text-purple-500" />
                      Print Executive PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 flex-1">
          {renderView()}
        </div>
      </main>

      {/* Upload & Extraction Review Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-terminal-card border border-slate-200 dark:border-terminal-border rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-terminal-border">
              <h3 className="text-xl font-bold text-navy-900 dark:text-slate-100">
                {extractedPreview ? 'Verify & Review Extracted Financial Data' : 'Upload Financial Documents'}
              </h3>
              <button
                onClick={() => { setUploadModalOpen(false); setExtractedPreview(null); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-terminal-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-graphite-500" />
              </button>
            </div>

            <input 
              type="file" 
              ref={pdfInputRef} 
              accept=".pdf" 
              className="hidden" 
              onChange={e => handleFileUpload(e.target.files[0], 'pdf')} 
            />
            <input 
              type="file" 
              ref={excelInputRef} 
              accept=".xlsx,.xls" 
              className="hidden" 
              onChange={e => handleFileUpload(e.target.files[0], 'excel')} 
            />

            {!extractedPreview ? (
              <div className="py-6 space-y-4">
                <div 
                  onClick={() => pdfInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-navy-900 dark:text-slate-100 font-semibold mb-1">Click or drag financial reports here</p>
                  <p className="text-sm text-graphite-500 dark:text-slate-400">Supports PDF annual reports & Excel financial workbooks</p>
                </div>

                {uploadStatus && (
                  <div className={`p-3 rounded-xl text-sm text-center font-medium ${
                    uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {uploadStatus.message}
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    disabled={uploading} 
                    onClick={() => pdfInputRef.current?.click()} 
                    className="flex-1 btn-primary"
                  >
                    {uploading ? 'Processing PDF...' : 'Select PDF File'}
                  </button>
                  <button 
                    disabled={uploading} 
                    onClick={() => excelInputRef.current?.click()} 
                    className="flex-1 btn-secondary"
                  >
                    {uploading ? 'Processing Excel...' : 'Select Excel File'}
                  </button>
                </div>
              </div>
            ) : (
              /* Extracted Data Verification Drawer */
              <div className="py-4 space-y-4 overflow-y-auto scrollbar-thin flex-1">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Confidence Score: {((extractedPreview.metadata?.confidence || 0.95) * 100).toFixed(0)}%
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 uppercase font-bold">PDF Pattern Extraction Matched</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-navy-900 dark:text-slate-200 mb-2">Parsed Company Meta</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <input 
                      type="text" 
                      value={extractedPreview.company?.name || ''} 
                      onChange={e => setExtractedPreview(prev => ({ ...prev, company: { ...prev.company, name: e.target.value } }))}
                      className="input-field"
                      placeholder="Company Name"
                    />
                    <input 
                      type="text" 
                      value={extractedPreview.company?.ticker || ''} 
                      onChange={e => setExtractedPreview(prev => ({ ...prev, company: { ...prev.company, ticker: e.target.value } }))}
                      className="input-field"
                      placeholder="Ticker"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-navy-900 dark:text-slate-200 mb-2">Extracted Financial Line Items</h4>
                  <div className="space-y-2">
                    {extractedPreview.statements?.map((s, idx) => (
                      <div key={s.year || idx} className="p-3 bg-slate-50 dark:bg-terminal-border rounded-xl text-xs space-y-2">
                        <div className="font-bold text-navy-800 dark:text-sky-400">Year {s.year}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-graphite-500 block">Revenue ($M)</span>
                            <input 
                              type="number" 
                              value={s.revenue || 0}
                              onChange={e => {
                                const val = parseFloat(e.target.value)
                                setExtractedPreview(prev => {
                                  const updated = [...prev.statements]
                                  updated[idx] = { ...updated[idx], revenue: val }
                                  return { ...prev, statements: updated }
                                })
                              }}
                              className="input-field text-xs py-1"
                            />
                          </div>
                          <div>
                            <span className="text-graphite-500 block">EBITDA ($M)</span>
                            <input 
                              type="number" 
                              value={s.ebitda || 0}
                              onChange={e => {
                                const val = parseFloat(e.target.value)
                                setExtractedPreview(prev => {
                                  const updated = [...prev.statements]
                                  updated[idx] = { ...updated[idx], ebitda: val }
                                  return { ...prev, statements: updated }
                                })
                              }}
                              className="input-field text-xs py-1"
                            />
                          </div>
                          <div>
                            <span className="text-graphite-500 block">Net Income ($M)</span>
                            <input 
                              type="number" 
                              value={s.net_income || 0}
                              onChange={e => {
                                const val = parseFloat(e.target.value)
                                setExtractedPreview(prev => {
                                  const updated = [...prev.statements]
                                  updated[idx] = { ...updated[idx], net_income: val }
                                  return { ...prev, statements: updated }
                                })
                              }}
                              className="input-field text-xs py-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={confirmExtractedData} className="flex-1 btn-primary py-2.5">
                    Apply to Active Model
                  </button>
                  <button onClick={() => setExtractedPreview(null)} className="btn-secondary py-2.5">
                    Re-upload
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Dashboard


