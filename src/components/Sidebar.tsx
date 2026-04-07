import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Receipt, Tag, LogOut, Wallet, X, BarChart3 } from 'lucide-react'

interface SidebarProps {
  onLogout: () => void
  isOpen?: boolean
  onClose?: () => void
}

const Sidebar = ({ onLogout, isOpen, onClose }: SidebarProps) => {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transações', path: '/transactions', icon: Receipt },
    { name: 'Comparativo', path: '/comparison', icon: BarChart3 },
    { name: 'Categorias', path: '/categories', icon: Tag },
  ]

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 glass border-r border-slate-700/50 flex flex-col p-6 transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 h-screen
      ${isOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-3">
          <img src="/Logo.png" alt="Logo" className="w-10 h-10 rounded-lg" />
          <h1 className="text-xl font-bold text-white lg:block hidden">
            Gestão Financeira
          </h1>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-3 -mr-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-all"
          aria-label="Fechar menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="text-xs text-slate-600 mb-6 px-2 text-center">
        <p>© 2026 Jair Alvarenga Pereira</p>
        <p className="mt-1">Todos os direitos reservados</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-lg shadow-sky-500/5' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-sky-400' : ''}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <button 
        onClick={onLogout}
        className="mt-auto flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sair</span>
      </button>
    </aside>
  )
}

export default Sidebar
