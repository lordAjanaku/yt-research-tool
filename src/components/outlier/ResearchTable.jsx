import { useState, useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import { fmtNum, parseNum } from '@/utils/numbers'
import { toCSV, downloadFile } from '@/utils/exportData'

const TITLE_TYPES = ['Tension','Mechanism','Contrarian','Stakes','Historical Revelation','Curiosity Gap']

export function ResearchTable() {
  const { entries, deleteEntry, deleteEntries, removeDuplicates, importEntries } = useStore()
  const [selected, setSelected] = useState(new Set())
  const [sortCol, setSortCol] = useState('index')
  const [sortDir, setSortDir] = useState('desc')
  const [filterQual, setFilterQual] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [exportMode, setExportMode] = useState('all')

  const dupeCount = useMemo(() => {
    const seen = new Set()
    let count = 0
    entries.forEach(e => {
      const k = e.title + '|' + e.channel
      if (seen.has(k)) count++
      else seen.add(k)
    })
    return count
  }, [entries])

  const rows = useMemo(() => {
    let r = entries.map((e, i) => ({ ...e, _idx: i }))
    if (filterQual === 'yes') r = r.filter(e => e.qualifies)
    if (filterQual === 'no') r = r.filter(e => !e.qualifies)
    if (filterType !== 'all') r = r.filter(e => e.titleType === filterType)
    r.sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol]
      if (sortCol === 'index') { av = a._idx; bv = b._idx }
      if (sortCol === 'qualifies') { av = a.qualifies ? 1 : 0; bv = b.qualifies ? 1 : 0 }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return r
  }, [entries, sortCol, sortDir, filterQual, filterType])

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function toggleAll() {
    if (rows.every(r => selected.has(r.id))) setSelected(new Set())
    else setSelected(new Set(rows.map(r => r.id)))
  }

  function toggleRow(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleExport(format) {
    let data = entries
    if (exportMode === 'qualified') data = entries.filter(e => e.qualifies)
    if (exportMode === 'filtered') data = rows
    const date = new Date().toISOString().slice(0,10)
    if (format === 'json') downloadFile(JSON.stringify(data, null, 2), `outlier_${date}.json`, 'application/json')
    else downloadFile(toCSV(data), `outlier_${date}.csv`, 'text/csv')
  }

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = e => {
      const r = new FileReader()
      r.onload = ev => {
        try {
          const d = JSON.parse(ev.target.result)
          if (!Array.isArray(d)) throw new Error()
          if (confirm(`Import ${d.length} entries? Replaces current data.`)) importEntries(d)
        } catch { alert('Invalid JSON') }
      }
      r.readAsText(e.target.files[0])
      e.target.value = ''
    }
    input.click()
  }

  const Th = ({ col, label, style }) => (
    <th onClick={() => toggleSort(col)}
      className={`px-2 py-2 text-left text-[10px] font-head font-semibold tracking-widest uppercase cursor-pointer select-none whitespace-nowrap hover:text-primary transition-colors ${sortCol === col ? 'text-primary' : 'text-muted-foreground'}`}
      style={style}>
      {label}{sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* TOOLBAR */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <input type="checkbox" className="accent-primary w-3 h-3 cursor-pointer"
            checked={rows.length > 0 && rows.every(r => selected.has(r.id))}
            onChange={toggleAll} />
          {selected.size > 0 && (
            <>
              <span className="text-[10px] text-primary">{selected.size} selected</span>
              <Button size="sm" variant="destructive" className="text-[10px] h-6 px-2"
                onClick={() => { deleteEntries(selected); setSelected(new Set()) }}>Delete</Button>
            </>
          )}
          <span className="text-[10px] text-muted-foreground">Sort</span>
          <Select value={sortCol} onValueChange={v => { setSortCol(v); setSortDir('desc') }}>
            <SelectTrigger className="h-6 text-[10px] w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['index','title','channel','subs','views','chMult','qualifies','date','titleType','emotion'].map(c =>
                <SelectItem key={c} value={c} className="text-[10px]">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="text-muted-foreground hover:text-primary text-xs border border-border px-1.5 py-0.5">
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
          <span className="text-[10px] text-muted-foreground">Filter</span>
          <Select value={filterQual} onValueChange={setFilterQual}>
            <SelectTrigger className="h-6 text-[10px] w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[10px]">All</SelectItem>
              <SelectItem value="yes" className="text-[10px]">Qualified</SelectItem>
              <SelectItem value="no" className="text-[10px]">Not qualified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-6 text-[10px] w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[10px]">All types</SelectItem>
              {TITLE_TYPES.map(t => <SelectItem key={t} value={t} className="text-[10px]">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {dupeCount > 0 && (
            <Button size="sm" variant="destructive" className="text-[10px] h-6 px-2" onClick={removeDuplicates}>
              {dupeCount} Dupes
            </Button>
          )}
          <Select value={exportMode} onValueChange={setExportMode}>
            <SelectTrigger className="h-6 text-[10px] w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[10px]">Export All</SelectItem>
              <SelectItem value="qualified" className="text-[10px]">Qualified Only</SelectItem>
              <SelectItem value="filtered" className="text-[10px]">Current Filter</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleExport('json')}>JSON</Button>
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleExport('csv')}>CSV</Button>
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={handleImport}>Import</Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
            <span className="text-2xl opacity-30">◈</span>
            <span className="text-xs tracking-widest">NO ENTRIES — FETCH OR ENTER DATA</span>
          </div>
        ) : (
          <table className="w-full border-collapse" style={{ minWidth: 900 }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-card border-b border-border">
                <th className="px-2 py-2 w-8"><input type="checkbox" className="accent-primary w-3 h-3" checked={rows.every(r => selected.has(r.id))} onChange={toggleAll} /></th>
                <Th col="index" label="#" />
                <Th col="title" label="Title" style={{ maxWidth: 180 }} />
                <Th col="channel" label="Channel" />
                <Th col="subs" label="Subs(K)" />
                <Th col="views" label="Views" />
                <Th col="chMult" label="Ch.×" />
                <Th col="qualifies" label="Qual" />
                <Th col="titleType" label="Title Type" />
                <Th col="emotion" label="Emotion" />
                <Th col="hook" label="Hook" />
                <Th col="pacing" label="Pacing" />
                <th className="px-2 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={e.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${selected.has(e.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-2 py-1.5"><input type="checkbox" className="accent-primary w-3 h-3" checked={selected.has(e.id)} onChange={() => toggleRow(e.id)} /></td>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{e._idx + 1}</td>
                  <td className="px-2 py-1.5 text-[10px] text-foreground" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.title}>{e.title}</td>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.channel || '—'}</td>
                  <td className="px-2 py-1.5 text-[10px]">{e.subs || '—'}</td>
                  <td className="px-2 py-1.5 text-[10px]">{fmtNum(e.views)}</td>
                  <td className="px-2 py-1.5 text-[10px]">
                    <span className={e.chMult >= 6 ? 'text-yellow-300 font-bold' : e.chMult >= 4 ? 'text-primary font-bold' : 'text-muted-foreground'}>{e.chMult}x</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <Badge variant={e.qualifies ? 'success' : 'destructive'} className="text-[9px]">{e.qualifies ? 'YES' : 'NO'}</Badge>
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-primary">{e.titleType || '—'}</td>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{e.emotion || '—'}</td>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{e.hook || '—'}</td>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{e.pacing || '—'}</td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive text-xs transition-colors px-1">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
