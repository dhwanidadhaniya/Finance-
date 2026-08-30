import { motion } from 'framer-motion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import { useApp } from '../../context/AppContext'
import { FileSpreadsheet } from 'lucide-react'

const Financials = () => {
  const { company, financialData, formatAmount, currencySymbol, showToast } = useApp()

  if (!financialData || !financialData.statements) {
    return <div className="text-center text-graphite-500 py-12">Loading financial data...</div>
  }

  const statements = financialData.statements

  const exportStatementsCSV = () => {
    const headers = ["Item", ...statements.slice().reverse().map(s => s.year)]
    const rows = [
      ["Revenue", ...statements.slice().reverse().map(s => s.revenue)],
      ["COGS", ...statements.slice().reverse().map(s => s.cogs)],
      ["Gross Profit", ...statements.slice().reverse().map(s => s.gross_profit)],
      ["EBITDA", ...statements.slice().reverse().map(s => s.ebitda)],
      ["EBIT", ...statements.slice().reverse().map(s => s.ebit)],
      ["Net Income", ...statements.slice().reverse().map(s => s.net_income)],
      ["Free Cash Flow", ...statements.slice().reverse().map(s => s.free_cash_flow)]
    ]
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${company?.ticker || 'Company'}_Statements.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast("Downloaded Financial Statements CSV", "success")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-navy-900 dark:text-slate-100">Historical Financial Statements</h3>
        <button
          onClick={exportStatementsCSV}
          className="btn-secondary text-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          Export CSV
        </button>
      </div>

      {/* Income Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card p-6"
      >
        <h4 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Income Statement</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-terminal-border">
                <TableHead className="dark:text-slate-300">Line Item</TableHead>
                {statements.slice().reverse().map(s => (
                  <TableHead key={s.year} className="text-right dark:text-slate-300 font-bold">{s.year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Revenue</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-semibold">{formatAmount(s.revenue)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Cost of Goods Sold (COGS)</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.cogs)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover font-semibold">
                <TableCell className="font-semibold dark:text-slate-200">Gross Profit</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.gross_profit)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Operating Expenses</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.operating_expenses)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-navy-50/50 dark:bg-blue-950/40 hover:bg-navy-100/50">
                <TableCell className="font-bold text-navy-900 dark:text-sky-400">EBITDA</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-bold text-navy-900 dark:text-sky-400">{formatAmount(s.ebitda)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">EBIT (Operating Income)</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.ebit)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Interest Expense</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.interest_expense)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Pre-Tax Income</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.pre_tax_income)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Income Tax Expense</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.tax)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/40 font-bold">
                <TableCell className="font-bold text-emerald-900 dark:text-emerald-300">Net Income</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-bold text-emerald-900 dark:text-emerald-300">{formatAmount(s.net_income)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Diluted EPS</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-semibold">{currencySymbol}{s.eps?.toFixed(2) || '—'}</TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Balance Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h4 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Balance Sheet</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-terminal-border">
                <TableHead className="dark:text-slate-300">Line Item</TableHead>
                {statements.slice().reverse().map(s => (
                  <TableHead key={s.year} className="text-right dark:text-slate-300 font-bold">{s.year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Cash & Equivalents</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-semibold">{formatAmount(s.cash)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Total Current Assets</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.current_assets)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-navy-50/50 dark:bg-blue-950/40 font-bold">
                <TableCell className="font-bold text-navy-900 dark:text-sky-400">Total Assets</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-bold text-navy-900 dark:text-sky-400">{formatAmount(s.total_assets)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Total Current Liabilities</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.current_liabilities)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Total Liabilities</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.total_liabilities)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Total Debt</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-semibold text-rose-600 dark:text-rose-400">{formatAmount(s.total_debt)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/40 font-bold">
                <TableCell className="font-bold text-emerald-900 dark:text-emerald-300">Total Shareholders' Equity</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-bold text-emerald-900 dark:text-emerald-300">{formatAmount(s.shareholders_equity)}</TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Cash Flow Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h4 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Cash Flow Statement</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-terminal-border">
                <TableHead className="dark:text-slate-300">Line Item</TableHead>
                {statements.slice().reverse().map(s => (
                  <TableHead key={s.year} className="text-right dark:text-slate-300 font-bold">{s.year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Operating Cash Flow</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-semibold">{formatAmount(s.operating_cash_flow)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Capital Expenditures (Capex)</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right text-rose-600 dark:text-rose-400 font-medium">-{formatAmount(s.capex)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Investing Cash Flow</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.investing_cash_flow)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-terminal-hover">
                <TableCell className="font-medium dark:text-slate-200">Financing Cash Flow</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right">{formatAmount(s.financing_cash_flow)}</TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/40 font-bold">
                <TableCell className="font-bold text-emerald-900 dark:text-emerald-300">Free Cash Flow (FCF)</TableCell>
                {statements.slice().reverse().map(s => (
                  <TableCell key={s.year} className="text-right font-bold text-emerald-900 dark:text-emerald-300">{formatAmount(s.free_cash_flow)}</TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Financials

