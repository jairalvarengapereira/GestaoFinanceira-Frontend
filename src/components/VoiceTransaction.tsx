import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2, Check, AlertCircle } from 'lucide-react'
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
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [gravando, setGravando] = useState(false)
  const [textoFalado, setTextoFalado] = useState('')
  const recognitionRef = useRef<any>(null)

  const iniciarGravacao = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      setMensagem('Navegador não suporta voz.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setGravando(true)
      setTextoFalado('')
      setMensagem('')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setTextoFalado(transcript)
      setTexto(transcript)
      setTimeout(() => processarTranscricao(transcript), 300)
    }

    recognition.onerror = (event: any) => {
      setGravando(false)
      if (event.error === 'no-speech') {
        setMensagem('Nenhuma fala detectada.')
      }
    }

    recognition.onend = () => {
      setGravando(false)
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
    const lower = texto.toLowerCase().trim()
    
    let tipo: 'receita' | 'despesa' = 'despesa'
    if (lower.includes('receita') || lower.includes('ganho') || lower.includes('recebi') || lower.includes('salário') || lower.includes('salario')) {
      tipo = 'receita'
    } else if (lower.includes('despesa') || lower.includes('gastei') || lower.includes('paguei') || lower.includes('gasto')) {
      tipo = 'despesa'
    }
    
    let valor = 0
    const numeros = lower.match(/\d+(?:[.,]\d+)?|\d+/g)
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
    
    let desc = lower.replace(/despesa|receita|gastei|paguei|recebi|ganho|salário|salario|um|uma|dois|duas|três|\d+/g, ' ')
    desc = desc.replace(/[^a-záàâãéèêíìîóòôõúùûç]/g, ' ').replace(/\s+/g, ' ').trim()
    
    if (!desc) desc = tipo === 'receita' ? 'Receita' : 'Despesa'
    
    if (valor > 0) {
      const data = new Date().toISOString().split('T')[0]
      setResultado({ valor, tipo, data, descricao: desc })
      setMensagem('')
    } else {
      setMensagem('Não entendi. Fale: despesa 50 mercado')
    }
  }

  const salvarTransacao = async () => {
    if (!resultado) return
    
    setSalvando(true)
    setMensagem('')
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
      setTimeout(() => {
        setResultado(null)
        setTexto('')
        setTextoFalado('')
      }, 2000)
    } catch (error: any) {
      setMensagem(`Erro: ${error?.response?.data?.message || error.message || 'Tente novamente'}`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="premium-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-sky-500/20 rounded-xl">
          <Mic className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Transação por Voz</h3>
          <p className="text-slate-400 text-sm">Clique no microfone e fale</p>
        </div>
      </div>

      <div className="space-y-4">
        {resultado ? (
          <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 text-xs">Tipo</span>
                <p className={`text-xl font-bold ${resultado.tipo === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {resultado.tipo === 'receita' ? '↑ Receita' : '↓ Despesa'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Valor</span>
                <p className="text-xl font-bold">R$ {resultado.valor.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Descrição</span>
              <p className="text-white">{resultado.descricao}</p>
            </div>
            <button
              onClick={salvarTransacao}
              disabled={salvando}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {salvando ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Fale ou digite: despesa 50 mercado"
                className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4"
              />
              <button
                onClick={gravando ? pararGravacao : iniciarGravacao}
                className={`p-3 rounded-xl transition-all ${gravando ? 'bg-rose-500 text-rose-400' : 'bg-sky-500 text-sky-400'}`}
              >
                {gravando ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>

            {gravando && (
              <div className="flex items-center gap-2 text-sky-400 animate-pulse">
                <div className="w-3 h-3 bg-sky-400 rounded-full" />
                <span className="text-sm">Ouvindo... Fale agora!</span>
              </div>
            )}

            {textoFalado && !gravando && (
              <div className="text-sm text-slate-400">
                Você disse: "{textoFalado}"
              </div>
            )}

            <button
              onClick={() => texto && processarTranscricao(texto)}
              disabled={!texto.trim()}
              className="w-full btn-primary py-3"
            >
              Processar
            </button>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span>Exemplos:</span>
              <button onClick={() => { setTexto('despesa 50 supermercado'); processarTranscricao('despesa 50 supermercado') }} className="px-2 py-1 bg-slate-800 rounded-full hover:bg-slate-700">despesa 50</button>
              <button onClick={() => { setTexto('receita 1000 salário'); processarTranscricao('receita 1000 salário') }} className="px-2 py-1 bg-slate-800 rounded-full hover:bg-slate-700">receita 1000</button>
              <button onClick={() => { setTexto('gastei 30 cinema'); processarTranscricao('gastei 30 cinema') }} className="px-2 py-1 bg-slate-800 rounded-full hover:bg-slate-700">gastei 30</button>
            </div>
          </>
        )}

        {mensagem && (
          <div className={`p-3 rounded-xl flex items-center gap-2 ${
            mensagem.includes('sucesso') ? 'bg-emerald-500/20 text-emerald-400' : 
            mensagem.includes('Ouvindo') ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'
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