import { useState, useMemo, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import { fmtNum } from '@/utils/numbers'
import { toCSV, downloadFile } from '@/utils/exportData'
import { parseCSV } from '@/utils/csvParser'

const TITLE_TYPES = ['Tension','Mechanism','Contrarian','Stakes','Historical Revelation','Curiosity Gap']

const DEFAULT_WIDTHS = {
  cb: 32, idx: 40, title: 200, channel: 120, subs: 70,
  views: 80, chMult: 70, qual: 60, titleType: 130,
  emotion: 90, hook: 110, pacing: 70, actions: 60
}

export function ResearchTable() {
  const { entries, deleteEntry, deleteEntries, clearEntries, removeDuplicates, importEntries } = useStore()
  const [selected, setSelected] = useState(new Set())
  const [sortCol, setSortCol] = useState('index')
  const [sortDir, setSortDir] = useState('desc')
  const [filterQual, setFilterQual] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [exportMode, setExportMode] = useState('all')
  const [colWidths, setColWidths] = useState(DEFAULT_WIDTHS)
  const resizing = useRef(null)

  const startResize = useCallback((col, e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = colWidths[col]
    resizing.current = { col, startX, startW }
    function onMove(ev) {
      if (!resizing.current) return
      const delta = ev.clientX - resizing.current.startX
      const newW = Math.max(40, resizing.current.startW + delta)
      setColWidths(w => ({ ...w, [resizing.current.col]: newW }))
    }
    function onUp() {
      resizing.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [colWidths])

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
      return sortDir === 'asc' ? (av - bv) : (bv - av)
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

  function handleClearAll() {
    if (!entries.length) return
    if (confirm(`Clear all ${entries.length} entries? This cannot be undone.`)) {
      clearEntries()
      setSelected(new Set())
    }
  }

  function handleExport(format) {
    let data = entries
    if (exportMode === 'qualified') data = entries.filter(e => e.qualifies)
    if (exportMode === 'filtered') data = rows
    const date = new Date().toISOString().slice(0, 10)
    if (format === 'json') downloadFile(JSON.stringify(data, null, 2), `outlier_${date}.json`, 'application/json')
    else downloadFile(toCSV(data), `outlier_${date}.csv`, 'text/csv')
  }

  // Import accepts both JSON and CSV
  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.csv'
    input.onchange = e => {
      const file = e.target.files[0]
      if (!file) return
      const r = new FileReader()
      r.onload = ev => {
        try {
          let data
          if (file.name.endsWith('.csv')) {
            data = parseCSV(ev.target.result)
            // coerce numeric fields from CSV strings
            data = data.map(row => ({
              ...row,
              subs: parseFloat(row.subs) || 0,
              views: parseFloat(row.views) || 0,
              length: parseFloat(row.length) || 0,
              chMult: parseFloat(row.chMult) || 0,
              chMedian: parseFloat(row.chMedian) || 0,
              median: parseFloat(row.median) || 0,
              qualifies: row.qualifies === 'true' || row.qualifies === true,
            }))
          } else {
            data = JSON.parse(ev.target.result)
          }
          if (!Array.isArray(data)) throw new Error('Expected an array')
          if (confirm(`Import ${data.length} entries? Replaces current data.`)) importEntries(data)
        } catch (err) {
          alert('Import failed: ' + err.message)
        }
      }
      r.readAsText(file)
      e.target.value = ''
    }
    input.click()
  }

  function Th({ col, label }) {
    const w = colWidths[col]
    const active = sortCol === col
    return (
      <th
        style={{ width: w, minWidth: w, maxWidth: w, position: 'relative', userSelect: 'none' }}
        className={`px-2 py-2 text-[10px] font-head font-semibold tracking-widest uppercase cursor-pointer whitespace-nowrap transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => toggleSort(col)}
      >
        <span>{label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</span>
        <span
          onMouseDown={e => { e.stopPropagation(); startResize(col, e) }}
          onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 2 }}
          className="hover:bg-primary/40 transition-colors"
        />
      </th>
    )
  }

  function rowBg(e, i) {
    if (selected.has(e.id)) return 'bg-primary/5'
    return i % 2 === 0 ? 'bg-background' : 'bg-muted/20'
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* TOOLBAR */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input type="checkbox" className="accent-primary w-3 h-3 cursor-pointer"
            checked={rows.length > 0 && rows.every(r => selected.has(r.id))}
            onChange={toggleAll} />
          {selected.size > 0 && (
            <>
              <span className="text-[10px] text-primary whitespace-nowrap">{selected.size} selected</span>
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
          {entries.length > 0 && (
            <Button size="sm" variant="destructive" className="text-[10px] h-6 px-2" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
          <Select value={exportMode} onValueChange={setExportMode}>
            <SelectTrigger className="h-6 text-[10px] w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[10px]">Export All</SelectItem>
              <SelectItem value="qualified" className="text-[10px]">Qualified Only</SelectItem>
              <SelectItem value="filtered" className="text-[10px]">Current Filter</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleExport('json')}>JSON</Button>
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleExport('csv')}>CSV</Button>
          {/* Import now accepts both .json and .csv */}
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
          <table className="border-collapse" style={{ tableLayout: 'fixed', width: Object.values(colWidths).reduce((a, b) => a + b, 0) }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-card border-b border-border">
                <th style={{ width: colWidths.cb }} className="px-2 py-2">
                  <input type="checkbox" className="accent-primary w-3 h-3"
                    checked={rows.length > 0 && rows.every(r => selected.has(r.id))}
                    onChange={toggleAll} />
                </th>
                <Th col="idx" label="#" />
                <Th col="title" label="Title" />
                <Th col="channel" label="Channel" />
                <Th col="subs" label="Subs(K)" />
                <Th col="views" label="Views" />
                <Th col="chMult" label="Ch.×" />
                <Th col="qual" label="Qual" />
                <Th col="titleType" label="Title Type" />
                <Th col="emotion" label="Emotion" />
                <Th col="hook" label="Hook" />
                <Th col="pacing" label="Pacing" />
                <th style={{ width: colWidths.actions }} className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={e.id}
                  className={`border-b border-border hover:bg-primary/5 transition-colors ${rowBg(e, i)}`}>
                  <td style={{ width: colWidths.cb }} className="px-2 py-1.5">
                    <input type="checkbox" className="accent-primary w-3 h-3" checked={selected.has(e.id)} onChange={() => toggleRow(e.id)} />
                  </td>
                  <td style={{ width: colWidths.idx }} className="px-2 py-1.5 text-[10px] text-muted-foreground">{e._idx + 1}</td>
                  <td style={{ width: colWidths.title, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="px-2 py-1.5 text-[10px] text-foreground" title={e.title}>{e.title}</td>
                  <td style={{ width: colWidths.channel, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="px-2 py-1.5 text-[10px] text-muted-foreground">{e.channel || '—'}</td>
                  <td style={{ width: colWidths.subs }} className="px-2 py-1.5 text-[10px]">{e.subs || '—'}</td>
                  <td style={{ width: colWidths.views }} className="px-2 py-1.5 text-[10px]">{fmtNum(e.views)}</td>
                  <td style={{ width: colWidths.chMult }} className="px-2 py-1.5 text-[10px]">
                    <span className={e.chMult >= 6 ? 'text-yellow-300 font-bold' : e.chMult >= 4 ? 'text-primary font-bold' : 'text-muted-foreground'}>{e.chMult}x</span>
                  </td>
                  <td style={{ width: colWidths.qual }} className="px-2 py-1.5">
                    <Badge variant={e.qualifies ? 'success' : 'destructive'} className="text-[9px]">{e.qualifies ? 'YES' : 'NO'}</Badge>
                  </td>
                  <td style={{ width: colWidths.titleType }} className="px-2 py-1.5 text-[10px] text-primary">{e.titleType || '—'}</td>
                  <td style={{ width: colWidths.emotion }} className="px-2 py-1.5 text-[10px] text-muted-foreground">{e.emotion || '—'}</td>
                  <td style={{ width: colWidths.hook }} className="px-2 py-1.5 text-[10px] text-muted-foreground">{e.hook || '—'}</td>
                  <td style={{ width: colWidths.pacing }} className="px-2 py-1.5 text-[10px] text-muted-foreground">{e.pacing || '—'}</td>
                  <td style={{ width: colWidths.actions }} className="px-2 py-1.5">
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
