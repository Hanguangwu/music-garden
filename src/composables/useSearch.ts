import { ref } from 'vue'
import type { SongInfo } from '../types'
import { searchMusic } from '../services/api'

export function useSearch() {
  const keyword = ref('')
  const sources = ref<string[]>(['netease', 'qq', 'kuwo'])
  const results = ref<SongInfo[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function doSearch() {
    if (!keyword.value.trim()) return
    isLoading.value = true
    error.value = null
    try {
      results.value = await searchMusic(keyword.value, sources.value, 20)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '搜索失败，请稍后重试'
      results.value = []
    } finally {
      isLoading.value = false
    }
  }

  function clearResults() {
    results.value = []
    error.value = null
  }

  function toggleSource(src: string) {
    const idx = sources.value.indexOf(src)
    if (idx >= 0) {
      if (sources.value.length > 1) {
        sources.value.splice(idx, 1)
      }
    } else {
      sources.value.push(src)
    }
  }

  return {
    keyword,
    sources,
    results,
    isLoading,
    error,
    search: doSearch,
    clearResults,
    toggleSource,
  }
}
