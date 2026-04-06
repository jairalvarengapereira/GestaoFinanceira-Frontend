import { useState } from 'react'
import { Plus, Tag, ArrowUpCircle, ArrowDownCircle, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import CategoryModal from '../components/CategoryModal'

const Categories = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const queryClient = useQueryClient()
  
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-slate-400 mt-1">Organize suas movimentações por grupos personalizados.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 py-3 px-6 rounded-2xl shadow-xl shadow-sky-500/10 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
          <p className="text-slate-500 text-sm">Carregando categorias...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((c: any) => (
            <div key={c.id} className="premium-card flex items-center justify-between group hover:border-sky-500/30 transition-all cursor-default">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${
                  c.tipo === 'RECEITA' || c.tipo === 'receita' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-100">{c.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {(c.tipo === 'RECEITA' || c.tipo === 'receita') ? (
                      <ArrowUpCircle className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowDownCircle className="w-3 h-3 text-rose-400" />
                    )}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.tipo}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => {
                    setEditingCategory(c)
                    setIsModalOpen(true)
                  }}
                  className="p-2 text-slate-500 hover:text-sky-400 transition-all"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
                      deleteMutation.mutate(c.id)
                    }
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {categories?.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center glass rounded-3xl border border-dashed border-slate-700/50">
               <Tag className="w-12 h-12 text-slate-700 mb-4" />
               <p className="text-slate-500 text-lg">Nenhuma categoria encontrada.</p>
               <button 
                onClick={() => setIsModalOpen(true)}
                className="text-sky-400 font-bold mt-2 hover:text-sky-300 transition-all underline underline-offset-4"
               >
                 Crie sua primeira categoria agora
               </button>
            </div>
          )}
        </div>
      )}

      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setEditingCategory(null)
        }}
        editingCategory={editingCategory}
      />
    </div>
  )
}

export default Categories
