export const Table = ({ children, className = '' }) => (
  <table className={`w-full text-sm ${className}`}>
    {children}
  </table>
)

export const TableHeader = ({ children, className = '' }) => (
  <thead className={`bg-slate-50 ${className}`}>
    {children}
  </thead>
)

export const TableBody = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-slate-200 ${className}`}>
    {children}
  </tbody>
)

export const TableRow = ({ children, className = '' }) => (
  <tr className={`hover:bg-slate-50 transition-colors ${className}`}>
    {children}
  </tr>
)

export const TableHead = ({ children, className = '' }) => (
  <th className={`px-4 py-3 text-left text-xs font-semibold text-graphite-600 uppercase tracking-wider ${className}`}>
    {children}
  </th>
)

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-navy-900 ${className}`}>
    {children}
  </td>
)
