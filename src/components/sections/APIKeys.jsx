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
  const {
    ytApiKey, setYtApiKey,
    aiProvider, setAiProvider,
    aiApiKey, setAiApiKey,
    outlierThreshold, setOutlierThreshold,
    channelBaseline, setChannelBaseline,
  } = useStore()

  const [ytStatus, setYtStatus] = useState('')
  const [aiStatus, setAiStatus] = useState('')
  const { testKey: testYT } = useYouTubeAPI()
  const { testKey: testAI } = useAIAnalysis()

  async function handleTestYT() {
    setYtStatus('Testing...')
    try { await testYT(); setYtStatus('Connected') }
    catch (e) { setYtStatus('Failed: ' + e.message) }
  }

  async function handleTestAI() {
    setAiStatus('Testing...')
    try { await testAI(); setAiStatus('Connected') }
    catch (e) { setAiStatus('Failed: ' + e.message) }
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* LEFT — API KEY INPUTS */}
      <div className="w-[300px] flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-card">
          <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">API Keys</p>
          <p className="text-xs text-muted-foreground">YouTube + AI provider</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 flex flex-col gap-5">

            {/* YOUTUBE API */}
            <div className="border border-border">
              <div className="px-3 py-2 bg-card border-b border-border">
                <p className="font-head font-semibold text-[10px] tracking-widest uppercase text-primary">YouTube Data API v3</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <Label>API Key</Label>
                <Input type="password" value={ytApiKey} onChange={e => setYtApiKey(e.target.value)}
                  placeholder="AIza..." className="font-mono text-xs w-full" />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleTestYT} className="text-xs">Test Key</Button>
                  {ytStatus && (
                    <span className={`text-xs ${ytStatus === 'Connected' ? 'text-green-400' : 'text-destructive'}`}>
                      {ytStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI PROVIDER */}
            <div className="border border-border">
              <div className="px-3 py-2 bg-card border-b border-border">
                <p className="font-head font-semibold text-[10px] tracking-widest uppercase text-primary">AI Provider</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <Label>Provider</Label>
                <Select value={aiProvider} onValueChange={setAiProvider}>
                  <SelectTrigger className="text-xs w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map(p => (
                      <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label>API Key</Label>
                <Input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)}
                  placeholder="Paste key..." className="font-mono text-xs w-full" />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleTestAI} className="text-xs">Test Key</Button>
                  {aiStatus && (
                    <span className={`text-xs ${aiStatus === 'Connected' ? 'text-green-400' : 'text-destructive'}`}>
                      {aiStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* OUTLIER CONFIG */}
            <div className="border border-border">
              <div className="px-3 py-2 bg-card border-b border-border">
                <p className="font-head font-semibold text-[10px] tracking-widest uppercase text-primary">Outlier Config</p>
              </div>
              <div className="p-3 flex flex-col gap-3">

                <div className="flex flex-col gap-1">
                  <Label>Outlier Threshold</Label>
                  <p className="text-[9px] text-muted-foreground">Minimum channel multiple a video needs to qualify as an outlier.</p>
                  <Select value={String(outlierThreshold)} onValueChange={v => setOutlierThreshold(Number(v))}>
                    <SelectTrigger className="text-xs w-full mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3" className="text-xs">3x — Lenient</SelectItem>
                      <SelectItem value="4" className="text-xs">4x — Standard (recommended)</SelectItem>
                      <SelectItem value="5" className="text-xs">5x — Strict</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Channel Baseline</Label>
                  <p className="text-[9px] text-muted-foreground">How many of the channel's recent videos to use when calculating the channel median.</p>
                  <Select value={String(channelBaseline)} onValueChange={v => setChannelBaseline(Number(v))}>
                    <SelectTrigger className="text-xs w-full mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10" className="text-xs">Last 10 videos</SelectItem>
                      <SelectItem value="15" className="text-xs">Last 15 videos (recommended)</SelectItem>
                      <SelectItem value="20" className="text-xs">Last 20 videos</SelectItem>
                      <SelectItem value="30" className="text-xs">Last 30 videos</SelectItem>
                      <SelectItem value="50" className="text-xs">Last 50 videos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="border border-border bg-background p-2">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Threshold</p>
                    <p className="text-primary font-bold text-sm mt-0.5">{outlierThreshold}x</p>
                  </div>
                  <div className="border border-border bg-background p-2">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Baseline</p>
                    <p className="text-primary font-bold text-sm mt-0.5">{channelBaseline} videos</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </ScrollArea>
      </div>

      {/* RIGHT — QUOTA + FREE PROVIDER GUIDE */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-xl flex flex-col gap-6">

          {/* YOUTUBE QUOTA */}
          <div className="border border-border">
            <div className="px-3 py-2 bg-card border-b border-border">
              <p className="font-head font-semibold text-[10px] tracking-widest uppercase text-primary">YouTube API Quota Guide</p>
            </div>
            <div className="p-3 flex flex-col gap-0">
              {[
                ['Single video fetch', '~3 units'],
                ['Multi-URL batch (50 videos)', '~3 units total'],
                ['Keyword search', '~100 units'],
                ['Channel analysis', '~50–200 units'],
                ['Comment fetch (100 comments)', '~1 unit'],
                ['Daily free quota', '10,000 units'],
              ].map(([op, cost], i) => (
                <div key={op} className={`flex justify-between py-2 text-xs border-b border-border ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'} px-2`}>
                  <span className="text-muted-foreground">{op}</span>
                  <span className="text-primary font-mono">{cost}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FREE AI PROVIDER GUIDE */}
          <div className="border border-border">
            <div className="px-3 py-2 bg-card border-b border-border">
              <p className="font-head font-semibold text-[10px] tracking-widest uppercase text-primary">Free AI Provider Guide</p>
            </div>
            <div className="p-3 flex flex-col gap-3">
              {[
                {
                  name: 'OpenRouter',
                  url: 'openrouter.ai',
                  steps: 'Sign up → Keys → Create Key',
                  note: 'Access to 30+ free models with one key. Best option for variety.',
                },
                {
                  name: 'Groq',
                  url: 'console.groq.com',
                  steps: 'Sign up → API Keys → Create API Key',
                  note: 'Fastest inference. Free tier with generous quota. Recommended for speed.',
                },
                {
                  name: 'Google Gemini',
                  url: 'aistudio.google.com',
                  steps: 'Sign in → Get API Key',
                  note: 'Free tier via Google AI Studio. Good quota for personal use.',
                },
              ].map(p => (
                <div key={p.name} className="border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-head font-bold text-xs text-primary tracking-wider">{p.name}</p>
                    <span className="text-[9px] text-muted-foreground font-mono">{p.url}</span>
                  </div>
                  <p className="text-[10px] text-foreground mb-1">{p.steps}</p>
                  <p className="text-[9px] text-muted-foreground">{p.note}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}
