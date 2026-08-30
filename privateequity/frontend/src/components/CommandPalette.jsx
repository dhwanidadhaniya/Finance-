import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const CommandPalette = () => {
  const { 
    commandPaletteOpen, setCommandPaletteOpen, 
    loadDemoCompany, setCurrentView, 
    darkMode, setDarkMode, 
    setUnitMode, setCurrencySymbol 
  } = useApp()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  const commands = [
    { id: 'toggle-theme', label: `Toggle Theme (${darkMode ? 'Switch to Light' : 'Switch to Dark'})`, action: () => { setDarkMode(!darkMode); setCommandPaletteOpen(false) } },
    { id: 'unit-millions', label: 'Display Units: Millions ($M)', action: () => { setUnitMode('M'); setCommandPaletteOpen(false) } },
    { id: 'unit-billions', label: 'Display Units: Billions ($B)', action: () => { setUnitMode('B'); setCommandPaletteOpen(false) } },
    { id: 'curr-usd', label: 'Currency: USD ($)', action: () => { setCurrencySymbol('$'); setCommandPaletteOpen(false) } },
    { id: 'curr-eur', label: 'Currency: EUR (€)', action: () => { setCurrencySymbol('€'); setCommandPaletteOpen(false) } },
    { id: 'curr-gbp', label: 'Currency: GBP (£)', action: () => { setCurrencySymbol('£'); setCommandPaletteOpen(false) } },
    { id: 'load-tech', label: 'Load Demo: TechCorp (TECH)', action: () => loadDemoAndNavigate('TECH') },
    { id: 'load-green', label: 'Load Demo: GreenEnergy (GREEN)', action: () => loadDemoAndNavigate('GREEN') },
    { id: 'load-finh', label: 'Load Demo: FinanceHub (FINH)', action: () => loadDemoAndNavigate('FINH') },
    { id: 'nav-overview', label: 'Navigate: Overview', action: () => navigateToView('overview') },
    { id: 'nav-fundamentals', label: 'Navigate: Fundamentals', action: () => navigateToView('fundamentals') },
    { id: 'nav-financials', label: 'Navigate: Financials', action: () => navigateToView('financials') },
    { id: 'nav-forecast', label: 'Navigate: Forecast', action: () => navigateToView('forecast') },
    { id: 'nav-valuation', label: 'Navigate: Valuation', action: () => navigateToView('valuation') },
    { id: 'nav-technicals', label: 'Navigate: Technicals', action: () => navigateToView('technicals') },
    { id: 'nav-peers', label: 'Navigate: Peers', action: () => navigateToView('peers') },
    { id: 'nav-scenarios', label: 'Navigate: Scenarios', action: () => navigateToView('scenarios') },
    { id: 'nav-investment', label: 'Navigate: Investment View', action: () => navigateToView('investment') },
  ]

  const loadDemoAndNavigate = async (ticker) => {
    await loadDemoCompany(ticker)
    navigate('/dashboard')
    setCommandPaletteOpen(false)
  }

  const navigateToView = (view) => {
    setCurrentView(view)
    navigate('/dashboard')
    setCommandPaletteOpen(false)
  }

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setCommandPaletteOpen(prev => !prev)
    }
    if (!commandPaletteOpen) return

    if (e.key === 'Escape') {
      setCommandPaletteOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action()
      }
    }
  }, [commandPaletteOpen, filteredCommands, selectedIndex, setCommandPaletteOpen])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!commandPaletteOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
        onClick={() => setCommandPaletteOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-white dark:bg-terminal-card border border-slate-200 dark:border-terminal-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 dark:border-terminal-border">
            <Search className="w-5 h-5 text-graphite-400" />
            <input
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-navy-900 dark:text-slate-100 placeholder-graphite-400 font-medium"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-terminal-border rounded text-graphite-500">ESC</kbd>
          </div>
          
          <div className="max-h-96 overflow-y-auto py-2 scrollbar-thin">
            {filteredCommands.length === 0 ? (
              <div className="px-6 py-8 text-center text-graphite-500">
                No matching commands
              </div>
            ) : (
              filteredCommands.map((command, index) => {
                const isSelected = index === selectedIndex
                return (
                  <button
                    key={command.id}
                    onClick={command.action}
                    className={`w-full px-6 py-3 flex items-center gap-4 transition-colors text-left text-sm ${
                      isSelected 
                        ? 'bg-navy-100 dark:bg-blue-600/30 text-navy-900 dark:text-sky-300 font-semibold' 
                        : 'hover:bg-slate-50 dark:hover:bg-terminal-hover text-navy-900 dark:text-slate-200'
                    }`}
                  >
                    <span className="flex-1">{command.label}</span>
                    {isSelected && <kbd className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded text-graphite-600 dark:text-slate-300">↵</kbd>}
                  </button>
                )
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CommandPalette


