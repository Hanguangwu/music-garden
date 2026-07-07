import type { SongInfo } from '../types'

const KEYS = {
  playlist: 'music-garden-playlist',
  favorites: 'music-garden-favorites',
  volume: 'music-garden-volume',
} as const

export function savePlaylist(tracks: SongInfo[]): void {
  try {
    localStorage.setItem(KEYS.playlist, JSON.stringify(tracks))
  } catch {
    // Storage full or unavailable
  }
}

export function loadPlaylist(): SongInfo[] {
  try {
    const data = localStorage.getItem(KEYS.playlist)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveFavorites(favorites: SongInfo[]): void {
  try {
    localStorage.setItem(KEYS.favorites, JSON.stringify(favorites))
  } catch {
    // Storage full or unavailable
  }
}

export function loadFavorites(): SongInfo[] {
  try {
    const data = localStorage.getItem(KEYS.favorites)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveVolume(volume: number): void {
  try {
    localStorage.setItem(KEYS.volume, String(volume))
  } catch {
    // Storage full or unavailable
  }
}

export function loadVolume(): number {
  try {
    const data = localStorage.getItem(KEYS.volume)
    return data ? parseFloat(data) : 0.8
  } catch {
    return 0.8
  }
}
