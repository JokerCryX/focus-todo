<template>
  <div class="view-page">
    <div class="view-header">
      <h2>{{ $t('stickyNotes.title') }}</h2>
      <div class="toolbar-group">
        <button class="add-btn" @click="createNote" :title="$t('stickyNotes.addNote')">+</button>
        <div class="color-picker">
          <button
            v-for="c in colorOptions"
            :key="c.value"
            class="color-circle"
            :class="{ selected: selectedColor === c.value }"
            :style="{ backgroundColor: c.value }"
            @click="selectedColor = c.value"
          >
            <span v-if="selectedColor === c.value" class="check">✓</span>
          </button>
        </div>
      </div>
    </div>
    <div class="sticky-grid" v-if="notes.length > 0">
      <StickyNoteCard
        v-for="note in notes"
        :key="note.note_id"
        :note="note"
        @to-widget="onToWidget"
        @from-widget="onFromWidget"
        @remove="onRemove"
        @update="onUpdate"
      />
    </div>
    <EmptyState v-else icon="🗒️" :text="$t('stickyNotes.empty')" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import StickyNoteCard from '@/components/stickynote/StickyNoteCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'

interface StickyNote {
  note_id: string
  content: string
  color: string
  is_widget: number
}

const colorOptions = [
  { value: '#FFCDD2' },
  { value: '#FFF9C4' },
  { value: '#BBDEFB' },
  { value: '#C8E6C9' }
]

const selectedColor = ref('#FFF9C4')
const notes = ref<StickyNote[]>([])

async function loadNotes() {
  notes.value = await window.api.stickyNote.list()
}

async function createNote() {
  const note = await window.api.stickyNote.create({ color: selectedColor.value })
  notes.value.push(note)
}

async function onToWidget(noteId: string) {
  await window.api.stickyNote.toWidget(noteId)
  await loadNotes()
}

async function onFromWidget(noteId: string) {
  await window.api.stickyNote.fromWidget(noteId)
  await loadNotes()
}

async function onRemove(noteId: string) {
  await window.api.stickyNote.remove(noteId)
  await loadNotes()
}

async function onUpdate(noteId: string, changes: { content?: string; color?: string }) {
  await window.api.stickyNote.update(noteId, changes)
  const idx = notes.value.findIndex(n => n.note_id === noteId)
  if (idx !== -1) {
    Object.assign(notes.value[idx], changes)
  }
}

function onChanged(_noteId: string) {
  loadNotes()
}

onMounted(() => {
  loadNotes()
  window.api.on('stickyNote:changed', onChanged)
})

onUnmounted(() => {
  window.api.removeListener('stickyNote:changed', onChanged)
})
</script>

<style scoped>
.view-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
}

.view-header h2 {
  font-size: var(--font-xl, 18px);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-btn {
  border: none;
  background: var(--bg-active, rgba(0, 0, 0, 0.06));
  color: var(--text-secondary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.add-btn:hover {
  background: var(--bg-hover);
  color: var(--accent-primary);
}

.color-picker {
  display: flex;
  gap: 6px;
}

.color-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  position: relative;
}

.color-circle:hover {
  transform: scale(1.1);
}

.color-circle.selected {
  border-color: var(--text-secondary, #555);
  box-shadow: 0 0 0 2px var(--border-primary, rgba(0, 0, 0, 0.1));
}

.check {
  font-size: 13px;
  font-weight: bold;
  color: var(--text-secondary, #555);
}

.sticky-grid {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: var(--spacing-lg);
  padding-top: var(--spacing-sm);
  overflow-y: auto;
  align-content: flex-start;
}
</style>
