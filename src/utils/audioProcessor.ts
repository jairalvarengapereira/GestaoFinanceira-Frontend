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
  'Alimentação': ['supermercado', 'mercado', 'comida', 'almoço', 'jantar', 'café', 'lanche', 'pizza', 'hambúrguer', 'restaurante', 'lanchonete', 'delivery', 'ifood', ' Rappi', 'uber eats', 'Padaria', 'padaria', 'açougue', 'fruteira', 'hortifruti'],
  'Transporte': ['uber', '99', '99pop', 'taxi', 'ônibus', 'metrô', 'metro', 'combustível', 'gasolina', 'álcool', 'etanol', 'diesel', 'posto', 'posto de gasolina', 'estacionamento', 'pedágio', 'pedagio', 'ipva', 'seguro carro', 'mecânico', 'mecanico', 'lava rapid', 'lavajato'],
  'Lazer': ['cinema', 'teatro', 'show', 'fest', 'balada', 'bar', 'boteco', 'pub', 'karaokê', 'karaoke', 'jogo', 'futebol', 'estádio', 'bilhete', 'park', 'Disney', 'netflix', 'spotify', 'apple music', 'amazon prime', 'globo play'],
  'Saúde': ['farmácia', 'farmacia', 'drogaria', 'médico', 'medico', 'consulta', 'exame', 'laboratório', 'laboratorio', 'hospital', 'clinica', 'clínica', 'dentista', 'psicólogo', 'psicologo', 'fisioterapeuta', 'fisioterapia', 'academia', 'smart fit', 'bio Ritmo', 'wellhub'],
  'Moradia': ['aluguel', 'condomínio', 'condominio', 'luz', 'água', 'agua', 'internet', 'wi-fi', 'wifi', 'net', 'claro', 'vivo', 'tim', 'oi', 'geladeira', 'móvel', 'movel', 'mobiliário', 'mobiliario', 'tinta', 'construção', 'construcao', 'ferramenta'],
  'Educação': ['curso', 'livro', 'escola', 'universidade', 'faculdade', 'mensalidade', 'mesada', 'colégio', 'colegio', 'apostila', 'material', 'papelaria', ' Udemy', 'coursera', 'alura', 'linkedin learning', 'youtube premium', 'skillshare'],
  'Outros': []
}

const TERMINOS_ENTRADA = ['recebi', 'recebimento', 'salário', 'salario', 'bônus', 'bonus', 'comissão', 'comissao', 'lucro', 'ganho', 'entrada', 'depositado', 'depósito', 'deposito', 'pago', 'paguei', 'ganhei', 'liquidado', 'quitação']

const TERMINOS_SAIDA = ['gastei', 'gasto', 'paguei', 'pague', 'pago', 'despesa', 'saída', 'saida', 'pagamento', 'boleto', 'conta', 'cobrança', 'cobranca']

const CATEGORIA_OUTROS = 'Outros'

export interface TransactionData {
  valor: number
  tipo: 'ENTRADA' | 'SAÍDA'
  data: string
  descricao: string
  categoria: string
  confianca_processamento: number
}

const hoje = new Date()
const hojeStr = hoje.toISOString().split('T')[0]

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
      const regexPrefixo = /(?:um|uma|duas|dois|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|vinte|trinta|quarenta|cinquenta)\s+/i
      const preceded = regexPrefixo.test(textoLower.split(palavra)[0].slice(-20))
      if (!preceded || palavra.includes('pau') || palavra.includes('conta')) {
        return { valor, confianca: preceded ? 0.85 : 0.7 }
      }
      const multiplicadores: Record<string, number> = {
        'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3,
        'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8,
        'nove': 9, 'dez': 10, 'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50
      }
      for (const [mult, val] of Object.entries(multiplicadores)) {
        if (textoLower.includes(`${mult} ${palavra}`)) {
          return { valor: val * valor, confianca: 0.8 }
        }
      }
    }
  }
  
  return { valor: 0, confianca: 0 }
}

function extrairTipo(texto: string): { tipo: 'ENTRADA' | 'SAÍDA'; confianca: number } {
  const textoLower = texto.toLowerCase()
  let scoreEntrada = 0
  let scoreSaida = 0

  for (const termo of TERMINOS_ENTRADA) {
    if (textoLower.includes(termo)) scoreEntrada += 1
  }
  for (const termo of TERMINOS_SAIDA) {
    if (textoLower.includes(termo)) scoreSaida += 1
  }

  const regexValores = textoLower.match(/(\d+(?:[.,]\d{1,2})?|cinquentão|cem|vinte|paus|contos|mil)/g)
  if (regexValores) {
    const prefixos = ['recebi', 'ganhei', 'entrou', 'salário', 'bônus']
    const sufixos = ['gastei', 'paguei', 'saída', 'despesa']
    
    for (const match of regexValores) {
      const idx = textoLower.indexOf(match)
      const prefixo = textoLower.slice(Math.max(0, idx - 20), idx)
      if (prefixos.some(p => prefixo.includes(p))) scoreEntrada += 1.5
      if (sufixos.some(s => prefixo.includes(s))) scoreSaida += 1.5
    }
  }

  if (scoreEntrada > scoreSaida) {
    return { tipo: 'ENTRADA', confianca: Math.min(0.95, 0.5 + scoreEntrada * 0.15) }
  } else if (scoreSaida > scoreEntrada) {
    return { tipo: 'SAÍDA', confianca: Math.min(0.95, 0.5 + scoreSaida * 0.15) }
  }
  
  return { tipo: 'SAÍDA', confianca: 0.5 }
}

function extrairData(texto: string): { data: string; confianca: number } {
  const textoLower = texto.toLowerCase()
  const dataProcessada = new Date(hojeStr)
  
  if (textoLower.includes('hoje')) {
    return { data: hojeStr, confianca: 1.0 }
  }
  
  if (textoLower.includes('ontem')) {
    dataProcessada.setDate(dataProcessada.getDate() - 1)
    return { data: dataProcessada.toISOString().split('T')[0], confianca: 1.0 }
  }
  
  if (textoLower.includes('anteontem') || textoLower.includes('ante-ontem')) {
    dataProcessada.setDate(dataProcessada.getDate() - 2)
    return { data: dataProcessada.toISOString().split('T')[0], confianca: 1.0 }
  }
  
  const regexSemana = textoLower.match(/semana passada?|semana retrasada?/)
  if (regexSemana) {
    dataProcessada.setDate(dataProcessada.getDate() - (regexSemana[0].includes('retrasada') ? 14 : 7))
    return { data: dataProcessada.toISOString().split('T')[0], confianca: 0.9 }
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
      dataProcessada.setMonth(meses[mesNome[0]])
      dataProcessada.setDate(dia)
      return { data: dataProcessada.toISOString().split('T')[0], confianca: 0.95 }
    }
  }
  
  const regexDataNum = textoLower.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (regexDataNum) {
    const [, d, m, a] = regexDataNum
    const ano = a.length === 2 ? `20${a}` : a
    return { data: `${ano}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, confianca: 0.95 }
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
  
  const remover = ['recebi', 'gastei', 'paguei', 'salário', 'salario', 'bônus', 'bonus', 'de', 'r$', 'r', 'hoje', 'ontem', 'amanhã', 'ontem', 'em', 'no', 'na']
  let desc = textoLower
  
  for (const termo of remover) {
    desc = desc.replace(new RegExp(`\\b${termo}\\b`, 'gi'), '').replace(new RegExp(`\\s+`, 'g'), ' ')
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

export function processarTranscricao(texto: string): TransactionData {
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
  
  const resultado: TransactionData = {
    valor: valorExtraido.valor,
    tipo: tipoExtraido.tipo,
    data: dataExtraida.data,
    descricao,
    categoria: categoriaExtraida.categoria,
    confianca_processamento: Math.round(confianca * 100) / 100
  }
  
  return resultado
}

export function TransactionDataToApi(data: TransactionData, categorias: any[]): any {
  const categoria = categorias.find(c => c.nome.toLowerCase() === data.categoria.toLowerCase())
  
  return {
    descricao: data.descricao,
    valor: data.valor,
    data: data.data,
    tipo: data.tipo === 'ENTRADA' ? 'receita' : 'despesa',
    categoriaId: categoria?.id || 1,
    status: 'pago'
  }
}