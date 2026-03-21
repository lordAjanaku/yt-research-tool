import { useStore } from '../store/useStore'
import { calcMedian } from '../utils/numbers'
import { getQualifies } from '../utils/qualify'

function extractId(url) {
  const s = url.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] || 0) * 60) + parseInt(m[2] || 0) + Math.round(parseInt(m[3] || 0) / 60)
}

export function useYouTubeAPI() {
  const { ytApiKey, outlierThreshold, channelBaseline } = useStore()

  async function fetchVideoDetails(ids) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids.join(',')}&key=${ytApiKey}`
    const r = await fetch(url)
    const d = await r.json()
    if (d.error) throw new Error(d.error.message)
    return d.items || []
  }

  async function fetchChannelSubs(channelIds) {
    const ids = [...new Set(channelIds)].join(',')
    const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${ids}&key=${ytApiKey}`)
    const d = await r.json()
    const map = {}
    ;(d.items || []).forEach(ch => {
      map[ch.id] = Math.round(parseInt(ch.statistics.subscriberCount || 0) / 1000)
    })
    return map
  }

  async function fetchChannelMedian(channelId) {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${ytApiKey}`)
    const d = await r.json()
    const playlistId = d.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!playlistId) return 0
    const pr = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=${channelBaseline}&key=${ytApiKey}`)
    const pd = await pr.json()
    const videoIds = (pd.items || []).map(i => i.contentDetails.videoId)
    if (!videoIds.length) return 0
    const items = await fetchVideoDetails(videoIds)
    const views = items.map(i => parseInt(i.statistics.viewCount || 0))
    return calcMedian(views)
  }

  async function fetchSingle(urlOrId) {
    const vid = extractId(urlOrId)
    if (!vid) throw new Error('Could not extract video ID')
    const items = await fetchVideoDetails([vid])
    if (!items.length) throw new Error('Video not found')
    const item = items[0]
    const subsMap = await fetchChannelSubs([item.snippet.channelId])
    const chMedian = await fetchChannelMedian(item.snippet.channelId)
    const views = parseInt(item.statistics.viewCount || 0)
    const subs = subsMap[item.snippet.channelId] || 0
    const length = parseDuration(item.contentDetails.duration)
    const chMult = chMedian > 0 ? parseFloat((views / chMedian).toFixed(2)) : 0
    return {
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      subs,
      views,
      length,
      date: item.snippet.publishedAt.slice(0, 10),
      chMedian,
      chMult,
      comments: 'No',
      qualifies: getQualifies({ subs, chMult, length, comments: 'No', threshold: outlierThreshold }),
    }
  }

  async function fetchMultiURL(urls) {
    const ids = urls.map(extractId).filter(Boolean)
    const chunks = []
    for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50))
    let allItems = []
    for (const chunk of chunks) allItems = allItems.concat(await fetchVideoDetails(chunk))
    const channelIds = [...new Set(allItems.map(i => i.snippet.channelId))]
    const subsMap = await fetchChannelSubs(channelIds)
    const medianMap = {}
    for (const cid of channelIds) medianMap[cid] = await fetchChannelMedian(cid)
    const searchMedian = calcMedian(allItems.map(i => parseInt(i.statistics.viewCount || 0)))
    return allItems.map(item => {
      const views = parseInt(item.statistics.viewCount || 0)
      const subs = subsMap[item.snippet.channelId] || 0
      const length = parseDuration(item.contentDetails.duration)
      const chMedian = medianMap[item.snippet.channelId] || 0
      const chMult = chMedian > 0 ? parseFloat((views / chMedian).toFixed(2)) : 0
      const searchMult = searchMedian > 0 ? parseFloat((views / searchMedian).toFixed(2)) : 0
      return {
        videoId: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        subs, views, length,
        date: item.snippet.publishedAt.slice(0, 10),
        chMedian, chMult, searchMult, searchMedian,
        comments: 'No',
        qualifies: getQualifies({ subs, chMult, length, comments: 'No', threshold: outlierThreshold }),
      }
    })
  }

  async function fetchKeywordSearch(query, months, maxResults) {
    const after = new Date()
    after.setMonth(after.getMonth() - months)
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=relevance&publishedAfter=${after.toISOString()}&maxResults=${maxResults}&key=${ytApiKey}`)
    const d = await r.json()
    if (d.error) throw new Error(d.error.message)
    if (!d.items?.length) throw new Error('No results found')
    const ids = d.items.map(i => i.id.videoId)
    return fetchMultiURL(ids.map(id => id))
  }

  async function fetchChannel(channelInput, months) {
    let channelId = channelInput.trim()
    if (channelId.includes('@') || channelId.includes('/c/') || channelId.includes('/channel/')) {
      const handle = channelId.match(/\/@([^/]+)/)?.[1] || channelId.match(/\/c\/([^/]+)/)?.[1]
      if (handle) {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=${handle}&key=${ytApiKey}`)
        const d = await r.json()
        channelId = d.items?.[0]?.id || ''
      } else {
        const match = channelId.match(/\/channel\/([^/]+)/)
        if (match) channelId = match[1]
      }
    }
    if (!channelId) throw new Error('Could not resolve channel ID')
    const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${ytApiKey}`)
    const d = await r.json()
    const ch = d.items?.[0]
    if (!ch) throw new Error('Channel not found')
    const playlistId = ch.contentDetails.relatedPlaylists.uploads
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months)
    let allVideoIds = []
    let pageToken = ''
    do {
      const pr = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50${pageToken ? '&pageToken=' + pageToken : ''}&key=${ytApiKey}`)
      const pd = await pr.json()
      const items = pd.items || []
      let done = false
      for (const item of items) {
        const pub = new Date(item.contentDetails.videoPublishedAt)
        if (pub < cutoff) { done = true; break }
        allVideoIds.push(item.contentDetails.videoId)
      }
      pageToken = pd.nextPageToken || ''
      if (done) break
    } while (pageToken)
    if (!allVideoIds.length) return { channelInfo: { id: channelId, name: ch.snippet.title }, videos: [] }
    const chunks = []
    for (let i = 0; i < allVideoIds.length; i += 50) chunks.push(allVideoIds.slice(i, i + 50))
    let allItems = []
    for (const chunk of chunks) allItems = allItems.concat(await fetchVideoDetails(chunk))
    const views = allItems.map(i => parseInt(i.statistics.viewCount || 0))
    const chMedian = calcMedian(views)
    const subs = Math.round(parseInt(ch.statistics.subscriberCount || 0) / 1000)
    const videos = allItems.map(item => {
      const v = parseInt(item.statistics.viewCount || 0)
      const length = parseDuration(item.contentDetails.duration)
      const chMult = chMedian > 0 ? parseFloat((v / chMedian).toFixed(2)) : 0
      return {
        videoId: item.id,
        title: item.snippet.title,
        channel: ch.snippet.title,
        channelId,
        subs, views: v, length,
        date: item.snippet.publishedAt.slice(0, 10),
        chMedian, chMult,
        comments: 'No',
        qualifies: getQualifies({ subs, chMult, length, comments: 'No', threshold: outlierThreshold }),
      }
    })
    return {
      channelInfo: {
        id: channelId,
        name: ch.snippet.title,
        subs,
        chMedian,
        totalFetched: videos.length,
        qualified: videos.filter(v => v.qualifies).length,
      },
      videos,
    }
  }

  async function testKey() {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${ytApiKey}`)
    const d = await r.json()
    if (d.error) throw new Error(d.error.message)
    return true
  }

  return { fetchSingle, fetchMultiURL, fetchKeywordSearch, fetchChannel, testKey }
}
