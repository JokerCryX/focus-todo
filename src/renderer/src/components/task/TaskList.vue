<template>
  <div class="task-list">
    <TaskGroup
      v-for="group in groupedTasks"
      :key="group.label"
      :label="group.label"
      :tasks="group.tasks"
      :context-mode="contextMode"
    />
    <EmptyState
      v-if="tasks.length === 0"
      :icon="emptyIcon"
      :text="emptyText"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Task } from '@/types/task'
import TaskGroup from './TaskGroup.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps<{
  tasks: Task[]
  emptyIcon?: string
  emptyText?: string
  emptySubText?: string
  contextMode?: 'default' | 'completed'
}>()

const { t } = useI18n()

interface TaskGroup {
  label: string
  tasks: Task[]
}

const groupedTasks = computed<TaskGroup[]>(() => {
  if (props.tasks.length === 0) return []

  if (props.contextMode === 'completed') {
    return [{ label: '', tasks: props.tasks }]
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86400000)
  const dayAfter = new Date(today.getTime() + 86400000 * 2)

  const groups: Record<string, Task[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    upcoming: [],
    other: []
  }

  for (const task of props.tasks) {
    if (!task.due_date) {
      groups.other.push(task)
      continue
    }
    const due = new Date(task.due_date)
    if (due < today) {
      groups.overdue.push(task)
    } else if (due < tomorrow) {
      groups.today.push(task)
    } else if (due < dayAfter) {
      groups.tomorrow.push(task)
    } else {
      groups.upcoming.push(task)
    }
  }

  const result: TaskGroup[] = []
  const labelMap: Record<string, string> = {
    overdue: t('task.overdue'),
    today: t('nav.today'),
    tomorrow: t('task.tomorrow'),
    upcoming: t('task.upcoming'),
    other: t('task.noDueDate')
  }

  for (const [key, label] of Object.entries(labelMap)) {
    if (groups[key].length > 0) {
      result.push({ label: `${label} (${groups[key].length})`, tasks: groups[key] })
    }
  }

  return result
})
</script>

<style scoped>
.task-list {
  padding: var(--spacing-sm) var(--spacing-lg);
  animation: fadeIn 0.25s var(--ease-out);
}
</style>
