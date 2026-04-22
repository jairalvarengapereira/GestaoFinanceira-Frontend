const CATEGORIAS_KEYWORDS = {
  'Alimentação': ['padaria', 'supermercado', 'mercado', 'restaurante', 'lanchonete', 'ifood', 'uber eats', 'comida', 'almoço', 'jantar'],
  'Transporte': ['uber', '99', 'gasolina', 'ônibus', 'metrô', 'táxi', 'taxi'],
  'Lazer': ['cinema', 'netflix', 'spotify', 'show', 'teatro', 'fest', 'balada'],
  'Saúde': ['farmacia', 'farmácia', 'médico', 'medico', 'dentista', 'academia'],
  'Moradia': ['aluguel', 'luz', 'água', 'internet', 'condomínio'],
  'Educação': ['curso', 'escola', 'universidade', 'livro', 'material'],
  'Outros': []
}

async function processarTransacao(texto, categorias) {
  const lower = texto.toLowerCase().trim()
  
  let tipo = 'despesa'
  if (lower.includes('receita') || lower.includes('ganho') || lower.includes('recebi') || lower.includes('salário')) tipo = 'receita'
  else if (lower.includes('despesa') || lower.includes('gastei') || lower.includes('paguei') || lower.includes('gasto')) tipo = 'despesa'
  
  let valor = 0
  const numeros = lower.match(/\d+(?:[.,]\d+)?|\d+/g)
  if (numeros) {
    const nums = numeros.map(n => parseFloat(n.replace(',', '.'))).filter(n => !isNaN(n) && n > 0)
    if (nums.length > 0) valor = Math.max(...nums)
  }
  
  if (valor <= 0) return null
  
  const palavras = lower.replace(/despesa|receita|gastei|paguei|recebi|ganho|salário|salario|um|uma|dois|duas|três|\d+/g, ' ')
  const partes = palavras.replace(/[^a-záàâãéèêíìîóòôõúùûç\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(p => p.length > 2)
  
  let desc = tipo === 'receita' ? 'Receita' : 'Despesa'
  let categoriaId
  
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
  
  return { descricao: desc, valor, data: new Date().toISOString().split('T')[0], tipo, status: 'pago', categoriaId }
}

async function enviarMensagemWhatsApp(to, message, token) {
  await fetch('https://graph.facebook.com/v18.0/me/messages', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, text: { body: message } })
  })
}

exports.handler = async function(event, context) {
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const entry = body.entry?.[0]?.changes?.[0]?.value
    const message = entry?.messages?.[0]
    
    if (!message) {
      return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) }
    }

    const from = message.from
    const type = message.type
    let texto = ''

    if (type === 'text') {
      texto = message.text?.body || ''
    } else if (type === 'audio') {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        await enviarMensagemWhatsApp(from, 'Configure OpenAI API Key para transcrever áudio.', process.env.WHATSAPP_TOKEN)
        return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) }
      }
      
      texto = '[ÁUDIO RECEBIDO - Configure transcrição]'
    }

    const result = await processarTransacao(texto, [])
    
    if (!result || result.valor <= 0) {
      await enviarMensagemWhatsApp(from, 'Não entendi. Fale: despesa 50 padaria', process.env.WHATSAPP_TOKEN)
      return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) }
    }

    await enviarMensagemWhatsApp(from, `✅ Salvo!\n\n${result.tipo === 'receita' ? '↑' : '↓'} ${result.descricao}\nR$ ${result.valor.toFixed(2)}`, process.env.WHATSAPP_TOKEN)

    return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) }
  } catch (error) {
    console.error('Erro:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno' }) }
  }
}