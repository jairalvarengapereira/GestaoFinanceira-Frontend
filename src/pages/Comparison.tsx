import { useState } from 'react'
import { TrendingUp, TrendingDown, Loader2, DollarSign, BarChart3, Trophy } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

interface MonthData {
  month: string
  receita: number
  despesa: number
  diferenca: number
}

const Comparison = () => {
  const currentDate = new Date()
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const previousMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
  const previousMonthKey = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)
  
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

  const getMonthLabel = (monthKey: string) => {
    const [year, m] = monthKey.split('-')
    return new Date(Number(year), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const selectedMonthData = monthlyData.find(m => m.month === selectedMonth)
  const selectedMonthReceitas = selectedMonthData?.receita || 0
  const selectedMonthDespesas = selectedMonthData?.despesa || 0
  const selectedMonthSaldo = selectedMonthReceitas - selectedMonthDespesas

  const categoryRanking = (selectedMonth 
    ? transactions?.filter((t: any) => {
        const date = new Date(t.data)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        return monthKey === selectedMonth
      })
    : transactions
  )?.reduce((acc: any[], t: any) => {
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

  const filteredTransactions = selectedMonth 
    ? transactions?.filter((t: any) => {
        const date = new Date(t.data)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        return monthKey === selectedMonth && (t.tipo === 'DESPESA' || t.tipo?.toLowerCase() === 'despesa')
      })
    : transactions?.filter((t: any) => t.tipo === 'DESPESA' || t.tipo?.toLowerCase() === 'despesa')

  const pieData = filteredTransactions?.reduce((acc: any[], t: any) => {
    if (t.categoria) {
      const existing = acc.find(item => item.name === t.categoria.nome)
      if (existing) {
        existing.value += Number(t.valor)
      } else {
        acc.push({ name: t.categoria.nome, value: Number(t.valor) })
      }
    }
    return acc
  }, []).sort((a, b) => b.value - a.value) || []

  const COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7']

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const receita = payload.find((p: any) => p.dataKey === 'receita')?.value || 0
      const despesa = payload.find((p: any) => p.dataKey === 'despesa')?.value || 0
      const saldo = receita - despesa
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl">
          <p className="text-slate-300 font-medium mb-2">{label}</p>
          <p className="text-sm text-emerald-400">Receitas: R$ {receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-rose-400">Despesas: R$ {despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className={`text-sm font-bold mt-1 ${saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Saldo: R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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

      <div className="premium-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Período</p>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-lg font-bold text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="">Todos os meses</option>
              <option value={currentMonthKey}>{getMonthLabel(currentMonthKey)} (Atual)</option>
              <option value={previousMonthKey}>{getMonthLabel(previousMonthKey)} (Anterior)</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4 flex-1 md:ml-8">
            <div className="text-center p-3 bg-slate-800/50 rounded-xl">
              <p className="text-slate-400 text-xs uppercase">Receitas</p>
              <p className="text-xl font-bold text-emerald-400">
                R$ {selectedMonthReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-xl">
              <p className="text-slate-400 text-xs uppercase">Despesas</p>
              <p className="text-xl font-bold text-rose-400">
                R$ {selectedMonthDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-xl">
              <p className="text-slate-400 text-xs uppercase">Saldo</p>
              <p className={`text-xl font-bold ${selectedMonthSaldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                R$ {selectedMonthSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
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
              <defs>
                <linearGradient id="colorReceitaBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981"/>
                  <stop offset="100%" stopColor="#059669"/>
                </linearGradient>
                <linearGradient id="colorDespesaBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e"/>
                  <stop offset="100%" stopColor="#e11d48"/>
                </linearGradient>
              </defs>
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
              <Bar 
                dataKey="receita" 
                name="Receitas" 
                fill="url(#colorReceitaBar)" 
                radius={[8, 8, 0, 0]} 
                maxBarSize={60}
              />
              <Bar 
                dataKey="despesa" 
                name="Despesas" 
                fill="url(#colorDespesaBar)" 
                radius={[8, 8, 0, 0]} 
                maxBarSize={60}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {pieData.length > 0 && (
          <div className="premium-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-400" />
                Distribuição de Despesas por Categoria
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default Comparison
