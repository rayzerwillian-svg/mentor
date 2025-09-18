// /api/mentor.js  (Vercel Serverless Function)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { system, user, history = [] } = req.body || {};
  const openaiKey = process.env.OPENAI_API_KEY;

  // Sem OPENAI_API_KEY → responde via “mock” gastronômico inteligente
  if (!openaiKey) {
    const q = (user || '').toLowerCase();
    // exemplo: ingredientes reconhecidos
    if (q.includes('banana') && (q.includes('lombo') || q.includes('porco'))) {
      const text = [
        `🔹 **Reflexiva** — “Doçura, gordura e acidez: a tríade que dá vida ao prato.”`,
        `🔹 **Executiva** — *Lombo suíno laqueado com banana e pimenta, finalizado com limão*:\n` +
        `• Sele o lombo; deglace com suco de laranja; glace com mel/rapadura.\n` +
        `• Banana caramelizada (manteiga + mascavo + sal) + pimenta dedo-de-moça.\n` +
        `• Final: raspas e gotas de limão. Acomp.: purê de mandioca ou arroz de castanhas.\n` +
        `• CMV: padronize 160 g/porção; banana madura; controle perdas no mise en place.`,
        `🔹 **Didática** — A banana pede acidez e sal para equilíbrio; o laqueado traz brilho/umami. Textura crocante eleva valor percebido sem estourar custo.`
      ].join('\n');
      return res.status(200).json({ text });
    }
    const text = [
      `🔹 **Reflexiva** — “Decisão é corte com propósito. Qual é o propósito agora?”`,
      `🔹 **Executiva** — Diga objetivo, contexto e opções; devolvo plano em 3 camadas com riscos e métricas.`,
      `🔹 **Didática** — Assim evitamos genericidade e vamos ao aplicável.`
    ].join('\n');
    return res.status(200).json({ text });
  }

  // Com OpenAI (opcional — define OPENAI_API_KEY nas Environment Variables)
  try {
    const sys = `
${system || ''}
Regras:
- Responda SEMPRE à pergunta do usuário, concreta e específica para bares/restaurantes.
- Mantenha o formato: Reflexiva • Executiva • Didática.
- Se houver ingredientes/receitas, entregue ficha clara (técnica + CMV/execução).
`.trim();

    const historyText = history.map(m => `${m.role === 'user' ? 'Usuário' : 'Mentor'}: ${m.text}`).join('\n');
    const finalPrompt = `${sys}\n\nHistórico (recente):\n${historyText}\n\nUsuário: ${user}\nMentor:`.trim();

    const r = await fetch('https://api.openai.com/v1/responses', {
      method:'POST',
      headers:{
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type':'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: finalPrompt
      })
    });
    const data = await r.json();
    const text = data?.output_text || data?.text || JSON.stringify(data);
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'LLM call failed', details: String(e) });
  }
}
