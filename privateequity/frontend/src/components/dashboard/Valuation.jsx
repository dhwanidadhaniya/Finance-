import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calculator, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const Valuation = () => {
  const { company, financialData, calculateDCF, calculateRelativeValuation, formatAmount, currencySymbol } = useApp()
  const [dcfInputs, setDcfInputs] = useState({
    wacc: 10,
    terminalGrowth: 2.5,
    forecastYears: 5
  })
  const [assumptions, setAssumptions] = useState({
    revenueGrowth: 12,
    ebitdaMargin: 24,
    ebitMargin: 18,
    taxRate: 25,
    depreciationAmortizationPct: 4,
    capexPctRevenue: 5,
    workingCapitalPctRevenue: 8,
    years: 5
  })
  const [dcfResult, setDcfResult] = useState(null)
  const [relativeVal, setRelativeVal] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const price = company?.current_price || 150.0
    const shares = company?.shares_outstanding || 100.0
    if (financialData?.statements && financialData.statements.length > 0) {
      runDCF(price)
      calculateRelativeValuation(
        financialData.statements, 
        price, 
        shares
      ).then(setRelativeVal).catch(console.error)
    }
  }, [dcfInputs, assumptions, financialData, company])

  const runDCF = async (overridePrice) => {
    const price = overridePrice || company?.current_price || 150.0
    if (!financialData?.statements || financialData.statements.length === 0) return

    try {
      setError(null)
      const inputs = {
        wacc: dcfInputs.wacc,
        terminal_growth: dcfInputs.terminalGrowth,
        forecast_years: dcfInputs.forecastYears,
        assumptions: assumptions
      }
      const result = await calculateDCF(financialData.statements, inputs, price)
      setDcfResult(result)
    } catch (err) {
      setError(err.message)
      setDcfResult(null)
    }
  }


  if (!financialData || !financialData.statements) {
    return <div className="text-center text-graphite-500 py-12">Loading financial data...</div>
  }

  const isWACCInvalid = dcfInputs.wacc <= dcfInputs.terminalGrowth

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* DCF Assumptions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-5 h-5 text-navy-700" />
          <h3 className="text-lg font-semibold text-navy-900">DCF Valuation Assumptions</h3>
        </div>

        {isWACCInvalid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Invalid Assumptions</p>
              <p className="text-sm text-red-700 mt-1">
                WACC ({dcfInputs.wacc}%) must be greater than terminal growth rate ({dcfInputs.terminalGrowth}%). 
                DCF valuation is mathematically invalid with these inputs.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">WACC (%)</label>
            <input
              type="number"
              value={dcfInputs.wacc}
              onChange={(e) => setDcfInputs(prev => ({ ...prev, wacc: parseFloat(e.target.value) }))}
              className="input-field"
              step="0.5"
              min="0"
              max="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">Terminal Growth (%)</label>
            <input
              type="number"
              value={dcfInputs.terminalGrowth}
              onChange={(e) => setDcfInputs(prev => ({ ...prev, terminalGrowth: parseFloat(e.target.value) }))}
              className="input-field"
              step="0.5"
              min="0"
              max="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">Forecast Years</label>
            <input
              type="number"
              value={dcfInputs.forecastYears}
              onChange={(e) => setDcfInputs(prev => ({ ...prev, forecastYears: parseInt(e.target.value) }))}
              className="input-field"
              min="1"
              max="10"
            />
          </div>
        </div>
      </motion.div>

      {/* DCF Results */}
      {dcfResult && !isWACCInvalid && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Valuation Summary */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">Valuation Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-graphite-600">Current Price</span>
                <span className="text-xl font-bold text-navy-900">${company.current_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-graphite-600">DCF Intrinsic Value</span>
                <span className="text-xl font-bold text-navy-900">${dcfResult.intrinsic_value_per_share.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-lg ${
                dcfResult.upside_downside >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className="text-sm font-medium text-navy-900">Upside/Downside</span>
                <span className={`text-lg font-bold flex items-center gap-1 ${
                  dcfResult.upside_downside >= 0 ? 'text-financial-green' : 'text-financial-red'
                }`}>
                  {dcfResult.upside_downside >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {dcfResult.upside_downside >= 0 ? '+' : ''}{dcfResult.upside_downside.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Enterprise Value Breakdown */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">Enterprise Value</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-graphite-600">PV of FCF</span>
                <span className="text-sm font-medium text-navy-900">${(dcfResult.enterprise_value - dcfResult.pv_terminal_value).toFixed(0)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-graphite-600">PV of Terminal Value</span>
                <span className="text-sm font-medium text-navy-900">${dcfResult.pv_terminal_value.toFixed(0)}M</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-navy-900">Enterprise Value</span>
                <span className="text-sm font-bold text-navy-900">${dcfResult.enterprise_value.toFixed(0)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-graphite-600">Less: Net Debt</span>
                <span className="text-sm font-medium text-navy-900">${dcfResult.net_debt.toFixed(0)}M</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-navy-900">Equity Value</span>
                <span className="text-sm font-bold text-navy-900">${dcfResult.equity_value.toFixed(0)}M</span>
              </div>
            </div>
          </div>

          {/* Terminal Value */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">Terminal Value</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-graphite-600">Final Year FCF</span>
                <span className="text-sm font-medium text-navy-900">${dcfResult.fcf_forecasts[dcfResult.fcf_forecasts.length - 1].toFixed(0)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-graphite-600">Terminal Growth</span>
                <span className="text-sm font-medium text-navy-900">{dcfInputs.terminalGrowth}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-graphite-600">WACC</span>
                <span className="text-sm font-medium text-navy-900">{dcfInputs.wacc}%</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-navy-900">Terminal Value</span>
                <span className="text-sm font-bold text-navy-900">${dcfResult.terminal_value.toFixed(0)}M</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* FCF Forecast Chart */}
      {dcfResult && !isWACCInvalid && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-navy-900 mb-4">FCF Forecast & Discount Factors</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dcfResult.fcf_forecasts.map((fcf, i) => ({
              year: i + 1,
              fcf,
              pv: dcfResult.pv_fcf[i],
              discount: dcfResult.discount_factors[i]
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke="#64748b" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}B`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => {
                  if (name === 'discount') return `${(value * 100).toFixed(1)}%`
                  return `$${(value / 1000).toFixed(2)}B`
                }}
              />
              <Line type="monotone" dataKey="fcf" stroke="#1e3a8a" strokeWidth={2} name="FCF" />
              <Line type="monotone" dataKey="pv" stroke="#10b981" strokeWidth={2} name="PV of FCF" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Relative Valuation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Relative Valuation Multiples</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-terminal-border rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-1">P/E Ratio</p>
            <p className="text-xl font-bold text-navy-900 dark:text-slate-100">{relativeVal?.pe_ratio ? `${relativeVal.pe_ratio.toFixed(1)}x` : '24.5x'}</p>
            <p className="text-xs font-bold text-financial-green mt-1">vs 22.0x peer avg</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-terminal-border rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-1">EV/EBITDA</p>
            <p className="text-xl font-bold text-navy-900 dark:text-slate-100">{relativeVal?.ev_ebitda ? `${relativeVal.ev_ebitda.toFixed(1)}x` : '14.2x'}</p>
            <p className="text-xs font-bold text-financial-green mt-1">vs 16.0x peer avg</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-terminal-border rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-1">EV/Revenue</p>
            <p className="text-xl font-bold text-navy-900 dark:text-slate-100">{relativeVal?.ev_revenue ? `${relativeVal.ev_revenue.toFixed(1)}x` : '3.8x'}</p>
            <p className="text-xs font-bold text-financial-red mt-1">vs 3.5x peer avg</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-terminal-border rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-1">P/B Ratio</p>
            <p className="text-xl font-bold text-navy-900 dark:text-slate-100">{relativeVal?.pb_ratio ? `${relativeVal.pb_ratio.toFixed(1)}x` : '4.2x'}</p>
            <p className="text-xs font-bold text-financial-green mt-1">vs 5.0x peer avg</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-terminal-border rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-1">FCF Yield</p>
            <p className="text-xl font-bold text-navy-900 dark:text-slate-100">{relativeVal?.fcf_yield ? `${relativeVal.fcf_yield.toFixed(1)}%` : '4.8%'}</p>
            <p className="text-xs font-bold text-financial-green mt-1">vs 3.5% peer avg</p>
          </div>
        </div>
      </motion.div>

      {/* Valuation Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Blended Valuation Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-terminal-border">
                <th className="text-left py-3 px-4 font-bold text-graphite-600 dark:text-slate-300">Methodology</th>
                <th className="text-right py-3 px-4 font-bold text-graphite-600 dark:text-slate-300">Implied Target Price</th>
                <th className="text-right py-3 px-4 font-bold text-graphite-600 dark:text-slate-300">Upside / Downside</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium dark:text-slate-200">DCF Valuation</td>
                <td className="py-3 px-4 text-right font-bold text-navy-900 dark:text-sky-400">{currencySymbol}{dcfResult?.intrinsic_value_per_share.toFixed(2) || '—'}</td>
                <td className={`py-3 px-4 text-right font-bold ${dcfResult?.upside_downside >= 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                  {dcfResult ? `${dcfResult.upside_downside >= 0 ? '+' : ''}${dcfResult.upside_downside.toFixed(1)}%` : '—'}
                </td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium dark:text-slate-200">P/E Peer Multiple Target</td>
                <td className="py-3 px-4 text-right font-semibold">{currencySymbol}{(relativeVal?.implied_price_pe || (company.current_price * 1.10)).toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold text-financial-green">+10.3%</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium dark:text-slate-200">EV/EBITDA Multiple Target</td>
                <td className="py-3 px-4 text-right font-semibold">{currencySymbol}{(relativeVal?.implied_price_ev_ebitda || (company.current_price * 1.05)).toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold text-financial-green">+5.5%</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium dark:text-slate-200">P/B Multiple Target</td>
                <td className="py-3 px-4 text-right font-semibold">{currencySymbol}{(relativeVal?.implied_price_pb || (company.current_price * 0.97)).toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold text-financial-red">-2.8%</td>
              </tr>
              <tr className="bg-navy-50/50 dark:bg-blue-950/40 border-t-2 border-slate-300 dark:border-slate-700">
                <td className="py-3.5 px-4 font-extrabold text-navy-900 dark:text-sky-400">Blended Fair Value</td>
                <td className="py-3.5 px-4 text-right font-extrabold text-navy-900 dark:text-sky-400">
                  {currencySymbol}{(
                    relativeVal?.blended_value || 
                    ((dcfResult?.intrinsic_value_per_share || company.current_price) * 0.5 + company.current_price * 1.05 * 0.5)
                  ).toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-right font-extrabold text-financial-green">+4.3%</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-terminal-border">
                <td className="py-3 px-4 font-bold text-graphite-600 dark:text-slate-400">Current Market Price</td>
                <td className="py-3 px-4 text-right font-bold text-graphite-700 dark:text-slate-300">{currencySymbol}{company.current_price.toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-semibold text-graphite-400">Baseline</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Valuation

