/**
 * Music API Service Layer
 * Provides search and download functionality via multiple aggregator APIs
 * Reference: https://github.com/CharlesPikachu/musicdl
 */

import type { SongInfo } from '../types'

export interface ApiConfig {
  tuneHubBase: string
  metingBase: string
  jbsouBase: string
}

export const defaultApiConfig: ApiConfig = {
  tuneHubBase: 'https://music-dl.sayqz.com',
  metingBase: 'https://api.qijieya.cn/meting',
  jbsouBase: 'https://www.jbsou.cn',
}

// Source name mappings
const SOURCE_NAMES: Record<string, string> = {
  netease: '网易云',
  qq: 'QQ音乐',
  kuwo: '酷我',
  kugou: '酷狗',
  migu: '咪咕',
}

const SOURCE_METING_MAP: Record<string, string> = {
  netease: 'netease',
  qq: 'tencent',
  kuwo: 'kuwo',
  kugou: 'kugou',
}

/** Parse LRC text into timed lines */
export function parseLRC(lrcText: string): { time: number; text: string }[] {
  const lines = lrcText.split('\n')
  const result: { time: number; text: string }[] = []
  const regex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\](.*)/
  for (const line of lines) {
    const match = line.match(regex)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const millis = parseInt(match[3].padEnd(3, '0'))
      const time = minutes * 60 + seconds + millis / 1000
      const text = match[4].trim()
      if (text) {
        result.push({ time, text })
      }
    }
  }
  return result
}

/** Follow redirects to get the final URL */
export async function resolveUrl(url: string, timeout = 10000): Promise<string> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const resp = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timer)
    return resp.url || url
  } catch {
    return url
  }
}

/** Helper: fetch with timeout */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal })
    return resp
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Search via TuneHub API (primary)
 * GET /api/?source={source}&type=search&keyword={keyword}&limit={limit}
 */
async function searchTuneHub(
  keyword: string,
  source: string,
  limit: number,
  config: ApiConfig
): Promise<SongInfo[]> {
  try {
    const url = `${config.tuneHubBase}/api/?source=${source}&type=search&keyword=${encodeURIComponent(keyword)}&limit=${limit}`
    const resp = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json' } })
    if (!resp.ok) return []
    const data = await resp.json()
    if (data.code !== 200 || !data.data?.results) return []

    return data.data.results.map((r: Record<string, unknown>) => ({
      id: `${source}-${r.id}`,
      songId: String(r.id),
      name: String(r.name || ''),
      artist: String(r.artist || ''),
      album: String(r.album || ''),
      source,
      coverUrl: String(r.pic || ''),
      audioUrl: `${config.tuneHubBase}/api/?source=${source}&id=${r.id}&type=url&br=320k`,
      lyrics: '',
      duration: 0,
      ext: 'mp3',
    }))
  } catch {
    return []
  }
}

/**
 * Search via Meting API (fallback)
 * GET ?server={server}&type=search&name={keyword}
 */
async function searchMeting(
  keyword: string,
  source: string,
  limit: number,
  config: ApiConfig
): Promise<SongInfo[]> {
  const server = SOURCE_METING_MAP[source]
  if (!server) return []

  try {
    const url = `${config.metingBase}/?server=${server}&type=search&name=${encodeURIComponent(keyword)}&limit=${limit}`
    const resp = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json' } })
    if (!resp.ok) return []
    const results = await resp.json()
    if (!Array.isArray(results)) return []

    return results.slice(0, limit).map((r: Record<string, unknown>) => ({
      id: `${source}-${r.id}`,
      songId: String(r.id),
      name: String(r.name || ''),
      artist: String(r.author || r.artist || ''),
      album: String(r.album || ''),
      source,
      coverUrl: String(r.pic || ''),
      audioUrl: `${config.metingBase}/?server=${server}&type=url&id=${r.id}&br=320000`,
      lyrics: `${config.metingBase}/?server=${server}&type=lrc&id=${r.id}`,
      duration: typeof r.duration === 'number' ? r.duration : 0,
      ext: 'mp3',
    }))
  } catch {
    return []
  }
}

/**
 * Search via JBSou API (alternative)
 * POST / with form data { input, filter, type, page }
 */
async function searchJBSou(
  keyword: string,
  source: string,
  _limit: number,
  config: ApiConfig
): Promise<SongInfo[]> {
  try {
    const formData = new URLSearchParams()
    formData.append('input', keyword)
    formData.append('filter', 'name')
    formData.append('type', source)
    formData.append('page', '1')

    const resp = await fetchWithTimeout(config.jbsouBase, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    })
    if (!resp.ok) return []
    const data = await resp.json()
    if (!data.data || !Array.isArray(data.data)) return []

    const songs: SongInfo[] = []
    for (const item of data.data) {
      if (!item.songid || !item.name) continue
      const downloadUrl = item.url ? await resolveUrl(new URL(item.url, config.jbsouBase).toString()) : ''
      const coverUrl = item.cover ? await resolveUrl(new URL(item.cover, config.jbsouBase).toString()) : ''
      songs.push({
        id: `${source}-${item.songid}`,
        songId: String(item.songid),
        name: String(item.name || ''),
        artist: String((item.artist || '').replace('/', ', ')),
        album: String(item.album || ''),
        source,
        coverUrl,
        audioUrl: downloadUrl,
        lyrics: item.lrc || '',
        duration: 0,
        ext: 'mp3',
      })
    }
    return songs
  } catch {
    return []
  }
}

/**
 * Main search function - tries multiple APIs with fallback
 */
export async function searchMusic(
  keyword: string,
  sources: string[],
  limit = 20,
  config: ApiConfig = defaultApiConfig
): Promise<SongInfo[]> {
  if (!keyword.trim()) return []

  const allSongs: SongInfo[] = []
  const seen = new Set<string>()

  for (const source of sources) {
    // Try TuneHub first
    let results = await searchTuneHub(keyword, source, limit, config)

    // Fallback to Meting if TuneHub returns nothing
    if (results.length === 0) {
      results = await searchMeting(keyword, source, limit, config)
    }

    // Fallback to JBSou
    if (results.length === 0) {
      results = await searchJBSou(keyword, source, limit, config)
    }

    // Deduplicate
    for (const song of results) {
      const key = `${song.name}-${song.artist}-${song.source}`
      if (!seen.has(key)) {
        seen.add(key)
        allSongs.push(song)
      }
    }
  }

  return allSongs
}

/**
 * Resolve the actual playable audio URL for a song
 */
export async function getAudioUrl(song: SongInfo): Promise<string> {
  if (song.audioUrl.startsWith('http')) {
    return resolveUrl(song.audioUrl)
  }
  return song.audioUrl
}

/**
 * Fetch LRC lyrics for a song
 */
export async function getLyrics(song: SongInfo): Promise<{ time: number; text: string }[]> {
  if (song.lyrics && !song.lyrics.startsWith('http')) {
    return parseLRC(song.lyrics)
  }

  const lrcUrl = song.lyrics || `${defaultApiConfig.tuneHubBase}/api/?source=${song.source}&id=${song.songId}&type=lrc`
  if (!lrcUrl) return []

  try {
    const resp = await fetchWithTimeout(lrcUrl)
    if (!resp.ok) return []
    const text = await resp.text()
    return parseLRC(text)
  } catch {
    return []
  }
}

/**
 * Get source display name
 */
export function getSourceName(source: string): string {
  return SOURCE_NAMES[source] || source
}

/**
 * Direct download a song - triggers browser download
 */
export function downloadSong(song: SongInfo): void {
  const link = document.createElement('a')
  link.href = song.audioUrl
  link.download = `${song.name} - ${song.artist}.${song.ext || 'mp3'}`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
