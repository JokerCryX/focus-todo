<template>
  <div class="task-group">
    <div class="group-header">{{ label }}</div>
    <TaskCard
      v-for="task in tasks"
      :key="task.task_id"
      :task="task"
      :context-mode="contextMode"
    />
  </div>
</template>

<script setup lang="ts">
import type { Task } from '@/types/task'
import TaskCard from './TaskCard.vue'

defineProps<{ label: string; tasks: Task[]; contextMode?: 'default' | 'completed' }>()
</script>

<style scoped>
.task-group {
  margin-bottom: var(--spacing-md);
}

.group-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  padding: var(--spacing-sm) 4px;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
</style>
