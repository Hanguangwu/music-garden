<script setup lang="ts">
import { ref } from 'vue'
import type { SongInfo } from '../types'
import { getSourceName } from '../services/api'

const props = defineProps<{
  playlist: SongInfo[]
  currentTrack: SongInfo | null
  favorites: SongInfo[]
  currentTab: 'playlist' | 'favorites'
}>()

const emit = defineEmits<{
  (e: 'play', song: SongInfo): void
  (e: 'remove', id: string): void
  (e: 'remove-fav', id: string): void
  (e: 'clear'): void
  (e: 'update:currentTab', tab: 'playlist' | 'favorites'): void
  (e: 'import', songs: SongInfo[]): void
  (e: 'add-fav', song: SongInfo): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

function playSong(song: SongInfo) {
  emit('play', song)
}

function removeSong(song: SongInfo) {
  if (props.currentTab === 'favorites') {
    emit('remove-fav', song.id)
  } else {
    emit('remove', song.id)
  }
}

function clearAll() {
  emit('clear')
}

function exportPlaylist() {
  const data = JSON.stringify(props.playlist, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'music-garden-playlist.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInputRef.value?.click()
}

function onFileImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const songs = JSON.parse(reader.result as string) as SongInfo[]
      if (Array.isArray(songs)) {
        emit('import', songs)
      }
    } catch {
      // Invalid file
    }
  }
  reader.readAsText(file)
  input.value = ''
}

const currentItems = ref<SongInfo[]>([])

// We'll use computed-like reactivity through watchers
import { watch } from 'vue'

watch(() => props.currentTab, () => {
  updateItems()
}, { immediate: true })

watch([() => props.playlist, () => props.favorites], () => {
  updateItems()
}, { deep: true })

function updateItems() {
  currentItems.value = props.currentTab === 'favorites'
    ? props.favorites
    : props.playlist
}

function isCurrentPlaying(song: SongInfo): boolean {
  return props.currentTrack?.id === song.id
}
</script>

<template>
  <div class="playlist-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span class="title-icon">📋</span>
        <span>播放列表</span>
      </div>
      <span class="panel-chip">{{ currentItems.length }} 首</span>
    </div>

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: currentTab === 'playlist' }"
        @click="emit('update:currentTab', 'playlist')"
      >
        播放列表
      </button>
      <button
        class="tab"
        :class="{ active: currentTab === 'favorites' }"
        @click="emit('update:currentTab', 'favorites')"
      >
        收藏
      </button>
    </div>

    <div class="toolbar">
      <input
        ref="fileInputRef"
        type="file"
        accept=".json"
        style="display: none"
        @change="onFileImport"
      />
      <button class="btn btn-ghost btn-xs" @click="triggerImport">导入</button>
      <button class="btn btn-ghost btn-xs" @click="exportPlaylist">导出</button>
      <button
        v-if="currentTab === 'playlist' && playlist.length > 0"
        class="btn btn-ghost btn-xs"
        @click="clearAll"
      >
        清空
      </button>
    </div>

    <div v-if="currentItems.length === 0" class="empty-playlist">
      <span class="empty-icon">📭</span>
      <p>{{ currentTab === 'favorites' ? '暂无收藏' : '列表为空' }}</p>
    </div>

    <div v-else class="playlist-scroll">
      <div
        v-for="(song, index) in currentItems"
        :key="song.id"
        class="playlist-item"
        :class="{ playing: isCurrentPlaying(song) }"
        @click="playSong(song)"
      >
        <span class="item-index">{{ index + 1 }}</span>
        <div class="item-meta">
          <div class="item-title">{{ song.name }}</div>
          <div class="item-sub">
            <span>{{ song.artist }}</span>
            <span class="item-source" :class="`source-${song.source}`">
              {{ getSourceName(song.source) }}
            </span>
          </div>
        </div>
        <button
          class="item-remove"
          @click.stop="removeSong(song)"
          title="移除"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

.title-icon { font-size: 16px; }

.panel-chip {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0,0,0,0.25);
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 2px;
  border-radius: 999px;
  background: rgba(0,0,0,0.3);
  flex-shrink: 0;
}

.tab {
  flex: 1;
  border: none;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.tab.active {
  background: radial-gradient(circle at 30% 0, rgba(255,255,255,0.1), rgba(104,174,255,0.8));
  color: #fff;
  font-weight: 600;
}

.toolbar {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-xs {
  padding: 3px 10px;
  font-size: 10px;
}

.empty-playlist {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  color: var(--text-secondary);
}

.empty-playlist .empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-playlist p {
  margin: 0;
  font-size: 12px;
}

.playlist-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 4px;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
  border: 1px solid transparent;
}

.playlist-item:hover {
  background: rgba(255,255,255,0.04);
}

.playlist-item.playing {
  border-color: var(--accent-1);
  background: rgba(245,200,76,0.06);
}

.item-index {
  width: 20px;
  text-align: right;
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.playlist-item.playing .item-index {
  color: var(--accent-1);
}

.item-meta {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 1px;
}

.item-source {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid currentColor;
}

.source-netease { color: var(--accent-netease); }
.source-qq { color: var(--accent-qq); }
.source-kuwo { color: var(--accent-kuwo); }
.source-kugou { color: var(--accent-kugou); }
.source-migu { color: var(--accent-migu); }

.item-remove {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 10px;
  padding: 2px;
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
}

.playlist-item:hover .item-remove {
  opacity: 0.6;
}

.item-remove:hover {
  opacity: 1 !important;
  color: var(--accent-2);
}
</style>
