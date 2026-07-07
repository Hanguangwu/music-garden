<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  lyrics: { time: number; text: string }[]
  currentIndex: number
}>()

const containerRef = ref<HTMLElement | null>(null)

watch(() => props.currentIndex, async () => {
  await nextTick()
  if (!containerRef.value) return
  const activeEl = containerRef.value.querySelector('.lyric-line.active') as HTMLElement | null
  if (activeEl) {
    activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})

const currentLineStr = ref('')

watch(() => props.currentIndex, (idx) => {
  if (idx >= 0 && idx < props.lyrics.length) {
    currentLineStr.value = props.lyrics[idx].text
  }
})
</script>

<template>
  <div class="lyrics-panel">
    <div v-if="lyrics.length === 0" class="lyrics-empty">
      <div class="empty-lyrics-icon">🎤</div>
      <p>暂无歌词</p>
      <p class="empty-sub">播放音乐后，歌词将在此显示</p>
    </div>
    <div v-else ref="containerRef" class="lyrics-scroll">
      <div
        v-for="(line, index) in lyrics"
        :key="index"
        class="lyric-line"
        :class="{ active: index === currentIndex }"
      >
        {{ line.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.lyrics-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px;
  border-radius: 14px;
  background: radial-gradient(
    circle at 50% 0,
    rgba(255, 220, 150, 0.12),
    transparent 60%
  ),
  radial-gradient(
    circle at 10% 100%,
    rgba(107, 150, 255, 0.12),
    transparent 60%
  ),
  rgba(4, 6, 20, 0.6);
  border: 1px solid var(--glass-border);
  position: relative;
}

.lyrics-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: var(--text-secondary);
  text-align: center;
}

.empty-lyrics-icon {
  font-size: 36px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.lyrics-empty p {
  margin: 0;
  font-size: 13px;
}

.empty-sub {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.6;
}

.lyrics-scroll {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
}

.lyric-line {
  font-size: 14px;
  color: rgba(196, 199, 235, 0.5);
  text-align: center;
  transition: all 0.3s ease;
  padding: 2px 0;
  line-height: 1.6;
}

.lyric-line.active {
  font-size: 18px;
  opacity: 1;
  color: transparent;
  background: linear-gradient(120deg, #ffe6a7, #ff9bd4, #8fd5ff);
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 0 0 20px rgba(245, 200, 76, 0.6);
  transform: scale(1.05);
}
</style>
