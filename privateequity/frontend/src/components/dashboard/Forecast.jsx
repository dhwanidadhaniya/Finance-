import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Save, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../../context/AppContext'

const Forecast = () => {
  const { financialData } = useApp()
  const [assumptions, setAssumptions] = useState({
    revenueGrowth: 12,
    ebitdaMargin: 24,
    ebitMargin: 18,
    taxRate: 25,
    depreciationAmortization: 4,
    capexPercent: 5,
    workingCapitalPercent: 8,
    years: 5
  })

  if (!financialData || !financialData.statements) {
    return <div className="text-center text-graphite-500 py-12">Loading financial data...</div>
  }

  const current = financialData.statements[0]
  
  // Generate forecast data
  const forecastData = []
  const historicalData = financialData.statements.slice().reverse()
  
  let baseRevenue = current.revenue
  for (let i = 0; i < assumptions.years; i++) {
    const year = 2024 + i
    const revenue = baseRevenue * (1 + assumptions.revenueGrowth / 100)
    const ebitda = revenue * (assumptions.ebitdaMargin / 100)
    const ebit = revenue * (assumptions.ebitMargin / 100)
    const netIncome = ebit * (1 - assumptions.taxRate / 100)
    const fcf = netIncome + (revenue * assumptions.depreciationAmortization / 100) - (revenue * assumptions.capexPercent / 100)
    
    forecastData.push({
      year,
      revenue,
      ebitda,
      netIncome,
      fcf,
      isForecast: true
    })
    
    baseRevenue = revenue
  }

  const allData = [...historicalData.map(d => ({ ...d, isForecast: false })), ...forecastData]

  const handleAssumptionChange = (key, value) => {
    setAssumptions(prev => ({ ...prev, [key]: parseFloat(value) }))
  }

  const resetAssumptions = () => {
    setAssumptions({
      revenueGrowth: 12,
      ebitdaMargin: 24,
      ebitMargin: 18,
      taxRate: 25,
      depreciationAmortization: 4,
      capexPercent: 5,
      workingCapitalPercent: 8,
      years: 5
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Assumptions Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-navy-900">Forecast Assumptions</h3>
          <button
            onClick={resetAssumptions}
            className="flex items-center gap-2 px-3 py-2 text-sm text-navy-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">Revenue Growth (%)</label>
            <input
              type="number"
              value={assumptions.revenueGrowth}
              onChange={(e) => handleAssumptionChange('revenueGrowth', e.target.value)}
              className="input-field"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">EBITDA Margin (%)</label>
            <input
              type="number"
              value={assumptions.ebitdaMargin}
              onChange={(e) => handleAssumptionChange('ebitdaMargin', e.target.value)}
              className="input-field"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">EBIT Margin (%)</label>
            <input
              type="number"
              value={assumptions.ebitMargin}
              onChange={(e) => handleAssumptionChange('ebitMargin', e.target.value)}
              className="input-field"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              value={assumptions.taxRate}
              onChange={(e) => handleAssumptionChange('taxRate', e.target.value)}
              className="input-field"
              step="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">D&A (% of Revenue)</label>
            <input
              type="number"
              value={assumptions.depreciationAmortization}
              onChange={(e) => handleAssumptionChange('depreciationAmortization', e.target.value)}
              className="input-field"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">Capex (% of Revenue)</label>
            <input
              type="number"
              value={assumptions.capexPercent}
              onChange={(e) => handleAssumptionChange('capexPercent', e.target.value)}
              className="input-field"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">Working Capital (% of Revenue)</label>
            <input
              type="number"
              value={assumptions.workingCapitalPercent}
              onChange={(e) => handleAssumptionChange('workingCapitalPercent', e.target.value)}
              className="input-field"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-600 mb-2">Forecast Years</label>
            <input
              type="number"
              value={assumptions.years}
              onChange={(e) => handleAssumptionChange('years', e.target.value)}
              className="input-field"
              min="1"
              max="10"
            />
          </div>
        </div>
      </motion.div>

      {/* Forecast Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Revenue Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={allData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" stroke="#64748b" />
            <YAxis stroke="#64748b" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}B`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
              formatter={(value) => `$${(value / 1000).toFixed(2)}B`}
 />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#1e3a8a" 
              strokeWidth={2}
              name="Revenue"
              dot={(props) => {
                if (props.payload.isForecast) {
                  return <circle {...props} r={4} fill="#1e3a8a" fillOpacity={0.5} />
                }
                return <circle {...props} r={4} fill="#1e3a8a" />
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">EBITDA Forecast</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={allData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}B`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value) => `$${(value / 1000).toFixed(2)}B`}
              />
              <Line 
                type="monotone" 
                dataKey="ebitda" 
                stroke="#10b981" 
                strokeWidth={2}
                name="EBITDA"
                dot={(props) => {
                  if (props.payload.isForecast) {
                    return <circle {...props} r={4} fill="#10b981" fillOpacity={0.5} />
                  }
                  return <circle {...props} r={4} fill="#10b981" />
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">Free Cash Flow Forecast</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={allData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}B`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value) => `$${(value / 1000).toFixed(2)}B`}
              />
              <Line 
                type="monotone" 
                dataKey="fcf" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Free Cash Flow"
                dot={(props) => {
                  if (props.payload.isForecast) {
                    return <circle {...props} r={4} fill="#f59e0b" fillOpacity={0.5} />
                  }
                  return <circle {...props} r={4} fill="#f59e0b" />
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Forecast Summary Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Forecast Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-graphite-600">Year</th>
                <th className="text-right py-3 px-4 font-semibold text-graphite-600">Revenue</th>
                <th className="text-right py-3 px-4 font-semibold text-graphite-600">EBITDA</th>
                <th className="text-right py-3 px-4 font-semibold text-graphite-600">Net Income</th>
                <th className="text-right py-3 px-4 font-semibold text-graphite-600">FCF</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((row, index) => (
                <tr key={row.year} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{row.year}</td>
                  <td className="py-3 px-4 text-right">${(row.revenue / 1000).toFixed(2)}B</td>
                  <td className="py-3 px-4 text-right">${(row.ebitda / 1000).toFixed(2)}B</td>
                  <td className="py-3 px-4 text-right">${(row.netIncome / 1000).toFixed(2)}B</td>
                  <td className="py-3 px-4 text-right">${(row.fcf / 1000).toFixed(2)}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Forecast
