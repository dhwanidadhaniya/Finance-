import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, TrendingUp, BarChart3, Shield, Zap, FileText, Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'

const Landing = () => {
  const navigate = useNavigate()
  const { loadDemoCompany, setCommandPaletteOpen } = useApp()

  const handleLoadDemo = async () => {
    await loadDemoCompany('TECH')
    navigate('/dashboard')
  }

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'PDF/Excel Extraction',
      description: 'Automatically extract financial data from annual reports and statements'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Fundamental Analysis',
      description: 'Comprehensive ratios, margins, and growth metrics'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'DCF Valuation',
      description: 'Professional discounted cash flow modeling'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Scenario Analysis',
      description: 'Bull, Base, and Bear case modeling'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Technical Indicators',
      description: 'RSI, MACD, Bollinger Bands, and more'
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: 'Peer Comparison',
      description: 'Compare against industry peers'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-50/50 to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32"
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-100 text-navy-700 text-sm font-medium mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-navy-500 animate-pulse" />
              Equity Research Terminal
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-5xl lg:text-7xl font-bold text-navy-900 mb-6 tracking-tight"
            >
              EquityLens
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-graphite-600 max-w-2xl mx-auto mb-10"
            >
              Professional equity research and investment analytics. Extract financial data, 
              perform fundamental analysis, value companies, and generate investment views.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button
                onClick={handleLoadDemo}
                className="group flex items-center gap-2 px-8 py-4 bg-navy-700 text-white rounded-xl font-semibold hover:bg-navy-800 transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                Load Demo Company
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-8 py-4 bg-white text-navy-700 border-2 border-slate-200 rounded-xl font-semibold hover:border-navy-300 hover:bg-slate-50 transition-all duration-300"
              >
                <kbd className="px-2 py-1 text-xs bg-slate-100 rounded">⌘K</kbd>
                Command Palette
              </button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-navy-900 mb-4">Everything you need for equity research</h2>
          <p className="text-graphite-600 max-w-xl mx-auto">
            From document extraction to investment recommendations, all in one terminal
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-2">{feature.title}</h3>
              <p className="text-graphite-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-navy-900 mb-4">Ready to analyze?</h2>
          <p className="text-graphite-600 mb-8 max-w-xl mx-auto">
            Start with a demo company or upload your own financial documents
          </p>
          <button
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-2 px-8 py-4 bg-navy-700 text-white rounded-xl font-semibold hover:bg-navy-800 transition-all duration-300 hover:shadow-xl"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-graphite-500 text-sm">
          <p>EquityLens — For educational and research purposes only. Not financial advice.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
