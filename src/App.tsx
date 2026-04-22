import { useState, useEffect, useLayoutEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import VoiceFAB from './components/VoiceFAB'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Comparison from './pages/Comparison'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  useLayoutEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('@SaaS:token')
    console.log('App: checking token', !!token)
    setIsAuthenticated(!!token)
  }, [])

  const handleLogout = () => {
    console.log('App: handleLogout called')
    localStorage.removeItem('@SaaS:token')
    localStorage.removeItem('@SaaS:user')
    setIsAuthenticated(false)
    setIsSidebarOpen(false)
  }

  const handleLogin = () => {
    console.log('App: handleLogin called')
    setIsAuthenticated(true)
  }

  if (isAuthenticated === null) return null

  return (
    <Router>
      <div className="flex min-h-screen bg-background text-slate-100 overflow-x-hidden">
        {isAuthenticated && (
          <>
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass z-40 px-6 flex items-center justify-between border-b border-slate-700/50">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-400 hover:text-white transition-all"
              >
                <Menu className="w-6 h-6" />
              </button>
              <img src="/Logo.png?v=3" alt="Logo" className="h-8 w-8" />
              <div className="w-10" /> {/* Spacer */}
            </header>

            {/* Overlay */}
            {isSidebarOpen && !isDesktop && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden cursor-pointer active:bg-black/70 transition-all"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            <Sidebar 
              isOpen={isDesktop || isSidebarOpen} 
              onClose={() => setIsSidebarOpen(false)} 
              onLogout={handleLogout} 
            />
          </>
        )}
        
        <main className={`${isAuthenticated ? 'flex-1 lg:p-8 p-6 pt-24 lg:pt-8' : 'w-full'} overflow-y-auto`}>
          <Routes>
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/" /> : <Register />} 
            />
            <Route 
              path="/" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/transactions" 
              element={isAuthenticated ? <Transactions /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/categories" 
              element={isAuthenticated ? <Categories /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/comparison" 
              element={isAuthenticated ? <Comparison /> : <Navigate to="/login" />} 
            />
<Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
            </Routes>
            
            {isAuthenticated && <VoiceFAB />}
          </main>
      </div>
    </Router>
  )
}

export default App
