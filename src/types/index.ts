export interface MusicSource {
  id: string
  name: string
  color: string
  enabled: boolean
}

export interface SongInfo {
  id: string
  songId: string
  name: string
  artist: string
  album: string
  source: string
  coverUrl: string
  audioUrl: string
  lyrics: string
  duration: number
  ext: string
}

export interface SearchResult {
  source: string
  songs: SongInfo[]
}

export interface PlaylistItem extends SongInfo {
  playlistId: string
  addedAt: number
}

export type PlayMode = 'order' | 'repeat' | 'shuffle'

export interface PlayerState {
  currentTrack: PlaylistItem | null
  playlist: PlaylistItem[]
  playMode: PlayMode
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
}
