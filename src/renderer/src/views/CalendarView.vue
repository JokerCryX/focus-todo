<template>
  <div class="view-page">
    <div class="view-header">
      <div class="cal-nav">
        <button class="cal-arrow" @click="prevMonth">
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <span class="cal-title">{{ $t('calendar.monthTitle', { year: year, month: month + 1 }) }}</span>
        <button class="cal-arrow" @click="nextMonth">
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <button class="cal-today-btn" @click="goToday">{{ $t('calendar.today') }}</button>
    </div>

    <div class="cal-body">
      <div class="cal-weekdays">
        <span v-for="d in weekdays" :key="d" class="cal-weekday">{{ d }}</span>
      </div>
      <div class="cal-grid">
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          class="cal-cell"
          :class="{
            'other-month': !day.currentMonth,
            'is-today': day.isToday,
            'is-selected': isSelectedDay(day)
          }"
          @click="onCellClick(day, $event)"
          @contextmenu.prevent="onCellAreaContextMenu($event, day)"
          @wheel.prevent="onCellWheel(day)"
        >
          <div class="cal-date-row">
            <span class="cal-date">{{ day.date }}</span>
            <span v-if="day.label" class="cal-meta">{{ day.label }}</span>
          </div>
          <div class="cal-cell-tasks">
            <div
              v-for="task in day.tasks.slice(0, 2)"
              :key="task.task_id"
              class="cal-task-bar"
              :class="{ done: task.complete, 'is-task-selected': isTaskSelected(task) }"
              :style="{ borderLeftColor: getBarColor(task) }"
              :title="task.title"
              @click.stop="selectTask(task, day)"
              @contextmenu.prevent.stop="onTaskContextMenu($event, task)"
            >
              <span class="cal-bar-title">{{ task.title }}</span>
            </div>
            <span v-if="day.tasks.length > 2" class="cal-more" :title="day.tasks.slice(2).map(t => t.title).join('\n')">+{{ day.tasks.length - 2 }}</span>
          </div>
          <button v-if="day.tasks.length === 0" class="cal-cell-add" @click.stop="addTaskOnDay(day)">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 1v12M1 7h12" /></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="cal-detail">
      <template v-if="selectedTask">
        <div
          class="cal-detail-item"
          :class="{ done: selectedTask.complete }"
          @click="openTaskPopup(selectedTask)"
          @contextmenu.prevent="onTaskContextMenu($event, selectedTask, true)"
        >
          <div class="cal-detail-bar" :style="{ background: getBarColor(selectedTask) }" />
          <div class="cal-detail-body">
            <span class="cal-detail-title">{{ selectedTask.title }}</span>
            <span class="cal-detail-desc" v-if="selectedTask.description">{{ selectedTask.description }}</span>
          </div>
          <span class="cal-detail-time" v-if="hasTimeReminder(selectedTask)" :class="{ highlight: true }">{{ formatTime(selectedTask.due_date) }}</span>
          <span class="cal-detail-priority" v-if="selectedTask.priority > 0">P{{ selectedTask.priority }}</span>
        </div>
      </template>
      <div v-else class="cal-detail-empty">
        {{ selectedDay ? $t('calendar.noTasks') : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoryStore } from '@/stores/category'
import { useUIStore } from '@/stores/ui'
import { getCalendarLabel } from '@/composables/useCalendarMeta'
import type { Task } from '@/types/task'
import { useTaskStore } from '@/stores/task'

const { t, tm } = useI18n()
const uiStore = useUIStore()
const categoryStore = useCategoryStore()
const taskStore = useTaskStore()

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const selectedDay = ref<{ year: number; month: number; date: number } | null>(null)
const selectedTask = ref<Task | null>(null)
const monthTasks = ref<Task[]>([])

function openTaskPopup(task: Task) {
  window.api.popup.openTask(task.task_id)
}

function selectTask(task: Task, day: CalDay) {
  selectedTask.value = task
  selectDay(day)
}

function isTaskSelected(task: Task): boolean {
  return !!selectedTask.value && selectedTask.value.task_id === task.task_id
}

function onCellClick(day: CalDay, e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.cal-task-bar') && !target.closest('.cal-cell-add')) {
    selectDay(day)
    selectedTask.value = day.tasks.length > 0 ? day.tasks[0] : null
  }
}

function onCellWheel(day: CalDay) {
  selectDay(day)
  if (day.tasks.length === 0) return
  if (!selectedTask.value || !day.tasks.find(t => t.task_id === selectedTask.value!.task_id)) {
    selectedTask.value = day.tasks[0]
  } else {
    const idx = day.tasks.findIndex(t => t.task_id === selectedTask.value!.task_id)
    selectedTask.value = day.tasks[(idx + 1) % day.tasks.length]
  }
}

function closeAllMenus() {
  document.querySelectorAll('.context-menu').forEach(m => m.remove())
}

function onTaskContextMenu(e: MouseEvent, task: Task, openAbove = false) {
  closeAllMenus()
  const menu = document.createElement('div')
  menu.className = 'context-menu'
  menu.innerHTML = `<div class="ctx-item" data-action="edit">${t('task.edit')}</div><div class="ctx-item ctx-danger" data-action="delete">${t('task.delete')}</div>`
  document.body.appendChild(menu)
  menu.style.left = e.clientX + 'px'
  menu.style.top = openAbove ? (e.clientY - menu.offsetHeight) + 'px' : e.clientY + 'px'

  const handler = async (ev: MouseEvent) => {
    const action = (ev.target as HTMLElement).getAttribute('data-action')
    closeAllMenus()
    if (action === 'edit') {
      openTaskPopup(task)
    } else if (action === 'delete') {
      await taskStore.removeTask(task.task_id)
      selectedTask.value = null
      await loadMonthTasks()
    }
  }

  menu.addEventListener('click', handler)
  const onClickOutside = () => { closeAllMenus(); document.removeEventListener('click', onClickOutside) }
  setTimeout(() => document.addEventListener('click', onClickOutside), 0)
}

function onCellAreaContextMenu(e: MouseEvent, day: CalDay) {
  if ((e.target as HTMLElement).closest('.cal-task-bar')) return
  closeAllMenus()
  const menu = document.createElement('div')
  menu.className = 'context-menu'
  menu.style.left = e.clientX + 'px'
  menu.style.top = e.clientY + 'px'
  menu.innerHTML = `<div class="ctx-item" data-action="add">${t('task.add')}</div>`
  document.body.appendChild(menu)

  const handler = async (ev: MouseEvent) => {
    const action = (ev.target as HTMLElement).getAttribute('data-action')
    closeAllMenus()
    if (action === 'add') {
      await addTaskOnDay(day)
    }
  }

  menu.addEventListener('click', handler)
  const onClickOutside = () => { closeAllMenus(); document.removeEventListener('click', onClickOutside) }
  setTimeout(() => document.addEventListener('click', onClickOutside), 0)
}

const weekdays = computed(() => {
  const val = tm('calendar.weekDays')
  return Array.isArray(val) ? val : []
})

const PRIORITY_COLORS = ['#D1D5DB', '#FBBF24', '#34D399', '#F87171']

interface CalDay {
  year: number
  month: number
  date: number
  currentMonth: boolean
  isToday: boolean
  tasks: Task[]
  label: string
}

const calendarDays = computed<CalDay[]>(() => {
  const firstDay = new Date(year.value, month.value, 1)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  const daysInPrevMonth = new Date(year.value, month.value, 0).getDate()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  const days: CalDay[] = []

  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = month.value - 1
    const y = m < 0 ? year.value - 1 : year.value
    const am = m < 0 ? 11 : m
    days.push({
      year: y, month: am, date: d,
      currentMonth: false,
      isToday: `${y}-${am}-${d}` === todayStr,
      tasks: getTasksForDate(y, am, d),
      label: getCalendarLabel(y, am, d)
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      year: year.value, month: month.value, date: d,
      currentMonth: true,
      isToday: `${year.value}-${month.value}-${d}` === todayStr,
      tasks: getTasksForDate(year.value, month.value, d),
      label: getCalendarLabel(year.value, month.value, d)
    })
  }

  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const m = month.value + 1
    const y = m > 11 ? year.value + 1 : year.value
    const am = m > 11 ? 0 : m
    days.push({
      year: y, month: am, date: d,
      currentMonth: false,
      isToday: `${y}-${am}-${d}` === todayStr,
      tasks: getTasksForDate(y, am, d),
      label: getCalendarLabel(y, am, d)
    })
  }

  return days
})

function getTasksForDate(y: number, m: number, d: number): Task[] {
  const start = new Date(y, m, d).getTime()
  const end = new Date(y, m, d, 23, 59, 59, 999).getTime()
  return monthTasks.value.filter(t => t.due_date && t.due_date >= start && t.due_date <= end)
}

function hasTimeReminder(task: Task): boolean {
  if (!task.due_date) return false
  const d = new Date(task.due_date)
  return d.getHours() !== 0 || d.getMinutes() !== 0
}

function getBarColor(task: Task): string {
  if (task.category_id) {
    const cat = categoryStore.getCategoryById(task.category_id)
    if (cat?.color) return cat.color
  }
  return PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[0]
}

function isSelectedDay(day: CalDay): boolean {
  if (!selectedDay.value) return false
  return day.year === selectedDay.value.year && day.month === selectedDay.value.month && day.date === selectedDay.value.date
}

function selectDay(day: CalDay) {
  selectedDay.value = { year: day.year, month: day.month, date: day.date }
}

function addTaskOnDay(day: CalDay) {
  const dueDate = new Date(day.year, day.month, day.date, 0, 0, 0).getTime()
  window.api.popup.openTask(`create_${dueDate}`, { mode: 'create', dueDate })
}

function prevMonth() {
  if (month.value === 0) { month.value = 11; year.value-- }
  else month.value--
  selectedDay.value = null
  selectedTask.value = null
  loadMonthTasks()
}

function nextMonth() {
  if (month.value === 11) { month.value = 0; year.value++ }
  else month.value++
  selectedDay.value = null
  selectedTask.value = null
  loadMonthTasks()
}

function goToday() {
  const t = new Date()
  year.value = t.getFullYear()
  month.value = t.getMonth()
  selectedDay.value = { year: t.getFullYear(), month: t.getMonth(), date: t.getDate() }
  loadMonthTasks()
}

async function loadMonthTasks() {
  const start = new Date(year.value, month.value - 1, 1).getTime()
  const end = new Date(year.value, month.value + 2, 0, 23, 59, 59, 999).getTime()
  monthTasks.value = await window.api.task.listByDateRange(start, end)
  if (selectedTask.value) {
    const updated = monthTasks.value.find(t => t.task_id === selectedTask.value!.task_id)
    selectedTask.value = updated || null
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  await loadMonthTasks()
  const today = new Date()
  selectedDay.value = { year: today.getFullYear(), month: today.getMonth(), date: today.getDate() }
  window.api.on('task:changed', loadMonthTasks)
})

onUnmounted(() => {
  window.api.removeListener?.('task:changed', loadMonthTasks)
})
</script>

<style scoped>
.view-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding-bottom: var(--spacing-sm);
}

/* --- Header --- */

.view-header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.cal-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cal-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.cal-arrow:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.cal-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  min-width: 90px;
  text-align: center;
  letter-spacing: -0.01em;
}

.cal-today-btn {
  padding: 4px 10px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-secondary);
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cal-today-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* --- Grid --- */

.cal-body {
  padding: 0 var(--spacing-lg) var(--spacing-xs);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}

.cal-weekday {
  text-align: center;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  font-weight: 600;
  padding: 6px 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 1px;
  background: var(--border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  flex: 1;
}

/* --- Cell --- */

.cal-cell {
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  padding: 5px 5px 3px;
  cursor: pointer;
  transition: background var(--transition-fast);
  overflow: hidden;
  position: relative;
}

.cal-cell:hover {
  background: var(--bg-hover);
}

.cal-cell-add {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-placeholder);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s var(--ease-out), color 0.15s;
  padding: 0;
}

.cal-cell:hover .cal-cell-add {
  opacity: 0.5;
}

.cal-cell-add:hover {
  opacity: 1 !important;
  color: var(--accent-primary);
  background: var(--accent-light);
}

.cal-cell.other-month {
  opacity: 0.45;
}

.cal-cell.is-today .cal-date {
  background: var(--accent-primary);
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cal-cell.is-selected {
  background: var(--accent-light);
}

.cal-date-row {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-bottom: 3px;
  justify-content: space-between;
}

.cal-date {
  font-size: var(--font-sm);
  color: var(--text-primary);
  line-height: 1;
  font-weight: 500;
}

.cal-meta {
  font-size: 9px;
  color: var(--accent-primary);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40px;
  opacity: 0.8;
  position: relative;
  top: -1px;
}

/* --- In-cell task bars --- */

.cal-cell-tasks {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-height: 0;
}

.cal-task-bar {
  display: flex;
  align-items: center;
  padding: 0 4px;
  border-left: 2.5px solid;
  border-radius: 0 3px 3px 0;
  background: var(--bg-secondary);
  height: 17px;
  min-height: 15px;
  cursor: pointer;
  transition: background var(--transition-fast);
  flex-shrink: 1;
}

.cal-task-bar:hover {
  background: var(--bg-hover);
}

.cal-task-bar.done {
  opacity: 0.45;
}

.cal-task-bar.done .cal-bar-title {
  text-decoration: line-through;
}

.cal-task-bar.is-task-selected {
  background: var(--accent-light);
  box-shadow: inset 0 0 0 1px var(--accent-primary);
}

.cal-bar-title {
  font-size: 10px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
}

.cal-more {
  font-size: 9px;
  color: var(--text-tertiary);
  padding-left: 4px;
  line-height: 14px;
}

/* --- Task detail below --- */

.cal-detail {
  flex-shrink: 0;
  height: 40px;
  padding: 7px var(--spacing-lg) 2px;
  border-top: 1px solid var(--border-secondary);
}

.cal-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
  position: relative;
  overflow: hidden;
  height: 100%;
}

.cal-detail-item:hover {
  background: var(--bg-hover);
}

.cal-detail-item.done .cal-detail-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.cal-detail-item.done .cal-detail-desc {
  text-decoration: line-through;
}

.cal-detail-bar {
  width: 3px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 0 2px 2px 0;
}

.cal-detail-body {
  flex: 1;
  min-width: 0;
  padding-left: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cal-detail-title {
  font-size: var(--font-md);
  color: var(--text-primary);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cal-detail-desc {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cal-detail-time {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.cal-detail-time.highlight {
  color: var(--accent-primary);
  font-weight: 500;
}

.cal-detail-priority {
  font-size: 10px;
  color: var(--accent-primary);
  flex-shrink: 0;
  font-weight: 600;
}

.cal-detail-empty {
  text-align: center;
  color: var(--text-tertiary);
  padding: 8px;
  font-size: var(--font-sm);
  line-height: 1;
}
</style>
