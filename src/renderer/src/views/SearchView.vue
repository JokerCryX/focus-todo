<template>
  <div class="view-page">
    <div class="view-header">
      <h2>{{ $t('search.title') }}</h2>
      <div class="search-box">
        <input
          v-model="query"
          type="text"
          :placeholder="$t('search.placeholder')"
          class="search-input"
          @input="onInput"
        />
      </div>
    </div>
    <div v-if="query && filteredTasks.length === 0" class="empty-hint">
      {{ $t('search.noResult') }}
    </div>
    <div v-if="query && filteredTasks.length > 0" class="result-count">
      {{ $t('search.resultCount', { count: filteredTasks.length }) }}
    </div>
    <div v-if="query" class="search-results">
      <div
        v-for="task in filteredTasks"
        :key="task.task_id"
        class="search-task-card"
        @click="uiStore.openEditor(task)"
      >
        <div class="search-task-title" v-html="highlight(task.title)" />
        <div v-if="task.description" class="search-task-desc" v-html="highlight(task.description)" />
        <div class="search-task-meta">
          <span v-if="task.due_date" class="meta-date">{{ formatDate(task.due_date) }}</span>
          <TaskPriorityBadge v-if="task.priority > 0" :priority="task.priority" />
          <span v-for="tag in task.tags?.slice(0, 2)" :key="tag" class="meta-tag">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUIStore } from '@/stores/ui'
import { pinyin } from 'pinyin-pro'
import TaskPriorityBadge from '@/components/task/TaskPriorityBadge.vue'
import type { Task } from '@/types/task'

const { t } = useI18n()
const uiStore = useUIStore()
const query = ref('')
const allTasks = ref<Task[]>([])

let timer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (timer) clearTimeout(timer)
  const q = query.value.trim()
  if (!q) {
    allTasks.value = []
    return
  }
  timer = setTimeout(async () => {
    allTasks.value = await window.api.task.searchAll()
  }, 300)
}

function toPinyin(text: string): string {
  return pinyin(text, { toneType: 'none', type: 'array' }).join('').toLowerCase()
}

function fuzzyScore(source: string, target: string): number {
  const s = source.toLowerCase()
  const t = target.toLowerCase()
  if (s === t) return 1
  if (s.includes(t)) return 0.9
  let si = 0
  for (let ti = 0; ti < t.length && si < s.length; si++) {
    if (s[si] === t[ti]) ti++
  }
  const matched = si <= s.length
  return matched ? 0.6 * (t.length / s.length) : 0
}

function matchTask(task: Task, keyword: string): boolean {
  const fields = [task.title, task.description || '', ...(task.subtasks?.map(s => s.title) || [])]
  for (const field of fields) {
    if (field.toLowerCase().includes(keyword.toLowerCase())) return true
    if (toPinyin(field).includes(keyword.toLowerCase())) return true
    if (fuzzyScore(field, keyword) >= 0.6) return true
  }
  return false
}

const filteredTasks = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q || allTasks.value.length === 0) return []
  return allTasks.value.filter(t => matchTask(t, q)).slice(0, 50)
})

function highlight(text: string): string {
  const q = query.value.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return t('date.dateFormat', { m: d.getMonth() + 1, d: d.getDate() })
}
</script>

<style scoped>
.view-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm);
  flex-shrink: 0;
}

.view-header h2 {
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.search-box {
  margin-top: var(--spacing-xs);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-md);
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--accent-primary);
}

.result-count {
  padding: 0 var(--spacing-lg);
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-sm);
}

.empty-hint {
  text-align: center;
  color: var(--text-tertiary);
  padding: var(--spacing-xl);
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-lg);
}

.search-task-card {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.search-task-card:hover {
  background: var(--bg-hover);
}

.search-task-title {
  font-size: var(--font-md);
  color: var(--text-primary);
  line-height: 1.45;
}

.search-task-desc {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.meta-date {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.meta-tag {
  font-size: 10.5px;
  color: var(--accent-primary);
  background: var(--accent-light);
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 500;
}
</style>

<style>
.search-highlight {
  background: rgba(245, 158, 11, 0.25);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}
</style>
