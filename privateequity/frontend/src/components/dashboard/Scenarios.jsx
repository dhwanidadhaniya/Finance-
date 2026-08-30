import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

const Scenarios = () => {
  const { company, financialData, generateScenarios, currencySymbol, unitMode } = useApp()
  const [scenarios, setScenarios] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState('Base')

  const baseAssumptions = {
    revenue_growth: 12,
    ebitda_margin: 24,
    ebit_margin: 18,
    tax_rate: 25,
    depreciation_amortization_pct: 4,
    capex_pct_revenue: 5,
    working_capital_pct_revenue: 8,
    years: 5
  }

  const baseDcfInputs = {
    wacc: 10,
    terminal_growth: 2.5,
    forecast_years: 5,
    assumptions: baseAssumptions
  }

  useEffect(() => {
    const currentPrice = company?.current_price || 150.0
    if (financialData?.statements && financialData.statements.length > 0) {
      generateScenarios(
        financialData.statements,
        baseAssumptions,
        baseDcfInputs,
        currentPrice
      ).then(setScenarios).catch(console.error)
    }
  }, [financialData, company, generateScenarios])

  if (!financialData || !financialData.statements) {
    return <div className="text-center text-graphite-500 py-12">Loading financial data...</div>
  }

  const scenarioColors = {
    Bull: { bg: 'bg-green-50 dark:bg-emerald-950/40', border: 'border-green-200 dark:border-emerald-800', text: 'text-green-900 dark:text-emerald-300', accent: '#10b981' },
    Base: { bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-sky-300', accent: '#1e3a8a' },
    Bear: { bg: 'bg-red-50 dark:bg-rose-950/40', border: 'border-red-200 dark:border-rose-800', text: 'text-red-900 dark:text-rose-300', accent: '#ef4444' }
  }

  const currentScenario = scenarios?.find(s => s.name === selectedScenario)

  // Generate chart data reliably from scenarios by name
  const generateChartData = () => {
    if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) return []
    
    const bullScen = scenarios.find(s => s.name === 'Bull') || scenarios[0]
    const baseScen = scenarios.find(s => s.name === 'Base') || scenarios[1] || scenarios[0]
    const bearScen = scenarios.find(s => s.name === 'Bear') || scenarios[2] || scenarios[0]

    const baseYear = financialData?.statements?.[0]?.year || 2024
    const years = Array.from({ length: 5 }, (_, i) => baseYear + 1 + i)

    return years.map((year, i) => ({
      year: `FY${year}`,
      Bull: bullScen?.revenue?.[i] ?? 0,
      Base: baseScen?.revenue?.[i] ?? 0,
      Bear: bearScen?.revenue?.[i] ?? 0
    }))
  }

  const chartData = generateChartData()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Scenario Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-3"
      >
        {['Bull', 'Base', 'Bear'].map(scenario => (
          <button
            key={scenario}
            onClick={() => setSelectedScenario(scenario)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              selectedScenario === scenario
                ? `${scenarioColors[scenario].bg} ${scenarioColors[scenario].border} ${scenarioColors[scenario].text} border-2`
                : 'bg-white dark:bg-terminal-card border-slate-200 dark:border-terminal-border text-navy-900 dark:text-slate-100 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {scenario === 'Bull' && <TrendingUp className="w-5 h-5" />}
              {scenario === 'Bear' && <TrendingDown className="w-5 h-5" />}
              {scenario === 'Base' && <Minus className="w-5 h-5" />}
              <span className="font-semibold">{scenario}</span>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Scenario Comparison Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {scenarios?.map((scenario) => {
          const colors = scenarioColors[scenario.name] || scenarioColors.Base
          const intrinsicVal = scenario.intrinsic_share_price ?? scenario.intrinsicSharePrice ?? 0
          const upsideVal = scenario.upside_downside ?? scenario.upsideDownside ?? 0
          return (
            <div
              key={scenario.name}
              className={`glass-card p-6 border-2 ${colors.border} ${selectedScenario === scenario.name ? 'ring-2 ring-offset-2' : ''}`}
              style={{ ringColor: colors.accent }}
            >
              <div className="flex items-center gap-2 mb-4">
                {scenario.name === 'Bull' && <TrendingUp className={`w-5 h-5 ${colors.text}`} />}
                {scenario.name === 'Bear' && <TrendingDown className={`w-5 h-5 ${colors.text}`} />}
                {scenario.name === 'Base' && <Minus className={`w-5 h-5 ${colors.text}`} />}
                <h3 className={`text-lg font-semibold ${colors.text}`}>{scenario.name} Case</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-graphite-600 dark:text-slate-300">Intrinsic Value</span>
                  <span className="font-semibold text-navy-900 dark:text-slate-100">{currencySymbol}{intrinsicVal.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between p-2 rounded ${upsideVal >= 0 ? 'bg-green-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-rose-950/40'}`}>
                  <span className="text-sm text-graphite-600 dark:text-slate-300">Upside/Downside</span>
                  <span className={`font-semibold ${upsideVal >= 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                    {upsideVal >= 0 ? '+' : ''}{upsideVal.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-graphite-600 dark:text-slate-300">Revenue CAGR</span>
                  <span className="font-medium text-navy-900 dark:text-slate-100">{(scenario.assumptions?.revenue_growth ?? scenario.assumptions?.revenueGrowth ?? 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-graphite-600 dark:text-slate-300">EBITDA Margin</span>
                  <span className="font-medium text-navy-900 dark:text-slate-100">{(scenario.assumptions?.ebitda_margin ?? scenario.assumptions?.ebitdaMargin ?? 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-graphite-600 dark:text-slate-300">WACC</span>
                  <span className="font-medium text-navy-900 dark:text-slate-100">{(scenario.dcf_inputs?.wacc ?? 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Scenario Comparison Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 dark:text-slate-100 mb-4">Revenue Forecast Comparison</h3>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis 
                stroke="#64748b" 
                tickFormatter={(val) => `${currencySymbol}${unitMode === 'B' ? (val / 1000).toFixed(1) + 'B' : val >= 1000 ? (val / 1000).toFixed(1) + 'B' : val.toFixed(0) + 'M'}`} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(val) => [`${currencySymbol}${unitMode === 'B' ? (val / 1000).toFixed(2) + 'B' : val.toFixed(2) + 'M'}`, '']}
              />
              <Legend />
              <Line type="monotone" dataKey="Bull" stroke="#10b981" strokeWidth={2} name="Bull Case" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="Base" stroke="#1e3a8a" strokeWidth={3} name="Base Case" />
              <Line type="monotone" dataKey="Bear" stroke="#ef4444" strokeWidth={2} name="Bear Case" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Detailed Scenario Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 dark:text-slate-100 mb-4">Scenario Comparison Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-terminal-border">
                <th className="text-left py-3 px-4 font-semibold text-graphite-600 dark:text-slate-300">Metric</th>
                {scenarios?.map(s => (
                  <th key={s.name} className={`text-right py-3 px-4 font-semibold ${scenarioColors[s.name]?.text || 'text-navy-900'}`}>
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-slate-300">Revenue Growth</td>
                {scenarios?.map(s => (
                  <td key={s.name} className="py-3 px-4 text-right">{(s.assumptions?.revenue_growth ?? s.assumptions?.revenueGrowth ?? 0).toFixed(1)}%</td>
                ))}
              </tr>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-slate-300">EBITDA Margin</td>
                {scenarios?.map(s => (
                  <td key={s.name} className="py-3 px-4 text-right">{(s.assumptions?.ebitda_margin ?? s.assumptions?.ebitdaMargin ?? 0).toFixed(1)}%</td>
                ))}
              </tr>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-slate-300">Tax Rate</td>
                {scenarios?.map(s => (
                  <td key={s.name} className="py-3 px-4 text-right">{(s.assumptions?.tax_rate ?? s.assumptions?.taxRate ?? 0).toFixed(1)}%</td>
                ))}
              </tr>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-slate-300">WACC</td>
                {scenarios?.map(s => (
                  <td key={s.name} className="py-3 px-4 text-right">{(s.dcf_inputs?.wacc ?? 0).toFixed(1)}%</td>
                ))}
              </tr>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-slate-300">Terminal Growth</td>
                {scenarios?.map(s => (
                  <td key={s.name} className="py-3 px-4 text-right">{(s.dcf_inputs?.terminal_growth ?? s.dcf_inputs?.terminalGrowth ?? 0).toFixed(1)}%</td>
                ))}
              </tr>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-slate-300">Enterprise Value</td>
                {scenarios?.map(s => (
                  <td key={s.name} className="py-3 px-4 text-right">
                    {currencySymbol}{unitMode === 'B' ? ((s.enterprise_value ?? 0) / 1000).toFixed(2) + 'B' : (s.enterprise_value ?? 0).toFixed(0) + 'M'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100 dark:border-terminal-border">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-slate-300">Equity Value</td>
                {scenarios?.map(s => (
                  <td key={s.name} className="py-3 px-4 text-right">
                    {currencySymbol}{unitMode === 'B' ? ((s.equity_value ?? 0) / 1000).toFixed(2) + 'B' : (s.equity_value ?? 0).toFixed(0) + 'M'}
                  </td>
                ))}
              </tr>
              <tr className="bg-navy-50 dark:bg-terminal-border">
                <td className="py-3 px-4 font-semibold text-navy-900 dark:text-slate-100">Intrinsic Value/Share</td>
                {scenarios?.map(s => (
                  <td key={s.name} className="py-3 px-4 text-right font-bold text-navy-900 dark:text-slate-100">
                    {currencySymbol}{(s.intrinsic_share_price ?? s.intrinsicSharePrice ?? 0).toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-navy-900 dark:text-slate-100">Upside/Downside</td>
                {scenarios?.map(s => {
                  const val = s.upside_downside ?? s.upsideDownside ?? 0
                  return (
                    <td key={s.name} className={`py-3 px-4 text-right font-bold ${val >= 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                      {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Scenario Assumptions Detail */}
      {currentScenario && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={`glass-card p-6 border-2 ${scenarioColors[selectedScenario]?.border || 'border-slate-200'}`}
        >
          <h3 className="text-lg font-semibold text-navy-900 dark:text-slate-100 mb-4">
            {selectedScenario} Case Assumptions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">Revenue Growth</p>
              <p className="text-lg font-bold text-navy-900 dark:text-slate-100">{(currentScenario.assumptions?.revenue_growth ?? currentScenario.assumptions?.revenueGrowth ?? 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">EBITDA Margin</p>
              <p className="text-lg font-bold text-navy-900 dark:text-slate-100">{(currentScenario.assumptions?.ebitda_margin ?? currentScenario.assumptions?.ebitdaMargin ?? 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">EBIT Margin</p>
              <p className="text-lg font-bold text-navy-900 dark:text-slate-100">{(currentScenario.assumptions?.ebit_margin ?? currentScenario.assumptions?.ebitMargin ?? 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">Tax Rate</p>
              <p className="text-lg font-bold text-navy-900 dark:text-slate-100">{(currentScenario.assumptions?.tax_rate ?? currentScenario.assumptions?.taxRate ?? 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">D&A (% Revenue)</p>
              <p className="text-lg font-bold text-navy-900 dark:text-slate-100">{(currentScenario.assumptions?.depreciation_amortization_pct ?? currentScenario.assumptions?.depreciationAmortizationPct ?? 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">Capex (% Revenue)</p>
              <p className="text-lg font-bold text-navy-900 dark:text-slate-100">{(currentScenario.assumptions?.capex_pct_revenue ?? currentScenario.assumptions?.capexPctRevenue ?? 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">Working Capital (% Revenue)</p>
              <p className="text-lg font-bold text-navy-900 dark:text-slate-100">{(currentScenario.assumptions?.working_capital_pct_revenue ?? currentScenario.assumptions?.workingCapitalPctRevenue ?? 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">WACC</p>
              <p className="text-lg font-bold text-navy-900 dark:text-slate-100">{(currentScenario.dcf_inputs?.wacc ?? 0).toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>
      )}

    </motion.div>
  )
}

export default Scenarios
