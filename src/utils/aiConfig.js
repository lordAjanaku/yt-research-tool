export const AI_PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'groq', label: 'Groq' },
  { value: 'gemini_flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini_pro', label: 'Gemini 2.5 Pro (Large Context)' },
  { value: 'gemini_lite', label: 'Gemini 2.5 Flash-Lite' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'deepseek', label: 'DeepSeek' },
]

export const ENDPOINTS = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini_flash: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  gemini_pro: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
  gemini_lite: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
}
