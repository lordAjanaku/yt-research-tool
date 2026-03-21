import { useStore } from '@/store/useStore'

export function StatusBar() {
  const { entries } = useStore()
  const qualified = entries.filter(e => e.qualifies)
  const mults = qualified.map(e => e.chMult).filter(Boolean)
  const avgMult = mults.length ? (mults.reduce((a, b) => a + b, 0) / mults.length).toFixed(1) + 'x' : '—'
  const tally = {}
  qualified.forEach(e => { if (e.titleType) tally[e.titleType] = (tally[e.titleType] || 0) + 1 })
  const dom = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  return (
    <div className="h-8 flex items-center justify-between px-4 bg-card border-t border-border text-xs text-muted-foreground font-mono flex-shrink-0">
      <span>TOTAL <b className="text-foreground">{entries.length}</b></span>
      <span>QUALIFIED <b className="text-foreground">{qualified.length}</b></span>
      <span>UNDER 200K <b className="text-foreground">{entries.filter(e => e.subs < 200).length}</b></span>
      <span>AVG MULTIPLE <b className="text-primary">{avgMult}</b></span>
      <span>DOMINANT TYPE <b className="text-primary">{dom}</b></span>
    </div>
  )
}
