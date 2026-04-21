import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2, Check, AlertCircle, Trash2 } from 'lucide-react'
import api from '../services/api'

interface TransactionResult {
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  descricao: string
}

const VoiceTransaction = () => {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState<TransactionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [gravando, setGravando] = useState(false)
  const [transcricaoAtual, setTranscricaoAtual] = useState('')
  const recognitionRef = useRef<any>(null)

  const iniciarGravacao = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      setMensagem('Navegador não suporta voz.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      setGravando(true)
      setTranscricaoAtual('')
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }
      if (finalTranscript) {
        setTranscricaoAtual(finalTranscript)
      }
    }

    recognition.onerror = () => {
      setGravando(false)
    }

    recognition.onend = () => {
      setGravando(false)
      if (transcricaoAtual) {
        processarTranscricao(transcricaoAtual)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const pararGravacao = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setGravando(false)
    }
  }

  const processarTranscricao = (texto: string) => {
    const lower = texto.toLowerCase()
    
    let tipo: 'receita' | 'despesa' = 'despesa'
    if (lower.includes('receita') || lower.includes('ganho') || lower.includes('recebi') || lower.includes('salário') || lower.includes('salario')) {
      tipo = 'receita'
    } else if (lower.includes('despesa') || lower.includes('gastei') || lower.includes('paguei') || lower.includes('gasto')) {
      tipo = 'despesa'
    }
    
    let valor = 0
    const numeros = texto.match(/\d+(?:[.,]\d+)?|\d+/g)
    if (numeros) {
      const nums = numeros.map((n: string) => parseFloat(n.replace(',', '.'))).filter((n: number) => !isNaN(n) && n > 0)
      if (nums.length > 0) valor = Math.max(...nums)
    }
    
    const gurias: Record<string, number> = {
      'cinquentão': 50, 'cem': 100, 'duzentão': 200, 'trezentão': 300,
      'quatrocentão': 400, 'quinhentão': 500, 'mil': 1000, 'vinte paus': 20,
      'trinta paus': 30, 'quarenta paus': 40, 'cinquenta paus': 50,
      'cem paus': 100, 'dois contos': 2000, 'três contos': 3000
    }
    for (const [palavra, val] of Object.entries(gurias)) {
      if (lower.includes(palavra)) { valor = val; break }
    }
    
    const palavras = lower.replace(/despesa|receita|gastei|paguei|recebi|ganho|salário|salario|hoje|ontem|um|uma|dois|duas|três/g, ' ')
    const desc = palavras.replace(/\d+/g, '').replace(/[^a-záàâãéèêíìîóòôõúùûç]/g, ' ').replace(/\s+/g, ' ').trim() || (tipo === 'receita' ? 'Receita' : 'Despesa')
    
    const data = new Date().toISOString().split('T')[0]
    
    if (valor > 0) {
      setResultado({ valor, tipo, data, descricao: desc })
      setTexto('')
    } else {
      setMensagem('Não entendi o valor. Tente: "despesa 50" ou "receita 100"')
    }
  }

  const salvarTransacao = async () => {
    if (!resultado) return
    
    setSalvando(true)
    try {
      const payload = {
        descricao: resultado.descricao,
        valor: resultado.valor,
        data: resultado.data,
        tipo: resultado.tipo,
        status: 'pago'
      }
      await api.post('/transactions', payload)
      setMensagem('✅ Salvo com sucesso!')
      setResultado(null)
      setTranscricaoAtual('')
    } catch (error: any) {
      setMensagem(`Erro: ${error?.response?.data?.message || error.message || 'Tente novamente'}`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="premium-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-sky-500/20 rounded-xl">
          <Mic className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Transação por Voz</h3>
          <p className="text-slate-400 text-sm">Diga: despesa 50 supermercado</p>
        </div>
      </div>

      <div className="space-y-4">
        {resultado ? (
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-slate-500 text-sm">Tipo:</span>
                <p className={`text-lg font-bold ${resultado.tipo === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {resultado.tipo === 'receita' ? 'Receita ↑' : 'Despesa ↓'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-sm">Valor:</span>
                <p className="text-lg font-bold">R$ {resultado.valor.toFixed(2)}</p>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-slate-500 text-sm">Descrição:</span>
              <p className="text-white">{resultado.descricao}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={salvarTransacao} disabled={salvando} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Salvar
              </button>
              <button onClick={() => setResultado(null)} className="btn-primary bg-slate-700 flex items-center justify-center gap-2">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex: despesa 50 supermercado"
              className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4"
              onKeyDown={(e) => e.key === 'Enter' && texto && processarTranscricao(texto)}
            />
            <button
              onClick={gravando ? pararGravacao : iniciarGravacao}
              className={`p-3 rounded-xl ${gravando ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-sky-500/20 text-sky-400'}`}
            >
              {gravando ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button onClick={() => texto && processarTranscricao(texto)} className="btn-primary px-4">Ok</button>
          </div>
        )}

        {gravando && (
          <div className="flex items-center gap-2 text-rose-400">
            <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
            <span>Ouvindo... Fale: despesa 50 supermercado</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span>Exemplos:</span>
          <button onClick={() => processarTranscricao('despesa 50 supermercado')} className="px-2 py-1 bg-slate-800 rounded-full">despesa 50</button>
          <button onClick={() => processarTranscricao('receita 1000 salário')} className="px-2 py-1 bg-slate-800 rounded-full">receita 1000</button>
          <button onClick={() => processarTranscricao('gastei 30 no cinema')} className="px-2 py-1 bg-slate-800 rounded-full">gastei 30</button>
          <button onClick={() => processarTranscricao('recebi 500 freelance')} className="px-2 py-1 bg-slate-800 rounded-full">recebi 500</button>
        </div>

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