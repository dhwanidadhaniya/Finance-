import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const Peers = () => {
  const { company, peersData } = useApp()

  // Dynamic peer data from context or fallback
  const peers = peersData || [
    {
      name: company.name,
      ticker: company.ticker,
      revenueGrowth: 12.3,
      ebitdaMargin: 24.5,
      netMargin: 18.2,
      roe: 22.3,
      roce: 18.5,
      debtEbitda: 2.3,
      pe: 24.5,
      evEbitda: 14.2,
      pb: 4.2,
      fcfYield: 4.8
    },
    {
      name: 'Competitor A',
      ticker: 'COMPA',
      revenueGrowth: 8.5,
      ebitdaMargin: 21.2,
      netMargin: 15.8,
      roe: 18.5,
      roce: 14.2,
      debtEbitda: 3.1,
      pe: 22.0,
      evEbitda: 16.0,
      pb: 5.0,
      fcfYield: 3.5
    },
    {
      name: 'Competitor B',
      ticker: 'COMPB',
      revenueGrowth: 15.2,
      ebitdaMargin: 26.8,
      netMargin: 20.1,
      roe: 25.1,
      roce: 20.3,
      debtEbitda: 1.8,
      pe: 28.5,
      evEbitda: 18.5,
      pb: 6.2,
      fcfYield: 2.8
    },
    {
      name: 'Competitor C',
      ticker: 'COMPC',
      revenueGrowth: 6.8,
      ebitdaMargin: 19.5,
      netMargin: 14.2,
      roe: 16.8,
      roce: 12.5,
      debtEbitda: 3.8,
      pe: 20.5,
      evEbitda: 13.5,
      pb: 3.8,
      fcfYield: 5.2
    }
  ]


  const metrics = [
    { key: 'revenueGrowth', label: 'Revenue Growth %', format: v => v.toFixed(1), higherBetter: true },
    { key: 'ebitdaMargin', label: 'EBITDA Margin %', format: v => v.toFixed(1), higherBetter: true },
    { key: 'netMargin', label: 'Net Margin %', format: v => v.toFixed(1), higherBetter: true },
    { key: 'roe', label: 'ROE %', format: v => v.toFixed(1), higherBetter: true },
    { key: 'roce', label: 'ROCE %', format: v => v.toFixed(1), higherBetter: true },
    { key: 'debtEbitda', label: 'Debt/EBITDA', format: v => v.toFixed(1), higherBetter: false },
    { key: 'pe', label: 'P/E', format: v => v.toFixed(1), higherBetter: false },
    { key: 'evEbitda', label: 'EV/EBITDA', format: v => v.toFixed(1), higherBetter: false },
    { key: 'pb', label: 'P/B', format: v => v.toFixed(1), higherBetter: false },
    { key: 'fcfYield', label: 'FCF Yield %', format: v => v.toFixed(1), higherBetter: true }
  ]

  const getComparison = (value, peerValues, higherBetter) => {
    const avg = peerValues.reduce((a, b) => a + b, 0) / peerValues.length
    const isBetter = higherBetter ? value >= avg : value <= avg
    return {
      status: isBetter ? 'Better' : value === avg ? 'Similar' : 'Worse',
      color: isBetter ? 'text-financial-green' : value === avg ? 'text-graphite-500' : 'text-financial-red',
      icon: isBetter ? TrendingUp : value === avg ? Minus : TrendingDown
    }
  }

  const radarData = metrics.slice(0, 6).map(m => ({
    metric: m.label.split(' ')[0],
    [company.ticker]: peers[0][m.key],
    'Peer Average': peers.slice(1).reduce((sum, p) => sum + p[m.key], 0) / (peers.length - 1)
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Peer Comparison Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-navy-700" />
          <h3 className="text-lg font-semibold text-navy-900">Peer Comparison</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar 
                name={company.ticker} 
                dataKey={company.ticker} 
                stroke="#1e3a8a" 
                fill="#1e3a8a" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar 
                name="Peer Average" 
                dataKey="Peer Average" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-navy-700" />
                <span className="text-sm text-navy-900">{company.ticker}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-financial-green" />
                <span className="text-sm text-navy-900">Peer Average</span>
              </div>
            </div>
            <div className="space-y-2">
              {radarData.map((item, index) => (
                <div key={item.metric} className="flex items-center justify-between text-sm">
                  <span className="text-graphite-600">{item.metric}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-navy-900">{item[company.ticker]?.toFixed(1)}</span>
                    <span className="text-graphite-400">vs</span>
                    <span className="font-medium text-graphite-600">{item['Peer Average']?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Detailed Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-graphite-600">Metric</th>
                {peers.map(peer => (
                  <th key={peer.ticker} className="text-right py-3 px-4 font-semibold text-navy-900">
                    {peer.ticker}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={metric.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-graphite-600">{metric.label}</td>
                  {peers.map((peer, peerIndex) => {
                    const isCompany = peerIndex === 0
                    const comparison = isCompany 
                      ? getComparison(
                          peer[metric.key],
                          peers.slice(1).map(p => p[metric.key]),
                          metric.higherBetter
                        )
                      : null
                    return (
                      <td key={peer.ticker} className={`py-3 px-4 text-right ${isCompany ? 'font-semibold' : ''}`}>
                        <div className="flex items-center justify-end gap-2">
                          {metric.format(peer[metric.key])}
                          {isCompany && (
                            <comparison.icon className={`w-4 h-4 ${comparison.color}`} />
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Valuation Comparison Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Valuation Multiples Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={peers}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="ticker" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="pe" fill="#1e3a8a" name="P/E" />
            <Bar dataKey="evEbitda" fill="#10b981" name="EV/EBITDA" />
            <Bar dataKey="pb" fill="#f59e0b" name="P/B" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Peer Ranking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Peer Ranking</h3>
        <div className="space-y-3">
          {peers.map((peer, index) => {
            const score = (
              (peer.revenueGrowth / 20) * 20 +
              (peer.ebitdaMargin / 30) * 20 +
              (peer.roe / 30) * 20 +
              ((5 - peer.debtEbitda) / 5) * 20 +
              ((30 - peer.pe) / 30) * 20
            )
            return (
              <div key={peer.ticker} className={`flex items-center justify-between p-4 rounded-lg ${
                index === 0 ? 'bg-navy-100 border-2 border-navy-300' : 'bg-slate-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-navy-700 text-white' : 'bg-slate-200 text-navy-900'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{peer.name}</p>
                    <p className="text-sm text-graphite-500">{peer.ticker}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-navy-900">{score.toFixed(0)}</p>
                  <p className="text-xs text-graphite-500">Composite Score</p>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Peers
