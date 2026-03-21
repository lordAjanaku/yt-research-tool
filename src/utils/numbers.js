export function parseNum(val) {
  if (val === null || val === undefined || val === '') return 0
  const s = String(val).trim().toUpperCase()
  if (s.endsWith('M')) return Math.round(parseFloat(s) * 1_000_000)
  if (s.endsWith('K')) return Math.round(parseFloat(s) * 1_000)
  return parseInt(s.replace(/[^0-9]/g, ''), 10) || 0
}

export function fmtNum(n) {
  if (!n || n === 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}

export function calcMedian(arr) {
  if (!arr || !arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}
