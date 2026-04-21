import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
const fetch = (...args: any) => import('node-fetch').then((m: any) => m.default(...args))

const GIRIAS_VALORES: Record<string, number> = {
  'cinquentão': 50,
  'cem': 100,
  'duzentão': 200,
  'trezentão': 300,
  'quatrocentão': 400,
  'quinhentão': 500,
  'seiscentão': 600,
  'setecentão': 700,
  'oitocentos': 800,
  'novecentão': 900,
  'mil': 1000,
  'vinte paus': 20,
  'trinta paus': 30,
  'quarenta paus': 40,
  'cinquenta paus': 50,
  'cem paus': 100,
  'dois contos': 2000,
  'três contos': 3000,
  'quatro contos': 4000,
  'cinco contos': 5000,
  'dez contos': 10000,
  'vinte contos': 20000,
}

const CATEGORIAS_PALAVRAS_CHAVE: Record<string, string[]> = {
  'Alimentação': ['supermercado', 'mercado', 'comida', 'almoço', 'jantar', 'café', 'lanche', 'pizza', 'hambúrguer', 'restaurante', 'lanchonete', 'delivery', 'ifood', 'rappi', 'uber eats', 'padaria', 'açougue', 'fruteira', 'hortifruti'],
  'Transporte': ['uber', '99', '99pop', 'taxi', 'ônibus', 'metrô', 'combustível', 'gasolina', 'álcool', 'etanol', 'diesel', 'posto', 'estacionamento', 'pedágio', 'ipva', 'seguro carro', 'mecânico', 'lava rapid', 'lavajato'],
  'Lazer': ['cinema', 'teatro', 'show', 'festa', 'balada', 'bar', 'boteco', 'pub', 'karaokê', 'jogo', 'futebol', 'estádio', 'park', 'disney', 'netflix', 'spotify', 'amazon prime', 'globo play'],
  'Saúde': ['farmácia', 'farmacia', 'drogaria', 'médico', 'medico', 'consulta', 'exame', 'laboratório', 'hospital', 'clínica', 'dentista', 'psicólogo', 'fisioterapeuta', 'fisioterapia', 'academia', 'smart fit', 'bio ritmo', 'wellhub'],
  'Moradia': ['aluguel', 'condomínio', 'luz', 'água', 'internet', 'wi-fi', 'wifi', 'net', 'claro', 'vivo', 'tim', 'oi', 'geladeira', 'móvel', 'mobiliário', 'tinta', 'construção', 'ferramenta'],
  'Educação': ['curso', 'livro', 'escola', 'universidade', 'faculdade', 'mensalidade', 'mesada', 'colégio', 'apostila', 'material', 'papelaria', 'udemy', 'coursera', 'alura', 'linkedin learning', 'youtube premium', 'skillshare'],
  'Outros': []
}

const TERMINOS_ENTRADA = ['recebi', 'recebimento', 'salário', 'bônus', 'comissão', 'lucro', 'ganho', 'entrada', 'depositado', 'depósito', 'pago', 'paguei', 'ganhei', 'liquidado', 'quitação']
const TERMINOS_SAIDA = ['gastei', 'gasto', 'paguei', 'pague', 'pago', 'despesa', 'saída', 'pagamento', 'boleto', 'conta', 'cobrança']

const CATEGORIA_OUTROS = 'Outros'

interface TransactionResult {
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  descricao: string
  categoria: string
  confianca_processamento: number
}

function extrairValor(texto: string): { valor: number; confianca: number } {
  const textoLower = texto.toLowerCase()
  
  const regexNumeros = /(?:r?\$?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|r\$)?/gi
  const matches: number[] = []
  let match
  
  while ((match = regexNumeros.exec(texto)) !== null) {
    const num = parseFloat(match[1].replace(',', '.'))
    if (!isNaN(num) && num > 0) {
      matches.push(num)
    }
  }
  
  if (matches.length > 0) {
    const maior = Math.max(...matches)
    return { valor: maior, confianca: 0.95 }
  }
  
  for (const [palavra, valor] of Object.entries(GIRIAS_VALORES)) {
    if (textoLower.includes(palavra)) {
      return { valor, confianca: 0.7 }
    }
  }
  
  return { valor: 0, confianca: 0 }
}

function extrairTipo(texto: string): { tipo: 'receita' | 'despesa'; confianca: number } {
  const textoLower = texto.toLowerCase()
  let scoreEntrada = 0
  let scoreSaida = 0

  for (const termo of TERMINOS_ENTRADA) {
    if (textoLower.includes(termo)) scoreEntrada += 1
  }
  for (const termo of TERMINOS_SAIDA) {
    if (textoLower.includes(termo)) scoreSaida += 1
  }

  if (scoreEntrada > scoreSaida) {
    return { tipo: 'receita', confianca: Math.min(0.95, 0.5 + scoreEntrada * 0.15) }
  } else if (scoreSaida > scoreEntrada) {
    return { tipo: 'despesa', confianca: Math.min(0.95, 0.5 + scoreSaida * 0.15) }
  }
  
  return { tipo: 'despesa', confianca: 0.5 }
}

function extrairData(texto: string): { data: string; confianca: number } {
  const textoLower = texto.toLowerCase()
  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]
  
  if (textoLower.includes('hoje')) {
    return { data: hojeStr, confianca: 1.0 }
  }
  
  if (textoLower.includes('ontem')) {
    const ont = new Date(hoje)
    ont.setDate(ont.getDate() - 1)
    return { data: ont.toISOString().split('T')[0], confianca: 1.0 }
  }
  
  if (textoLower.includes('anteontem') || textoLower.includes('ante-ontem')) {
    const ant = new Date(hoje)
    ant.setDate(ant.getDate() - 2)
    return { data: ant.toISOString().split('T')[0], confianca: 1.0 }
  }
  
  const regexSemana = textoLower.match(/semana passada?|semana retrasada?/)
  if (regexSemana) {
    const sem = new Date(hoje)
    sem.setDate(sem.getDate() - (regexSemana[0].includes('retrasada') ? 14 : 7))
    return { data: sem.toISOString().split('T')[0], confianca: 0.9 }
  }
  
  const regexDia = textoLower.match(/(\d{1,2})\s*(?:de)?\s*(?:janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/)
  if (regexDia) {
    const meses: Record<string, number> = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2, 'abril': 3,
      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7, 'setembro': 8,
      'outubro': 9, 'novembro': 10, 'dezembro': 11
    }
    const dia = parseInt(regexDia[1])
    const mesNome = textoLower.match(/(?:janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/)
    if (mesNome && meses[mesNome[0]] !== undefined) {
      const dataProc = new Date(hoje)
      dataProc.setMonth(meses[mesNome[0]])
      dataProc.setDate(dia)
      return { data: dataProc.toISOString().split('T')[0], confianca: 0.95 }
    }
  }
  
  return { data: hojeStr, confianca: 0.6 }
}

function extrairCategoria(texto: string): { categoria: string; confianca: number } {
  const textoLower = texto.toLowerCase()
  
  let melhorCategoria = CATEGORIA_OUTROS
  let melhorScore = 0
  
  for (const [categoria, palavras] of Object.entries(CATEGORIAS_PALAVRAS_CHAVE)) {
    let score = 0
    for (const palavra of palavras) {
      if (textoLower.includes(palavra.toLowerCase())) {
        score += 1
      }
    }
    if (score > melhorScore) {
      melhorScore = score
      melhorCategoria = categoria
    }
  }
  
  if (melhorScore > 0) {
    return { categoria: melhorCategoria, confianca: Math.min(0.95, 0.5 + melhorScore * 0.2) }
  }
  
  return { categoria: CATEGORIA_OUTROS, confianca: 0.4 }
}

function extrairDescricao(texto: string, categoria: string): string {
  const textoLower = texto.toLowerCase()
  
  const remover = ['recebi', 'gastei', 'paguei', 'salário', 'bônus', 'de', 'r$', 'r', 'hoje', 'ontem', 'amanhã', 'em', 'no', 'na']
  let desc = textoLower
  
  for (const termo of remover) {
    desc = desc.replace(new RegExp(`\\b${termo}\\b`, 'gi'), '').replace(/\s+/g, ' ')
  }
  
  const numeros = desc.match(/\d+([.,]\d+)?/g)
  if (numeros) {
    for (const n of numeros) {
      desc = desc.replace(n, '')
    }
  }
  
  desc = desc.replace(/[^a-záàâãéèêíìîóòôõúùûç]/gi, ' ')
           .replace(/\s+/g, ' ')
           .trim()
  
  if (desc.length < 3) {
    return categoria === CATEGORIA_OUTROS ? 'Transação' : `Transação - ${categoria}`
  }
  
  return desc.charAt(0).toUpperCase() + desc.slice(1)
}

function processarTranscricao(texto: string): TransactionResult {
  const valorExtraido = extrairValor(texto)
  const tipoExtraido = extrairTipo(texto)
  const dataExtraida = extrairData(texto)
  const categoriaExtraida = extrairCategoria(texto)
  
  const descricao = extrairDescricao(texto, categoriaExtraida.categoria)
  
  const confianca = (
    valorExtraido.confianca * 0.35 +
    tipoExtraido.confianca * 0.2 +
    dataExtraida.confianca * 0.15 +
    categoriaExtraida.confianca * 0.3
  )
  
  return {
    valor: valorExtraido.valor,
    tipo: tipoExtraido.tipo,
    data: dataExtraida.data,
    descricao,
    categoria: categoriaExtraida.categoria,
    confianca_processamento: Math.round(confianca * 100) / 100
  }
}

async function transcreverAudio(audioUrl: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada')
  }
  
  const formData = new FormData()
  formData.append('file', await fetch(audioUrl).then((res: any) => res.blob()))
  formData.append('model', 'whisper-1')
  formData.append('language', 'pt')
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  })
  
  if (!response.ok) {
    throw new Error(`Erro na transcrição: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.text
}

async function salvarTransacao(transacao: TransactionResult, userId: number): Promise<any> {
  const apiUrl = process.env.API_URL || 'https://gestaofinanceira-backend.fly.dev/api'
  const token = process.env.API_TOKEN
  
  const payload = {
    descricao: transacao.descricao,
    valor: transacao.valor,
    data: transacao.data,
    tipo: transacao.tipo,
    categoriaId: 1,
    status: 'pago'
  }
  
  const response = await fetch(`${apiUrl}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  
  if (!response.ok) {
    throw new Error(`Erro ao salvar transação: ${response.statusText}`)
  }
  
  return response.json()
}

const handler: Handler = async function(event: HandlerEvent, _context: HandlerContext): Promise<HandlerResponse> {
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', message: 'WhatsApp Webhook ativo' }),
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    
    if (!message) {
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'ok', message: 'Nenhuma mensagem' }),
      }
    }

    const messageType = message.type
    const from = message.from
    
    let textoTranscrito = ''
    let audioUrl = ''
    
    if (messageType === 'audio') {
      const audioData = message.audio
      audioUrl = audioData?.mime_type || ''
      
      const mediaId = audioData?.id
      if (mediaId) {
        const tokenWhatsApp = process.env.WHATSAPP_TOKEN
        if (tokenWhatsApp) {
          const mediaResponse = await fetch(`https://graph.facebook.com/v17.0/${mediaId}`, {
            headers: {
              'Authorization': `Bearer ${tokenWhatsApp}`,
            },
          })
          const mediaData = await mediaResponse.json()
          audioUrl = mediaData.url
        }
      }
      
      if (audioUrl) {
        textoTranscrito = await transcreverAudio(audioUrl)
      }
    } else if (messageType === 'text') {
      textoTranscrito = message.text?.body || ''
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'ok', message: 'Tipo de mensagem não suportado' }),
      }
    }

    const transacao = processarTranscricao(textoTranscrito)
    
    if (transacao.confianca_processamento < 0.5 || transacao.valor <= 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: from,
          text: {
            body: 'Não consegui entender o áudio. Pode repetir ou digitar o valor?\n\nExemplo: "gastei 50 no supermercado"'
          }
        }),
      }
    }

    const responseMessage = `Entendi! 💰\n\n*${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}:* ${transacao.descricao}\n*Valor:* R$ ${transacao.valor.toFixed(2)}\n*Data:* ${new Date(transacao.data).toLocaleDateString('pt-BR')}\n*Categoria:* ${transacao.categoria}\n\nConfiança: ${(transacao.confianca_processamento * 100).toFixed(0)}%\n\n✅ Registrado!`
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: from,
        text: {
          body: responseMessage
        }
      }),
    }
  } catch (error) {
    console.error('Erro:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno' }),
    }
  }
}

export { handler }

type HandlerContext = {
  callbackWaitsForEmptyEventLoop: boolean
}