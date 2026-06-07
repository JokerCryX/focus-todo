<template>
  <div class="task-popup">
    <div class="popup-toolbar">
      <div class="tb-group">
        <div class="time-group" :class="{ active: timeActive, set: hasReminder }">
          <button class="time-toggle" @click.stop="timeActive = !timeActive">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="8" cy="8" r="6.5" /><path d="M8 4.5V8l2.5 1.5" /></svg>
            <span class="time-label">{{ hasReminder ? `${hourStr}:${minuteStr}` : '--:--' }}</span>
            <span v-if="hasReminder" class="time-clear" @click.stop="clearReminder">&times;</span>
          </button>
          <div v-if="timeActive" class="time-popup" @click.stop>
            <div class="time-col">
              <div v-for="h in hours" :key="h" class="time-opt" :class="{ sel: hourStr === h }" @click="setHour(h)">{{ h }}</div>
            </div>
            <span class="time-popup-sep">:</span>
            <div class="time-col">
              <div v-for="m in minutes" :key="m" class="time-opt" :class="{ sel: minuteStr === m }" @click="setMinute(m)">{{ m }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tb-sep"></div>

      <div class="tb-group">
        <div class="cat-group">
          <span class="cat-dot" :style="{ background: selectedCategoryColor || 'var(--text-tertiary)' }"></span>
          <select v-model="form.category_id" @change="saveField('category_id')" class="toolbar-select cat-select">
            <option :value="null">{{ $t('task.categoryLabel') }}</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>

      <div class="tb-sep"></div>

      <div class="tb-group">
        <div class="priority-group">
          <button class="priority-btn" :class="{ active: form.priority === 0 }" @click="setPriority(0)" title="None">
            <span class="p-bar" style="background:var(--border-primary)"></span>
          </button>
          <button class="priority-btn" :class="{ active: form.priority === 1 }" @click="setPriority(1)" title="Normal">
            <span class="p-bar" style="background:#FBBF24"></span>
          </button>
          <button class="priority-btn" :class="{ active: form.priority === 2 }" @click="setPriority(2)" title="Important">
            <span class="p-bar" style="background:#34D399"></span>
          </button>
          <button class="priority-btn" :class="{ active: form.priority === 3 }" @click="setPriority(3)" title="Urgent">
            <span class="p-bar" style="background:#F87171"></span>
          </button>
        </div>
      </div>

      <button class="close-btn" @click="closePopup" title="Close">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" /></svg>
      </button>
    </div>

    <div class="popup-editor">
      <input
        ref="titleRef"
        v-model="form.title"
        class="popup-title"
        :placeholder="$t('task.titlePlaceholder')"
        @blur="saveField('title')"
        @keyup.enter="$event.target.blur()"
      />
      <div class="popup-divider" />
      <textarea
        v-model="form.description"
        class="popup-desc"
        :placeholder="$t('task.descPlaceholder')"
        @blur="saveField('description')"
        rows="4"
      />
    </div>

    <div class="popup-footer">
      <template v-if="isCreateMode">
        <button class="confirm-btn" @click="confirmCreate">{{ $t('common.confirm') }}</button>
      </template>
      <template v-else>
        <span class="footer-label">{{ $t('task.createdAt') }}</span>
        <span class="footer-time">{{ createdAtLabel }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTaskStore } from '@/stores/task'
import { useCategoryStore } from '@/stores/category'
import { useSettingsStore } from '@/stores/settings'
import type { Task } from '@/types/task'

const { t } = useI18n()
const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()

const params = new URLSearchParams(window.location.search)
const taskId = params.get('taskId') || ''
const mode = params.get('mode') || ''
const dueDateParam = params.get('dueDate')

const isCreateMode = computed(() => mode === 'create')

const task = ref<Task | null>(null)
const titleRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  title: '',
  description: '',
  category_id: null as number | null,
  priority: 0
})

const hourStr = ref('09')
const minuteStr = ref('00')
const timeActive = ref(false)
const hasReminder = ref(false)

if (isCreateMode.value && dueDateParam) {
  // create mode: no reminder by default
}

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const categories = computed(() => categoryStore.categories)

const selectedCategoryColor = computed(() => {
  if (form.category_id == null) return ''
  const cat = categories.value.find((c: any) => c.id === form.category_id)
  return cat?.color || ''
})

const createdAtLabel = computed(() => {
  if (!task.value?.created_at) return ''
  const d = new Date(task.value.created_at)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

watch(task, (val) => {
  if (val) {
    form.title = val.title
    form.description = val.description
    form.category_id = val.category_id
    form.priority = val.priority
    if (val.due_date) {
      const d = new Date(val.due_date)
      hourStr.value = String(d.getHours()).padStart(2, '0')
      minuteStr.value = String(d.getMinutes()).padStart(2, '0')
      hasReminder.value = d.getHours() !== 0 || d.getMinutes() !== 0
    } else {
      hasReminder.value = false
    }
  }
}, { immediate: true })

watch(timeActive, async (val) => {
  if (val) {
    await nextTick()
    document.querySelectorAll('.time-col').forEach(col => {
      const sel = col.querySelector('.time-opt.sel') as HTMLElement
      if (sel) sel.scrollIntoView({ block: 'center' })
    })
  }
})

function onTimeClickOutside() {
  timeActive.value = false
}

async function loadTask() {
  if (isCreateMode.value || !taskId) return
  const all = await window.api.task.list({ view: 'inbox' })
  const found = (all as Task[]).find(t => t.task_id === taskId)
  if (found) {
    task.value = found
  }
}

async function saveField(field: string) {
  if (!task.value || isCreateMode.value) return
  const input: any = { task_id: task.value.task_id, [field]: (form as any)[field] }
  const updated = await taskStore.updateTask(input)
  task.value = updated
  window.api.send('task:changed')
}

async function saveTime() {
  if (!task.value || isCreateMode.value) return
  const dueDate = task.value.due_date || Date.now()
  const d = new Date(dueDate)
  d.setHours(Number(hourStr.value), Number(minuteStr.value), 0, 0)
  const input: any = { task_id: task.value.task_id, due_date: d.getTime() }
  const updated = await taskStore.updateTask(input)
  task.value = updated
  window.api.send('task:changed')
}

function setHour(h: string) {
  hourStr.value = h
  hasReminder.value = true
  if (!isCreateMode.value) saveTime()
}

function setMinute(m: string) {
  minuteStr.value = m
  hasReminder.value = true
  if (!isCreateMode.value) saveTime()
}

function setPriority(p: number) {
  form.priority = p
  if (!isCreateMode.value) saveField('priority')
}

async function clearReminder() {
  hasReminder.value = false
  timeActive.value = false
  if (!isCreateMode.value && task.value) {
    const dueDate = task.value.due_date || Date.now()
    const d = new Date(dueDate)
    d.setHours(0, 0, 0, 0)
    const input: any = { task_id: task.value.task_id, due_date: d.getTime() }
    const updated = await taskStore.updateTask(input)
    task.value = updated
    window.api.send('task:changed')
  }
}

async function confirmCreate() {
  const input: any = {
    title: form.title || '',
    description: form.description || '',
    category_id: form.category_id,
    priority: form.priority
  }
  if (hasReminder.value) {
    const baseDate = dueDateParam ? Number(dueDateParam) : Date.now()
    const d = new Date(baseDate)
    d.setHours(Number(hourStr.value), Number(minuteStr.value), 0, 0)
    input.due_date = d.getTime()
  } else if (dueDateParam) {
    const d = new Date(Number(dueDateParam))
    d.setHours(0, 0, 0, 0)
    input.due_date = d.getTime()
  }
  await window.api.task.create(input)
  window.api.send('task:changed')
  window.close()
}

onMounted(async () => {
  await Promise.all([
    settingsStore.loadSettings(),
    categoryStore.fetchCategories(),
    loadTask()
  ])
  titleRef.value?.focus()
  document.addEventListener('click', onTimeClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onTimeClickOutside)
})

function closePopup() {
  window.close()
}
</script>

<style scoped>
.task-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: var(--font-sm);
  border-radius: 9px;
  border: 1px solid var(--text-primary);
  overflow: hidden;
  box-shadow: var(--shadow-window, none);
}

/* ── Toolbar ── */
.popup-toolbar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-secondary);
  background: var(--bg-titlebar);
  backdrop-filter: blur(12px);
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.tb-group {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.tb-sep {
  width: 1px;
  height: 16px;
  background: var(--border-primary);
  margin: 0 6px;
  flex-shrink: 0;
}

.close-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  margin-left: auto;
  -webkit-app-region: no-drag;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: #e53e3e;
  color: #fff;
}

.toolbar-select {
  height: 24px;
  padding: 0 16px 0 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 11px;
  font-family: var(--font-family);
  cursor: pointer;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  transition: all var(--transition-fast);
  background-image: url("data:image/svg+xml,%3Csvg width='6' height='4' viewBox='0 0 8 5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%239ca3af' stroke-width='1.2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 5px center;
}

.toolbar-select:hover {
  border-color: var(--accent-primary);
  color: var(--text-primary);
}

.toolbar-select:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(59, 158, 255, 0.12);
}

.cat-group {
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
}

.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  position: absolute;
  left: 6px;
  z-index: 1;
  pointer-events: none;
}

.cat-select {
  max-width: 90px;
  padding-left: 20px;
}

/* ── Time group ── */
.time-group {
  position: relative;
}

.time-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 11px;
  font-family: var(--font-family);
  transition: all var(--transition-fast);
}

.time-toggle:hover {
  border-color: var(--accent-primary);
  color: var(--text-primary);
}

.time-group.active .time-toggle {
  background: var(--accent-light);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(59, 158, 255, 0.12);
}

.time-group.set .time-toggle {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--accent-light);
}

.time-group.set.active .time-toggle {
  box-shadow: 0 0 0 2px rgba(59, 158, 255, 0.12);
}

.time-label {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.time-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-left: 1px;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1;
}

.time-clear:hover {
  background: var(--danger);
  color: #fff;
}

.time-popup {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  display: flex;
  align-items: stretch;
  gap: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(15, 17, 23, 0.12);
  z-index: 10;
  padding: 4px;
}

.time-col {
  height: calc(5 * 22px);
  overflow-y: auto;
  scrollbar-width: thin;
  min-width: 38px;
}

.time-opt {
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  cursor: pointer;
  border-radius: 4px;
  color: var(--text-secondary);
  transition: all 0.1s;
  padding: 0 4px;
}

.time-opt:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.time-opt.sel {
  background: var(--accent-primary);
  color: white;
  font-weight: 500;
}

.time-popup-sep {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 600;
  padding: 0 1px;
}

/* ── Priority buttons ── */
.priority-group {
  display: flex;
  flex-direction: row;
  gap: 3px;
  padding: 2px;
}

.priority-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 24px;
  border: none;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  padding: 0;
  opacity: 0.25;
  transition: all 0.15s ease;
}

.priority-btn:hover {
  opacity: 0.6;
}

.priority-btn.active {
  opacity: 1;
}

.p-bar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 3px;
  transition: transform 0.15s ease;
}

.priority-btn:hover .p-bar {
  transform: scaleY(1.05);
}

.priority-btn.active .p-bar {
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
}

/* ── Editor ── */
.popup-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 14px 0;
  min-height: 0;
}

.popup-title {
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-family);
  outline: none;
  padding: 0;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

.popup-title::placeholder {
  color: var(--text-placeholder);
  opacity: 0.5;
}

.popup-divider {
  height: 1px;
  background: var(--border-secondary);
  margin: 10px 0;
}

.popup-desc {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-family);
  outline: none;
  resize: none;
  padding: 0;
  line-height: 1.5;
  min-height: 40px;
}

.popup-desc::placeholder {
  color: var(--text-placeholder);
  opacity: 0.5;
}

/* ── Footer ── */
.popup-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-top: 1px solid var(--border-secondary);
  flex-shrink: 0;
}

.footer-label {
  font-size: 10px;
  color: var(--text-tertiary);
}

.footer-time {
  font-size: 10px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.confirm-btn {
  padding: 4px 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--accent-primary);
  color: #fff;
  font-size: 12px;
  font-family: var(--font-family);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  letter-spacing: 0.02em;
}

.confirm-btn:hover {
  opacity: 0.85;
}
</style>
