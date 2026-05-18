<template>
  <div class="shortcut-recorder">
    <template v-if="recording">
      <span class="recording-hint">{{ $t('shortcut.recording') }}</span>
      <button class="cancel-btn" @click="cancel">{{ $t('common.cancel') }}</button>
    </template>
    <template v-else>
      <span class="keys-display" @click="startRecording">{{ shortcut.keys }}</span>
      <button class="reset-btn" @click="$emit('reset')" :title="$t('shortcut.resetDefault')">
        <svg width="12" height="12" viewBox="0 0 16 16"><path d="M3 8a5 5 0 1 1 1.5 3.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5v3h3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </template>
    <div v-if="conflict" class="conflict-msg">{{ $t('shortcut.conflict', { name: conflict }) }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  shortcut: { id: string; keys: string; label: string }
}>()

const emit = defineEmits<{
  (e: 'recorded', keys: string): void
  (e: 'reset'): void
  (e: 'conflict', label: string | null): void
}>()

const recording = ref(false)
const conflict = ref<string | null>(null)

function formatKey(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
    parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
  }
  return parts.join('+')
}

function startRecording() {
  recording.value = true
  conflict.value = null
}

function cancel() {
  recording.value = false
}

function onKeyDown(e: KeyboardEvent) {
  if (!recording.value) return
  e.preventDefault()
  e.stopPropagation()

  if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return

  const keys = formatKey(e)
  if (keys.includes('+')) {
    recording.value = false
    emit('recorded', keys)
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown, true)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown, true)
})
</script>

<style scoped>
.shortcut-recorder {
  display: flex;
  align-items: center;
  gap: 8px;
}

.keys-display {
  display: inline-block;
  padding: 3px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-family: var(--font-mono);
  color: var(--text-primary);
  cursor: pointer;
  min-width: 80px;
  text-align: center;
  transition: border-color var(--transition-fast);
}

.keys-display:hover {
  border-color: var(--accent-primary);
}

.recording-hint {
  padding: 3px 10px;
  background: var(--accent-light);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  color: var(--accent-primary);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.cancel-btn, .reset-btn {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: var(--font-xs);
  padding: 3px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.cancel-btn:hover, .reset-btn:hover {
  border-color: var(--text-secondary);
  color: var(--text-secondary);
}

.conflict-msg {
  font-size: 10px;
  color: var(--danger);
  position: absolute;
  bottom: -16px;
  right: 0;
  white-space: nowrap;
}
</style>
