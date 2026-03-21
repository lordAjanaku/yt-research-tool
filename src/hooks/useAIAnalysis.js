import { useStore } from '../store/useStore'
import { buildSystemPrompt, buildUserMessage } from '../utils/aiPrompt'

const ENDPOINTS = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
}

export function useAIAnalysis() {
  const { aiProvider, aiApiKey } = useStore()

  async function analyze(entries) {
    const systemPrompt = buildSystemPrompt()
    const userMessage = buildUserMessage(entries)
    let raw = ''

    if (aiProvider === 'anthropic') {
      const r = await fetch(ENDPOINTS.anthropic, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': aiApiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          temperature: 0,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error.message)
      raw = d.content?.[0]?.text || ''
    } else if (aiProvider === 'gemini') {
      const r = await fetch(`${ENDPOINTS.gemini}?key=${aiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\n' + userMessage }] }],
          generationConfig: { temperature: 0 }
        }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error.message)
      raw = d.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else {
      const r = await fetch(ENDPOINTS[aiProvider], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiApiKey}` },
        body: JSON.stringify({
          model: aiProvider === 'groq' ? 'llama-3.3-70b-versatile' : 'openai/gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
          max_tokens: 1000,
          temperature: 0
        }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error.message || JSON.stringify(d.error))
      raw = d.choices?.[0]?.message?.content || ''
    }

    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  }

  async function testKey() {
    return analyze([{ title: 'Test', titleType: 'Tension', emotion: 'Fear', hook: 'Bold Claim', pacing: 'Fast', arc: '', insight: '', chMult: 5, views: 100000 }])
  }

  return { analyze, testKey }
}
