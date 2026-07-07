<script setup lang="ts">
import { ref } from 'vue'
import type { SongInfo } from '../types'
import { getSourceName } from '../services/api'

const props = defineProps<{
  results: SongInfo[]
  isLoading: boolean
  sources: string[]
}>()

const emit = defineEmits<{
  search: [keyword: string]
  play: [song: SongInfo]
  'update:sources': [sources: string[]]
}>()

const keyword = ref('')
const sourcesConfig = [
  { id: 'netease', label: '网易云', color: 'var(--accent-netease)' },
  { id: 'qq', label: 'QQ', color: 'var(--accent-qq)' },
  { id: 'kuwo', label: '酷我', color: 'var(--accent-kuwo)' },
  { id: 'kugou', label: '酷狗', color: 'var(--accent-kugou)' },
  { id: 'migu', label: '咪咕', color: 'var(--accent-migu)' },
]

function toggleSource(sourceId: string) {
  const current = [...props.sources]
  const idx = current.indexOf(sourceId)
  if (idx >= 0) {
    if (current.length > 1) {
      current.splice(idx, 1)
    }
  } else {
    current.push(sourceId)
  }
  emit('update:sources', current)
}

function doSearch() {
  if (keyword.value.trim()) {
    emit('search', keyword.value)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') doSearch()
}

function playSong(song: SongInfo) {
  emit('play', song)
}
</script>

<template>
  <div class="search-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span class="icon">🔍</span>
        <span>歌曲搜索</span>
      </div>
      <span class="chip">多源聚合搜索</span>
    </div>

    <div class="search-box">
      <input
        v-model="keyword"
        type="text"
        class="search-input"
        placeholder="输入歌名或歌手..."
        @keydown="onKeydown"
      />
      <button class="btn btn-primary" @click="doSearch" :disabled="isLoading">
        {{ isLoading ? '搜索中...' : '搜索' }}
      </button>
    </div>

    <div class="source-filters">
      <label
        v-for="src in sourcesConfig"
        :key="src.id"
        class="source-chip"
        :class="{ active: sources.includes(src.id) }"
      >
        <span class="source-dot" :style="{ backgroundColor: src.color }"></span>
        <input
          type="checkbox"
          :checked="sources.includes(src.id)"
          @change="toggleSource(src.id)"
        />
        <span>{{ src.label }}</span>
      </label>
    </div>

    <div class="results-header">
      <span class="results-count" v-if="results.length > 0">
        找到 {{ results.length }} 首
      </span>
      <span class="results-count" v-else-if="isLoading">
        搜索中...
      </span>
      <span class="results-count" v-else>
        输入关键词开始搜索
      </span>
    </div>

    <div class="results-list" v-if="!isLoading && results.length > 0">
      <div
        v-for="(song, idx) in results"
        :key="song.id"
        class="result-item"
        @click="playSong(song)"
      >
        <span class="result-index">{{ idx + 1 }}</span>
        <div class="result-info">
          <span class="result-title">{{ song.name }}</span>
          <span class="result-artist">{{ song.artist }}</span>
        </div>
        <span class="result-source" :class="'source-' + song.source">
          {{ getSourceName(song.source) }}
        </span>
        <button class="btn-icon btn-play-small" @click.stop="playSong(song)" title="播放">
          ▶
        </button>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>正在搜索...</span>
    </div>

    <div v-else class="empty-state">
      <span class="empty-icon">🎵</span>
      <span>搜索你喜欢的音乐</span>
    </div>
  </div>
</template>

<style scoped>
.search-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: rgba(5, 7, 20, 0.8);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--accent-1);
  box-shadow: 0 0 0 1px rgba(245, 200, 76, 0.3);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.source-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.source-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  font-size: 12px;
  user-select: none;
  transition: all 0.2s;
}

.source-chip:hover {
  background: rgba(255, 255, 255, 0.08);
}

.source-chip.active {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.source-chip input {
  display: none;
}

.source-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.results-header {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.result-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--glass-border);
}

.result-index {
  width: 24px;
  text-align: right;
  color: var(--text-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-title {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-artist {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-source {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid;
  white-space: nowrap;
  flex-shrink: 0;
}

.source-netease { color: var(--accent-netease); border-color: rgba(255, 107, 107, 0.3); background: rgba(255, 107, 107, 0.08); }
.source-qq { color: var(--accent-qq); border-color: rgba(77, 208, 225, 0.3); background: rgba(77, 208, 225, 0.08); }
.source-kuwo { color: var(--accent-kuwo); border-color: rgba(186, 104, 200, 0.3); background: rgba(186, 104, 200, 0.08); }
.source-kugou { color: var(--accent-kugou); border-color: rgba(255, 167, 38, 0.3); background: rgba(255, 167, 38, 0.08); }
.source-migu { color: var(--accent-migu); border-color: rgba(102, 187, 106, 0.3); background: rgba(102, 187, 106, 0.08); }

.btn-play-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(245, 200, 76, 0.15);
  color: var(--accent-1);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.btn-play-small:hover {
  background: rgba(245, 200, 76, 0.3);
  transform: scale(1.1);
}

.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.empty-icon {
  font-size: 36px;
  opacity: 0.5;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--glass-border);
  border-top-color: var(--accent-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
