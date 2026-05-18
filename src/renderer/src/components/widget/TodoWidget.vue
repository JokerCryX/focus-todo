<template>
  <div class="todo-widget">
    <!-- Header -->
    <header class="widget-header">
      <div class="header-left">
        <button class="action-btn pin-btn" :class="{ active: isPinned }" @click.stop="togglePin" :title="isPinned ? $t('titlebar.unpin') : $t('titlebar.pin')">
          {{ isPinned ? '📌' : '📍' }}
        </button>
        <div class="header-label-wrap" @click="showCategoryPicker = !showCategoryPicker">
          <svg class="header-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
            <path d="M5 1v3M11 1v3M1.5 6.5h13" />
          </svg>
          <span class="header-label">{{ currentLabel }}</span>
          <svg class="chevron-icon" :class="{ open: showCategoryPicker }" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </div>
      </div>
      <div class="header-actions">
        <div class="settings-trigger">
          <button class="action-btn" @click="showSettings = !showSettings" :title="$t('settings.title')">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="8" r="2.2" /><path d="M13.3 10a1.2 1.2 0 00.2 1.3l.04.04a1.45 1.45 0 11-2.06 2.06l-.04-.04a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.73 1.1v.11a1.45 1.45 0 01-2.9 0v-.06a1.2 1.2 0 00-.79-1.1 1.2 1.2 0 00-1.3.2l-.04.04a1.45 1.45 0 11-2.06-2.06l.04-.04a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.73h-.11a1.45 1.45 0 010-2.9h.06a1.2 1.2 0 001.1-.79 1.2 1.2 0 00-.2-1.3l-.04-.04a1.45 1.45 0 112.06-2.06l.04.04a1.2 1.2 0 001.3.2h.06a1.2 1.2 0 00.73-1.1v-.11a1.45 1.45 0 012.9 0v.06a1.2 1.2 0 00.79 1.1 1.2 1.2 0 001.3-.2l.04-.04a1.45 1.45 0 112.06 2.06l-.04.04a1.2 1.2 0 00-.2 1.3v.06a1.2 1.2 0 001.1.73h.11a1.45 1.45 0 010 2.9h-.06a1.2 1.2 0 00-1.1.79z" />
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="showSettings" class="settings-popup">
              <WidgetSettings :widget-id="widgetId" @close="showSettings = false" />
            </div>
          </Transition>
        </div>
        <button class="action-btn close" @click="windowClose" :title="$t('titlebar.close')">
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
            <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>

      <!-- Category picker dropdown -->
      <Transition name="dropdown">
        <div v-if="showCategoryPicker" class="category-picker">
          <button class="picker-item" :class="{ active: selectedCategoryId === null }" @click="selectCategory(null)">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h10M7 2v10" /></svg>
            {{ $t('task.noCategory') }}
          </button>
          <button
            v-for="c in categories"
            :key="c.id"
            class="picker-item"
            :class="{ active: selectedCategoryId === c.id }"
            @click="selectCategory(c.id)"
          >
            <span class="cat-dot" :style="{ background: c.color || 'var(--accent-primary)' }"></span>
            {{ c.name }}
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
      <TransitionGroup name="task-list" tag="div" class="task-list-inner">
        <div
          v-for="(task, index) in tasks"
          :key="task.task_id"
          class="task-item"
          :class="{ completed: task.complete, [`priority-${task.priority}`]: true }"
          :style="{ '--i': index }"
          @dblclick="openInMain(task.task_id)"
        >
          <div class="priority-bar"></div>
          <button class="task-check" :class="{ checked: task.complete }" @click.stop="toggleTask(task)">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke-width="1.2" />
              <path class="checkmark" d="M5 8.3L7.2 10.5L11 6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="task-title">{{ task.title }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WidgetSettings from './WidgetSettings.vue'

const { t } = useI18n()

const widgetId = computed(() => {
  const params = new URLSearchParams(window.location.search)
  return params.get('widgetId') || ''
})

const tasks = ref<any[]>([])
const categories = ref<any[]>([])
const selectedCategoryId = ref<number | null>(null)
const newTaskTitle = ref('')
const showSettings = ref(false)
const showCategoryPicker = ref(false)
const inputFocused = ref(false)
const isPinned = ref(false)

async function togglePin() {
  isPinned.value = !isPinned.value
  await window.api.window.setAlwaysOnTop(isPinned.value)
}

async function applyWidgetTheme() {
  const theme = (await window.api.settings.get('theme')) || 'light'
  document.documentElement.className = theme
  window.api.window.setBackgroundColor('#00000000')
}

const currentLabel = computed(() => {
  if (!selectedCategoryId.value) return t('nav.inbox')
  const cat = categories.value.find((c: any) => c.id === selectedCategoryId.value)
  return cat ? cat.name : t('nav.inbox')
})

onMounted(async () => {
  applyWidgetTheme()
  categories.value = await window.api.category.list()
  await loadTasks()
  isPinned.value = await window.api.window.isAlwaysOnTop()
  window.api.on('task:changed', loadTasks)
  window.api.on('theme:changed', applyWidgetTheme)
})

onUnmounted(() => {
  window.api.removeListener?.('task:changed', loadTasks)
  window.api.removeListener?.('theme:changed', applyWidgetTheme)
})

async function loadTasks() {
  const filter: any = selectedCategoryId.value
    ? { view: 'category', category_id: selectedCategoryId.value }
    : { view: 'inbox' }
  tasks.value = await window.api.task.list(filter)
}

function selectCategory(id: number | null) {
  selectedCategoryId.value = id
  showCategoryPicker.value = false
  loadTasks()
}

async function addTask() {
  if (!newTaskTitle.value.trim()) return
  await window.api.task.create({
    title: newTaskTitle.value.trim(),
    category_id: selectedCategoryId.value || undefined
  })
  newTaskTitle.value = ''
  await loadTasks()
  window.api.send('task:changed')
}

async function toggleTask(task: any) {
  await window.api.task.update({
    task_id: task.task_id,
    complete: task.complete ? 0 : 1
  })
  await loadTasks()
  window.api.send('task:changed')
}

function openInMain(taskId: string) {
  window.api.widget.openTaskInMain(taskId)
}

function windowClose() {
  window.close()
}
</script>

<style scoped>
.todo-widget {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
  position: relative;
  font-family: var(--font-family);
  font-size: var(--font-sm);
  border-radius: 9px;
  box-shadow: var(--shadow-window, none);
}

/* ── Header ── */
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 6px;
  height: 42px;
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

.header-icon {
  width: 13px;
  height: 13px;
  color: var(--accent-primary);
  flex-shrink: 0;
  opacity: 0.85;
}

.header-label {
  font-weight: 600;
  font-size: 12px;
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

.settings-popup {
  position: absolute;
  top: 32px;
  right: 0;
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

/* ── Category picker ── */
.category-picker {
  position: absolute;
  top: 40px;
  left: 8px;
  min-width: 170px;
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
  font-size: var(--font-xs);
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

.cat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 4px rgba(59, 158, 255, 0.15);
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

.add-icon {
  width: 13px;
  height: 13px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: color 0.25s var(--ease-out), transform 0.25s var(--ease-out);
}

.add-input-wrap.focused .add-icon {
  color: var(--accent-primary);
  transform: scale(1.1);
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
  font-size: 12px;
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
  align-items: center;
  gap: 10px;
  padding: 10px 10px 10px 14px;
  cursor: pointer;
  transition: background 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
  animation: taskEnter 0.35s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 25ms);
  position: relative;
  border-radius: 8px;
  margin: 1px 0;
}

.priority-bar {
  position: absolute;
  left: 2px;
  top: 8px;
  bottom: 8px;
  width: 2.5px;
  border-radius: 2px;
  transition: opacity 0.2s var(--ease-out);
}

.priority-0 .priority-bar {
  opacity: 0;
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

.task-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.45;
  transition: all 0.2s var(--ease-out);
  letter-spacing: 0.01em;
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
  font-size: 11px;
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
