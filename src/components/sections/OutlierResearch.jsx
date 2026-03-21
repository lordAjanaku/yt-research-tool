import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStore } from '@/store/useStore'
import { useYouTubeAPI } from '@/hooks/useYouTubeAPI'
import { fmtNum, parseNum, calcMedian } from '@/utils/numbers'
import { toCSV, downloadFile } from '@/utils/exportData'
import { ResearchTable } from '@/components/outlier/ResearchTable'

const TITLE_TYPES = ['Tension','Mechanism','Contrarian','Stakes','Historical Revelation','Curiosity Gap']
const EMOTIONS = ['Fear','Curiosity','Outrage','Awe','Urgency','Validation']
const HOOKS = ['Bold Claim','Shocking Fact','Open Loop','Question','Contradiction']
const PACING = ['Slow','Medium','Fast']
const COMMENTS = ['No','Yes']

function QualifyBadge({ entry }) {
  if (!entry.views || !entry.chMedian || !entry.subs) {
    return <div className="text-center py-2 text-xs text-muted-foreground border border-border">ENTER DATA TO QUALIFY</div>
  }
  if (entry.qualifies) {
    return <div className="text-center py-2 text-xs font-head font-bold tracking-widest text-green-400 border border-green-800 bg-green-900/20">✓ QUALIFIES AS OUTLIER</div>
  }
  const reasons = []
  if (entry.subs >= 200) reasons.push('SUBS ≥200K')
  if (entry.chMult < 4) reasons.push('MULTIPLE <4x')
  if (entry.length < 7) reasons.push('LENGTH <7MIN')
  if (entry.comments === 'Yes') reasons.push('EXT. PUSHED')
  return <div className="text-center py-2 text-xs font-head font-bold tracking-widest text-destructive border border-red-900 bg-red-900/10">✗ FAILS: {reasons.join(' · ')}</div>
}

export function OutlierResearch() {
  const { entries, addEntry, outlierThreshold, channelBaseline } = useStore()
  const { fetchSingle, fetchMultiURL, fetchKeywordSearch } = useYouTubeAPI()

  const [fetchLog, setFetchLog] = useState('// Ready — enter API key in Settings to enable fetch')
  const [fetchLogType, setFetchLogType] = useState('info')
  const [singleURL, setSingleURL] = useState('')
  const [singleMedian, setSingleMedian] = useState('')
  const [multiURLs, setMultiURLs] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchPeriod, setSearchPeriod] = useState('12')
  const [searchMax, setSearchMax] = useState('20')
  const [batchResults, setBatchResults] = useState([])
  const [batchMedian, setBatchMedian] = useState(0)
  const [fetching, setFetching] = useState(false)
  const [progress, setProgress] = useState(0)

  const [form, setForm] = useState({
    search: '', median: '', title: '', channel: '', subs: '',
    views: '', length: '', date: '', comments: '', chMedian: '',
    titleType: '', emotion: '', thumbnail: '', hook: '', pacing: '', arc: '', insight: ''
  })

  function log(msg, type = 'info') { setFetchLog(msg); setFetchLogType(type) }

  function calcForm(f) {
    const views = parseNum(f.views)
    const chMedian = parseNum(f.chMedian || f.median)
    const subs = parseNum(f.subs)
    const length = parseFloat(f.length) || 0
    const chMult = chMedian > 0 ? parseFloat((views / chMedian).toFixed(2)) : 0
    const qualifies = subs < 200 && chMult >= outlierThreshold && length >= 7 && f.comments !== 'Yes'
    return { views, chMedian, subs, length, chMult, qualifies }
  }

  function populateForm(v) {
    setForm(f => ({ ...f, ...v }))
  }

  async function handleFetchSingle() {
    if (!singleURL) return
    setFetching(true); log('Fetching video...')
    try {
      const v = await fetchSingle(singleURL)
      if (singleMedian) v.median = singleMedian
      populateForm({
        title: v.title, channel: v.channel, subs: String(v.subs),
        views: String(v.views), length: String(v.length), date: v.date,
        chMedian: String(v.chMedian), comments: v.comments,
        median: singleMedian
      })
      log(`✓ Loaded: ${v.title}`, 'ok')
    } catch (e) { log('✗ ' + e.message, 'err') }
    setFetching(false)
  }

  async function handleFetchMulti() {
    const urls = multiURLs.split('\n').map(u => u.trim()).filter(Boolean)
    if (!urls.length) return
    setFetching(true); setProgress(10); log(`Fetching ${urls.length} videos...`)
    try {
      const results = await fetchMultiURL(urls)
      setProgress(100)
      setBatchMedian(results[0]?.searchMedian || 0)
      setBatchResults(results)
      log(`✓ ${results.length} videos. ${results.filter(v => v.qualifies).length} pre-qualified.`, 'ok')
    } catch (e) { log('✗ ' + e.message, 'err') }
    setFetching(false); setProgress(0)
  }

  async function handleSearch() {
    if (!searchQuery) return
    setFetching(true); log(`Searching "${searchQuery}"...`)
    try {
      const results = await fetchKeywordSearch(searchQuery, parseInt(searchPeriod), parseInt(searchMax))
      setBatchMedian(results[0]?.searchMedian || 0)
      setBatchResults(results)
      setForm(f => ({ ...f, search: searchQuery, median: String(results[0]?.searchMedian || '') }))
      log(`✓ ${results.length} results. ${results.filter(v => v.qualifies).length} pre-qualified.`, 'ok')
    } catch (e) { log('✗ ' + e.message, 'err') }
    setFetching(false)
  }

  function loadBatchItem(v) {
    populateForm({
      title: v.title, channel: v.channel, subs: String(v.subs),
      views: String(v.views), length: String(v.length), date: v.date,
      chMedian: String(v.chMedian), comments: v.comments,
      median: String(v.searchMedian || batchMedian)
    })
  }

  function autoLog(videos) {
    videos.forEach(v => {
      addEntry({
        search: form.search, title: v.title, channel: v.channel,
        subs: v.subs, views: v.views, length: v.length, date: v.date,
        median: v.searchMedian || batchMedian, chMedian: v.chMedian,
        chMult: v.chMult, searchMult: v.searchMult || 0,
        comments: v.comments || 'No',
        titleType: '', emotion: '', thumbnail: '', hook: '', pacing: '', arc: '', insight: ''
      })
    })
    log(`✓ Logged ${videos.length} videos.`, 'ok')
  }

  function handleLog() {
    const { views, chMedian, subs, length, chMult, qualifies } = calcForm(form)
    if (!form.title || !views) return
    addEntry({
      search: form.search,
      title: form.title, channel: form.channel,
      subs, views, length,
      date: form.date,
      median: parseNum(form.median),
      chMedian, chMult,
      searchMult: form.median ? parseFloat((views / parseNum(form.median)).toFixed(2)) : 0,
      comments: form.comments || 'No',
      titleType: form.titleType, emotion: form.emotion,
      thumbnail: form.thumbnail, hook: form.hook,
      pacing: form.pacing, arc: form.arc, insight: form.insight,
    })
    clearForm()
  }

  function clearForm() {
    setForm({ search: '', median: '', title: '', channel: '', subs: '',
      views: '', length: '', date: '', comments: '', chMedian: '',
      titleType: '', emotion: '', thumbnail: '', hook: '', pacing: '', arc: '', insight: '' })
  }

  const computed = calcForm(form)

  const logColor = fetchLogType === 'ok' ? 'text-green-400' : fetchLogType === 'err' ? 'text-destructive' : 'text-primary'

  const multiCount = multiURLs.split('\n').filter(u => u.trim()).length

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-[300px] flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">Data Entry</p>
          <p className="text-xs text-muted-foreground">Fetch or enter manually</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 flex flex-col gap-3">

            {/* FETCH BOX */}
            <div className="border border-primary/30 bg-card">
              <div className="px-3 py-2 border-b border-primary/20 bg-primary/5">
                <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">⚡ YouTube API Fetch</p>
              </div>
              <div className="p-3">
                <Tabs defaultValue="single">
                  <TabsList className="w-full mb-3">
                    <TabsTrigger value="single" className="flex-1 text-[10px]">Single</TabsTrigger>
                    <TabsTrigger value="multi" className="flex-1 text-[10px]">Multi-URL</TabsTrigger>
                    <TabsTrigger value="search" className="flex-1 text-[10px]">Search</TabsTrigger>
                  </TabsList>

                  <TabsContent value="single" className="flex flex-col gap-2">
                    <Label>Video URL or ID</Label>
                    <div className="flex gap-1">
                      <Input value={singleURL} onChange={e => setSingleURL(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1 text-[10px]" />
                      <Button size="sm" onClick={handleFetchSingle} disabled={fetching} className="flex-shrink-0 text-[10px]">Fetch</Button>
                    </div>
                    <Label>Median Views (manual)</Label>
                    <Input value={singleMedian} onChange={e => setSingleMedian(e.target.value)} placeholder="From search result set" className="text-[10px]" />
                  </TabsContent>

                  <TabsContent value="multi" className="flex flex-col gap-2">
                    <Label>Paste URLs — one per line</Label>
                    <Textarea value={multiURLs} onChange={e => setMultiURLs(e.target.value)} placeholder="https://youtube.com/watch?v=abc&#10;https://youtu.be/def" className="text-[10px] min-h-[80px]" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{multiCount} URL{multiCount !== 1 ? 's' : ''} detected</span>
                      <Button size="sm" onClick={handleFetchMulti} disabled={fetching} className="text-[10px]">Fetch All</Button>
                    </div>
                    {fetching && <Progress value={progress} className="h-1" />}
                  </TabsContent>

                  <TabsContent value="search" className="flex flex-col gap-2">
                    <Label>Search Keyword</Label>
                    <div className="flex gap-1">
                      <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="e.g. history of money" className="flex-1 text-[10px]" />
                      <Button size="sm" onClick={handleSearch} disabled={fetching} className="text-[10px]">Go</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Published Within</Label>
                        <Select value={searchPeriod} onValueChange={setSearchPeriod}>
                          <SelectTrigger className="text-[10px] mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                            <SelectItem value="24">24 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Max Results</Label>
                        <Select value={searchMax} onValueChange={setSearchMax}>
                          <SelectTrigger className="text-[10px] mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* BATCH RESULTS */}
                {batchResults.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center mb-1">
                      <Label>Results — click to load</Label>
                      <span className="text-[10px] text-muted-foreground">Median: {fmtNum(batchMedian)}</span>
                    </div>
                    <div className="max-h-[160px] overflow-y-auto flex flex-col gap-1">
                      {batchResults.map((v, i) => (
                        <button key={i} onClick={() => loadBatchItem(v)}
                          className="flex items-center gap-2 p-2 border border-border hover:border-primary text-left bg-background transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-foreground truncate">{v.title}</p>
                            <p className="text-[9px] text-muted-foreground">{v.channel} · {v.subs}K · {v.length}min</p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-[10px] text-primary">{fmtNum(v.views)} · {v.chMult}x</p>
                            <p className={`text-[9px] font-head font-bold ${v.qualifies ? 'text-green-400' : 'text-destructive'}`}>{v.qualifies ? '✓' : '✗'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" variant="outline" className="flex-1 text-[10px]" onClick={() => autoLog(batchResults.filter(v => v.qualifies))}>Log Qualified</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-[10px]" onClick={() => autoLog(batchResults)}>Log All</Button>
                    </div>
                  </div>
                )}

                <div className={`mt-2 p-2 bg-background border border-border text-[10px] font-mono min-h-[28px] ${logColor}`}>{fetchLog}</div>
              </div>
            </div>

            {/* SECTION 01 */}
            <div className="border border-border">
              <div className="px-3 py-2 bg-card border-b border-border flex items-center gap-2">
                <span className="text-[10px] text-primary border border-primary px-1">01</span>
                <span className="text-xs text-foreground">Search Context</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <Label>Search Term Used</Label>
                <Input value={form.search} onChange={e => setForm(f => ({...f, search: e.target.value}))} placeholder="e.g. history of money systems" className="text-[10px]" />
                <Label>Median Views of Search Set</Label>
                <Input value={form.median} onChange={e => setForm(f => ({...f, median: e.target.value}))} placeholder="e.g. 45000" className="text-[10px]" />
              </div>
            </div>

            {/* SECTION 02 */}
            <div className="border border-border">
              <div className="px-3 py-2 bg-card border-b border-border flex items-center gap-2">
                <span className="text-[10px] text-primary border border-primary px-1">02</span>
                <span className="text-xs text-foreground">Video Metadata</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <Label>Video Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Full title" className="text-[10px]" />
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Channel Name</Label><Input value={form.channel} onChange={e => setForm(f => ({...f, channel: e.target.value}))} placeholder="Channel" className="text-[10px] mt-1" /></div>
                  <div><Label>Subscribers (K)</Label><Input value={form.subs} onChange={e => setForm(f => ({...f, subs: e.target.value}))} placeholder="e.g. 85" className="text-[10px] mt-1" /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Views</Label><Input value={form.views} onChange={e => setForm(f => ({...f, views: e.target.value}))} placeholder="380000" className="text-[10px] mt-1" /></div>
                  <div><Label>Length (min)</Label><Input value={form.length} onChange={e => setForm(f => ({...f, length: e.target.value}))} placeholder="18" className="text-[10px] mt-1" /></div>
                  <div><Label>Upload Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="text-[10px] mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Channel Median Views</Label>
                    <Input value={form.chMedian} onChange={e => setForm(f => ({...f, chMedian: e.target.value}))} placeholder="Channel avg" className="text-[10px] mt-1" />
                  </div>
                  <div>
                    <Label>Comment Clustering</Label>
                    <Select value={form.comments} onValueChange={v => setForm(f => ({...f, comments: v}))}>
                      <SelectTrigger className="text-[10px] mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{COMMENTS.map(c => <SelectItem key={c} value={c} className="text-[10px]">{c === 'No' ? 'No (organic)' : 'Yes (ext. pushed)'}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="border border-border bg-card p-2">
                    <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Ch. Multiple</p>
                    <p className="text-primary font-bold mt-1">{computed.chMult > 0 ? computed.chMult.toFixed(1) + 'x' : '—'}</p>
                  </div>
                  <div className="border border-border bg-card p-2">
                    <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Search Multiple</p>
                    <p className="text-primary font-bold mt-1">{form.median && computed.views ? (computed.views / parseNum(form.median)).toFixed(1) + 'x' : '—'}</p>
                  </div>
                </div>
                <QualifyBadge entry={{ ...form, ...computed }} />
              </div>
            </div>

            {/* SECTION 03 */}
            <div className="border border-border">
              <div className="px-3 py-2 bg-card border-b border-border flex items-center gap-2">
                <span className="text-[10px] text-primary border border-primary px-1">03</span>
                <span className="text-xs text-foreground">Packaging Analysis</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Title Type</Label>
                    <Select value={form.titleType} onValueChange={v => setForm(f => ({...f, titleType: v}))}>
                      <SelectTrigger className="text-[10px] mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{TITLE_TYPES.map(t => <SelectItem key={t} value={t} className="text-[10px]">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Emotional Trigger</Label>
                    <Select value={form.emotion} onValueChange={v => setForm(f => ({...f, emotion: v}))}>
                      <SelectTrigger className="text-[10px] mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{EMOTIONS.map(e => <SelectItem key={e} value={e} className="text-[10px]">{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Label>Thumbnail Description</Label>
                <Textarea value={form.thumbnail} onChange={e => setForm(f => ({...f, thumbnail: e.target.value}))} placeholder="Elements, text, faces, contrast, emotion..." className="text-[10px]" />
              </div>
            </div>

            {/* SECTION 04 */}
            <div className="border border-border">
              <div className="px-3 py-2 bg-card border-b border-border flex items-center gap-2">
                <span className="text-[10px] text-primary border border-primary px-1">04</span>
                <span className="text-xs text-foreground">Content Analysis</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Hook Structure</Label>
                    <Select value={form.hook} onValueChange={v => setForm(f => ({...f, hook: v}))}>
                      <SelectTrigger className="text-[10px] mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{HOOKS.map(h => <SelectItem key={h} value={h} className="text-[10px]">{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pacing</Label>
                    <Select value={form.pacing} onValueChange={v => setForm(f => ({...f, pacing: v}))}>
                      <SelectTrigger className="text-[10px] mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{PACING.map(p => <SelectItem key={p} value={p} className="text-[10px]">{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Label>Narrative Arc</Label>
                <Textarea value={form.arc} onChange={e => setForm(f => ({...f, arc: e.target.value}))} placeholder="Problem → Mechanism → Consequence → Modern connection..." className="text-[10px]" />
                <Label>Key Insight</Label>
                <Textarea value={form.insight} onChange={e => setForm(f => ({...f, insight: e.target.value}))} placeholder="Why did this video outperform?" className="text-[10px]" />
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* STICKY FORM ACTIONS */}
        <div className="flex gap-2 p-3 border-t border-border flex-shrink-0">
          <Button className="flex-1 text-xs" onClick={handleLog}>+ Log Entry</Button>
          <Button variant="outline" className="text-xs" onClick={clearForm}>Clear</Button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <ResearchTable />
    </div>
  )
}
