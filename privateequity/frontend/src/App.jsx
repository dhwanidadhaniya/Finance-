import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import CommandPalette from './components/CommandPalette'

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <CommandPalette />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
