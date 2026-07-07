import { ref, watch, onUnmounted } from 'vue'
import type { SongInfo, PlayMode } from '../types'
import { getAudioUrl, getLyrics } from '../services/api'
import { saveVolume, loadVolume } from './useStorage'

export function usePlayer() {
  const currentTrack = ref<SongInfo | null>(null)
  const playlist = ref<SongInfo[]>([])
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(loadVolume())
  const isMuted = ref(false)
  const playMode = ref<PlayMode>('order')
  const lyrics = ref<{ time: number; text: string }[]>([])
  const currentLyricIndex = ref(-1)
  let audioElement: HTMLAudioElement | null = null

  function ensureAudio() {
    if (!audioElement) {
      audioElement = new Audio()
      audioElement.preload = 'auto'

      audioElement.addEventListener('timeupdate', () => {
        currentTime.value = audioElement?.currentTime || 0
        updateLyricIndex()
      })

      audioElement.addEventListener('loadedmetadata', () => {
        duration.value = audioElement?.duration || 0
      })

      audioElement.addEventListener('ended', () => {
        isPlaying.value = false
        next()
      })

      audioElement.addEventListener('error', () => {
        isPlaying.value = false
        // Try next track on error
        next()
      })
    }
  }

  function updateLyricIndex() {
    const ct = currentTime.value
    const lrcs = lyrics.value
    let idx = -1
    for (let i = 0; i < lrcs.length; i++) {
      if (lrcs[i].time <= ct) {
        idx = i
      } else {
        break
      }
    }
    currentLyricIndex.value = idx
  }

  function applyVolume() {
    if (audioElement) {
      audioElement.volume = isMuted.value ? 0 : volume.value
    }
  }

  async function play(track: SongInfo) {
    ensureAudio()
    if (!audioElement) return

    currentTrack.value = track
    isPlaying.value = true
    currentTime.value = 0
    duration.value = 0

    try {
      // Resolve the audio URL (follow redirects)
      const finalUrl = await getAudioUrl(track)
      audioElement.src = finalUrl
      audioElement.volume = isMuted.value ? 0 : volume.value
      await audioElement.play()

      // Fetch lyrics
      const lrcData = await getLyrics(track)
      lyrics.value = lrcData
      currentLyricIndex.value = -1
    } catch {
      isPlaying.value = false
    }
  }

  function togglePlay() {
    ensureAudio()
    if (!audioElement) return

    if (isPlaying.value) {
      audioElement.pause()
      isPlaying.value = false
    } else if (currentTrack.value) {
      audioElement.play().catch(() => {
        isPlaying.value = false
      })
      isPlaying.value = true
    }
  }

  function pause() {
    audioElement?.pause()
    isPlaying.value = false
  }

  function resume() {
    if (currentTrack.value && audioElement && !isPlaying.value) {
      audioElement.play().catch(() => {})
      isPlaying.value = true
    }
  }

  function seek(time: number) {
    if (audioElement) {
      audioElement.currentTime = time
      currentTime.value = time
    }
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v))
    saveVolume(volume.value)
    applyVolume()
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    applyVolume()
  }

  function next() {
    const list = playlist.value
    if (list.length === 0 || !currentTrack.value) return

    const currentIdx = list.findIndex(t => t.id === currentTrack.value!.id)
    let nextIdx: number

    switch (playMode.value) {
      case 'shuffle':
        nextIdx = Math.floor(Math.random() * list.length)
        break
      case 'repeat':
        nextIdx = currentIdx
        break
      case 'order':
      default:
        nextIdx = (currentIdx + 1) % list.length
        break
    }

    const nextTrack = list[nextIdx]
    if (nextTrack) {
      play(nextTrack)
    }
  }

  function prev() {
    const list = playlist.value
    if (list.length === 0 || !currentTrack.value) return

    const currentIdx = list.findIndex(t => t.id === currentTrack.value!.id)
    const prevIdx = currentIdx <= 0 ? list.length - 1 : currentIdx - 1
    const prevTrack = list[prevIdx]
    if (prevTrack) {
      play(prevTrack)
    }
  }

  function addToPlaylist(track: SongInfo) {
    const exists = playlist.value.some(t => t.id === track.id)
    if (!exists) {
      playlist.value.push(track)
    }
  }

  function removeFromPlaylist(trackId: string) {
    playlist.value = playlist.value.filter(t => t.id !== trackId)
    if (currentTrack.value?.id === trackId) {
      pause()
      currentTrack.value = null
    }
  }

  function clearPlaylist() {
    playlist.value = []
    pause()
    currentTrack.value = null
  }

  function setPlayMode(mode: PlayMode) {
    playMode.value = mode
  }

  // Watch volume changes
  watch(volume, () => {
    applyVolume()
  })

  // Cleanup
  onUnmounted(() => {
    if (audioElement) {
      audioElement.pause()
      audioElement.src = ''
      audioElement = null
    }
  })

  return {
    currentTrack,
    playlist,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playMode,
    lyrics,
    currentLyricIndex,
    play,
    togglePlay,
    pause,
    resume,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    setPlayMode,
  }
}
