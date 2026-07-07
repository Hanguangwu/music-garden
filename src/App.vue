<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { SongInfo, PlayMode } from './types'
import { useSearch } from './composables/useSearch'
import { usePlayer } from './composables/usePlayer'
import { savePlaylist, loadPlaylist, loadFavorites, saveFavorites } from './composables/useStorage'
import { downloadSong } from './services/api'

import SearchPanel from './components/SearchPanel.vue'
import PlayerPanel from './components/PlayerPanel.vue'
import LyricsDisplay from './components/LyricsDisplay.vue'
import PlaylistPanel from './components/PlaylistPanel.vue'
import Toast from './components/Toast.vue'

const search = useSearch()
const player = usePlayer()

// Destructure search refs for template auto-unwrap
const {
  keyword: searchKeyword,
  sources: searchSources,
  results: searchResults,
  isLoading: searchLoading,
  search: doSearch,
  toggleSource: toggleSearchSource,
} = search

// Destructure player refs for template auto-unwrap
const {
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
  prev,
  next: nextTrack,
  seek,
  setVolume,
  toggleMute,
  addToPlaylist,
  removeFromPlaylist,
  clearPlaylist,
  setPlayMode,
} = player

const toastMessage = ref('')
const toastVisible = ref(false)

const playlistTab = ref<'playlist' | 'favorites'>('playlist')
const favorites = ref<SongInfo[]>([])

// Load saved data on mount
onMounted(() => {
  const savedPlaylist = loadPlaylist()
  if (savedPlaylist.length > 0) {
    playlist.value = savedPlaylist
  }
  const savedFavs = loadFavorites()
  if (savedFavs.length > 0) {
    favorites.value = savedFavs
  }
})

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
}

// Search
function onSearch(keyword: string) {
  searchKeyword.value = keyword
  doSearch()
}

function onToggleSource(sourceId: string) {
  toggleSearchSource(sourceId)
}

// Play
function onPlay(song: SongInfo) {
  addToPlaylist(song)
  play(song)
  showToast(`正在播放: ${song.name}`)
}

function onTogglePlay() {
  togglePlay()
}

function onPrev() {
  prev()
}

function onNext() {
  nextTrack()
}

function onSeek(time: number) {
  seek(time)
}

function onSetVolume(v: number) {
  setVolume(v)
}

function onToggleMute() {
  toggleMute()
}

function onSetPlayMode(mode: PlayMode) {
  setPlayMode(mode)
}

function onDownload() {
  if (currentTrack.value) {
    downloadSong(currentTrack.value)
    showToast('开始下载...')
  }
}

function onToggleFav() {
  const track = currentTrack.value
  if (!track) return
  const idx = favorites.value.findIndex(f => f.id === track.id)
  if (idx >= 0) {
    favorites.value.splice(idx, 1)
    showToast('已取消收藏')
  } else {
    favorites.value.push({ ...track })
    showToast('已添加收藏')
  }
}

function onRemoveFromPlaylist(id: string) {
  removeFromPlaylist(id)
}

function onRemoveFromFavorites(id: string) {
  favorites.value = favorites.value.filter(f => f.id !== id)
}

function onClearPlaylist() {
  clearPlaylist()
  showToast('已清空播放列表')
}

function onImportPlaylist(songs: SongInfo[]) {
  for (const song of songs) {
    addToPlaylist(song)
  }
  showToast(`已导入 ${songs.length} 首歌曲`)
}

function onAddFav(song: SongInfo) {
  const exists = favorites.value.some(f => f.id === song.id)
  if (!exists) {
    favorites.value.push(song)
    saveFavorites(favorites.value)
    showToast('已添加收藏')
  }
}

// Persist changes
watch(() => playlist.value, (val) => {
  savePlaylist(val)
}, { deep: true })

watch(() => favorites.value, (val) => {
  saveFavorites(val)
}, { deep: true })
</script>

<template>
  <div class="app-container">
    <div class="bg-glow" />

    <header class="app-header">
      <div class="logo-area">
        <div class="logo-icon">🎵</div>
        <div class="logo-text">
          <h1>音乐花园</h1>
          <p>Music Garden</p>
        </div>
      </div>
      <div class="header-info">
        <span class="source-count">{{ searchSources.length }} 源</span>
        <span class="track-count">{{ playlist.length }} 首</span>
      </div>
    </header>

    <main class="main-layout">
      <section class="glass-panel search-section">
        <SearchPanel
          :results="searchResults"
          :isLoading="searchLoading"
          :sources="searchSources"
          @search="onSearch"
          @play="onPlay"
          @toggle-source="onToggleSource"
        />
      </section>

      <section class="center-section">
        <div class="glass-panel player-section">
          <PlayerPanel
            :track="currentTrack"
            :isPlaying="isPlaying"
            :currentTime="currentTime"
            :duration="duration"
            :volume="volume"
            :isMuted="isMuted"
            :playMode="playMode"
            @toggle-play="onTogglePlay"
            @prev="onPrev"
            @next="onNext"
            @seek="onSeek"
            @set-volume="onSetVolume"
            @toggle-mute="onToggleMute"
            @toggle-fav="onToggleFav"
            @download="onDownload"
            @set-play-mode="onSetPlayMode"
          />
        </div>
        <div class="glass-panel lyrics-section">
          <LyricsDisplay
            :lyrics="lyrics"
            :currentIndex="currentLyricIndex"
          />
        </div>
      </section>

      <section class="glass-panel playlist-section">
        <PlaylistPanel
          :playlist="playlist"
          :currentTrack="currentTrack"
          :favorites="favorites"
          :currentTab="playlistTab"
          @play="onPlay"
          @remove="onRemoveFromPlaylist"
          @remove-fav="onRemoveFromFavorites"
          @clear="onClearPlaylist"
          @update:currentTab="playlistTab = $event"
          @import="onImportPlaylist"
          @add-fav="onAddFav"
        />
      </section>
    </main>

    <Toast
      :message="toastMessage"
      :visible="toastVisible"
      @close="toastVisible = false"
    />
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.bg-glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse at 10% 0%, #1b2340 0%, transparent 50%),
    radial-gradient(ellipse at 90% 100%, #211a38 0%, transparent 50%),
    var(--bg-primary);
}

/* Header */
.app-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  flex-shrink: 0;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text h1 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.logo-text p {
  font-size: 10px;
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.header-info {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-secondary);
}

.header-info span {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
}

/* Main Layout */
.main-layout {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(260px, 0.75fr) minmax(360px, 1.5fr) minmax(260px, 0.75fr);
  gap: 10px;
  padding: 0 16px 12px;
  overflow: hidden;
}

.search-section,
.playlist-section {
  min-height: 0;
}

.center-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.player-section {
  flex-shrink: 0;
}

.lyrics-section {
  flex: 1;
  min-height: 0;
}

/* Responsive */
@media (max-width: 1100px) {
  .main-layout {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      "player player"
      "search playlist";
  }
  .search-section { grid-area: search; }
  .center-section { grid-area: player; }
  .playlist-section { grid-area: playlist; }
}

@media (max-width: 700px) {
  .main-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      "player"
      "search"
      "playlist";
  }
  .search-section { grid-area: search; }
  .center-section { grid-area: player; }
  .playlist-section { grid-area: playlist; }

  .app-header {
    padding: 8px 12px;
  }

  .logo-text h1 {
    font-size: 16px;
  }
}
</style>
