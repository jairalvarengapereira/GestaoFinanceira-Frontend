import { Plus, Search, Loader2, Trash2, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../services/api'
import TransactionModal from '../components/TransactionModal'

const Transactions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [tipoTransacao, setTipoTransacao] = useState<'receita' | 'despesa'>('despesa')
  const queryClient = useQueryClient()
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions')
      return response.data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/transactions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-slate-400 mt-1">Gerencie seu histórico financeiro aqui.</p>
        </div>
        <button 
          onClick={() => {
            setTipoTransacao('despesa')
            setIsModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Transação
        </button>
      </header>

      <div className="premium-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar transação..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-slate-700/50">
                  <th className="pb-4 font-medium">Descrição</th>
                  <th className="pb-4 font-medium">Categoria</th>
                  <th className="pb-4 font-medium">Data</th>
                  <th className="pb-4 font-medium">Valor</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {transactions?.map((t: any) => (
                  <tr key={t.id} className="group hover:bg-slate-700/10 transition-all">
                    <td className="py-4 font-medium">{t.descricao}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">
                        {t.categoria?.nome || 'Sem categoria'}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400 text-sm">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-4">
                      <span className={`font-bold ${t.tipo?.toLowerCase() === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.tipo?.toLowerCase() === 'receita' ? '+' : '-'} R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            setEditingTransaction(t)
                            setIsModalOpen(true)
                          }}
                          className="p-2 text-slate-500 hover:text-sky-400 transition-all"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta transação?')) {
                              deleteMutation.mutate(t.id)
                            }
                          }}
                          className="p-2 text-slate-500 hover:text-rose-400 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setEditingTransaction(null)
        }} 
        editingTransaction={editingTransaction}
        tipoInicial={editingTransaction ? editingTransaction.tipo?.toLowerCase() : tipoTransacao}
      />
    </div>
  )
}

export default Transactions
