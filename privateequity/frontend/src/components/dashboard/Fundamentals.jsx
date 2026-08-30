import { motion } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useState, useEffect } from 'react'

const Fundamentals = () => {
  const { financialData, calculateFundamentals } = useApp()
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    if (financialData?.statements) {
      calculateFundamentals(financialData.statements).then(setMetrics).catch(console.error)
    }
  }, [financialData, calculateFundamentals])

  if (!financialData || !financialData.statements) {
    return <div className="text-center text-graphite-500 py-12">Loading financial data...</div>
  }

  const current = financialData.statements[0]
  const chartData = financialData.statements.slice().reverse().map(s => ({
    year: s.year,
    revenue: s.revenue,
    ebitda: s.ebitda,
    netIncome: s.net_income,
    eps: s.eps,
    grossMargin: ((s.gross_profit / s.revenue) * 100).toFixed(1),
    ebitdaMargin: ((s.ebitda / s.revenue) * 100).toFixed(1),
    netMargin: ((s.net_income / s.revenue) * 100).toFixed(1)
  }))

  // Financial DNA data for radar chart
  const radarData = [
    { metric: 'Growth', value: 85 },
    { metric: 'Profitability', value: 78 },
    { metric: 'Cash Flow', value: 72 },
    { metric: 'Balance Sheet', value: 88 },
    { metric: 'Valuation', value: 65 },
    { metric: 'Momentum', value: 70 }
  ]

  const fundamentalMetrics = metrics || {
    revenue_growth: 12.3,
    ebitda_growth: 8.7,
    net_income_growth: 15.2,
    gross_margin: 45.2,
    ebitda_margin: 23.4,
    net_profit_margin: 18.5,
    roe: 22.3,
    roa: 12.8,
    roce: 18.5,
    current_ratio: 2.1,
    debt_ebitda: 2.3,
    fcf_margin: 8.5
  }

  const renderMetric = (label, value, unit = '', benchmark = null, higherIsBetter = true) => {
    const isPositive = benchmark 
      ? higherIsBetter ? value >= benchmark : value <= benchmark
      : value >= 0
    
    return (
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <span className="text-sm text-graphite-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-navy-900">
            {value?.toFixed(1)}{unit}
          </span>
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 text-financial-green" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-financial-red" />
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Financial DNA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Financial DNA</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar 
                name="Score" 
                dataKey="value" 
                stroke="#1e3a8a" 
                fill="#1e3a8a" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {radarData.map((item, index) => (
              <div key={item.metric} className="flex items-center justify-between">
                <span className="text-sm text-graphite-600">{item.metric}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-navy-700 rounded-full transition-all duration-500"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-navy-900 w-8">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Growth Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Growth Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderMetric('Revenue Growth', fundamentalMetrics.revenue_growth, '%', 10, true)}
          {renderMetric('EBITDA Growth', fundamentalMetrics.ebitda_growth, '%', 8, true)}
          {renderMetric('Net Income Growth', fundamentalMetrics.net_income_growth, '%', 12, true)}
          {renderMetric('EPS Growth', fundamentalMetrics.eps_growth || 14.5, '%', 10, true)}
        </div>
      </motion.div>

      {/* Profitability Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Profitability Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {renderMetric('Gross Margin', fundamentalMetrics.gross_margin, '%', 40, true)}
          {renderMetric('EBITDA Margin', fundamentalMetrics.ebitda_margin, '%', 20, true)}
          {renderMetric('Net Margin', fundamentalMetrics.net_profit_margin, '%', 15, true)}
          {renderMetric('ROCE', fundamentalMetrics.roce, '%', 15, true)}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Line type="monotone" dataKey="grossMargin" stroke="#1e3a8a" name="Gross Margin %" strokeWidth={2} />
            <Line type="monotone" dataKey="ebitdaMargin" stroke="#10b981" name="EBITDA Margin %" strokeWidth={2} />
            <Line type="monotone" dataKey="netMargin" stroke="#f59e0b" name="Net Margin %" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Return Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Return Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderMetric('ROE', fundamentalMetrics.roe, '%', 15, true)}
          {renderMetric('ROA', fundamentalMetrics.roa, '%', 10, true)}
          {renderMetric('ROCE', fundamentalMetrics.roce, '%', 15, true)}
          {renderMetric('Asset Turnover', fundamentalMetrics.asset_turnover || 0.8, 'x', 1.0, true)}
        </div>
      </motion.div>

      {/* Liquidity & Leverage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">Liquidity</h3>
          <div className="space-y-3">
            {renderMetric('Current Ratio', fundamentalMetrics.current_ratio, 'x', 1.5, true)}
            {renderMetric('Quick Ratio', fundamentalMetrics.quick_ratio || 1.2, 'x', 1.0, true)}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">Leverage</h3>
          <div className="space-y-3">
            {renderMetric('Debt/EBITDA', fundamentalMetrics.debt_ebitda, 'x', 3.0, false)}
            {renderMetric('Net Debt/EBITDA', fundamentalMetrics.net_debt_ebitda || 1.8, 'x', 2.5, false)}
            {renderMetric('Interest Coverage', fundamentalMetrics.interest_coverage || 5.2, 'x', 3.0, true)}
          </div>
        </div>
      </motion.div>

      {/* Cash Flow Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Cash Flow Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderMetric('FCF Margin', fundamentalMetrics.fcf_margin, '%', 8, true)}
          {renderMetric('FCF Conversion', fundamentalMetrics.fcf_conversion || 85, '%', 80, true)}
          {renderMetric('Capex Intensity', fundamentalMetrics.capex_intensity || 4.5, '%', 6, false)}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Fundamentals
