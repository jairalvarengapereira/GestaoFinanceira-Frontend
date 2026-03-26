import { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, Type, Tag as TagIcon, Loader2, CreditCard } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import api from '../services/api'

const TransactionModal = ({ isOpen, onClose, editingTransaction = null }: any) => {
  const queryClient = useQueryClient()
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [categoriaId, setCategoriaId] = useState('')
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago')
  const [categories, setCategories] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      api.get('/categories').then(res => setCategories(res.data))
      
      if (editingTransaction) {
        setTipo(editingTransaction.tipo?.toLowerCase() || 'despesa')
        setDescricao(editingTransaction.descricao || '')
        setValor(editingTransaction.valor?.toString() || '')
        setData(new Date(editingTransaction.data).toISOString().split('T')[0])
        setCategoriaId(editingTransaction.categoriaId?.toString() || '')
        setStatus(editingTransaction.status?.toLowerCase() || 'pago')
      } else {
        resetForm()
      }
    }
  }, [isOpen, editingTransaction])

  const createMutation = useMutation({
    mutationFn: (newTransaction: any) => api.post('/transactions', newTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      onClose()
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      onClose()
      resetForm()
    }
  })

  const resetForm = () => {
    setTipo('despesa')
    setDescricao('')
    setValor('')
    setData(new Date().toISOString().split('T')[0])
    setCategoriaId('')
    setStatus('pago')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingTransaction) {
        await updateMutation.mutateAsync({
          id: editingTransaction.id,
          data: {
            descricao,
            valor: Number(valor),
            data,
            tipo,
            categoriaId: Number(categoriaId),
            status
          }
        })
      } else {
        await createMutation.mutateAsync({
          descricao,
          valor: Number(valor),
          data,
          tipo,
          categoriaId: Number(categoriaId),
          status
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="premium-card w-full max-w-lg relative animate-slide-up shadow-2xl shadow-sky-500/10">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-500 hover:text-white transition-all">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-8">{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={() => setTipo('receita')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                tipo === 'receita' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 hover:bg-slate-700'
              }`}
            >
              Receita
            </button>
            <button 
              type="button" 
              onClick={() => setTipo('despesa')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                tipo === 'despesa' 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-lg shadow-rose-500/10' 
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 hover:bg-slate-700'
              }`}
            >
              Despesa
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Descrição</label>
            <div className="relative">
              <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all" 
                placeholder="Ex: Supermercado" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Valor</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="number" 
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all" 
                  placeholder="0,00" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Data</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="date" 
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Categoria</label>
            <div className="relative">
              <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <select 
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Status</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pago' | 'pendente')}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              >
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-4 font-bold text-lg mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Salvar Transação'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default TransactionModal
