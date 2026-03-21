import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PanelLeftClose, PanelLeftOpen, CheckCircle, Circle } from 'lucide-react'
import { useStore } from '@/store/useStore'

const PANEL_WIDTH = 360

// ── PHASE DEFINITIONS ──
const PHASES = [
  { id: 'v1', num: 'V1', label: 'Demand Signal', sub: 'Autocomplete phrases' },
  { id: 'v2', num: 'V2', label: 'Competition', sub: 'Competitor analysis' },
  { id: 'v3', num: 'V3', label: 'Momentum', sub: 'Trend direction' },
  { id: 'v4', num: 'V4', label: 'Content Gap', sub: 'Audience questions' },
  { id: 'v5', num: 'V5', label: 'Title Testing', sub: 'Final decision' },
]

// ── SCORECARD CATEGORIES ──
const SCORECARD = [
  { key: 'autocomplete', label: 'Autocomplete Demand (V1)', weak: 'Phrase not in autocomplete', moderate: 'Appears in 1–2 lists', strong: 'Appears across 3+ lists' },
  { key: 'competition', label: 'Competition Level (V2)', weak: 'Dominated by 1M+ channels', moderate: 'Mix of large and mid', strong: 'Mid-sized channels winning' },
  { key: 'recency', label: 'Upload Recency (V2)', weak: 'All uploaded last 3 months', moderate: 'Mix of old and new', strong: 'Top videos 1–3 years old' },
  { key: 'trend', label: 'Trend Direction (V3)', weak: 'Declining trend', moderate: 'Stable / flat', strong: 'Rising or evergreen with spikes' },
  { key: 'regional', label: 'Regional Interest (V3)', weak: 'Low-RPM regions only', moderate: 'Mixed regional interest', strong: 'Strong US/UK/CA/AU interest' },
  { key: 'gap', label: 'Content Gap Size (V4)', weak: 'Top videos answer thoroughly', moderate: 'Small gaps in depth', strong: 'Clear unanswered questions' },
  { key: 'click', label: 'Title Click Power (V5)', weak: 'No title passes click test', moderate: '1–2 titles pass', strong: '3+ strong candidates' },
  { key: 'keyword', label: 'Keyword-Title Match (V5)', weak: 'Title has no validated keyword', moderate: 'Title has close variant', strong: 'Title contains primary keyword' },
]

function scoreToDecision(total) {
  if (total >= 20) return { label: 'GO', color: 'text-green-400', border: 'border-green-700', bg: 'bg-green-900/20', note: 'Proceed to scripting. Strong topic, validated title, clear gap.' }
  if (total >= 14) return { label: 'ADJUST', color: 'text-yellow-400', border: 'border-yellow-700', bg: 'bg-yellow-900/20', note: 'Refine your angle or title before scripting. The topic has potential.' }
  if (total >= 8) return { label: 'ADJUST OR PIVOT', color: 'text-orange-400', border: 'border-orange-700', bg: 'bg-orange-900/20', note: 'Multiple weak signals. Try a more specific angle and re-run V1.' }
  return { label: 'PIVOT', color: 'text-destructive', border: 'border-red-700', bg: 'bg-red-900/20', note: 'Insufficient demand or opportunity. Choose a different topic.' }
}

export function TopicValidation() {
  const { validation, setValidationPhase, setValidationData } = useStore()
  const activePhase = validation.activePhase
  const phases = validation.phases

  const [leftCollapsed, setLeftCollapsed] = useState(false)

  // ── V1 state ──
  const [v1Root, setV1Root] = useState('')
  const [v1Phrases, setV1Phrases] = useState(phases.v1.phrases || [])
  const [v1Input, setV1Input] = useState('')
  const [v1Primary, setV1Primary] = useState(phases.v1.primary || ['', '', ''])

  // ── V2 state ──
  const [v2Videos, setV2Videos] = useState(phases.v2.videos || [])
  const [v2Form, setV2Form] = useState({ title: '', channel: '', subs: '', views: '', date: '', length: '' })

  // ── V3 state ──
  const [v3Direction, setV3Direction] = useState(phases.v3.direction || '')
  const [v3Regional, setV3Regional] = useState(phases.v3.regional || '')
  const [v3Rising, setV3Rising] = useState(phases.v3.rising || '')

  // ── V4 state ──
  const [v4Questions, setV4Questions] = useState(phases.v4.questions || [])
  const [v4Input, setV4Input] = useState('')
  const [v4Gap, setV4Gap] = useState(phases.v4.gap || '')
  const [v4Diff, setV4Diff] = useState(phases.v4.diff || '')

  // ── V5 state ──
  const [v5Titles, setV5Titles] = useState(phases.v5.titles || ['', '', '', '', ''])
  const [v5Clicks, setV5Clicks] = useState(phases.v5.clicks || {})
  const [v5Scores, setV5Scores] = useState(phases.v5.scores || {})

  // ── PHASE COMPLETION ──
  function isComplete(id) {
    if (id === 'v1') return v1Phrases.length >= 3 && v1Primary.filter(Boolean).length === 3
    if (id === 'v2') return v2Videos.length >= 3
    if (id === 'v3') return !!v3Direction
    if (id === 'v4') return v4Questions.length >= 5 && !!v4Diff
    if (id === 'v5') return Object.keys(v5Scores).length === 8
    return false
  }

  function savePhase(id) {
    if (id === 'v1') setValidationData('v1', { phrases: v1Phrases, primary: v1Primary })
    if (id === 'v2') setValidationData('v2', { videos: v2Videos })
    if (id === 'v3') setValidationData('v3', { direction: v3Direction, regional: v3Regional, rising: v3Rising })
    if (id === 'v4') setValidationData('v4', { questions: v4Questions, gap: v4Gap, diff: v4Diff })
    if (id === 'v5') setValidationData('v5', { titles: v5Titles, clicks: v5Clicks, scores: v5Scores })
  }

  function goNext() {
    savePhase('v' + activePhase)
    if (activePhase < 5) setValidationPhase(activePhase + 1)
  }

  // ── SCORECARD TOTAL ──
  const scorecardTotal = Object.values(v5Scores).reduce((a, b) => a + (parseInt(b) || 0), 0)
  const decision = scoreToDecision(scorecardTotal)

  // ── RENDER PHASE CONTENT ──
  function PhaseContent() {
    switch (activePhase) {
      case 1: return <PhaseV1 />
      case 2: return <PhaseV2 />
      case 3: return <PhaseV3 />
      case 4: return <PhaseV4 />
      case 5: return <PhaseV5 />
      default: return null
    }
  }

  // ── V1 ──
  function PhaseV1() {
    function addPhrase() {
      if (!v1Input.trim()) return
      const updated = [...v1Phrases, v1Input.trim()]
      setV1Phrases(updated)
      setV1Input('')
    }
    return (
      <div className="flex flex-col gap-4">
        <PhaseHeader num="V1" title="Demand Signal Check" sub="Is anyone actually searching for this topic on YouTube?" time="~5 minutes" />
        <Section title="Root Keyword">
          <Label>Your topic root keyword</Label>
          <Input value={v1Root} onChange={e => setV1Root(e.target.value)} placeholder="e.g. why empires destroy" className="text-[10px] w-full" />
          <p className="text-[10px] text-muted-foreground">Type this into YouTube search bar without pressing Enter. Record every autocomplete suggestion below.</p>
        </Section>
        <Section title="Autocomplete Phrases Recorded">
          <div className="flex gap-2">
            <Input value={v1Input} onChange={e => setV1Input(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPhrase()}
              placeholder="Paste autocomplete phrase, press Enter" className="flex-1 min-w-0 text-[10px]" />
            <Button size="sm" onClick={addPhrase} className="text-[10px] flex-shrink-0">Add</Button>
          </div>
          <p className="text-[9px] text-muted-foreground">Repeat with 3 alternative root keywords. Target 8–12 phrases total.</p>
          {v1Phrases.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {v1Phrases.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-2 py-1.5 border border-border bg-background">
                  <span className="text-[10px] text-foreground flex-1 min-w-0 truncate">{p}</span>
                  <button onClick={() => setV1Phrases(v1Phrases.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive text-xs flex-shrink-0">✕</button>
                </div>
              ))}
              <p className="text-[9px] text-primary mt-1">{v1Phrases.length} phrase{v1Phrases.length !== 1 ? 's' : ''} recorded</p>
            </div>
          )}
        </Section>
        <Section title="Top 3 Primary Keywords">
          <p className="text-[10px] text-muted-foreground">The phrases that appeared most often across different root searches. These drive the rest of the SOP.</p>
          {[0, 1, 2].map(i => (
            <div key={i}>
              <Label>Primary Keyword {i + 1}</Label>
              <Input value={v1Primary[i]} onChange={e => {
                const updated = [...v1Primary]; updated[i] = e.target.value; setV1Primary(updated)
              }} placeholder={`Keyword ${i + 1}`} className="text-[10px] w-full mt-1" />
            </div>
          ))}
        </Section>
      </div>
    )
  }

  // ── V2 ──
  function PhaseV2() {
    function addVideo() {
      if (!v2Form.title) return
      setV2Videos([...v2Videos, { ...v2Form, id: Date.now() }])
      setV2Form({ title: '', channel: '', subs: '', views: '', date: '', length: '' })
    }
    return (
      <div className="flex flex-col gap-4">
        <PhaseHeader num="V2" title="Competition Analysis" sub="Who covers this topic, and how dominant are they?" time="~8 minutes" />
        <Section title="Log Competitor Video">
          <p className="text-[10px] text-muted-foreground">Search your primary keywords on YouTube. For each result, record the first 5 videos per keyword.</p>
          <Label>Video Title</Label>
          <Input value={v2Form.title} onChange={e => setV2Form(f => ({ ...f, title: e.target.value }))} placeholder="Full video title" className="text-[10px] w-full" />
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Channel</Label><Input value={v2Form.channel} onChange={e => setV2Form(f => ({ ...f, channel: e.target.value }))} placeholder="Channel name" className="text-[10px] mt-1 w-full" /></div>
            <div><Label>Subs (K)</Label><Input value={v2Form.subs} onChange={e => setV2Form(f => ({ ...f, subs: e.target.value }))} placeholder="e.g. 85" className="text-[10px] mt-1 w-full" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Views</Label><Input value={v2Form.views} onChange={e => setV2Form(f => ({ ...f, views: e.target.value }))} placeholder="1.2M" className="text-[10px] mt-1 w-full" /></div>
            <div><Label>Length (min)</Label><Input value={v2Form.length} onChange={e => setV2Form(f => ({ ...f, length: e.target.value }))} placeholder="18" className="text-[10px] mt-1 w-full" /></div>
            <div><Label>Upload Date</Label><Input type="date" value={v2Form.date} onChange={e => setV2Form(f => ({ ...f, date: e.target.value }))} className="text-[10px] mt-1 w-full" /></div>
          </div>
          <Button size="sm" onClick={addVideo} className="w-full text-[10px]">+ Add Video</Button>
        </Section>
        {v2Videos.length > 0 && (
          <Section title={`Competitor Videos (${v2Videos.length})`}>
            <div className="flex flex-col gap-1">
              {v2Videos.map((v, i) => (
                <div key={v.id} className={`px-2 py-2 border text-[10px] flex items-start justify-between gap-2 ${i % 2 === 0 ? 'bg-background border-border' : 'bg-muted/20 border-border'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate font-medium">{v.title}</p>
                    <p className="text-muted-foreground">{v.channel} · {v.subs}K subs · {v.views} views · {v.length}min · {v.date}</p>
                  </div>
                  <button onClick={() => setV2Videos(v2Videos.filter(x => x.id !== v.id))}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    )
  }

  // ── V3 ──
  function PhaseV3() {
    return (
      <div className="flex flex-col gap-4">
        <PhaseHeader num="V3" title="Momentum Check" sub="Is interest rising, stable, or dying?" time="~5 minutes" />
        <Section title="Google Trends — YouTube Search">
          <p className="text-[10px] text-muted-foreground">Go to trends.google.com → search your primary keyword → set to 5 Years → select <b>YouTube Search</b> as the search type.</p>
          <Label>Trend Direction</Label>
          <Select value={v3Direction} onValueChange={setV3Direction}>
            <SelectTrigger className="text-[10px] mt-1 w-full"><SelectValue placeholder="Select trend direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Rising" className="text-[10px]">Rising — line moves up over 5 years</SelectItem>
              <SelectItem value="Stable" className="text-[10px]">Stable / Evergreen — flat with consistent spikes</SelectItem>
              <SelectItem value="Declining" className="text-[10px]">Declining — line moves down over 5 years</SelectItem>
              <SelectItem value="Seasonal" className="text-[10px]">Seasonal — regular spikes same time each year</SelectItem>
            </SelectContent>
          </Select>
          {v3Direction && (
            <div className={`mt-2 p-2 border text-[10px] ${
              v3Direction === 'Rising' ? 'border-green-700 bg-green-900/20 text-green-400' :
              v3Direction === 'Stable' ? 'border-primary/40 bg-primary/5 text-primary' :
              v3Direction === 'Declining' ? 'border-red-700 bg-red-900/20 text-destructive' :
              'border-yellow-700 bg-yellow-900/20 text-yellow-400'
            }`}>
              {v3Direction === 'Rising' && 'Strong signal. Enter now while momentum is building.'}
              {v3Direction === 'Stable' && 'Safe signal. Consistent demand. Enter any time.'}
              {v3Direction === 'Declining' && 'Caution. Check if a news cycle caused past spikes. If overall direction is down — pivot.'}
              {v3Direction === 'Seasonal' && 'Plan your publish date to hit before the next spike, not after.'}
            </div>
          )}
        </Section>
        <Section title="Regional Interest">
          <p className="text-[10px] text-muted-foreground">Scroll down on Google Trends to Interest by Subregion. Note which countries show highest interest.</p>
          <Label>Regional Interest Notes</Label>
          <Textarea value={v3Regional} onChange={e => setV3Regional(e.target.value)}
            placeholder="e.g. Strong US, UK, Canada, Australia interest — high RPM potential" className="text-[10px] w-full" />
        </Section>
        <Section title="Rising Related Queries">
          <p className="text-[10px] text-muted-foreground">Scroll to Related Queries → click the Rising tab. Note any terms connecting to your topic.</p>
          <Label>Rising Queries</Label>
          <Textarea value={v3Rising} onChange={e => setV3Rising(e.target.value)}
            placeholder="List rising related queries that connect to your topic..." className="text-[10px] w-full" />
        </Section>
      </div>
    )
  }

  // ── V4 ──
  function PhaseV4() {
    function addQuestion() {
      if (!v4Input.trim()) return
      setV4Questions([...v4Questions, v4Input.trim()])
      setV4Input('')
    }
    return (
      <div className="flex flex-col gap-4">
        <PhaseHeader num="V4" title="Content Gap Mining" sub="What is the audience asking that nobody has answered?" time="~7 minutes" />
        <Section title="Audience Questions from Comments">
          <p className="text-[10px] text-muted-foreground">Open the top 3 competitor videos. Read comment sections sorted by Top then Newest. Record every question, complaint about missing info, or request for more depth.</p>
          <div className="flex gap-2">
            <Input value={v4Input} onChange={e => setV4Input(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQuestion()}
              placeholder="Paste comment question, press Enter" className="flex-1 min-w-0 text-[10px]" />
            <Button size="sm" onClick={addQuestion} className="text-[10px] flex-shrink-0">Add</Button>
          </div>
          <p className="text-[9px] text-muted-foreground">Target: minimum 5 questions. Aim for questions that appear across multiple videos.</p>
          {v4Questions.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {v4Questions.map((q, i) => (
                <div key={i} className={`flex items-start gap-2 px-2 py-1.5 border text-[10px] ${i % 2 === 0 ? 'bg-background border-border' : 'bg-muted/20 border-border'}`}>
                  <span className="text-muted-foreground flex-shrink-0">{i + 1}.</span>
                  <span className="text-foreground flex-1 min-w-0">{q}</span>
                  <button onClick={() => setV4Questions(v4Questions.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0">✕</button>
                </div>
              ))}
              <p className="text-[9px] text-primary mt-1">{v4Questions.length} question{v4Questions.length !== 1 ? 's' : ''} recorded {v4Questions.length >= 5 ? '✓' : `(need ${5 - v4Questions.length} more)`}</p>
            </div>
          )}
        </Section>
        <Section title="Primary Content Gap">
          <Label>Most Repeated Unanswered Question</Label>
          <Textarea value={v4Gap} onChange={e => setV4Gap(e.target.value)}
            placeholder="The question that appears across multiple comment sections..." className="text-[10px] w-full" />
        </Section>
        <Section title="Differentiation Statement">
          <p className="text-[10px] text-muted-foreground">In one sentence, write how your video will be different from the top competitor.</p>
          <Textarea value={v4Diff} onChange={e => setV4Diff(e.target.value)}
            placeholder="e.g. The top video explains the mechanism but never shows who benefited — mine makes that the central argument." className="text-[10px] w-full" />
        </Section>
      </div>
    )
  }

  // ── V5 ──
  function PhaseV5() {
    return (
      <div className="flex flex-col gap-4">
        <PhaseHeader num="V5" title="Title Testing & Final Decision" sub="Choose your title and make the GO / ADJUST / PIVOT call" time="~5 minutes" />
        <Section title="5 Title Candidates">
          <p className="text-[10px] text-muted-foreground">Write 5 title versions using different emotional angles: Fear, Curiosity, Contrarian, Historical, Modern Urgency.</p>
          {[0,1,2,3,4].map(i => (
            <div key={i}>
              <Label>Title {i + 1}</Label>
              <div className="flex gap-2 mt-1 items-center">
                <Input value={v5Titles[i]} onChange={e => {
                  const t = [...v5Titles]; t[i] = e.target.value; setV5Titles(t)
                }} placeholder={['Fear-based','Curiosity','Contrarian','Historical','Modern urgency'][i]} className="flex-1 min-w-0 text-[10px]" />
                <button
                  onClick={() => setV5Clicks(c => ({ ...c, [i]: c[i] === 'CLICK' ? 'SCROLL' : 'CLICK' }))}
                  className={`flex-shrink-0 text-[9px] font-head font-bold tracking-wider px-2 py-1 border transition-colors ${
                    v5Clicks[i] === 'CLICK' ? 'border-green-700 bg-green-900/20 text-green-400' :
                    v5Clicks[i] === 'SCROLL' ? 'border-red-700 bg-red-900/20 text-destructive' :
                    'border-border text-muted-foreground'
                  }`}
                >
                  {v5Clicks[i] || 'RATE'}
                </button>
              </div>
            </div>
          ))}
          <p className="text-[9px] text-muted-foreground mt-1">Rate each title: would you click it in under 4 seconds on your YouTube homepage?</p>
        </Section>

        <Section title="Validation Scorecard">
          <p className="text-[10px] text-muted-foreground">Score each category 1–3 based on your research from V1–V5.</p>
          <div className="flex flex-col gap-2">
            {SCORECARD.map(cat => (
              <div key={cat.key} className="border border-border p-2">
                <p className="text-[10px] text-foreground font-medium mb-1">{cat.label}</p>
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3].map(score => (
                    <button key={score}
                      onClick={() => setV5Scores(s => ({ ...s, [cat.key]: score }))}
                      className={`text-[9px] p-1.5 border text-center transition-colors ${
                        v5Scores[cat.key] === score
                          ? score === 1 ? 'border-red-700 bg-red-900/20 text-destructive'
                          : score === 2 ? 'border-yellow-700 bg-yellow-900/20 text-yellow-400'
                          : 'border-green-700 bg-green-900/20 text-green-400'
                          : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                      }`}
                    >
                      {score === 1 ? cat.weak : score === 2 ? cat.moderate : cat.strong}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL + DECISION */}
          <div className={`mt-3 p-3 border ${decision.border} ${decision.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground">TOTAL SCORE</span>
              <span className="text-primary font-bold text-sm">{scorecardTotal} / 24</span>
            </div>
            <p className={`font-head font-bold text-lg tracking-widest ${decision.color}`}>{decision.label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{decision.note}</p>
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* LEFT PANEL — Phase Navigator */}
      <div
        className="flex-shrink-0 flex-grow-0 border-r border-border flex flex-col transition-all duration-200"
        style={{ width: leftCollapsed ? 0 : PANEL_WIDTH, minWidth: leftCollapsed ? 0 : PANEL_WIDTH, maxWidth: PANEL_WIDTH, overflow: 'hidden', position: 'relative' }}
      >
        <div className="px-3 py-2.5 border-b border-border bg-card flex-shrink-0 flex items-center justify-between"
          style={{ width: PANEL_WIDTH }}>
          <div className="min-w-0 overflow-hidden">
            <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary truncate">Topic Validation</p>
            <p className="text-[10px] text-muted-foreground truncate">5-phase validation system</p>
          </div>
          <button onClick={() => setLeftCollapsed(true)}
            className="text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0 ml-2"
            title="Collapse panel">
            <PanelLeftClose size={14} />
          </button>
        </div>

        <ScrollArea className="flex-1" style={{ width: PANEL_WIDTH }}>
          <div style={{ width: PANEL_WIDTH, boxSizing: 'border-box' }} className="p-3 flex flex-col gap-2">

            {/* PHASE STEPS */}
            {PHASES.map((p, i) => {
              const done = isComplete(p.id)
              const active = activePhase === i + 1
              return (
                <button key={p.id}
                  onClick={() => { savePhase('v' + activePhase); setValidationPhase(i + 1) }}
                  className={`flex items-center gap-3 p-3 border text-left transition-colors w-full ${
                    active ? 'border-primary bg-primary/10' :
                    done ? 'border-green-700 bg-green-900/10' :
                    'border-border hover:border-muted-foreground'
                  }`}>
                  <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center border text-[10px] font-head font-bold ${
                    active ? 'border-primary text-primary' :
                    done ? 'border-green-700 text-green-400' :
                    'border-border text-muted-foreground'
                  }`}>
                    {done ? '✓' : p.num}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-head font-semibold tracking-wider uppercase truncate ${active ? 'text-primary' : done ? 'text-green-400' : 'text-foreground'}`}>{p.label}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{p.sub}</p>
                  </div>
                </button>
              )
            })}

            {/* OVERALL PROGRESS */}
            <div className="border border-border p-3 mt-2">
              <p className="text-[10px] text-muted-foreground mb-2">OVERALL PROGRESS</p>
              <div className="flex gap-1">
                {PHASES.map((p, i) => (
                  <div key={p.id} className={`flex-1 h-1.5 ${isComplete(p.id) ? 'bg-green-500' : activePhase === i + 1 ? 'bg-primary' : 'bg-border'}`} />
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5">{PHASES.filter(p => isComplete(p.id)).length} of 5 phases complete</p>
            </div>

            {/* SAVE + NEXT */}
            <Button className="w-full text-xs mt-1" onClick={goNext} disabled={activePhase >= 5}>
              {activePhase >= 5 ? 'All Phases Complete' : `Save & Go to V${activePhase + 1}`}
            </Button>
            <Button variant="outline" className="w-full text-xs" onClick={() => savePhase('v' + activePhase)}>
              Save Current Phase
            </Button>

          </div>
        </ScrollArea>
      </div>

      {/* EXPAND BUTTON */}
      {leftCollapsed && (
        <button onClick={() => setLeftCollapsed(false)}
          className="flex-shrink-0 flex items-center justify-center w-6 bg-card border-r border-border text-muted-foreground hover:text-primary transition-colors"
          title="Expand panel">
          <PanelLeftOpen size={14} />
        </button>
      )}

      {/* RIGHT PANEL — Phase Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 max-w-3xl mx-auto">
          <PhaseContent />
        </div>
      </ScrollArea>

    </div>
  )
}

// ── SHARED HELPERS ──
function PhaseHeader({ num, title, sub, time }) {
  return (
    <div className="border-b border-border pb-3">
      <div className="flex items-center gap-3 mb-1">
        <span className="border border-primary text-primary font-head font-bold text-xs px-2 py-0.5">{num}</span>
        <h2 className="font-head font-bold text-sm tracking-widest uppercase text-foreground">{title}</h2>
      </div>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">Est. {time}</p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="border border-border">
      <div className="px-3 py-2 bg-card border-b border-border">
        <p className="font-head font-semibold text-[10px] tracking-widest uppercase text-primary">{title}</p>
      </div>
      <div className="p-3 flex flex-col gap-2">{children}</div>
    </div>
  )
}
