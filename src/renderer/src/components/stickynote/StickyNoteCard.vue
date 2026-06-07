<template>
  <div class="sticky-card" :style="{ '--note-color': note.color, '--note-color-dark': darkColor(note.color), backgroundColor: note.color }">
    <div class="card-toolbar" :style="{ backgroundColor: darkColor(note.color) }">
      <div class="color-dots">
        <span
          v-for="c in colors"
          :key="c"
          class="dot"
          :class="{ active: note.color === c }"
          :style="{ backgroundColor: c }"
          @click="changeColor(c)"
        />
      </div>
      <div class="card-actions">
        <button
          v-if="!note.is_widget"
          class="action-btn widget-btn"
          @click.stop="$emit('toWidget', note.note_id)"
          :title="$t('stickyNotes.toWidget')"
        >+</button>
        <button class="action-btn delete-btn" @click.stop="$emit('remove', note.note_id)">×</button>
      </div>
    </div>
    <div
      class="card-content"
      contenteditable="true"
      :data-placeholder="$t('stickyNotes.placeholder')"
      @input="onInput"
      @blur="onBlur"
      ref="contentEl"
    >{{ note.content }}</div>
    <div v-if="note.is_widget" class="widget-badge">🧩</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface StickyNote {
  note_id: string
  content: string
  color: string
  is_widget: number
}

const props = defineProps<{ note: StickyNote }>()
const emit = defineEmits<{
  (e: 'toWidget', noteId: string): void
  (e: 'remove', noteId: string): void
  (e: 'update', noteId: string, changes: { content?: string; color?: string }): void
}>()

const colors = ['#FFCDD2', '#FFF9C4', '#BBDEFB', '#C8E6C9']
const contentEl = ref<HTMLElement>()
let saveTimer: ReturnType<typeof setTimeout> | null = null

const darkColorMap: Record<string, string> = {
  '#FFCDD2': '#EF9A9A',
  '#FFF9C4': '#FFE082',
  '#BBDEFB': '#90CAF9',
  '#C8E6C9': '#A5D6A7'
}

function darkColor(color: string): string {
  return darkColorMap[color] || color
}

function onInput() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveContent()
  }, 500)
}

function onBlur() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  saveContent()
}

function saveContent() {
  if (!contentEl.value) return
  const text = contentEl.value.innerText || ''
  if (text !== props.note.content) {
    emit('update', props.note.note_id, { content: text })
  }
}

function changeColor(c: string) {
  emit('update', props.note.note_id, { color: c })
}
</script>

<style scoped>
.sticky-card {
  width: 200px;
  min-height: 140px;
  border-radius: 8px;
  box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: box-shadow 0.2s ease;
}

.sticky-card:hover {
  box-shadow: 3px 6px 18px rgba(0, 0, 0, 0.22);
}

.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 2px;
  gap: 4px;
  border-radius: 8px 8px 0 0;
}

.color-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
  opacity: 0.5;
}

.dot:hover {
  opacity: 0.8;
  transform: scale(1.15);
}

.dot.active {
  border-color: var(--text-secondary, #555);
  opacity: 1;
}

.card-actions {
  display: flex;
  gap: 2px;
}

.action-btn {
  border: none;
  background: none;
  cursor: pointer;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-tertiary, #999);
  transition: all 0.15s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-primary, #333);
}

.widget-btn {
  font-weight: bold;
  font-size: 16px;
}

.card-content {
  flex: 1;
  padding: 4px 10px 10px;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.75);
  outline: none;
  word-break: break-word;
  white-space: pre-wrap;
  min-height: 80px;
}

.card-content:empty::before {
  content: attr(data-placeholder);
  color: rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.widget-badge {
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-size: 14px;
  opacity: 0.5;
}
</style>
