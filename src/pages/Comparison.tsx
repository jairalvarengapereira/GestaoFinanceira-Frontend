import { TrendingUp, TrendingDown, Loader2, DollarSign, BarChart3, Trophy } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

interface MonthData {
  month: string
  receita: number
  despesa: number
  diferenca: number
}

const Comparison = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions')
      return response.data
    }
  })

  const monthlyData: MonthData[] = transactions?.reduce((acc: MonthData[], t: any) => {
    const date = new Date(t.data)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const existing = acc.find(item => item.month === monthKey)
    if (existing) {
      if (t.tipo?.toLowerCase() === 'receita') {
        existing.receita += Number(t.valor)
      } else {
        existing.despesa += Number(t.valor)
      }
      existing.diferenca = existing.receita - existing.despesa
    } else {
      acc.push({
        month: monthKey,
        receita: t.tipo?.toLowerCase() === 'receita' ? Number(t.valor) : 0,
        despesa: t.tipo?.toLowerCase() === 'despesa' ? Number(t.valor) : 0,
        diferenca: t.tipo?.toLowerCase() === 'receita' ? Number(t.valor) : -Number(t.valor)
      })
    }
    return acc
  }, []).sort((a: MonthData, b: MonthData) => a.month.localeCompare(b.month)) || []

  const totalReceitas = monthlyData.reduce((sum, m) => sum + m.receita, 0)
  const totalDespesas = monthlyData.reduce((sum, m) => sum + m.despesa, 0)
  const saldoGeral = totalReceitas - totalDespesas

  const categoryRanking = transactions?.reduce((acc: any[], t: any) => {
    console.log('Transaction:', t.tipo, t.categoria)
    if ((t.tipo === 'DESPESA' || t.tipo?.toLowerCase() === 'despesa') && t.categoria) {
      const existing = acc.find(item => item.categoria === t.categoria.nome)
      if (existing) {
        existing.total += Number(t.valor)
        existing.count += 1
      } else {
        acc.push({
          categoria: t.categoria.nome,
          total: Number(t.valor),
          count: 1
        })
      }
    }
    return acc
  }, []).sort((a, b) => b.total - a.total).slice(0, 5) || []
  
  console.log('Category Ranking:', categoryRanking)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl">
          <p className="text-slate-300 font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4 animate-pulse">
      <Loader2 className="animate-spin text-sky-500 w-10 h-10" />
      <p className="text-slate-400 text-sm">Carregando seus dados...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Comparativo Mensal</h1>
          <p className="text-slate-400 mt-2 text-lg">Receitas vs Despesas por mês.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card flex flex-col gap-4 border-l-4 overflow-hidden relative group border-sky-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 blur-3xl transition-all group-hover:opacity-10 bg-sky-500" />
          <div className="flex items-center justify-between relative z-10">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Saldo Total</p>
            <p className={`text-2xl font-bold mt-1 ${saldoGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {saldoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="premium-card flex flex-col gap-4 border-l-4 overflow-hidden relative group border-emerald-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 blur-3xl transition-all group-hover:opacity-10 bg-emerald-500" />
          <div className="flex items-center justify-between relative z-10">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Receitas</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="premium-card flex flex-col gap-4 border-l-4 overflow-hidden relative group border-rose-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 blur-3xl transition-all group-hover:opacity-10 bg-rose-500" />
          <div className="flex items-center justify-between relative z-10">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Despesas</p>
            <p className="text-2xl font-bold mt-1 text-rose-400">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="premium-card h-[500px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            Receitas vs Despesas
          </h2>
        </div>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-')
                  return new Date(Number(year), Number(month) - 1).toLocaleDateString('pt-BR', { month: 'short' })
                }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}}
                tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
              />
              <ReferenceLine y={0} stroke="#334155" />
              <Bar 
                dataKey="receita" 
                name="Receitas" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
              <Bar 
                dataKey="despesa" 
                name="Despesas" 
                fill="#f43f5e" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <BarChart3 className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-500">Nenhum dado encontrado.</p>
          </div>
        )}
      </div>

      <div className="premium-card h-[400px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-sky-400" />
            Diferença Mensal (Saldo)
          </h2>
        </div>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-')
                  return new Date(Number(year), Number(month) - 1).toLocaleDateString('pt-BR', { month: 'short' })
                }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}}
                tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#334155" />
<Bar 
                dataKey="diferenca" 
                name="Diferença" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={80}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <DollarSign className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-500">Nenhum dado encontrado.</p>
          </div>
        )}
      </div>

      {categoryRanking.length > 0 && (
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Top 5 Categorias de Despesas
            </h2>
          </div>
          <div className="space-y-4">
            {categoryRanking.map((cat: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/50' :
                    index === 2 ? 'bg-orange-600/20 text-orange-500 border border-orange-600/50' :
                    'bg-slate-700/20 text-slate-400 border border-slate-600/30'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{cat.categoria}</p>
                    <p className="text-xs text-slate-400">{cat.count} transação{cat.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-400">
                    R$ {cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Comparison
