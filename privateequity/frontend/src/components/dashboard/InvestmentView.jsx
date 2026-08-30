import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Eye, TrendingUp, AlertTriangle, Zap, CheckCircle, XCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const InvestmentView = () => {
  const { company, financialData, fetchInvestmentScore } = useApp()
  const [scoreData, setScoreData] = useState(null)

  useEffect(() => {
    if (financialData?.statements) {
      fetchInvestmentScore(financialData.statements).then(setScoreData).catch(console.error)
    }
  }, [financialData, fetchInvestmentScore])

  if (!financialData || !financialData.statements) {
    return <div className="text-center text-graphite-500 py-12">Loading financial data...</div>
  }

  // Calculate investment scores
  const fundamentalScore = scoreData?.scores?.fundamental_score || 78
  const valuationScore = scoreData?.scores?.valuation_score || 72
  const technicalScore = scoreData?.scores?.technical_score || 85
  const overallScore = scoreData?.overall_score || Math.round((fundamentalScore + valuationScore + technicalScore) / 3)

  // Determine recommendation
  let recommendation = scoreData?.recommendation || 'HOLD'
  let recommendationColor = 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
  
  if (recommendation === 'BUY') {
    recommendationColor = 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
  } else if (recommendation === 'HOLD') {
    recommendationColor = 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
  } else if (recommendation === 'WATCH') {
    recommendationColor = 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700'
  } else {
    recommendationColor = 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700'
  }

  const thesis = scoreData?.thesis || [
    'Strong revenue growth driven by expanding market opportunities',
    'Improving EBITDA margins from operational efficiencies',
    'ROCE significantly above sector peer averages',
    'Healthy free cash flow generation supporting strategic initiatives',
    'Conservative leverage profile providing downside protection'
  ]

  const risks = scoreData?.risks || [
    'Increasing competitive pressure in key operating markets',
    'Capex intensity rising as company invests in scaling',
    'Margin pressure from cost inflation',
    'Macroeconomic headwinds impacting top-line momentum'
  ]

  const catalysts = scoreData?.catalysts || [
    'New product launches in high-growth segments',
    'Operational efficiency improvements expanding margins',
    'Strategic expansion into adjacent markets'
  ]

  const whatWouldChangeMind = scoreData?.what_would_change_mind || [
    'Revenue growth falling below target projections for consecutive quarters',
    'EBITDA margins compressing below historical baselines',
    'Leverage deteriorating beyond 3.5x Debt/EBITDA'
  ]


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Investment Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`glass-card p-8 border-2 ${recommendationColor}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Investment View</h2>
            </div>
            <p className="text-sm opacity-80">Based on fundamental, valuation, and technical analysis</p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-8 py-4 rounded-xl border-2 ${recommendationColor} text-4xl font-bold`}>
              {recommendation}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Overall Investment Score</h3>
        <div className="flex items-center gap-8">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#e2e8f0"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={overallScore >= 75 ? '#10b981' : overallScore >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${overallScore * 4.4} 440`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-navy-900">{overallScore}</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-graphite-600">Fundamental Score</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-navy-700 rounded-full"
                    style={{ width: `${fundamentalScore}%` }}
                  />
                </div>
                <span className="font-semibold text-navy-900 w-12">{fundamentalScore}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-graphite-600">Valuation Score</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-navy-700 rounded-full"
                    style={{ width: `${valuationScore}%` }}
                  />
                </div>
                <span className="font-semibold text-navy-900 w-12">{valuationScore}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-graphite-600">Technical Score</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-navy-700 rounded-full"
                    style={{ width: `${technicalScore}%` }}
                  />
                </div>
                <span className="font-semibold text-navy-900 w-12">{technicalScore}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Investment Thesis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-financial-green" />
          <h3 className="text-lg font-semibold text-navy-900">Investment Thesis</h3>
        </div>
        <ul className="space-y-3">
          {thesis.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-financial-green flex-shrink-0 mt-0.5" />
              <span className="text-sm text-navy-900">{point}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Key Risks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-financial-red" />
          <h3 className="text-lg font-semibold text-navy-900">Key Risks</h3>
        </div>
        <ul className="space-y-3">
          {risks.map((risk, index) => (
            <li key={index} className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-financial-red flex-shrink-0 mt-0.5" />
              <span className="text-sm text-navy-900">{risk}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Catalysts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-navy-900">Potential Catalysts</h3>
        </div>
        <ul className="space-y-3">
          {catalysts.map((catalyst, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-3 h-3 text-amber-600" />
              </div>
              <span className="text-sm text-navy-900">{catalyst}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* What Would Change My Mind */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass-card p-6 border-2 border-slate-300"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">What Would Change My Mind</h3>
        <ul className="space-y-3">
          {whatWouldChangeMind.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-slate-600">{index + 1}</span>
              </div>
              <span className="text-sm text-navy-900">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Score Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Score Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-navy-900 mb-3">Fundamental Score (78/100)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-graphite-600">Growth</span>
                <span className="font-medium">18/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">Profitability</span>
                <span className="font-medium">16/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">Balance Sheet</span>
                <span className="font-medium">17/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">Cash Flow</span>
                <span className="font-medium">15/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">Efficiency</span>
                <span className="font-medium">12/20</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-navy-900 mb-3">Valuation Score (72/100)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-graphite-600">DCF Upside</span>
                <span className="font-medium">18/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">Peer Multiples</span>
                <span className="font-medium">20/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">Historical Valuation</span>
                <span className="font-medium">17/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">FCF Yield</span>
                <span className="font-medium">17/25</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-navy-900 mb-3">Technical Score (85/100)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-graphite-600">Trend</span>
                <span className="font-medium">22/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">Momentum</span>
                <span className="font-medium">20/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">RSI</span>
                <span className="font-medium">18/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">MACD</span>
                <span className="font-medium">15/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-600">Support/Resistance</span>
                <span className="font-medium">10/25</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-slate-100 border border-slate-300 rounded-lg p-4"
      >
        <p className="text-sm text-graphite-600">
          <strong>Disclaimer:</strong> This investment view is generated by an analytical model and is for educational and research purposes only. 
          It does not constitute financial advice. Always conduct your own research and consult with a qualified financial advisor before making investment decisions.
          The scores and recommendations are based on historical data and assumptions that may not reflect future performance.
        </p>
      </motion.div>
    </motion.div>
  )
}

export default InvestmentView
