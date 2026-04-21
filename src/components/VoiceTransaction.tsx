import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2, Check, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

interface TransactionResult {
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  descricao: string
  categoriaNome?: string
}

const VoiceTransaction = () => {
  const queryClient = useQueryClient()
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState<TransactionResult | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [gravando, setGravando] = useState(false)
  const [textoFalado, setTextoFalado] = useState('')
  const [categorias, setCategorias] = useState<any[]>([])
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    api.get('/categories').then(res => setCategorias(res.data)).catch(() => {})
  }, [])

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

  const CATEGORIAS_KEYWORDS: Record<string, string[]> = {
    'Alimentação': ['padaria', 'supermercado', 'mercado', 'restaurante', 'lanchonete', 'ifood', 'uber eats', 'comida', 'almoço', 'jantar'],
    'Transporte': ['uber', '99', 'gasolina', 'ônibus', 'metrô', 'táxi', 'taxi'],
    'Lazer': ['cinema', 'netflix', 'spotify', 'show', 'teatro', 'fest', 'balada'],
    'Saúde': ['farmacia', 'farmácia', 'médico', 'medico', 'dentista', 'academia'],
    'Moradia': ['aluguel', 'luz', 'água', 'internet', 'condomínio'],
    'Educação': ['curso', 'escola', 'universidade', 'livro', 'material'],
    'Outros': []
  }

const processarESalvar = (texto: string) => {
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
    
    if (valor <= 0) {
      setMensagem('Não entendi o valor. Fale: despesa 50 padaria')
      return
    }
    
    let desc = tipo === 'receita' ? 'Receita' : 'Despesa'
    let categoriaNome = ''
    
    const palavras = lower.replace(/despesa|receita|gastei|paguei|recebi|ganho|salário|salario|um|uma|dois|duas|três|\d+/g, ' ')
    const partes = palavras.replace(/[^a-záàâãéèêíìîóòôõúùûç\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(p => p.length > 2)
    
    if (partes.length > 0) {
      const ultima = partes[partes.length - 1]
      
      const catEncontrada = categorias.find(c => c.nome.toLowerCase().includes(ultima) || ultima.includes(c.nome.toLowerCase()))
      if (catEncontrada) {
        categoriaNome = catEncontrada.nome
        desc = partes.length > 1 ? partes.slice(0, -1).join(' ') : catEncontrada.nome
      } else {
        for (const [catNome, keywords] of Object.entries(CATEGORIAS_KEYWORDS)) {
          if (keywords.some(k => ultima.includes(k) || k.includes(ultima))) {
            const catGeral = categorias.find(c => c.nome.toLowerCase() === catNome.toLowerCase())
            if (catGeral) {
              categoriaNome = catGeral.nome
              desc = partes.length > 1 ? partes.slice(0, -1).join(' ') : (desc || catNome)
              break
            }
          }
        }
        if (!categoriaNome) {
          desc = partes.join(' ')
        }
      }
    }
    
    const data = new Date().toISOString().split('T')[0]
    const resultadoAuto: TransactionResult = { valor, tipo, data, descricao: desc, categoriaNome }
    
    setResultado(resultadoAuto)
    setSalvando(true)
    
    const payload: any = {
      descricao: desc,
      valor,
      data,
      tipo,
      status: 'pago'
    }
    if (categoriaNome) {
      const cat = categorias.find(c => c.nome.toLowerCase() === categoriaNome.toLowerCase())
      if (cat) payload.categoriaId = cat.id
    }
    
    api.post('/transactions', payload)
      .then(() => {
        setMensagem('✅ Salvo automaticamente!')
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        setTimeout(() => {
          setResultado(null)
          setTexto('')
          setTextoFalado('')
          setMensagem('')
        }, 2000)
      })
      .catch((error: any) => {
        setMensagem(`Erro: ${error?.response?.data?.message || error.message}`)
        setResultado(null)
      })
      .finally(() => setSalvando(false))
  }

return (
    <div className="premium-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-sky-500/20 rounded-xl">
          <Mic className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Transação por Voz</h3>
          <p className="text-slate-400 text-sm">Fale e salva automático</p>
        </div>
      </div>

      <div className="space-y-4">
        {resultado && (
          <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
            {salvando && <div className="flex items-center gap-2 text-sky-400"><Loader2 className="w-4 h-4 animate-spin" /><span>Salvando...</span></div>}
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
            {resultado.categoriaNome && (
              <div>
                <span className="text-slate-500 text-xs">Categoria</span>
                <p className="text-emerald-400">{resultado.categoriaNome}</p>
              </div>
            )}
            <div className="pt-2 border-t border-slate-700">
              <span className="text-xs text-slate-500">Você pode editar na lista de transações</span>
            </div>
          </div>
        )}

        {!resultado && (
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
              onClick={() => texto && processarESalvar(texto)}
              disabled={!texto.trim() || salvando}
              className="w-full btn-primary py-3"
            >
              Salvar Agora
            </button>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span>Exemplos:</span>
              <button onClick={() => processarESalvar('despesa 50 supermercado')} className="px-2 py-1 bg-slate-800 rounded-full hover:bg-slate-700">despesa 50</button>
              <button onClick={() => processarESalvar('receita 1000 salário')} className="px-2 py-1 bg-slate-800 rounded-full hover:bg-slate-700">receita 1000</button>
              <button onClick={() => processarESalvar('gastei 30 cinema')} className="px-2 py-1 bg-slate-800 rounded-full hover:bg-slate-700">gastei 30</button>
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