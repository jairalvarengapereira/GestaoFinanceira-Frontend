import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

const CATEGORIAS_KEYWORDS: Record<string, string[]> = {
  'Alimentação': ['padaria', 'supermercado', 'mercado', 'restaurante', 'lanchonete', 'ifood', 'uber eats', 'comida', 'almoço', 'jantar'],
  'Transporte': ['uber', '99', 'gasolina', 'ônibus', 'metrô', 'táxi', 'taxi'],
  'Lazer': ['cinema', 'netflix', 'spotify', 'show', 'teatro', 'fest', 'balada'],
  'Saúde': ['farmacia', 'farmácia', 'médico', 'medico', 'dentista', 'academia'],
  'Moradia': ['aluguel', 'luz', 'água', 'internet', 'condomínio'],
  'Educação': ['curso', 'escola', 'universidade', 'livro', 'material'],
  'Outros': []
}

export default function VoiceFAB() {
  const queryClient = useQueryClient()
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [categorias, setCategorias] = useState<any[]>([])
  const [gravando, setGravando] = useState(false)
  const [textoFalado, setTextoFalado] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    api.get('/categories').then(res => setCategorias(res.data)).catch(() => {})
  }, [])

  const iniciarGravacao = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      setMensagem('Navegador não suporta voz')
      setAberto(true)
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
      setTimeout(() => salvarTransacao(transcript), 300)
    }

    recognition.onerror = (event: any) => {
      setGravando(false)
      if (event.error === 'no-speech') setMensagem('Nenhuma fala detectada')
    }

    recognition.onend = () => setGravando(false)

    recognitionRef.current = recognition
    recognition.start()
    setAberto(true)
  }

  const salvarTransacao = async (texto: string) => {
    setGravando(false)
    setMensagem('Salvando...')

    const lower = texto.toLowerCase().trim()
    
    let tipo: 'receita' | 'despesa' = 'despesa'
    if (lower.includes('receita') || lower.includes('ganho') || lower.includes('recebi') || lower.includes('salário')) tipo = 'receita'
    else if (lower.includes('despesa') || lower.includes('gastei') || lower.includes('paguei') || lower.includes('gasto')) tipo = 'despesa'
    
    let valor = 0
    const numeros = lower.match(/\d+(?:[.,]\d+)?|\d+/g)
    if (numeros) {
      const nums = numeros.map((n: string) => parseFloat(n.replace(',', '.'))).filter((n: number) => !isNaN(n) && n > 0)
      if (nums.length > 0) valor = Math.max(...nums)
    }
    
    if (valor <= 0) {
      setMensagem('Não entendi. Fale: despesa 50 padaria')
      return
    }
    
    const palavras = lower.replace(/despesa|receita|gastei|paguei|recebi|ganho|salário|salario|um|uma|dois|duas|três|\d+/g, ' ')
    const partes = palavras.replace(/[^a-záàâãéèêíìîóòôõúùûç\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(p => p.length > 2)
    
    let desc = tipo === 'receita' ? 'Receita' : 'Despesa'
    let categoriaId: number | undefined
    
    if (partes.length > 0) {
      const ultima = partes[partes.length - 1]
      const catEncontrada = categorias.find(c => c.nome.toLowerCase().includes(ultima) || ultima.includes(c.nome.toLowerCase()))
      if (catEncontrada) {
        categoriaId = catEncontrada.id
        desc = partes.length > 1 ? partes.slice(0, -1).join(' ') : catEncontrada.nome
      } else {
        for (const [catNome, keywords] of Object.entries(CATEGORIAS_KEYWORDS)) {
          if (keywords.some(k => ultima.includes(k))) {
            const cat = categorias.find(c => c.nome.toLowerCase() === catNome.toLowerCase())
            if (cat) { categoriaId = cat.id; break }
          }
        }
        if (!categoriaId) desc = partes.join(' ')
      }
    }
    
    const payload: any = { descricao: desc, valor, data: new Date().toISOString().split('T')[0], tipo, status: 'pago' }
    if (categoriaId) payload.categoriaId = categoriaId
    
    try {
      await api.post('/transactions', payload)
      setMensagem('✅ Salvo!')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setTimeout(() => setAberto(false), 1500)
    } catch {
      setMensagem('Erro ao salvar')
    }
  }

  return (
    <>
      <button
        onClick={iniciarGravacao}
        className="fixed bottom-6 right-6 w-14 h-14 bg-sky-500 hover:bg-sky-600 rounded-full shadow-lg shadow-sky-500/50 flex items-center justify-center transition-all z-50"
      >
        <Mic className="w-6 h-6 text-white" />
      </button>

      {aberto && (
        <div className="fixed bottom-24 right-6 w-72 premium-card p-4 z-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold">Transação por Voz</span>
            <button onClick={() => setAberto(false)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {gravando && (
            <div className="flex items-center gap-2 text-sky-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Ouvindo...</span>
            </div>
          )}

          {textoFalado && !gravando && (
            <div className="text-sm text-slate-400 mb-2">"{textoFalado}"</div>
          )}

          {mensagem && (
            <div className={`text-sm ${mensagem.includes('Salvo') ? 'text-emerald-400' : 'text-rose-400'}`}>
              {mensagem}
            </div>
          )}

          <div className="mt-3 text-xs text-slate-500">
            Fale: despesa 50 padaria
          </div>
        </div>
      )}
    </>
  )
}