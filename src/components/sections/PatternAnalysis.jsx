import { useState, useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useStore } from '@/store/useStore'
import { parseCSV } from '@/utils/csvParser'
import { downloadFile } from '@/utils/exportData'
import {
  buildSystemPrompt, buildUserMessage,
  buildCommentSystemPrompt, buildCommentUserMessage
} from '@/utils/aiPrompt'

const PANEL_WIDTH = 360
const AI_PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'groq', label: 'Groq' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
]
const ENDPOINTS = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  // gemini-2.0-flash — current stable model, replaces deprecated gemini-pro
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
}

async function callAI(provider, apiKey, systemPrompt, userMessage) {
  let raw = ''
  if (provider === 'anthropic') {
    const r = await fetch(ENDPOINTS.anthropic, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, system: systemPrompt, messages: [{ role: 'user', content: userMessage }] }),
    })
    const d = await r.json()
    if (d.error) throw new Error(d.error.message)
    raw = d.content?.[0]?.text || ''
  } else if (provider === 'gemini') {
    const r = await fetch(`${ENDPOINTS.gemini}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + '\n\n' + userMessage }] }] }),
    })
    const d = await r.json()
    if (d.error) throw new Error(d.error.message)
    raw = d.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } else {
    const r = await fetch(ENDPOINTS[provider], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: provider === 'groq' ? 'llama-3.3-70b-versatile' : 'openai/gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
        max_tokens: 1500
      }),
    })
    const d = await r.json()
    if (d.error) throw new Error(d.error.message || JSON.stringify(d.error))
    raw = d.choices?.[0]?.message?.content || ''
  }
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

async function fetchYTComments(videoUrl, maxCount, includeReplies, ytApiKey) {
  const match = videoUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
  const videoId = match ? match[1] : videoUrl.trim()
  if (!videoId || videoId.length !== 11) throw new Error('Could not extract video ID')
  let allComments = []
  let pageToken = ''
  const perPage = Math.min(maxCount, 100)
  do {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=${perPage}&order=relevance${pageToken ? '&pageToken=' + pageToken : ''}&key=${ytApiKey}`
    const r = await fetch(url)
    const d = await r.json()
    if (d.error) throw new Error(d.error.message)
    for (const item of (d.items || [])) {
      const top = item.snippet.topLevelComment.snippet
      allComments.push({ id: item.id, text: top.textDisplay.replace(/<[^>]*>/g, '').trim(), likes: top.likeCount || 0, author: top.authorDisplayName, date: top.publishedAt?.slice(0, 10) || '', isReply: false })
      if (includeReplies && item.replies?.comments) {
        for (const reply of item.replies.comments) {
          const rs = reply.snippet
          allComments.push({ id: reply.id, text: rs.textDisplay.replace(/<[^>]*>/g, '').trim(), likes: rs.likeCount || 0, author: rs.authorDisplayName, date: rs.publishedAt?.slice(0, 10) || '', isReply: true })
        }
      }
      if (allComments.length >= maxCount) break
    }
    pageToken = d.nextPageToken || ''
  } while (pageToken && allComments.length < maxCount)
  return allComments.slice(0, maxCount).sort((a, b) => b.likes - a.likes)
}

export function PatternAnalysis() {
  const { entries, aiProvider, aiApiKey, ytApiKey } = useStore()
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [outlierSource, setOutlierSource] = useState('store')
  const [uploadedEntries, setUploadedEntries] = useState([])
  const [outlierFilter, setOutlierFilter] = useState('qualified')
  const [outlierRunning, setOutlierRunning] = useState(false)
  const [outlierResult, setOutlierResult] = useState(null)
  const [outlierError, setOutlierError] = useState('')
  const [commentURL, setCommentURL] = useState('')
  const [commentMax, setCommentMax] = useState('100')
  const [commentMinLikes, setCommentMinLikes] = useState('0')
  const [commentReplies, setCommentReplies] = useState('no')
  const [commentFetching, setCommentFetching] = useState(false)
  const [commentFetchLog, setCommentFetchLog] = useState('// Enter a video URL to fetch comments')
  const [commentFetchLogType, setCommentFetchLogType] = useState('info')
  const [allComments, setAllComments] = useState([])
  const [commentRunning, setCommentRunning] = useState(false)
  const [commentResult, setCommentResult] = useState(null)
  const [commentError, setCommentError] = useState('')
  const [activeTab, setActiveTab] = useState('outlier')

  const outlierData = useMemo(() => {
    const base = outlierSource === 'store' ? entries : uploadedEntries
    return outlierFilter === 'qualified' ? base.filter(e => e.qualifies) : base
  }, [outlierSource, uploadedEntries, entries, outlierFilter])

  const filteredComments = useMemo(() => {
    const minL = parseInt(commentMinLikes) || 0
    return allComments.filter(c => c.likes >= minL)
  }, [allComments, commentMinLikes])

  function handleCSVUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const r = new FileReader()
    r.onload = ev => {
      try { setUploadedEntries(parseCSV(ev.target.result)) }
      catch { alert('Could not parse CSV file') }
    }
    r.readAsText(file)
    e.target.value = ''
  }

  async function runOutlierAnalysis() {
    if (!outlierData.length) { setOutlierError('No data to analyse.'); return }
    if (!aiApiKey) { setOutlierError('No AI API key configured. Go to API Keys settings.'); return }
    setOutlierRunning(true); setOutlierError(''); setOutlierResult(null)
    try { setOutlierResult(await callAI(aiProvider, aiApiKey, buildSystemPrompt(), buildUserMessage(outlierData))) }
    catch (e) { setOutlierError('Analysis failed: ' + e.message) }
    setOutlierRunning(false)
  }

  async function handleFetchComments() {
    if (!commentURL.trim()) return
    if (!ytApiKey) { setCommentFetchLog('✗ No YouTube API key.'); setCommentFetchLogType('err'); return }
    setCommentFetching(true); setAllComments([]); setCommentResult(null)
    setCommentFetchLog('Fetching comments...'); setCommentFetchLogType('info')
    try {
      const comments = await fetchYTComments(commentURL.trim(), parseInt(commentMax) || 100, commentReplies === 'yes', ytApiKey)
      setAllComments(comments)
      const filtered = comments.filter(c => c.likes >= (parseInt(commentMinLikes) || 0))
      setCommentFetchLog(`✓ ${comments.length} comments fetched. ${filtered.length} pass the likes filter.`)
      setCommentFetchLogType('ok')
    } catch (e) { setCommentFetchLog('✗ ' + e.message); setCommentFetchLogType('err') }
    setCommentFetching(false)
  }

  async function runCommentAnalysis() {
    if (!filteredComments.length) { setCommentError('No comments to analyse.'); return }
    if (!aiApiKey) { setCommentError('No AI API key configured.'); return }
    setCommentRunning(true); setCommentError(''); setCommentResult(null)
    try { setCommentResult(await callAI(aiProvider, aiApiKey, buildCommentSystemPrompt(), buildCommentUserMessage(filteredComments))) }
    catch (e) { setCommentError('Analysis failed: ' + e.message) }
    setCommentRunning(false)
  }

  const date = new Date().toISOString().slice(0, 10)

  function exportComments(format) {
    if (format === 'json') {
      downloadFile(JSON.stringify(allComments, null, 2), `comments_${date}.json`, 'application/json')
    } else {
      const hdr = 'likes,is_reply,date,author,text'
      const rows = allComments.map(c => [c.likes, c.isReply ? 'reply' : 'top', c.date, `"${c.author?.replace(/"/g,'""')}"`, `"${c.text?.replace(/"/g,'""')}"`].join(','))
      downloadFile([hdr, ...rows].join('\n'), `comments_${date}.csv`, 'text/csv')
    }
  }

  function exportOutlierResult() {
    if (!outlierResult) return
    downloadFile(JSON.stringify(outlierResult, null, 2), `outlier_analysis_${date}.json`, 'application/json')
  }

  function exportCommentResult() {
    if (!commentResult) return
    downloadFile(JSON.stringify(commentResult, null, 2), `comment_analysis_${date}.json`, 'application/json')
  }

  const logColor = (t) => t === 'ok' ? 'text-green-400' : t === 'err' ? 'text-destructive' : 'text-primary'

  return (
    <div className="flex flex-1 overflow-hidden">

      <div className="flex-shrink-0 flex-grow-0 border-r border-border flex flex-col transition-all duration-200"
        style={{ width: leftCollapsed ? 0 : PANEL_WIDTH, minWidth: leftCollapsed ? 0 : PANEL_WIDTH, maxWidth: PANEL_WIDTH, overflow: 'hidden', position: 'relative' }}>
        <div className="px-3 py-2.5 border-b border-border bg-card flex-shrink-0 flex items-center justify-between" style={{ width: PANEL_WIDTH }}>
          <div className="min-w-0 overflow-hidden">
            <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary truncate">Pattern Analysis</p>
            <p className="text-[10px] text-muted-foreground truncate">AI-powered analysis</p>
          </div>
          <button onClick={() => setLeftCollapsed(true)} className="text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0 ml-2" title="Collapse panel">
            <PanelLeftClose size={14} />
          </button>
        </div>

        <ScrollArea className="flex-1" style={{ width: PANEL_WIDTH }}>
          <div style={{ width: PANEL_WIDTH, boxSizing: 'border-box' }} className="p-3 flex flex-col gap-3">

            <div className="border border-border p-3 flex flex-col gap-1" style={{ width: '100%', boxSizing: 'border-box' }}>
              <p className="font-head font-semibold text-[10px] tracking-widest uppercase text-muted-foreground">AI Provider</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-foreground">{AI_PROVIDERS.find(p => p.value === aiProvider)?.label || aiProvider}</span>
                <Badge variant={aiApiKey ? 'success' : 'destructive'} className="text-[9px]">{aiApiKey ? 'KEY SET' : 'NO KEY'}</Badge>
              </div>
              <Badge variant={ytApiKey ? 'success' : 'destructive'} className="text-[9px] w-fit">YouTube API: {ytApiKey ? 'Connected' : 'Not set'}</Badge>
              {(!aiApiKey || !ytApiKey) && <p className="text-[9px] text-muted-foreground mt-1">Configure keys in API Keys settings.</p>}
            </div>

            <div className="border border-primary/30 bg-card" style={{ width: '100%', boxSizing: 'border-box' }}>
              <div className="px-3 py-2 border-b border-primary/20 bg-primary/5">
                <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">Mode 1 — Outlier Patterns</p>
              </div>
              <div className="p-3 flex flex-col gap-3" style={{ width: '100%', boxSizing: 'border-box' }}>
                <div>
                  <Label>Data Source</Label>
                  <Select value={outlierSource} onValueChange={setOutlierSource}>
                    <SelectTrigger className="text-[10px] w-full mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store" className="text-[10px]">Use Research Table ({entries.length} entries)</SelectItem>
                      <SelectItem value="upload" className="text-[10px]">Upload CSV file</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {outlierSource === 'upload' && (
                  <div>
                    <Label>Upload Outlier CSV</Label>
                    <input type="file" accept=".csv,.json" onChange={handleCSVUpload}
                      className="mt-1 text-[10px] text-muted-foreground file:mr-2 file:py-1 file:px-2 file:border file:border-border file:bg-card file:text-[10px] file:text-foreground file:cursor-pointer w-full" />
                    {uploadedEntries.length > 0 && <p className="text-[9px] text-green-400 mt-1">{uploadedEntries.length} entries loaded</p>}
                  </div>
                )}
                <div>
                  <Label>Filter</Label>
                  <Select value={outlierFilter} onValueChange={setOutlierFilter}>
                    <SelectTrigger className="text-[10px] w-full mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualified" className="text-[10px]">Qualified only ({(outlierSource === 'store' ? entries : uploadedEntries).filter(e => e.qualifies).length})</SelectItem>
                      <SelectItem value="all" className="text-[10px]">All entries ({(outlierSource === 'store' ? entries : uploadedEntries).length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Sending to AI:</span>
                  <span className="text-primary font-bold">{outlierData.length} videos</span>
                </div>
                {outlierError && <p className="text-[10px] text-destructive break-words">{outlierError}</p>}
                <Button className="w-full text-xs" onClick={runOutlierAnalysis} disabled={outlierRunning || !outlierData.length}>
                  {outlierRunning ? <span className="flex items-center gap-2"><Spinner size={12} /> Analysing...</span> : 'Run Outlier Analysis'}
                </Button>
              </div>
            </div>

            <div className="border border-primary/30 bg-card" style={{ width: '100%', boxSizing: 'border-box' }}>
              <div className="px-3 py-2 border-b border-primary/20 bg-primary/5">
                <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">Mode 2 — Comment Analysis</p>
              </div>
              <div className="p-3 flex flex-col gap-3" style={{ width: '100%', boxSizing: 'border-box' }}>
                <div>
                  <Label>Video URL or ID</Label>
                  <Input value={commentURL} onChange={e => setCommentURL(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full text-[10px] mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Max Comments</Label>
                    <Select value={commentMax} onValueChange={setCommentMax}>
                      <SelectTrigger className="text-[10px] mt-1 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['50','100','200','500'].map(v => <SelectItem key={v} value={v} className="text-[10px]">{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Replies</Label>
                    <Select value={commentReplies} onValueChange={setCommentReplies}>
                      <SelectTrigger className="text-[10px] mt-1 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no" className="text-[10px]">Top level only</SelectItem>
                        <SelectItem value="yes" className="text-[10px]">Include replies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full text-xs" onClick={handleFetchComments} disabled={commentFetching || !commentURL.trim()}>
                  {commentFetching ? <span className="flex items-center gap-2"><Spinner size={12} /> Fetching...</span> : 'Fetch Comments'}
                </Button>
                <div className={`p-2 bg-background border border-border text-[10px] font-mono min-h-[28px] break-all ${logColor(commentFetchLogType)}`}
                  style={{ width: '100%', boxSizing: 'border-box', overflowWrap: 'break-word' }}>
                  {commentFetchLog}
                </div>
                {allComments.length > 0 && (
                  <>
                    <div>
                      <Label>Min Likes Filter</Label>
                      <Input value={commentMinLikes} onChange={e => setCommentMinLikes(e.target.value)} type="number" min="0" placeholder="0 = include all" className="w-full text-[10px] mt-1" />
                      <p className="text-[9px] text-muted-foreground mt-1">{filteredComments.length} of {allComments.length} comments pass filter</p>
                    </div>
                    <div className="flex gap-1">
                      <Button className="flex-1 text-[10px]" size="sm" onClick={runCommentAnalysis} disabled={commentRunning || !filteredComments.length}>
                        {commentRunning ? <span className="flex items-center gap-1"><Spinner size={11} /> Analysing...</span> : 'Run AI Analysis'}
                      </Button>
                      <Button variant="outline" className="text-[10px]" size="sm" onClick={() => exportComments('json')}>JSON</Button>
                      <Button variant="outline" className="text-[10px]" size="sm" onClick={() => exportComments('csv')}>CSV</Button>
                    </div>
                    {commentError && <p className="text-[10px] text-destructive break-words">{commentError}</p>}
                  </>
                )}
              </div>
            </div>

          </div>
        </ScrollArea>
      </div>

      {leftCollapsed && (
        <button onClick={() => setLeftCollapsed(false)} className="flex-shrink-0 flex items-center justify-center w-6 bg-card border-r border-border text-muted-foreground hover:text-primary transition-colors" title="Expand panel">
          <PanelLeftOpen size={14} />
        </button>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="border-b border-border flex-shrink-0 px-3">
            <TabsTrigger value="outlier" className="text-[10px]">Outlier Patterns</TabsTrigger>
            <TabsTrigger value="comments" className="text-[10px]">Comment Analysis</TabsTrigger>
            {allComments.length > 0 && <TabsTrigger value="commentsraw" className="text-[10px]">Raw Comments ({allComments.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="outlier" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 max-w-3xl mx-auto flex flex-col gap-4">
                {!outlierResult ? (
                  <EmptyState icon={outlierRunning ? <Spinner size={28} /> : '◈'}
                    title={outlierRunning ? 'Running analysis...' : 'No analysis yet'}
                    sub={outlierRunning ? 'Sending data to AI, please wait' : 'Configure data source in left panel and run Outlier Analysis'} />
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={exportOutlierResult}>Export Result JSON</Button>
                    </div>
                    <ResultSection title="Dominant Patterns">
                      <div className="grid grid-cols-2 gap-2">
                        {[['Title Type', outlierResult.dominant_title_type], ['Hook Structure', outlierResult.dominant_hook], ['Emotional Trigger', outlierResult.dominant_emotion], ['Pacing', outlierResult.dominant_pacing]].map(([label, value]) => (
                          <div key={label} className="border border-border bg-background p-2">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
                            <p className="text-primary font-head font-bold text-xs mt-0.5">{value}</p>
                          </div>
                        ))}
                      </div>
                    </ResultSection>
                    <ResultSection title="Pattern Statement"><p className="text-[11px] text-foreground leading-relaxed">{outlierResult.pattern_statement}</p></ResultSection>
                    <ResultSection title="Narrative Arc">
                      <div className="flex flex-col gap-1">
                        {outlierResult.narrative_arc?.map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[9px] text-primary border border-primary px-1 flex-shrink-0 mt-0.5">{i + 1}</span>
                            <span className="text-[10px] text-foreground">{step}</span>
                          </div>
                        ))}
                      </div>
                    </ResultSection>
                    <ResultSection title="Title Formulas">
                      <div className="flex flex-col gap-2">
                        {outlierResult.title_formulas?.map((f, i) => (
                          <div key={i} className={`px-3 py-2 border border-border text-[10px] text-foreground ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>{f}</div>
                        ))}
                      </div>
                    </ResultSection>
                    <ResultSection title="Production Checklist">
                      <div className="flex flex-col gap-1.5">
                        {outlierResult.production_checklist?.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-primary text-xs flex-shrink-0">☐</span>
                            <span className="text-[10px] text-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </ResultSection>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 max-w-3xl mx-auto flex flex-col gap-4">
                {!commentResult ? (
                  <EmptyState icon={commentRunning ? <Spinner size={28} /> : '◈'}
                    title={commentRunning ? 'Running analysis...' : 'No analysis yet'}
                    sub={commentRunning ? 'Sending comments to AI, please wait' : 'Fetch comments using the left panel then run AI Analysis'} />
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={exportCommentResult}>Export Result JSON</Button>
                    </div>
                    <ResultSection title="Dominant Audience Emotion">
                      <div className="border border-primary/40 bg-primary/5 p-3 inline-block">
                        <p className="font-head font-bold text-lg tracking-widest text-primary">{commentResult.audience_emotion}</p>
                      </div>
                    </ResultSection>
                    {[
                      { title: 'Recurring Questions from Audience', key: 'recurring_questions', icon: '?', color: 'text-primary', note: "Questions the audience repeatedly asks that existing videos don't answer." },
                      { title: 'Content Complaints', key: 'content_complaints', icon: '✗', color: 'text-destructive', note: 'Specific things the audience says existing videos fail to cover.' },
                      { title: 'Content Gaps', key: 'content_gaps', icon: '→', color: 'text-yellow-400', note: 'Topics the audience wants that no existing video provides.' },
                      { title: 'Title Ideas from Comments', key: 'title_ideas', icon: null, color: null, note: 'Video titles derived directly from what the audience is asking.' },
                    ].map(({ title, key, icon, color, note }) => (
                      <ResultSection key={key} title={title}>
                        <p className="text-[9px] text-muted-foreground">{note}</p>
                        <div className="flex flex-col gap-1.5 mt-1">
                          {commentResult[key]?.map((item, i) => (
                            <div key={i} className={`flex items-start gap-2 px-3 py-2 border border-border text-[10px] ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                              {icon && <span className={`${color} flex-shrink-0`}>{icon}</span>}
                              <span className="text-foreground font-medium">{item}</span>
                            </div>
                          ))}
                        </div>
                      </ResultSection>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {allComments.length > 0 && (
            <TabsContent value="commentsraw" className="flex-1 overflow-hidden">
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-card flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">{filteredComments.length} shown (min {commentMinLikes || 0} likes)</span>
                  <span className="text-[10px] text-muted-foreground">Sorted by likes ↓</span>
                  <div className="flex gap-1 ml-auto">
                    <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => exportComments('json')}>Export JSON</Button>
                    <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => exportComments('csv')}>Export CSV</Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full border-collapse" style={{ minWidth: 500 }}>
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-card border-b border-border">
                        <th className="px-3 py-2 text-left text-[10px] font-head uppercase tracking-widest text-muted-foreground w-12">Likes</th>
                        <th className="px-3 py-2 text-left text-[10px] font-head uppercase tracking-widest text-muted-foreground w-16">Type</th>
                        <th className="px-3 py-2 text-left text-[10px] font-head uppercase tracking-widest text-muted-foreground">Comment</th>
                        <th className="px-3 py-2 text-left text-[10px] font-head uppercase tracking-widest text-muted-foreground w-24">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComments.map((c, i) => (
                        <tr key={c.id} className={`border-b border-border ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                          <td className="px-3 py-2 text-[10px] text-primary font-bold">{c.likes}</td>
                          <td className="px-3 py-2 text-[9px]"><Badge variant={c.isReply ? 'secondary' : 'outline'} className="text-[8px]">{c.isReply ? 'reply' : 'top'}</Badge></td>
                          <td className="px-3 py-2 text-[10px] text-foreground" style={{ maxWidth: 400 }}>{c.text}</td>
                          <td className="px-3 py-2 text-[10px] text-muted-foreground">{c.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
      {typeof icon === 'string' ? <span className="text-3xl opacity-30">{icon}</span> : icon}
      <p className="text-xs tracking-widest uppercase">{title}</p>
      <p className="text-[10px] text-center max-w-xs">{sub}</p>
    </div>
  )
}

function ResultSection({ title, children }) {
  return (
    <div className="border border-border">
      <div className="px-3 py-2 bg-card border-b border-border">
        <p className="font-head font-semibold text-[10px] tracking-widest uppercase text-primary">{title}</p>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}
