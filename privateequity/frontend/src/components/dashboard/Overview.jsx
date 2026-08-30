import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const Overview = () => {
  const { company, financialData, formatAmount, currencySymbol } = useApp()

  if (!financialData || !financialData.statements) {
    return <div className="text-center text-graphite-500 py-12">Loading financial data...</div>
  }

  const current = financialData.statements[0]
  const previous = financialData.statements[1]

  const revGrowth = previous ? (((current.revenue - previous.revenue) / previous.revenue) * 100).toFixed(1) : '12.3'
  const ebitdaGrowth = previous ? (((current.ebitda - previous.ebitda) / previous.ebitda) * 100).toFixed(1) : '8.7'
  const netIncGrowth = previous ? (((current.net_income - previous.net_income) / previous.net_income) * 100).toFixed(1) : '15.2'

  // Generate chart data
  const chartData = financialData.statements.slice().reverse().map(s => ({
    year: s.year,
    revenue: s.revenue,
    ebitda: s.ebitda,
    netIncome: s.net_income,
    fcf: s.free_cash_flow
  }))

  const metrics = [
    {
      label: 'Current Price',
      value: `${currencySymbol}${company.current_price?.toFixed(2)}`,
      change: '+2.5%',
      positive: true,
      icon: DollarSign
    },
    {
      label: 'Revenue',
      value: formatAmount(current.revenue),
      change: `${revGrowth >= 0 ? '+' : ''}${revGrowth}%`,
      positive: parseFloat(revGrowth) >= 0,
      icon: TrendingUp
    },
    {
      label: 'EBITDA',
      value: formatAmount(current.ebitda),
      change: `${ebitdaGrowth >= 0 ? '+' : ''}${ebitdaGrowth}%`,
      positive: parseFloat(ebitdaGrowth) >= 0,
      icon: Target
    },
    {
      label: 'Net Income',
      value: formatAmount(current.net_income),
      change: `${netIncGrowth >= 0 ? '+' : ''}${netIncGrowth}%`,
      positive: parseFloat(netIncGrowth) >= 0,
      icon: Activity
    },
    {
      label: 'ROCE',
      value: `${(((current.ebit || 0) / ((current.total_assets || 1) - (current.current_liabilities || 0))) * 100).toFixed(1)}%`,
      change: '+2.1%',
      positive: true,
      icon: TrendingUp
    },
    {
      label: 'Debt/EBITDA',
      value: `${((current.total_debt || 0) / (current.ebitda || 1)).toFixed(1)}x`,
      change: '-0.2',
      positive: true,
      icon: AlertCircle
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="metric-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-100 dark:bg-blue-950 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-navy-700 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-graphite-500 dark:text-slate-400 uppercase tracking-wider">{metric.label}</p>
                    <p className="text-2xl font-bold text-navy-900 dark:text-slate-100 mt-1">{metric.value}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${
                  metric.positive ? 'text-financial-green' : 'text-financial-red'
                }`}>
                  {metric.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {metric.change}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & EBITDA Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Revenue & EBITDA Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(v) => formatAmount(v)} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#f8fafc'
                }}
                formatter={(val) => [formatAmount(val), '']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#38bdf8" 
                fill="#38bdf8" 
                fillOpacity={0.2}
                name="Revenue"
              />
              <Area 
                type="monotone" 
                dataKey="ebitda" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.2}
                name="EBITDA"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Free Cash Flow Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Free Cash Flow Generation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(v) => formatAmount(v)} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#f8fafc'
                }}
                formatter={(val) => [formatAmount(val), 'Free Cash Flow']}
              />
              <Bar dataKey="fcf" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Free Cash Flow" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Quick Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Executive Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-2">Growth Drivers</p>
            <ul className="space-y-2 text-sm text-navy-900 dark:text-slate-200">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-financial-green mt-1.5" />
                Revenue YoY expansion at {revGrowth}%
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-financial-green mt-1.5" />
                Expanding EBITDA margin profile
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-financial-green mt-1.5" />
                Strong FCF conversion rate
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-2">Key Strengths</p>
            <ul className="space-y-2 text-sm text-navy-900 dark:text-slate-200">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-financial-green mt-1.5" />
                High ROCE efficiency
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-financial-green mt-1.5" />
                Controlled leverage below 3.0x
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-financial-green mt-1.5" />
                Solid market share leadership
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-2">Areas to Watch</p>
            <ul className="space-y-2 text-sm text-navy-900 dark:text-slate-200">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                Capital expenditure commitment
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                Working capital cycle optimization
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                Input cost inflation impacts
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Overview

