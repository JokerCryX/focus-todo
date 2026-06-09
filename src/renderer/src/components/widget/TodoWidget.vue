<template>
  <div class="todo-widget">
    <!-- Header -->
    <header class="widget-header">
      <div class="header-left">
        <button class="action-btn pin-btn" :class="{ active: isPinned }" @click.stop="togglePin" :title="isPinned ? $t('titlebar.unpin') : $t('titlebar.pin')">
          {{ isPinned ? '📌' : '📍' }}
        </button>
        <div class="header-label-wrap" @click="showViewPicker = !showViewPicker">
          <span class="header-label">{{ currentLabel }}</span>
          <svg class="chevron-icon" :class="{ open: showViewPicker }" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </div>
      </div>
      <div class="header-actions">
        <div class="settings-trigger">
          <button class="action-btn" @click="showThemePicker = !showThemePicker" title="Theme">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="8" r="2.2" /><path d="M13.3 10a1.2 1.2 0 00.2 1.3l.04.04a1.45 1.45 0 11-2.06 2.06l-.04-.04a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.73 1.1v.11a1.45 1.45 0 01-2.9 0v-.06a1.2 1.2 0 00-.79-1.1 1.2 1.2 0 00-1.3.2l-.04.04a1.45 1.45 0 11-2.06-2.06l.04-.04a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.73h-.11a1.45 1.45 0 010-2.9h.06a1.2 1.2 0 001.1-.79 1.2 1.2 0 00-.2-1.3l-.04-.04a1.45 1.45 0 112.06-2.06l.04.04a1.2 1.2 0 001.3.2h.06a1.2 1.2 0 00.73-1.1v-.11a1.45 1.45 0 012.9 0v.06a1.2 1.2 0 00.79 1.1 1.2 1.2 0 001.3-.2l.04-.04a1.45 1.45 0 112.06 2.06l-.04.04a1.2 1.2 0 00-.2 1.3v.06a1.2 1.2 0 001.1.73h.11a1.45 1.45 0 010 2.9h-.06a1.2 1.2 0 00-1.1.79z" />
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="showThemePicker" class="theme-popup">
              <button v-for="tm in themes" :key="tm.value" class="theme-item" :class="{ active: currentTheme === tm.value }" @click="setTheme(tm.value)">
                <span class="theme-dot" :style="{ background: tm.color }"></span>
                {{ tm.label }}
              </button>
            </div>
          </Transition>
        </div>
        <button class="action-btn close" @click="windowClose" :title="$t('titlebar.close')">
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
            <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>

      <!-- View picker dropdown -->
      <Transition name="dropdown">
        <div v-if="showViewPicker" class="category-picker">
          <button class="picker-item" :class="{ active: currentView === 'inbox' }" @click="selectView('inbox')">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="10" height="10" rx="2" /><path d="M2 9h10" /></svg>
            {{ $t('nav.inbox') }}
          </button>
          <button class="picker-item" :class="{ active: currentView === 'today' }" @click="selectView('today')">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="5" /><path d="M7 5v2.5l1.5 1" /></svg>
            {{ $t('nav.today') }}
          </button>
          <button class="picker-item" :class="{ active: currentView === 'recent' }" @click="selectView('recent')">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="5" /><path d="M5 9l4-4M9 9l-4-4" /></svg>
            {{ $t('nav.recent') }}
          </button>
          <button class="picker-item" :class="{ active: currentView === 'completed' }" @click="selectView('completed')">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l3 3 5-5" /></svg>
            {{ $t('nav.completed') }}
          </button>
        </div>
      </Transition>
    </header>

    <!-- Quick add -->
    <div class="quick-add">
      <div class="add-input-wrap" :class="{ focused: inputFocused }">
        <button class="add-submit" @click="addTask" :class="{ active: newTaskTitle.trim() }">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M7 2v10M2 7h10" /></svg>
        </button>
        <input
          v-model="newTaskTitle"
          :placeholder="$t('task.addInbox')"
          @keyup.enter="addTask"
          @focus="inputFocused = true"
          @blur="inputFocused = false"
        />
      </div>
    </div>

    <!-- Task list -->
    <div class="task-scroll">

      <!-- Resize handles -->
      <div class="resize-handle resize-n" @mousedown="startResize('n', $event)"></div>
      <div class="resize-handle resize-s" @mousedown="startResize('s', $event)"></div>
      <div class="resize-handle resize-e" @mousedown="startResize('e', $event)"></div>
      <div class="resize-handle resize-w" @mousedown="startResize('w', $event)"></div>
      <div class="resize-handle resize-ne" @mousedown="startResize('ne', $event)"></div>
      <div class="resize-handle resize-nw" @mousedown="startResize('nw', $event)"></div>
      <div class="resize-handle resize-se" @mousedown="startResize('se', $event)"></div>
      <div class="resize-handle resize-sw" @mousedown="startResize('sw', $event)"></div>
      <TransitionGroup name="task-list" tag="div" class="task-list-inner">
        <div
          v-for="(task, index) in tasks"
          :key="task.task_id"
          class="task-item"
          :class="{ completed: task.complete, [`priority-${task.priority}`]: true, expanded: expandedTaskId === task.task_id, 'drag-over': dragOverIndex === index && dragIndex !== index, 'drag-after': dragOverIndex === tasks.length && index === tasks.length - 1, 'dragging': dragIndex === index }"
          :style="{ '--i': index }"
          @mousedown="onItemMouseDown($event, index)"
          @click="toggleExpand(task)"
          @contextmenu.prevent="onTaskContextMenu($event, task)"
        >
          <div class="priority-bar-wrap" @click.stop="togglePriorityPicker(task)">
            <div class="priority-bar"></div>
            <div v-if="priorityPickerId === task.task_id" class="priority-picker">
              <button v-for="p in priorityOptions" :key="p.value" class="priority-opt" :class="{ active: task.priority === p.value, [`p${p.value}`]: true }" @click.stop="setPriority(task, p.value)" :title="p.label">
                <span class="opt-dot" :style="p.value ? { background: p.color } : {}"></span>
              </button>
            </div>
          </div>
          <button class="task-check" :class="{ checked: task.complete }" @click.stop="toggleTask(task)">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke-width="1.2" />
              <path class="checkmark" d="M5 8.3L7.2 10.5L11 6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <div class="task-content">
            <input
              v-if="editingTaskId === task.task_id"
              class="task-edit-input"
              v-model="task.title"
              @blur="finishEdit(task)"
              @keyup.enter="finishEdit(task)"
              @keyup.escape="cancelEdit(task)"
            />
            <span v-else class="task-title">{{ task.title }}</span>
            <div v-if="task.description && expandedTaskId === task.task_id" class="task-desc">{{ task.description }}</div>
            <div v-if="hasTimeReminder(task) && expandedTaskId === task.task_id" class="task-time" :class="getTimeClass(task)">
              <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="7" cy="7" r="5.5" /><path d="M7 4.5V7l1.8 1" /></svg>
              {{ formatTaskTime(task.due_date) }}
            </div>
          </div>
          <span v-if="hasTimeReminder(task) && expandedTaskId !== task.task_id" class="task-alarm" :class="getTimeClass(task)" :title="formatTaskTime(task.due_date)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="8" cy="8.5" r="5" /><path d="M8 6v2.5l1.5 1" /><path d="M5 2.5L3.5 1M11 2.5L12.5 1" /></svg>
          </span>
        </div>
      </TransitionGroup>

      <!-- Empty state -->
      <Transition name="fade">
        <div v-if="tasks.length === 0" class="empty-state">
          <div class="empty-shape">
            <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="28" height="32" rx="4" />
              <line x1="13" y1="12" x2="27" y2="12" />
              <line x1="13" y1="18" x2="24" y2="18" />
              <line x1="13" y1="24" x2="20" y2="24" />
            </svg>
          </div>
          <span class="empty-text">{{ $t('common.noData') }}</span>
        </div>
      </Transition>
    </div>
    <div v-if="isDocked" class="dock-strip"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTaskStore } from '@/stores/task'

const { t } = useI18n()
const taskStore = useTaskStore()

const isDocked = ref(false)
const tasks = ref<any[]>([])
const currentView = ref<'inbox' | 'today' | 'recent' | 'completed'>('inbox')
const newTaskTitle = ref('')
const showViewPicker = ref(false)
const showThemePicker = ref(false)
const inputFocused = ref(false)
const isPinned = ref(false)
const expandedTaskId = ref<string | null>(null)
const editingTaskId = ref<string | null>(null)
const priorityPickerId = ref<string | null>(null)
const currentTheme = ref('light')
const dragIndex = ref(-1)
const dragOverIndex = ref(-1)
const isDragging = ref(false)
let dragStartY = 0
let dragStarted = false

const themes = [
  { value: 'light', label: t('settings.light'), color: '#f8f9fa' },
  { value: 'dark', label: t('settings.dark'), color: '#1e2030' },
  { value: 'hermes', label: t('settings.hermes'), color: '#041c1c' },
  { value: 'transparent-light', label: t('settings.transparentLight'), color: 'rgba(240,242,248,0.6)' },
  { value: 'transparent-dark', label: t('settings.transparentDark'), color: 'rgba(24,26,38,0.6)' }
]

async function togglePin() {
  isPinned.value = !isPinned.value
  await window.api.window.setAlwaysOnTop(isPinned.value)
}

async function applyWidgetTheme() {
  const theme = (await window.api.settings.get('theme')) || 'light'
  document.documentElement.className = theme
  currentTheme.value = theme
  window.api.window.setBackgroundColor('#00000000')
}

async function setTheme(theme: string) {
  currentTheme.value = theme
  showThemePicker.value = false
  document.documentElement.className = theme
  await window.api.settings.set('theme', theme)
  window.api.window.setBackgroundColor('#00000000')
  window.api.send('theme:changed', theme)
}

const viewLabels: Record<string, string> = { inbox: 'nav.inbox', today: 'nav.today', recent: 'nav.recent', completed: 'nav.completed' }
const currentLabel = computed(() => t(viewLabels[currentView.value]))

onMounted(async () => {
  applyWidgetTheme()
  await loadTasks()
  isPinned.value = await window.api.window.isAlwaysOnTop()
  window.api.on('task:changed', loadTasks)
  window.api.on('theme:changed', applyWidgetTheme)
  window.api.on('widget:dock-changed', (docked: boolean) => { isDocked.value = docked })
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  window.api.removeListener?.('task:changed', loadTasks)
  window.api.removeListener?.('theme:changed', applyWidgetTheme)
  window.api.removeListener?.('widget:dock-changed')
  document.removeEventListener('click', onClickOutside)
})

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.header-label-wrap') && !target.closest('.category-picker')) {
    showViewPicker.value = false
  }
  if (!target.closest('.settings-trigger') && !target.closest('.theme-popup')) {
    showThemePicker.value = false
  }
  if (!target.closest('.priority-bar-wrap')) {
    priorityPickerId.value = null
  }
}

async function loadTasks() {
  const filter: any = { view: currentView.value }
  if (currentView.value === 'inbox') filter.sort_by = 'custom'
  tasks.value = await window.api.task.list(filter)
}

function selectView(view: 'inbox' | 'today' | 'recent' | 'completed') {
  currentView.value = view
  showViewPicker.value = false
  expandedTaskId.value = null
  loadTasks()
}

async function addTask() {
  if (!newTaskTitle.value.trim()) return
  await window.api.task.create({ title: newTaskTitle.value.trim() })
  taskStore.playSound('sound_new')
  newTaskTitle.value = ''
  await loadTasks()
  window.api.send('task:changed')
}

async function toggleTask(task: any) {
  const completing = !task.complete
  await window.api.task.update({
    task_id: task.task_id,
    complete: task.complete ? 0 : 1
  })
  if (completing) taskStore.playSound('sound_complete')
  await loadTasks()
  window.api.send('task:changed')
}

async function finishEdit(task: any) {
  if (editingTaskId.value !== task.task_id) return
  const title = task.title.trim()
  if (title) {
    await window.api.task.update({ task_id: task.task_id, title })
    window.api.send('task:changed')
  }
  editingTaskId.value = null
}

function cancelEdit(task: any) {
  editingTaskId.value = null
  loadTasks()
}

function toggleExpand(task: any) {
  if (!task.description && !hasTimeReminder(task)) return
  expandedTaskId.value = expandedTaskId.value === task.task_id ? null : task.task_id
}

function onTaskContextMenu(e: MouseEvent, task: any) {
  document.querySelectorAll('.widget-ctx').forEach(m => m.remove())
  const menu = document.createElement('div')
  menu.className = 'widget-ctx'
  menu.style.left = e.clientX + 'px'
  menu.style.top = e.clientY + 'px'
  menu.innerHTML = `
    <div class="ctx-item" data-action="edit">${t('task.editTask') || '编辑任务'}</div>
    <div class="ctx-item" data-action="open">${t('task.openInWindow') || '打开窗口'}</div>
    <div class="ctx-item ctx-danger" data-action="delete">${t('task.deleteTask')}</div>
  `
  document.body.appendChild(menu)
  const handler = async (ev: MouseEvent) => {
    const target = ev.target as HTMLElement
    const action = target.getAttribute('data-action')
    cleanup()
    if (action === 'open') {
      await window.api.widget.openTaskInMain(task.task_id)
    } else if (action === 'edit') {
      editingTaskId.value = task.task_id
      expandedTaskId.value = null
      setTimeout(() => {
        const input = document.querySelector('.task-edit-input') as HTMLInputElement
        input?.focus()
        input?.select()
      }, 0)
    } else if (action === 'delete') {
      await window.api.task.remove(task.task_id)
      taskStore.playSound('sound_remove')
      if (expandedTaskId.value === task.task_id) expandedTaskId.value = null
      await loadTasks()
      window.api.send('task:changed')
    }
  }
  const cleanup = () => {
    menu.removeEventListener('click', handler)
    menu.remove()
    document.removeEventListener('click', onClickOutside)
  }
  const onClickOutside = () => cleanup()
  menu.addEventListener('click', handler)
  setTimeout(() => document.addEventListener('click', onClickOutside), 0)
}

function hasTimeReminder(task: any): boolean {
  return !!task.due_date
}

function formatTaskTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getTimeClass(task: any): string {
  if (!task.due_date || task.complete) return ''
  const d = new Date(task.due_date)
  const now = new Date()
  const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  if (isToday) return 'time-today'
  if (task.due_date > Date.now()) return 'time-future'
  return 'time-past'
}

const priorityOptions = [
  { value: 0, label: t('task.priorityNone'), color: 'transparent' },
  { value: 1, label: t('task.priorityDaily'), color: '#FBBF24' },
  { value: 2, label: t('task.priorityImportant'), color: '#34D399' },
  { value: 3, label: t('task.priorityUrgent'), color: '#F87171' }
]

function togglePriorityPicker(task: any) {
  priorityPickerId.value = priorityPickerId.value === task.task_id ? null : task.task_id
}

async function setPriority(task: any, priority: number) {
  task.priority = priority
  priorityPickerId.value = null
  await window.api.task.update({ task_id: task.task_id, priority })
  window.api.send('task:changed')
}

function windowClose() {
  window.close()
}

function onItemMouseDown(e: MouseEvent, index: number) {
  if (e.button !== 0) return // 只响应左键
  if (currentView.value !== 'inbox') return
  // 如果点击的是 checkbox 按钮则忽略
  if ((e.target as HTMLElement).closest('.task-check')) return
  dragIndex.value = index
  dragStartY = e.clientY
  dragStarted = false
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (dragIndex.value === -1) return
  if (!dragStarted && Math.abs(e.clientY - dragStartY) < 5) return
  if (!dragStarted) {
    dragStarted = true
    isDragging.value = true
  }
  // 根据鼠标 Y 坐标计算目标位置
  const container = document.querySelector('.task-list-inner')
  if (!container) return
  const items = [...container.querySelectorAll('.task-item')]
  const mouseY = e.clientY
  let target = tasks.value.length
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    if (mouseY < rect.top + rect.height / 2) {
      target = i
      break
    }
  }
  dragOverIndex.value = target
}

async function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  if (dragIndex.value !== -1 && dragStarted && dragOverIndex.value !== -1 && dragIndex.value !== dragOverIndex.value) {
    const reordered = [...tasks.value]
    const [moved] = reordered.splice(dragIndex.value, 1)
    const insertIndex = dragOverIndex.value > dragIndex.value ? dragOverIndex.value - 1 : dragOverIndex.value
    reordered.splice(insertIndex, 0, moved)
    const updates: Promise<any>[] = []
    for (let i = 0; i < reordered.length; i++) {
      updates.push(window.api.task.update({ task_id: reordered[i].task_id, sort_order: i }))
    }
    await Promise.all(updates)
    window.api.send('task:changed')
  }
  dragIndex.value = -1
  dragOverIndex.value = -1
  dragStarted = false
  isDragging.value = false
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
</script>

<style scoped>
.todo-widget {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
  position: relative;
  font-family: var(--font-family);
  font-size: var(--font-md);
  border-radius: 9px;
  box-shadow:
    0 2px 6px rgba(15, 17, 23, 0.2),
    0 6px 14px rgba(15, 17, 23, 0.2),
    0 10px 22px rgba(15, 17, 23, 0.16);
}

.dock-strip {
  position: fixed;
  bottom: 0;
  left: 30px;
  right: 30px;
  height: 3px;
  background: var(--accent-primary);
  border-radius: 1px;
  opacity: 0.8;
  z-index: 999;
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
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 6px;
  height: var(--titlebar-height);
  background: var(--bg-titlebar);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-app-region: drag;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.widget-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-primary) 20%, var(--border-primary) 80%, transparent);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0;
  -webkit-app-region: no-drag;
}

.header-label {
  font-weight: 600;
  font-size: 13.5px;
  letter-spacing: 0.02em;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.chevron-icon {
  width: 10px;
  height: 10px;
  color: var(--text-tertiary);
  transition: transform 0.25s var(--ease-out);
}

.chevron-icon.open {
  transform: rotate(180deg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  -webkit-app-region: no-drag;
  position: relative;
  z-index: 100;
}

.settings-trigger {
  position: relative;
  z-index: 100;
}

.theme-popup {
  position: absolute;
  top: 32px;
  right: 0;
  min-width: auto;
  background: var(--bg-glass);
  backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 4px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  white-space: nowrap;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-sm);
  font-family: var(--font-family);
  cursor: pointer;
  border-radius: 7px;
  transition: all 0.15s var(--ease-out);
  text-align: left;
}

.theme-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.theme-item.active {
  background: var(--bg-active);
  color: var(--accent-primary);
  font-weight: 500;
}

.theme-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid var(--border-primary);
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s var(--ease-out);
  position: relative;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.action-btn.close:hover {
  background: var(--danger);
  color: white;
}

.action-btn.close:active {
  transform: scale(0.92);
}

/* ── Pin button ── */
.pin-btn.active {
  color: var(--accent-primary);
}

.pin-btn.active::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 6px;
  background: var(--accent-light);
  opacity: 0.6;
  animation: pinPulse 2.5s ease-in-out infinite;
}

@keyframes pinPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

.header-label-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 8px;
  transition: background 0.2s var(--ease-out);
}

.header-label-wrap:hover {
  background: var(--bg-hover);
}

.header-label-wrap:active {
  transform: scale(0.98);
}

/* ── View picker ── */
.category-picker {
  position: absolute;
  top: 40px;
  left: 8px;
  min-width: 150px;
  background: var(--bg-glass);
  backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(59, 158, 255, 0.04);
  padding: 4px;
  z-index: 50;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  border-radius: 7px;
  transition: all 0.15s var(--ease-out);
  text-align: left;
}

.picker-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.picker-item.active {
  background: var(--bg-active);
  color: var(--accent-primary);
  font-weight: 500;
}

.picker-item svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

/* ── Quick add ── */
.quick-add {
  padding: 10px 10px 10px 14px;
  flex-shrink: 0;
  position: relative;
}

.quick-add::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 14px;
  right: 10px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-secondary) 10%, var(--border-secondary) 90%, transparent);
}

.add-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  transition: all 0.25s var(--ease-out);
}

.add-input-wrap.focused {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-light), 0 2px 8px rgba(59, 158, 255, 0.08);
  background: var(--bg-primary);
  transform: translateY(-0.5px);
}

.add-submit {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 6px;
  flex-shrink: 0;
  padding: 0;
  transition: all 0.25s var(--ease-out);
}

.add-submit svg {
  width: 13px;
  height: 13px;
}

.add-submit:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.add-submit.active {
  color: var(--accent-primary);
}

.add-submit.active:hover {
  background: var(--accent-light);
  color: var(--accent-primary);
}

.add-submit:active {
  transform: scale(0.88);
}

.add-input-wrap input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13.5px;
  padding: 0;
  outline: none;
}

.add-input-wrap input::placeholder {
  color: var(--text-placeholder);
}

/* ── Task list ── */
.task-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 2px 0;
}

.task-list-inner {
  display: flex;
  flex-direction: column;
  padding: 0 6px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 10px 10px 14px;
  cursor: pointer;
  transition: background 0.2s var(--ease-out);
  animation: taskEnter 0.35s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 25ms);
  position: relative;
  border-radius: 8px;
  margin: 1px 0;
}

.task-item + .task-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 32px;
  right: 12px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--border-primary) 15%,
    rgba(59, 158, 255, 0.06) 50%,
    var(--border-primary) 85%,
    transparent
  );
}

.priority-bar-wrap {
  position: absolute;
  left: 2px;
  top: 8px;
  bottom: 8px;
  width: 2.5px;
  cursor: pointer;
  z-index: 10;
}

.priority-bar {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  transition: all 0.2s var(--ease-out);
}

.priority-bar-wrap:hover .priority-bar {
  width: 4px;
  opacity: 0.8;
}

.priority-0 .priority-bar {
  background: var(--border-primary);
  opacity: 0.35;
}

.priority-0 .priority-bar-wrap:hover .priority-bar {
  opacity: 0.6;
}

.priority-1 .priority-bar {
  background: #FBBF24;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.3);
}

.priority-2 .priority-bar {
  background: #34D399;
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.3);
}

.priority-3 .priority-bar {
  background: #F87171;
  box-shadow: 0 0 6px rgba(248, 113, 113, 0.3);
}

.priority-picker {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 3px;
  padding: 3px 4px;
  background: var(--bg-glass);
  backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  animation: pickerIn 0.15s var(--ease-out);
  z-index: 20;
}

@keyframes pickerIn {
  from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
  to { opacity: 1; transform: translateY(-50%) translateX(0); }
}

.priority-opt {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--border-primary);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.15s var(--ease-out);
}

.priority-opt:hover {
  transform: scale(1.2);
  border-color: var(--text-tertiary);
}

.priority-opt.active {
  border-width: 2px;
}

.priority-opt.p0.active { border-color: var(--text-tertiary); }
.priority-opt.p1.active { border-color: #FBBF24; }
.priority-opt.p2.active { border-color: #34D399; }
.priority-opt.p3.active { border-color: #F87171; }

.opt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: transform 0.15s var(--ease-out);
}

.priority-opt.p0 .opt-dot {
  width: 6px;
  height: 6px;
  border: 1px solid var(--border-primary);
  background: transparent !important;
}

.priority-opt.active .opt-dot {
  transform: scale(1.1);
}

@keyframes taskEnter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.task-item:hover {
  background: var(--bg-hover);
  box-shadow: var(--shadow-card-hover);
}

.task-item.drag-over {
  border-top: 2px solid var(--accent-primary);
}

.task-item.drag-after {
  border-bottom: 2px solid var(--accent-primary);
}

.task-item.dragging {
  opacity: 0.4;
}

/* ── Task content ── */
.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13.5px;
  line-height: 1.45;
  transition: all 0.2s var(--ease-out);
  letter-spacing: 0.01em;
}

.task-edit-input {
  font-size: 13.5px;
  line-height: 1.45;
  letter-spacing: 0.01em;
  font-family: var(--font-family);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1.5px solid var(--accent-primary);
  border-radius: 6px;
  padding: 2px 6px;
  outline: none;
  width: 100%;
  box-shadow: 0 0 0 3px var(--accent-light);
}

.task-desc {
  font-size: 12.5px;
  color: var(--desc-color);
  line-height: 1.4;
  margin-top: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.task-time {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  font-size: 12.5px;
  color: var(--accent-primary);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.task-time.time-today {
  color: var(--color-time-today);
}

.task-time.time-future {
  color: var(--color-time-future);
}

.task-time.time-past {
  color: var(--text-tertiary);
}

.task-alarm {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--accent-primary);
  margin-top: 1px;
  animation: alarmPulse 2.5s ease-in-out infinite;
}

.task-alarm svg {
  width: 14px;
  height: 14px;
}

.task-alarm.time-today {
  color: var(--color-time-today);
}

.task-alarm.time-future {
  color: var(--color-time-future);
}

.task-alarm.time-past {
  color: var(--text-tertiary);
}

@keyframes alarmPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ── Custom checkbox ── */
.task-check {
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  position: relative;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.task-check:active {
  transform: scale(0.82);
}

.task-check svg {
  width: 16px;
  height: 16px;
}

.task-check circle {
  stroke: var(--border-primary);
  fill: transparent;
  transition: all 0.25s var(--ease-out);
}

.task-check:hover circle {
  stroke: var(--accent-primary);
  filter: drop-shadow(0 0 2px rgba(59, 158, 255, 0.25));
}

.task-check.checked circle {
  stroke: var(--accent-primary);
  fill: var(--accent-primary);
}

.task-check .checkmark {
  stroke: white;
  stroke-dasharray: 14;
  stroke-dashoffset: 14;
  transition: stroke-dashoffset 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.task-check.checked .checkmark {
  stroke-dashoffset: 0;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
  text-decoration-color: var(--text-tertiary);
  text-decoration-thickness: 1px;
}

.task-item.completed .task-check circle {
  stroke: var(--text-tertiary);
  fill: var(--text-tertiary);
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 20px;
}

.empty-shape {
  width: 40px;
  height: 40px;
  color: var(--text-placeholder);
  opacity: 0.4;
  animation: emptyFloat 4s ease-in-out infinite;
}

.empty-shape svg {
  width: 100%;
  height: 100%;
}

@keyframes emptyFloat {
  0%, 100% { opacity: 0.35; transform: translateY(0); }
  50% { opacity: 0.55; transform: translateY(-3px); }
}

.empty-text {
  color: var(--text-tertiary);
  font-size: 12.5px;
  letter-spacing: 0.03em;
}

/* ── Transitions ── */
.dropdown-enter-active { transition: all 0.25s var(--ease-out); }
.dropdown-leave-active { transition: all 0.15s ease-in; }
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

.fade-enter-active { transition: opacity 0.35s ease; }
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.task-list-enter-active {
  transition: all 0.35s var(--ease-out);
}
.task-list-leave-active {
  transition: all 0.2s ease-in;
  position: absolute;
}
.task-list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
.task-list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
.task-list-move {
  transition: transform 0.3s var(--ease-out);
}
</style>

<style>
/* ── Context menu (unscoped) ── */
.widget-ctx {
  position: fixed;
  z-index: 9999;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
}
.widget-ctx .ctx-item {
  padding: 5px 12px;
  font-size: 12.5px;
  white-space: nowrap;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.1s;
}
.widget-ctx .ctx-item:hover {
  background: var(--bg-hover);
}
.widget-ctx .ctx-item.ctx-danger {
  color: var(--danger);
}
.widget-ctx .ctx-item.ctx-danger:hover {
  background: var(--danger);
  color: white;
}

html.dark .add-submit,
html.transparent-dark .add-submit,
html.hermes .add-submit {
  color: rgba(255, 255, 255, 0.7);
}

html.dark .add-input-wrap input::placeholder,
html.transparent-dark .add-input-wrap input::placeholder,
html.hermes .add-input-wrap input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
</style>
