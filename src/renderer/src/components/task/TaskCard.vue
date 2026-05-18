<template>
  <div
    class="task-card"
    :class="{ completed: task.complete, overdue: isOverdue, [`priority-${task.priority}`]: true }"
    @click="uiStore.openEditor(task)"
    @contextmenu.prevent="onContextMenu"
  >
    <div class="priority-bar"></div>
    <div class="task-left">
      <TaskCheckbox :checked="!!task.complete" @toggle="onToggle" />
    </div>
    <div class="task-body">
      <div class="task-title">{{ task.title }}</div>
      <div v-if="task.description" class="task-desc">{{ task.description }}</div>
      <div class="task-meta">
        <span v-if="task.due_date" class="meta-date" :class="{ overdue: isOverdue }">
          <svg class="meta-clock" width="11" height="11" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          {{ formatDate(task.due_date) }}
        </span>
        <span
          v-for="tag in task.tags?.slice(0, 2)"
          :key="tag"
          class="meta-tag"
        >{{ tag }}</span>
      </div>
    </div>
    <span v-if="categoryInfo" class="task-category-badge" :style="{ color: categoryInfo.color }">
      <span class="cat-icon">{{ categoryInfo.icon }}</span>
      <span class="cat-name">{{ categoryInfo.name }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Task } from '@/types/task'
import { useTaskStore } from '@/stores/task'
import { useCategoryStore } from '@/stores/category'
import { useUIStore } from '@/stores/ui'
import TaskCheckbox from './TaskCheckbox.vue'

const props = defineProps<{ task: Task; contextMode?: 'default' | 'completed' }>()
const { t } = useI18n()
const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const uiStore = useUIStore()

const isOverdue = computed(() => {
  if (!props.task.due_date || props.task.complete) return false
  return props.task.due_date < Date.now()
})

const categoryInfo = computed(() => {
  if (!props.task.category_id) return null
  const cat = categoryStore.getCategoryById(props.task.category_id)
  if (!cat) return null
  return { icon: cat.icon, name: cat.name, color: cat.color }
})

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = (target.getTime() - today.getTime()) / 86400000
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const time = `${hh}:${mm}`

  if (diff === 0) return `${t('date.today')} ${time}`
  if (diff === 1) return `${t('date.tomorrow')} ${time}`
  if (diff === -1) return `${t('date.yesterday')} ${time}`
  return `${t('date.dateFormat', { m: d.getMonth() + 1, d: d.getDate() })} ${time}`
}

async function onToggle() {
  await taskStore.toggleComplete(props.task.task_id, !props.task.complete)
}

function closeAllMenus() {
  document.querySelectorAll('.context-menu').forEach(m => m.remove())
}

function onContextMenu(e: MouseEvent) {
  closeAllMenus()
  const menu = document.createElement('div')
  menu.className = 'context-menu'
  menu.style.left = e.clientX + 'px'
  menu.style.top = e.clientY + 'px'

  let html = ''
  if (props.contextMode === 'completed') {
    html += `<div class="ctx-item" data-action="restore">${t('common.restore')}</div>`
  }
  html += `<div class="ctx-item ctx-danger" data-action="delete">${t('task.deleteTask')}</div>`
  menu.innerHTML = html
  document.body.appendChild(menu)

  const handler = async (ev: MouseEvent) => {
    const target = ev.target as HTMLElement
    const action = target.getAttribute('data-action')
    closeAllMenus()
    if (action === 'delete') {
      await taskStore.removeTask(props.task.task_id)
      if (uiStore.editingTask?.task_id === props.task.task_id) {
        uiStore.closeEditor()
      }
    } else if (action === 'restore') {
      await taskStore.toggleComplete(props.task.task_id, false)
    }
  }

  menu.addEventListener('click', handler)

  const onClickOutside = () => {
    closeAllMenus()
    document.removeEventListener('click', onClickOutside)
  }
  setTimeout(() => document.addEventListener('click', onClickOutside), 0)
}
</script>

<style scoped>
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.task-card:hover {
  background: var(--bg-hover);
  box-shadow: var(--shadow-card-hover);
}

.task-card.completed {
  opacity: 0.5;
}

.task-card.completed .task-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.task-card.overdue .meta-date {
  color: var(--danger);
  font-weight: 500;
}

.task-left {
  padding-top: 3px;
  flex-shrink: 0;
}

.task-body {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: var(--font-md);
  color: var(--text-primary);
  line-height: 1.45;
  word-break: break-word;
  letter-spacing: 0.01em;
}

.task-desc {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  flex-wrap: wrap;
}

.meta-date {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.meta-clock {
  flex-shrink: 0;
}

.meta-date.overdue {
  color: var(--danger);
}

.meta-tag {
  font-size: 10.5px;
  color: var(--accent-primary);
  background: var(--accent-light);
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 500;
}

.task-category-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  margin-top: 3px;
  font-size: 10.5px;
  font-weight: 500;
}

.cat-icon {
  font-size: 12px;
  line-height: 1;
}

.cat-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
  transition: background var(--transition-fast);
}

.priority-0 .priority-bar {
  background: transparent;
}

.priority-1 .priority-bar {
  background: #FBBF24;
}

.priority-2 .priority-bar {
  background: #34D399;
}

.priority-3 .priority-bar {
  background: #F87171;
}
</style>

<style>
.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  min-width: 0;
}

.ctx-item {
  padding: 5px 12px;
  font-size: 12px;
  white-space: nowrap;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.1s;
}

.ctx-item:hover {
  background: var(--bg-hover);
}

.ctx-item.ctx-danger {
  color: var(--danger);
}

.ctx-item.ctx-danger:hover {
  background: var(--danger);
  color: white;
}
</style>
