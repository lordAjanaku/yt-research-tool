export function toCSV(entries) {
  const cols = ['title','channel','subs','views','chMult','searchMult','qualifies','date','length','chMedian','comments','titleType','emotion','hook','pacing','arc','insight','search']
  const hdr = cols.join(',')
  const rows = entries.map(e =>
    cols.map(c => {
      const v = e[c] === undefined ? '' : String(e[c])
      return '"' + v.replace(/"/g, '""') + '"'
    }).join(',')
  )
  return [hdr, ...rows].join('\n')
}

export function downloadFile(content, filename, type) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = filename
  a.click()
}
