<template>
  <div class="note-page">
    <div class="view-header">
      <h2>{{ $t('notes.title') }}</h2>
      <div class="toolbar-group">
        <button class="toolbar-btn focus-btn" :class="{ active: uiStore.focusNoteMode }" @click="toggleFocus" :title="uiStore.focusNoteMode ? $t('notes.exitFocus') : $t('notes.focusMode')">
          <svg v-if="!uiStore.focusNoteMode" width="14" height="14" viewBox="0 0 16 16"><path d="M3 1v3.5h1.5V2.5H6V1H3zm7 0v1.5h1.5V4.5H13V1h-3zM3 11.5V15h3v-1.5H4.5V11.5H3zm8.5 0V13.5H10V15h3v-3.5h-1.5z" fill="currentColor"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 16 16"><path d="M1 1.5V5h1.5V2.5H5V1H1.5zm10 0V1h3.5v3.5H13.5V2.5H11zM1 11v3.5H5V13H2.5V11H1zm11 0v2H10v1.5h3.5V11H12z" fill="currentColor"/></svg>
        </button>
        <div class="toolbar-separator" />
        <select v-model="currentFont" @change="applyFont" class="toolbar-select" :title="$t('notes.font')">
          <option v-for="f in fonts" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>
        <select v-model="currentSize" @change="applyFontSize" class="toolbar-select size-select" :title="$t('notes.fontSize')">
          <option v-for="s in sizes" :key="s" :value="s">{{ s }}px</option>
        </select>
        <div class="toolbar-separator" />
        <button class="toolbar-btn" :class="{ active: isBold }" @click="execFormat('bold')" :title="$t('notes.bold')">
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M4 2h5.5a3.5 3.5 0 0 1 2.2 6.2A3.5 3.5 0 0 1 9 14H4V2zm2 2v3.5h3a1.75 1.75 0 0 0 0-3.5H6zm0 5.5V12h3.5a1.75 1.75 0 0 0 0-3.5H6z" fill="currentColor"/></svg>
        </button>
        <button class="toolbar-btn" :class="{ active: isItalic }" @click="execFormat('italic')" :title="$t('notes.italic')">
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M7 2h5v2H9.5l-1.8 8H10v2H5v-2h2.3l1.8-8H7V2z" fill="currentColor"/></svg>
        </button>
        <button class="toolbar-btn" :class="{ active: isStrike }" @click="execFormat('strikeThrough')" :title="$t('notes.strikethrough')">
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M6.35 4.75A2.25 2.25 0 0 1 11 6.5h2a4.25 4.25 0 0 0-8.15-1.75M4 8h8M11.65 11.25A2.25 2.25 0 0 1 5 9.5H3a4.25 4.25 0 0 0 8.15 1.75" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <div class="toolbar-separator" />
        <label class="color-picker-wrap" :title="$t('notes.fontColor')">
          <input type="color" class="color-picker-input" :value="currentColor" @input="applyFontColor($event)" />
          <span class="color-indicator" :style="{ background: currentColor }"></span>
        </label>
      </div>
    </div>

    <div class="note-editor-wrapper">
      <div class="note-paper">
        <div
          ref="editorRef"
          class="note-editor"
          contenteditable="true"
          :data-placeholder="$t('notes.placeholder')"
          @input="onInput"
          @mouseup="updateActiveStates"
          @keyup="updateActiveStates"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()

const STORAGE_KEY = 'focus-todo-notes'
const FONT_KEY = 'focus-todo-notes-font'
const SIZE_KEY = 'focus-todo-notes-size'

const fonts = [
  { label: '默认', value: 'inherit' },
  { label: '宋体', value: 'SimSun, STSong, serif' },
  { label: '黑体', value: 'SimHei, STHeiti, sans-serif' },
  { label: '楷体', value: 'KaiTi, STKaiti, serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' }
]

const sizes = [13, 14, 15, 16, 18, 20, 22, 24, 28, 32]

const currentFont = ref(localStorage.getItem(FONT_KEY) || 'inherit')
const currentSize = ref(Number(localStorage.getItem(SIZE_KEY)) || 16)
const isBold = ref(false)
const isItalic = ref(false)
const isStrike = ref(false)
const currentColor = ref('#000000')

const editorRef = ref<HTMLDivElement | null>(null)

function execFormat(command: string) {
  document.execCommand(command, false)
  editorRef.value?.focus()
  updateActiveStates()
}

function applyFont() {
  document.execCommand('fontName', false, currentFont.value)
  localStorage.setItem(FONT_KEY, currentFont.value)
  editorRef.value?.focus()
}

function applyFontSize() {
  document.execCommand('fontSize', false, '7')
  const fontElements = editorRef.value?.querySelectorAll('font[size="7"]')
  fontElements?.forEach(el => {
    const span = document.createElement('span')
    span.style.fontSize = currentSize.value + 'px'
    span.innerHTML = el.innerHTML
    el.replaceWith(span)
  })
  localStorage.setItem(SIZE_KEY, String(currentSize.value))
  editorRef.value?.focus()
}

function updateActiveStates() {
  isBold.value = document.queryCommandState('bold')
  isItalic.value = document.queryCommandState('italic')
  isStrike.value = document.queryCommandState('strikeThrough')
  const color = document.queryCommandValue('foreColor')
  if (color) currentColor.value = color.startsWith('rgb') ? rgbToHex(color) : color
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/\d+/g)
  if (!m || m.length < 3) return '#000000'
  return '#' + m.slice(0, 3).map(n => Number(n).toString(16).padStart(2, '0')).join('')
}

function applyFontColor(e: Event) {
  const color = (e.target as HTMLInputElement).value
  currentColor.value = color
  document.execCommand('foreColor', false, color)
  editorRef.value?.focus()
}

function onInput() {
  const html = editorRef.value?.innerHTML || ''
  localStorage.setItem(STORAGE_KEY, html)
  updateActiveStates()
}

async function toggleFocus() {
  const entering = !uiStore.focusNoteMode
  uiStore.toggleFocusNote()
  if (entering) {
    await window.api.window.resize(450, 600)
  } else {
    await window.api.window.resize(900, 600)
  }
}

function loadContent() {
  if (!editorRef.value) return
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    editorRef.value.innerHTML = saved
  }
}

onMounted(() => {
  loadContent()
})

onUnmounted(() => {
  const html = editorRef.value?.innerHTML || ''
  localStorage.setItem(STORAGE_KEY, html)
})
</script>

<style scoped>
/* ── Page Layout ── */
.note-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  animation: fadeIn 0.25s var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── View Header (matches CalendarView / InboxView pattern) ── */
.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm);
  flex-shrink: 0;
}

.view-header h2 {
  font-size: var(--font-2xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

/* ── Toolbar Group (right side of header) ── */
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-select {
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: var(--font-xs);
  font-family: var(--font-family);
  cursor: pointer;
  outline: none;
  transition: all var(--transition-fast);
  -webkit-appearance: none;
  appearance: none;
  padding-right: 20px;
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%239ca3af' stroke-width='1.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 7px center;
}

.toolbar-select:hover {
  border-color: var(--accent-primary);
  color: var(--text-primary);
}

.toolbar-select:focus {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-accent);
}

.size-select {
  width: 66px;
}

.toolbar-separator {
  width: 1px;
  height: 14px;
  background: var(--border-primary);
  margin: 0 2px;
}

/* ── Format Buttons (ghost style, matches app's action buttons) ── */
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.toolbar-btn.active {
  color: var(--accent-primary);
  background: var(--accent-light);
}

/* ── Color Picker ── */
.color-picker-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 26px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.color-picker-wrap:hover {
  background: var(--bg-hover);
}

.color-picker-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.color-indicator {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px var(--border-primary);
  transition: box-shadow var(--transition-fast);
}

.color-picker-wrap:hover .color-indicator {
  box-shadow: 0 0 0 1px var(--accent-primary);
}

/* ── Editor Wrapper ── */
.note-editor-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  animation: fadeIn 0.25s var(--ease-out);
  animation-fill-mode: backwards;
  animation-delay: 0.05s;
}

/* ── Paper (lined paper with left margin) ── */
.note-paper {
  height: 100%;
  box-sizing: border-box;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  border-top: 1px solid var(--border-primary);
  overflow-y: auto;
  position: relative;
  background-color: var(--note-paper-bg, var(--bg-card));
  background-image:
    linear-gradient(
      to right,
      transparent 47px,
      var(--note-margin-color, rgba(220, 80, 80, 0.25)) 47px,
      var(--note-margin-color, rgba(220, 80, 80, 0.25)) 48px,
      transparent 48px
    ),
    repeating-linear-gradient(
      transparent,
      transparent 31px,
      var(--note-line-color, rgba(160, 170, 185, 0.22)) 31px,
      var(--note-line-color, rgba(160, 170, 185, 0.22)) 32px
    );
  background-position: 0 0;
  background-size: 100% 100%, 100% 32px;
}

/* Light theme paper tint */
:root:not(.dark) .note-paper {
  --note-paper-bg: #fdfcf8;
  --note-margin-color: rgba(220, 80, 80, 0.22);
  --note-line-color: rgba(160, 170, 185, 0.2);
}

/* Dark theme paper tint */
:root.dark .note-paper {
  --note-paper-bg: #1a1c28;
  --note-margin-color: rgba(220, 80, 80, 0.15);
  --note-line-color: rgba(255, 255, 255, 0.06);
}

/* Transparent dark theme inherits dark paper */
:root.transparent-dark .note-paper {
  --note-paper-bg: #1a1c28;
  --note-margin-color: rgba(220, 80, 80, 0.15);
  --note-line-color: rgba(255, 255, 255, 0.06);
}

/* Custom scrollbar on paper */
.note-paper:hover::-webkit-scrollbar-thumb {
  background: var(--border-primary);
}

.note-paper::-webkit-scrollbar {
  width: 4px;
}

.note-paper::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.note-paper::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* ── Contenteditable Editor ── */
.note-editor {
  padding: 0 28px 60px 56px;
  outline: none;
  font-size: 16px;
  line-height: 32px;
  color: var(--text-primary);
  word-wrap: break-word;
  white-space: pre-wrap;
  caret-color: var(--accent-primary);
}

.note-editor:empty::before {
  content: attr(data-placeholder);
  font-size: 13px;
  color: var(--text-placeholder);
  opacity: 0.5;
  pointer-events: none;
}
</style>
