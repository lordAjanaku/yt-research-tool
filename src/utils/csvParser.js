export function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  return lines.slice(1).map(line => {
    const values = line.match(/("[^"]*"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || []
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = (values[i] || '').replace(/^"|"$/g, '').trim()
    })
    return obj
  })
}
