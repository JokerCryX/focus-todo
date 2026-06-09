<template>
  <div class="sticky-widget" :style="{ backgroundColor: noteColor }">
    <!-- Resize handles -->
    <div class="resize-handle resize-n" @mousedown="startResize('n', $event)"></div>
    <div class="resize-handle resize-s" @mousedown="startResize('s', $event)"></div>
    <div class="resize-handle resize-e" @mousedown="startResize('e', $event)"></div>
    <div class="resize-handle resize-w" @mousedown="startResize('w', $event)"></div>
    <div class="resize-handle resize-ne" @mousedown="startResize('ne', $event)"></div>
    <div class="resize-handle resize-nw" @mousedown="startResize('nw', $event)"></div>
    <div class="resize-handle resize-se" @mousedown="startResize('se', $event)"></div>
    <div class="resize-handle resize-sw" @mousedown="startResize('sw', $event)"></div>

    <!-- Header -->
    <header class="sticky-header" :style="{ backgroundColor: darkColor }">
      <button class="action-btn pin-btn" :class="{ active: isPinned }" @click.stop="togglePin" :title="isPinned ? $t('stickyNotes.unpin') : $t('stickyNotes.pin')">
        {{ isPinned ? '📌' : '📍' }}
      </button>
      <span class="header-spacer"></span>
      <button class="action-btn back-btn" @click="backToList" :title="$t('stickyNotes.fromWidget')">↩</button>
      <button class="action-btn close" @click="windowClose" :title="$t('common.close')">
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
          <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
        </svg>
      </button>
    </header>

    <!-- Content -->
    <div class="sticky-content">
      <textarea
        ref="textareaEl"
        v-model="content"
        :placeholder="$t('stickyNotes.placeholder')"
        :style="{ fontSize: fontSize + 'px' }"
        @input="onInput"
        @wheel.prevent="onWheelFontSize"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const content = ref('')
const noteColor = ref('#FFF9C4')
const isPinned = ref(false)
const textareaEl = ref<HTMLTextAreaElement>()
const fontSize = ref(14)

async function applyTheme() {
  const theme = (await window.api.settings.get('theme')) || 'light'
  document.documentElement.className = theme
  window.api.window.setBackgroundColor('#00000000')
}

function onThemeChanged(theme?: string) {
  if (theme) document.documentElement.className = theme
}

let noteId = ''
let widgetId = ''
let saveTimer: ReturnType<typeof setTimeout> | null = null

const darkColorMap: Record<string, string> = {
  '#FFCDD2': '#EF9A9A',
  '#FFF9C4': '#FFE082',
  '#BBDEFB': '#90CAF9',
  '#C8E6C9': '#A5D6A7'
}

const darkColor = computed(() => darkColorMap[noteColor.value] || noteColor.value)

async function loadNote() {
  const params = new URLSearchParams(window.location.search)
  widgetId = params.get('widgetId') || ''
  if (!widgetId) return

  const widget = await window.api.widget.getConfig(widgetId)
  if (!widget) return

  try {
    const config = JSON.parse(widget.config || '{}')
    noteId = config.note_id
  } catch { return }

  if (!noteId) return

  const note = await window.api.stickyNote.get(noteId)
  if (note) {
    content.value = note.content
    noteColor.value = note.color
  }

  // 从 app_settings 读取保存的字号
  const savedFontSize = await window.api.settings.get(`sticky_font_${noteId}`)
  if (savedFontSize) fontSize.value = Number(savedFontSize)
}

function onInput() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveNote()
  }, 500)
}

async function saveNote() {
  if (!noteId) return
  await window.api.stickyNote.update(noteId, { content: content.value })
  window.api.send('stickyNote:changed', noteId)
}

async function togglePin() {
  isPinned.value = !isPinned.value
  await window.api.window.setAlwaysOnTop(isPinned.value)
  // 同步更新数据库，让 setStickyTopMode 知道用户是否手动置顶
  if (widgetId) {
    await window.api.widget.update(widgetId, { always_on_top: isPinned.value ? 1 : 0 })
  }
}

async function backToList() {
  if (noteId) {
    await saveNote()
    await window.api.stickyNote.fromWidget(noteId)
  }
  window.close()
}

let fontSizeTimer: ReturnType<typeof setTimeout> | null = null

function onWheelFontSize(e: WheelEvent) {
  const delta = e.deltaY < 0 ? 1 : -1
  fontSize.value = Math.max(10, Math.min(60, fontSize.value + delta))
  // 防抖保存字号到 app_settings
  if (fontSizeTimer) clearTimeout(fontSizeTimer)
  fontSizeTimer = setTimeout(() => {
    if (noteId) {
      window.api.settings.set(`sticky_font_${noteId}`, String(fontSize.value))
    }
  }, 500)
}

function windowClose() {
  window.close()
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

function startResize(dir: ResizeDir, e: MouseEvent) {
  e.preventDefault()
  window.api.widget.startResize(dir)
  const onUp = () => {
    window.api.widget.stopResize()
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mouseup', onUp)
}

function onChanged(changedId: string) {
  if (changedId === noteId) {
    loadNote()
  }
}

onMounted(async () => {
  await loadNote()
  isPinned.value = await window.api.window.isAlwaysOnTop()
  window.api.on('stickyNote:changed', onChanged)
  window.api.on('theme:changed', onThemeChanged)
  applyTheme()

  // 自动聚焦输入
  setTimeout(() => {
    textareaEl.value?.focus()
  }, 100)
})

onUnmounted(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveNote()
  }
  window.api.removeListener?.('stickyNote:changed', onChanged)
  window.api.removeListener?.('theme:changed', onThemeChanged)
})
</script>

<style scoped>
.sticky-widget {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  font-family: var(--font-family);
  font-size: var(--font-md);
  border-radius: 12px;
  box-shadow:
    0 2px 6px rgba(15, 17, 23, 0.18),
    0 6px 14px rgba(15, 17, 23, 0.18),
    0 10px 22px rgba(15, 17, 23, 0.14);
  transition: background-color 0.3s ease;
}

/* ── Resize handles ── */
.resize-handle {
  position: absolute;
  z-index: 200;
  -webkit-app-region: no-drag;
}
.resize-n  { top: 0;    left: 14px;  right: 14px; height: 4px;  cursor: n-resize; }
.resize-s  { bottom: 0; left: 14px;  right: 14px; height: 4px;  cursor: s-resize; }
.resize-e  { right: 0;  top: 14px;   bottom: 14px; width: 4px;  cursor: e-resize; }
.resize-w  { left: 0;   top: 14px;   bottom: 14px; width: 4px;  cursor: w-resize; }
.resize-ne { top: 0;    right: 0;    width: 14px;  height: 14px; cursor: ne-resize; }
.resize-nw { top: 0;    left: 0;     width: 14px;  height: 14px; cursor: nw-resize; }
.resize-se { bottom: 0; right: 0;    width: 14px;  height: 14px; cursor: se-resize; }
.resize-sw { bottom: 0; left: 0;     width: 14px;  height: 14px; cursor: sw-resize; }

/* ── Header ── */
.sticky-header {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px 0 4px;
  height: 32px;
  flex-shrink: 0;
  -webkit-app-region: drag;
  position: relative;
  z-index: 100;
  border-radius: 12px 12px 0 0;
}

.header-spacer {
  flex: 1;
}

.action-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  font-size: 13px;
  -webkit-app-region: no-drag;
}

.action-btn svg {
  width: 12px;
  height: 12px;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.7);
}

.action-btn.close:hover {
  background: #e74c3c;
  color: white;
}

.action-btn.back-btn {
  font-size: 15px;
}

.pin-btn.active {
  color: rgba(0, 0, 0, 0.8);
}

/* ── Content ── */
.sticky-content {
  flex: 1;
  padding: 4px 12px 12px;
  overflow: hidden;
}

.sticky-content textarea {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.8);
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: var(--font-family);
  word-break: break-word;
  transition: font-size 0.1s ease;
}

.sticky-content textarea::placeholder {
  color: rgba(0, 0, 0, 0.3);
}
</style>
