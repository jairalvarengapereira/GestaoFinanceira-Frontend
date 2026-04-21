const GIRIAS_VALORES = {
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

const CATEGORIAS_PALAVRAS_CHAVE = {
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

function extrairValor(texto) {
  const textoLower = texto.toLowerCase()
  
  const regexNumeros = /(?:r?\$?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|r\$)?/gi
  const matches = []
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

function extrairTipo(texto) {
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

function extrairData(texto) {
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
  
  return { data: hojeStr, confianca: 0.6 }
}

function extrairCategoria(texto) {
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

function extrairDescricao(texto, categoria) {
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

function processarTranscricao(texto) {
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

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    }
  }

  try {
    const texto = event.queryStringParameters?.texto || 
                  (event.body ? JSON.parse(event.body).texto : '')
    
    if (!texto) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Texto é obrigatório' }),
      }
    }

    const resultado = processarTranscricao(texto)
    
    return {
      statusCode: 200,
      body: JSON.stringify(resultado),
    }
  } catch (error) {
    console.error('Erro:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno' }),
    }
  }
}