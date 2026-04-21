import { useState } from 'react'
import { Mic, Loader2, Check, AlertCircle } from 'lucide-react'
import api from '../services/api'

interface TransactionResult {
  valor: number
  tipo: string
  data: string
  descricao: string
  categoria: string
  confianca_processamento: number
}

const VoiceTransaction = () => {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState<TransactionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const testarProcessamento = async () => {
    if (!texto.trim()) return
    
    setLoading(true)
    setMensagem('')
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://gestaofinanceira.netlify.app'
      const response = await fetch(`${baseUrl}/.netlify/functions/processar-transacao?texto=${encodeURIComponent(texto)}`)
      const data = await response.json()
      setResultado(data)
    } catch (error) {
      setResultado(null)
      setMensagem('Erro ao processar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const salvarTransacao = async () => {
    if (!resultado) return
    
    setSalvando(true)
    try {
      await api.post('/transactions', {
        descricao: resultado.descricao,
        valor: resultado.valor,
        data: resultado.data,
        tipo: resultado.tipo,
        categoriaId: 1,
        status: 'pago'
      })
      setMensagem('✅ Transação salva com sucesso!')
      setTimeout(() => {
        setMensagem('')
        setTexto('')
        setResultado(null)
      }, 2000)
    } catch (error) {
      setMensagem('Erro ao salvar transação.')
    } finally {
      setSalvando(false)
    }
  }

  const exemplos = [
    'gastei 50 no supermercado hoje',
    'recebi mil de salário ontem',
    'paguei trinta paus no cinema',
    'gastei dois contos no restaurante',
  ]

  return (
    <div className="premium-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-sky-500/20 rounded-xl">
          <Mic className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Transação por Voz</h3>
          <p className="text-slate-400 text-sm">Digite ou fale sua transação</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex: gastei 50 no supermercado hoje"
            className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            onKeyDown={(e) => e.key === 'Enter' && testarProcessamento()}
          />
          <button
            onClick={testarProcessamento}
            disabled={loading || !texto.trim()}
            className="btn-primary px-4 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Processar'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {exemplos.map((ex, i) => (
            <button
              key={i}
              onClick={() => setTexto(ex)}
              className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {resultado && (
          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl space-y-3">
            <h4 className="font-semibold text-slate-300">Resultado</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Tipo:</span>
                <span className={`ml-2 font-medium ${resultado.tipo === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {resultado.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Valor:</span>
                <span className="ml-2 font-bold text-white">R$ {resultado.valor.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500">Data:</span>
                <span className="ml-2 text-white">{new Date(resultado.data).toLocaleDateString('pt-BR')}</span>
              </div>
              <div>
                <span className="text-slate-500">Categoria:</span>
                <span className="ml-2 text-white">{resultado.categoria}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700">
              <span className="text-slate-500 text-sm">Descrição:</span>
              <p className="text-white">{resultado.descricao}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">Confiança:</span>
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      resultado.confianca_processamento >= 0.7 ? 'bg-emerald-500' :
                      resultado.confianca_processamento >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${resultado.confianca_processamento * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{(resultado.confianca_processamento * 100).toFixed(0)}%</span>
              </div>
              
              <button
                onClick={salvarTransacao}
                disabled={salvando || resultado.confianca_processamento < 0.5}
                className="btn-primary flex items-center gap-2"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        )}

        {mensagem && (
          <div className={`p-3 rounded-xl flex items-center gap-2 ${
            mensagem.includes('sucesso') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {mensagem.includes('sucesso') ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {mensagem}
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceTransaction