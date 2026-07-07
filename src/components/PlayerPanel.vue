<script setup lang="ts">
import { computed } from 'vue'
import type { SongInfo, PlayMode } from '../types'
import { getSourceName } from '../services/api'

const props = defineProps<{
  track: SongInfo | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playMode: PlayMode
}>()

const emit = defineEmits<{
  (e: 'toggle-play'): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'seek', time: number): void
  (e: 'set-volume', v: number): void
  (e: 'toggle-mute'): void
  (e: 'toggle-fav'): void
  (e: 'download'): void
  (e: 'set-play-mode', mode: PlayMode): void
}>()

const playModeIcons: Record<PlayMode, string> = {
  order: '🔂',
  repeat: '🔁',
  shuffle: '🔀',
}

const playModeNext: Record<PlayMode, PlayMode> = {
  order: 'repeat',
  repeat: 'shuffle',
  shuffle: 'order',
}

const progressPercent = computed(() => {
  if (props.duration <= 0) return 0
  return (props.currentTime / props.duration) * 100
})

const currentTimeStr = computed(() => formatTime(props.currentTime))
const totalTimeStr = computed(() => formatTime(props.duration))

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function onProgressClick(e: MouseEvent) {
  const bar = e.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  const time = pct * props.duration
  if (isFinite(time)) emit('seek', time)
}

function onVolumeChange(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  emit('set-volume', val)
}

function cyclePlayMode() {
  emit('set-play-mode', playModeNext[props.playMode])
}

function onDownload() {
  emit('download')
}
</script>

<template>
  <div class="player-panel">
    <div class="player-top">
      <div class="cover-wrapper">
        <img
          v-if="track?.coverUrl"
          :src="track.coverUrl"
          alt="cover"
          class="cover-img"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <div v-else class="cover-placeholder">
          <div class="vinyl" :class="{ spinning: isPlaying }" />
          <span class="cover-hint">选择一首歌</span>
        </div>
      </div>

      <div class="player-info">
        <div class="track-title">{{ track?.name || '未选择歌曲' }}</div>
        <div class="track-artist">{{ track?.artist || '' }}</div>
        <div v-if="track" class="track-tags">
          <span class="source-pill" :class="`source-${track.source}`">
            {{ getSourceName(track.source) }}
          </span>
        </div>
      </div>
    </div>

    <div class="player-controls">
      <div class="progress-row" @click="onProgressClick">
        <span class="time-label">{{ currentTimeStr }}</span>
        <div class="progress-bar-wrapper">
          <div class="progress-track" />
          <div
            class="progress-fill"
            :style="{ width: `${progressPercent}%` }"
          />
          <div
            class="progress-handle"
            :style="{ left: `${progressPercent}%` }"
          />
        </div>
        <span class="time-label">{{ totalTimeStr }}</span>
      </div>

      <div class="control-row">
        <div class="control-main">
          <button class="ctrl-btn sm" @click="emit('prev')" title="上一首">⏮</button>
          <button class="ctrl-btn play-btn" @click="emit('toggle-play')" title="播放/暂停">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="ctrl-btn sm" @click="emit('next')" title="下一首">⏭</button>
        </div>

        <div class="control-secondary">
          <button class="ctrl-btn xs" @click="cyclePlayMode" :title="`播放模式: ${playMode}`">
            {{ playModeIcons[playMode] }}
          </button>
          <button class="ctrl-btn xs" @click="emit('toggle-fav')" title="收藏">🤍</button>
          <button class="ctrl-btn xs" @click="onDownload" title="下载">⬇</button>
          <div class="volume-control">
            <button class="ctrl-btn xs" @click="emit('toggle-mute')">
              {{ isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊' }}
            </button>
            <input
              type="range"
              class="volume-slider"
              min="0"
              max="1"
              step="0.05"
              :value="isMuted ? 0 : volume"
              @input="onVolumeChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-top {
  display: flex;
  gap: 14px;
  min-height: 130px;
}

.cover-wrapper {
  width: 130px;
  height: 130px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
  background: radial-gradient(circle at 30% 0, #34344b, #151628);
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  position: relative;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.vinyl {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 6px solid rgba(0,0,0,0.6);
  background: radial-gradient(circle, #16141f 0%, #000 45%, #222 70%, #000 100%);
  position: relative;
}

.vinyl::before {
  content: '';
  position: absolute;
  inset: 22%;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 0, var(--accent-2), #b546b8, #5a2a7c);
}

.vinyl::after {
  content: '';
  position: absolute;
  inset: 38%;
  border-radius: 50%;
  background: #05050a;
}

.vinyl.spinning {
  animation: spin 4s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cover-hint {
  font-size: 10px;
  color: var(--text-secondary);
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.track-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.track-artist {
  font-size: 12px;
  color: var(--text-secondary);
}

.track-tags {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.source-pill {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid currentColor;
}

.source-netease { color: var(--accent-netease); background: rgba(255,107,107,0.1); }
.source-qq { color: var(--accent-qq); background: rgba(77,208,225,0.1); }
.source-kuwo { color: var(--accent-kuwo); background: rgba(186,104,200,0.1); }
.source-kugou { color: var(--accent-kugou); background: rgba(255,167,38,0.1); }
.source-migu { color: var(--accent-migu); background: rgba(102,187,106,0.1); }

.player-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.time-label {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.progress-bar-wrapper {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: rgba(5,7,22,0.9);
  position: relative;
  overflow: visible;
}

.progress-track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-2), var(--accent-1), var(--accent-3));
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fffbe3;
  border: 2px solid #e6a52b;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px rgba(255,255,255,0.6);
  opacity: 0;
  transition: opacity 0.15s;
}

.progress-bar-wrapper:hover .progress-handle {
  opacity: 1;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-secondary {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ctrl-btn {
  border: none;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(0,0,0,0.35);
  color: var(--text-primary);
  transition: all 0.12s;
}

.ctrl-btn:hover {
  background: rgba(255,255,255,0.1);
}

.ctrl-btn:active {
  transform: scale(0.95);
}

.ctrl-btn.xs {
  width: 24px;
  height: 24px;
  font-size: 11px;
}

.ctrl-btn.sm {
  width: 28px;
  height: 28px;
  font-size: 13px;
}

.play-btn {
  width: 40px;
  height: 40px;
  font-size: 18px;
  background: radial-gradient(circle at 30% 0, rgba(255,255,255,0.15), var(--accent-1));
  color: #231b08;
  box-shadow: 0 4px 12px rgba(245,200,76,0.5);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.volume-slider {
  width: 60px;
  height: 4px;
  accent-color: var(--accent-1);
  cursor: pointer;
}
</style>
