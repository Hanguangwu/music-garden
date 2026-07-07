<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{
  message: string
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

watch(() => props.visible, (val) => {
  if (val) {
    setTimeout(() => {
      emit('close')
    }, 3000)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible && message" class="toast-container">
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(12, 14, 30, 0.96);
  border: 1px solid var(--glass-border);
  font-size: 12px;
  color: var(--text-primary);
  box-shadow: 0 8px 24px rgba(0,0,0,0.8);
  z-index: 9999;
  pointer-events: none;
  white-space: nowrap;
}

.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}
</style>
