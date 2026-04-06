import React, { useState, useEffect } from 'react'
import { X, Loader2, Tag } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  editingCategory?: any
}

const CategoryModal = ({ isOpen, onClose, editingCategory = null }: CategoryModalProps) => {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (editingCategory) {
      setNome(editingCategory.nome)
      setTipo(editingCategory.tipo?.toLowerCase() || 'receita')
    } else {
      setNome('')
      setTipo('receita')
    }
  }, [editingCategory])

  const createMutation = useMutation({
    mutationFn: (newCategory: any) => api.post('/categories', newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
      setNome('')
      setTipo('receita')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
      setNome('')
      setTipo('receita')
    }
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCategory) {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        data: { nome, tipo }
      })
    } else {
      await createMutation.mutateAsync({ nome, tipo })
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass w-full max-w-md border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
        <header className="px-8 py-6 border-b border-slate-700/50 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-1 bg-slate-900/50 rounded-2xl border border-slate-700/30">
              <button
                type="button"
                onClick={() => setTipo('receita')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold ${
                  tipo === 'receita' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setTipo('despesa')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold ${
                  tipo === 'despesa' 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Despesa
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Nome da Categoria</label>
              <input
                autoFocus
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Aluguel, Salário, Lanche..."
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full btn-primary py-4 rounded-2xl font-bold text-lg shadow-xl shadow-sky-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : editingCategory ? 'Salvar Categoria' : 'Criar Categoria'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal
