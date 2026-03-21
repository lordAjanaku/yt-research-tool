import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import { useYouTubeAPI } from '@/hooks/useYouTubeAPI'
import { useAIAnalysis } from '@/hooks/useAIAnalysis'

const AI_PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter (free models)' },
  { value: 'groq', label: 'Groq (free tier)' },
  { value: 'gemini', label: 'Google Gemini (free tier)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
]

export function APIKeys() {
  const { ytApiKey, setYtApiKey, aiProvider, setAiProvider, aiApiKey, setAiApiKey } = useStore()
  const [ytStatus, setYtStatus] = useState('')
  const [aiStatus, setAiStatus] = useState('')
  const { testKey: testYT } = useYouTubeAPI()
  const { testKey: testAI } = useAIAnalysis()

  async function handleTestYT() {
    setYtStatus('Testing...')
    try { await testYT(); setYtStatus('Connected') } catch (e) { setYtStatus('Failed: ' + e.message) }
  }

  async function handleTestAI() {
    setAiStatus('Testing...')
    try { await testAI(); setAiStatus('Connected') } catch (e) { setAiStatus('Failed: ' + e.message) }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-[280px] flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-card">
          <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">API Keys</p>
          <p className="text-xs text-muted-foreground">YouTube + AI provider</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <Label className="text-xs tracking-widest uppercase text-muted-foreground">YouTube Data API v3</Label>
              <Input type="password" value={ytApiKey} onChange={e => setYtApiKey(e.target.value)} placeholder="AIza..." className="font-mono text-xs" />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleTestYT} className="text-xs">Test Key</Button>
                {ytStatus && <span className={`text-xs ${ytStatus === 'Connected' ? 'text-green-500' : 'text-destructive'}`}>{ytStatus}</span>}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-xs tracking-widest uppercase text-muted-foreground">AI Provider</Label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}</SelectContent>
              </Select>
              <Label className="text-xs tracking-widest uppercase text-muted-foreground">AI API Key</Label>
              <Input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)} placeholder="Paste key..." className="font-mono text-xs" />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleTestAI} className="text-xs">Test Key</Button>
                {aiStatus && <span className={`text-xs ${aiStatus === 'Connected' ? 'text-green-500' : 'text-destructive'}`}>{aiStatus}</span>}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6">
          <p className="font-head text-xs tracking-widest uppercase text-muted-foreground mb-4">Quota Guide</p>
          <div className="flex flex-col gap-2">
            {[
              ['Single video fetch', '~3 units'],
              ['Multi-URL batch (50 videos)', '~3 units total'],
              ['Keyword search', '~100 units'],
              ['Channel analysis', '~50–200 units'],
              ['Daily free quota', '10,000 units'],
            ].map(([op, cost]) => (
              <div key={op} className="flex justify-between border-b border-border pb-2 text-xs">
                <span className="text-muted-foreground">{op}</span>
                <span className="text-primary font-mono">{cost}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
