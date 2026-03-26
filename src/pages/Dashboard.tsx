import { TrendingUp, TrendingDown, DollarSign, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

const StatCard = ({ title, value, type, icon: Icon }: any) => {
  const isRevenue = type === 'receita'
  const isBalance = type === 'saldo'
  
  return (
    <div className="premium-card flex flex-col gap-4 border-l-4 overflow-hidden relative group">
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 blur-3xl transition-all group-hover:opacity-10 ${
        isBalance ? 'bg-sky-500' : isRevenue ? 'bg-emerald-500' : 'bg-rose-500'
      }`} />
      
      <div className="flex items-center justify-between relative z-10">
        <div className={`p-2 rounded-lg ${
          isBalance ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
          isRevenue ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
          'bg-rose-500/10 text-rose-400 border-rose-500/20'
        } border`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold mt-1">
          R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  )
}

const TransactionItem = ({ t }: any) => {
  const isRevenue = t.tipo?.toLowerCase() === 'receita'
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700/30 group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isRevenue ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {isRevenue ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">{t.descricao}</p>
          <p className="text-[10px] text-slate-500">{new Date(t.data).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
      <p className={`text-sm font-bold ${isRevenue ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isRevenue ? '+' : '-'} {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

const Dashboard = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions')
      return response.data
    }
  })

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isReceita = data.tipo?.toLowerCase() === 'receita'
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl">
          <p className="text-slate-300 font-medium mb-1">
            {new Date(data.data).toLocaleDateString('pt-BR')}
          </p>
          <p className={`font-bold text-lg ${isReceita ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isReceita ? 'Receita' : 'Despesa'}: R$ {Number(data.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )
    }
    return null
  }

  const balance = transactions?.reduce((acc: number, t: any) => 
    t.tipo?.toLowerCase() === 'receita' ? acc + Number(t.valor) : acc - Number(t.valor), 0) || 0
  const income = transactions?.filter((t: any) => t.tipo?.toLowerCase() === 'receita')
    .reduce((acc: number, t: any) => acc + Number(t.valor), 0) || 0
  const expenses = transactions?.filter((t: any) => t.tipo?.toLowerCase() === 'despesa')
    .reduce((acc: number, t: any) => acc + Number(t.valor), 0) || 0

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4 animate-pulse">
      <Loader2 className="animate-spin text-sky-500 w-10 h-10" />
      <p className="text-slate-400 text-sm">Carregando seus dados...</p>
    </div>
  )

  const recentIncome = transactions?.filter((t: any) => t.tipo?.toLowerCase() === 'receita').slice(0, 5) || []
  const recentExpenses = transactions?.filter((t: any) => t.tipo?.toLowerCase() === 'despesa').slice(0, 5) || []

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-2 text-lg">Seu resumo financeiro inteligente e detalhado.</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium">Conta Ativa</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Saldo Consolidado" value={balance} type="saldo" icon={DollarSign} />
        <StatCard title="Entradas (Mês)" value={income} type="receita" icon={TrendingUp} />
        <StatCard title="Saídas (Mês)" value={expenses} type="despesa" icon={TrendingDown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
              Últimas Receitas
            </h2>
          </div>
          <div className="space-y-2">
            {recentIncome.length > 0 ? (
              recentIncome.map((t: any) => <TransactionItem key={t.id} t={t} />)
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">Nenhuma receita encontrada.</p>
            )}
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-rose-400">
              <TrendingDown className="w-5 h-5" />
              Últimas Despesas
            </h2>
          </div>
          <div className="space-y-2">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((t: any) => <TransactionItem key={t.id} t={t} />)
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">Nenhuma despesa encontrada.</p>
            )}
          </div>
        </div>
      </div>

      <div className="premium-card h-[400px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">Fluxo de Caixa</h2>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={transactions?.slice(0, 15).reverse()}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="descricao" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="valor" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Dashboard
