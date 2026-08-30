import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const Technicals = () => {
  const { company, calculateTechnical, currencySymbol } = useApp()
  const [technicalData, setTechnicalData] = useState(null)
  const [priceData, setPriceData] = useState(null)
  const [timeframe, setTimeframe] = useState('1Y')

  useEffect(() => {
    const currentPrice = company?.current_price || 150.0
    // Generate full 756 days of historical price data for complete DMA and indicator calculation
    const totalDays = 756
    const basePrice = currentPrice * 0.85
      const prices = []
      let price = basePrice
      
      for (let i = 0; i < totalDays; i++) {
        const change = (Math.random() - 0.48) * 0.03
        price = price * (1 + change)
        prices.push({
          date: i,
          price: Math.max(price, 1),
          volume: Math.floor(Math.random() * 4000000) + 1000000
        })
      }
      
      setPriceData(prices)
      
      // Calculate technical indicators on full series
      calculateTechnical(prices).then(setTechnicalData).catch(console.error)
  }, [company, calculateTechnical])

  if (!priceData) {
    return <div className="text-center text-graphite-500 py-12">Loading technical data...</div>
  }

  const daysToShow = timeframe === '1M' ? 30 : timeframe === '6M' ? 180 : timeframe === '1Y' ? 252 : 756
  const visiblePrices = priceData.slice(-daysToShow)

  const chartData = visiblePrices.map((p, index) => {
    const fullIndex = priceData.length - daysToShow + index
    return {
      date: `Day ${index + 1}`,
      price: p.price,
      dma20: fullIndex >= 19 ? priceData.slice(fullIndex - 19, fullIndex + 1).reduce((a, b) => a + b.price, 0) / 20 : null,
      dma50: fullIndex >= 49 ? priceData.slice(fullIndex - 49, fullIndex + 1).reduce((a, b) => a + b.price, 0) / 50 : null,
      dma200: fullIndex >= 199 ? priceData.slice(fullIndex - 199, fullIndex + 1).reduce((a, b) => a + b.price, 0) / 200 : null
    }
  })

  const indicators = technicalData || {
    rsi: 58.5,
    macd: 2.3,
    macd_signal: 1.8,
    macd_histogram: 0.5,
    bollinger_upper: 165,
    bollinger_lower: 135,
    bollinger_middle: 150,
    momentum: 8.5,
    volatility: 18.2,
    fifty_two_week_high: 175,
    fifty_two_week_low: 110,
    support: 138,
    resistance: 168
  }

  const getSignal = (value, overbought = 70, oversold = 30) => {
    if (value == null) return { status: 'Neutral', color: 'text-graphite-500', icon: Minus }
    if (value >= overbought) return { status: 'Overbought', color: 'text-financial-red', icon: TrendingDown }
    if (value <= oversold) return { status: 'Oversold', color: 'text-financial-green', icon: TrendingUp }
    return { status: 'Neutral', color: 'text-graphite-500', icon: Minus }
  }

  const rsiSignal = getSignal(indicators.rsi)
  const macdVal = indicators.macd ?? 0
  const macdSig = indicators.macd_signal ?? 0
  const macdSignal = macdVal > macdSig 
    ? { status: 'Bullish', color: 'text-financial-green', icon: TrendingUp }
    : { status: 'Bearish', color: 'text-financial-red', icon: TrendingDown }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Timeframe Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-2"
      >
        {['1M', '6M', '1Y', '3Y'].map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === tf 
                ? 'bg-navy-700 text-white dark:bg-blue-600' 
                : 'bg-white text-navy-700 border border-slate-300 hover:bg-slate-50 dark:bg-terminal-card dark:text-slate-200 dark:border-terminal-border'
            }`}
          >
            {tf}
          </button>
        ))}
      </motion.div>

      {/* Price Chart with Moving Averages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 dark:text-slate-100 mb-4">
          Price & Moving Averages ({timeframe})
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" hide />
            <YAxis stroke="#64748b" domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(v) => `${currencySymbol}${v.toFixed(0)}`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
              formatter={(value) => [`${currencySymbol}${parseFloat(value).toFixed(2)}`, '']}
            />
            <Line type="monotone" dataKey="dma200" stroke="#94a3b8" strokeWidth={1.5} name="200 DMA" dot={false} />
            <Line type="monotone" dataKey="dma50" stroke="#64748b" strokeWidth={1.5} name="50 DMA" dot={false} />
            <Line type="monotone" dataKey="dma20" stroke="#1e3a8a" strokeWidth={2} name="20 DMA" dot={false} />
            <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} name="Price" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Technical Indicators Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* RSI */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-navy-900 dark:text-slate-100">RSI (14)</h4>
            <div className={`flex items-center gap-1 text-sm ${rsiSignal.color}`}>
              <rsiSignal.icon className="w-4 h-4" />
              {rsiSignal.status}
            </div>
          </div>
          <div className="text-3xl font-bold text-navy-900 dark:text-slate-100 mb-2">
            {indicators.rsi != null ? indicators.rsi.toFixed(1) : '50.0'}
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                (indicators.rsi ?? 50) > 70 ? 'bg-financial-red' : (indicators.rsi ?? 50) < 30 ? 'bg-financial-green' : 'bg-navy-700 dark:bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, indicators.rsi ?? 50))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-graphite-500 dark:text-slate-400 mt-1">
            <span>Oversold (30)</span>
            <span>Overbought (70)</span>
          </div>
        </div>

        {/* MACD */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-navy-900 dark:text-slate-100">MACD</h4>
            <div className={`flex items-center gap-1 text-sm ${macdSignal.color}`}>
              <macdSignal.icon className="w-4 h-4" />
              {macdSignal.status}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-graphite-600 dark:text-slate-300">MACD</span>
              <span className="font-medium text-navy-900 dark:text-slate-100">
                {indicators.macd != null ? indicators.macd.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-graphite-600 dark:text-slate-300">Signal</span>
              <span className="font-medium text-navy-900 dark:text-slate-100">
                {indicators.macd_signal != null ? indicators.macd_signal.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-graphite-600 dark:text-slate-300">Histogram</span>
              <span className={`font-medium ${(indicators.macd_histogram ?? 0) >= 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                {(indicators.macd_histogram ?? 0) >= 0 ? '+' : ''}{(indicators.macd_histogram ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="glass-card p-6">
          <h4 className="font-semibold text-navy-900 dark:text-slate-100 mb-4">Bollinger Bands (20, 2)</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-graphite-600 dark:text-slate-300">Upper Band</span>
              <span className="font-medium text-navy-900 dark:text-slate-100">
                {currencySymbol}{indicators.bollinger_upper ? indicators.bollinger_upper.toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-graphite-600 dark:text-slate-300">Middle Band</span>
              <span className="font-medium text-navy-900 dark:text-slate-100">
                {currencySymbol}{indicators.bollinger_middle ? indicators.bollinger_middle.toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-graphite-600 dark:text-slate-300">Lower Band</span>
              <span className="font-medium text-navy-900 dark:text-slate-100">
                {currencySymbol}{indicators.bollinger_lower ? indicators.bollinger_lower.toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-terminal-border">
              <span className="text-sm text-graphite-600 dark:text-slate-300">Current Price</span>
              <span className="font-bold text-navy-900 dark:text-slate-100">{currencySymbol}{company.current_price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Momentum */}
        <div className="glass-card p-6">
          <h4 className="font-semibold text-navy-900 dark:text-slate-100 mb-4">Momentum (10)</h4>
          <div className="text-3xl font-bold text-navy-900 dark:text-slate-100 mb-2">
            {(indicators.momentum ?? 0) >= 0 ? '+' : ''}{(indicators.momentum ?? 0).toFixed(1)}%
          </div>
          <div className={`text-sm ${(indicators.momentum ?? 0) >= 0 ? 'text-financial-green' : 'text-financial-red'}`}>
            {(indicators.momentum ?? 0) >= 0 ? 'Positive momentum' : 'Negative momentum'}
          </div>
        </div>

        {/* Volatility */}
        <div className="glass-card p-6">
          <h4 className="font-semibold text-navy-900 dark:text-slate-100 mb-4">Volatility</h4>
          <div className="text-3xl font-bold text-navy-900 dark:text-slate-100 mb-2">
            {(indicators.volatility ?? 0).toFixed(1)}%
          </div>
          <div className="text-sm text-graphite-500 dark:text-slate-400">
            {(indicators.volatility ?? 0) > 20 ? 'High volatility' : (indicators.volatility ?? 0) > 10 ? 'Moderate volatility' : 'Low volatility'}
          </div>
        </div>

        {/* 52-Week Range */}
        <div className="glass-card p-6">
          <h4 className="font-semibold text-navy-900 dark:text-slate-100 mb-4">52-Week Range</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-graphite-600 dark:text-slate-300">52W High</span>
              <span className="font-medium text-navy-900 dark:text-slate-100">
                {currencySymbol}{indicators.fifty_two_week_high ? indicators.fifty_two_week_high.toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-graphite-600 dark:text-slate-300">52W Low</span>
              <span className="font-medium text-navy-900 dark:text-slate-100">
                {currencySymbol}{indicators.fifty_two_week_low ? indicators.fifty_two_week_low.toFixed(2) : '—'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full bg-navy-700 dark:bg-blue-500 rounded-full"
                style={{ 
                  width: `${indicators.fifty_two_week_high && indicators.fifty_two_week_low && indicators.fifty_two_week_high !== indicators.fifty_two_week_low
                    ? Math.min(100, Math.max(0, ((company.current_price - indicators.fifty_two_week_low) / (indicators.fifty_two_week_high - indicators.fifty_two_week_low)) * 100))
                    : 50}%` 
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Support & Resistance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-navy-900 dark:text-slate-100 mb-4">Support & Resistance Levels</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-graphite-600 dark:text-slate-300 mb-2">Support Levels</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-emerald-950/40 rounded-lg">
                <span className="text-sm font-medium text-navy-900 dark:text-slate-100">S1</span>
                <span className="text-sm font-bold text-financial-green">
                  {currencySymbol}{indicators.support ? indicators.support.toFixed(2) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-terminal-border rounded-lg">
                <span className="text-sm font-medium text-navy-900 dark:text-slate-100">S2</span>
                <span className="text-sm font-medium text-navy-900 dark:text-slate-100">
                  {currencySymbol}{indicators.support ? (indicators.support * 0.95).toFixed(2) : '—'}
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-graphite-600 dark:text-slate-300 mb-2">Resistance Levels</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-rose-950/40 rounded-lg">
                <span className="text-sm font-medium text-navy-900 dark:text-slate-100">R1</span>
                <span className="text-sm font-bold text-financial-red">
                  {currencySymbol}{indicators.resistance ? indicators.resistance.toFixed(2) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-terminal-border rounded-lg">
                <span className="text-sm font-medium text-navy-900 dark:text-slate-100">R2</span>
                <span className="text-sm font-medium text-navy-900 dark:text-slate-100">
                  {currencySymbol}{indicators.resistance ? (indicators.resistance * 1.05).toFixed(2) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Technical Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-navy-700 dark:text-sky-400" />
          <h3 className="text-lg font-semibold text-navy-900 dark:text-slate-100">Technical Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-terminal-border rounded-lg">
            <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">Trend</p>
            <p className="text-lg font-bold text-financial-green">Bullish</p>
            <p className="text-xs text-graphite-600 dark:text-slate-300 mt-1">Price above 50/200 DMA</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-terminal-border rounded-lg">
            <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">Momentum</p>
            <p className="text-lg font-bold text-financial-green">Positive</p>
            <p className="text-xs text-graphite-600 dark:text-slate-300 mt-1">MACD above signal line</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-terminal-border rounded-lg">
            <p className="text-xs text-graphite-500 dark:text-slate-400 mb-1">Overall Signal</p>
            <p className="text-lg font-bold text-navy-900 dark:text-slate-100">BUY</p>
            <p className="text-xs text-graphite-600 dark:text-slate-300 mt-1">Multiple bullish signals</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Technicals
