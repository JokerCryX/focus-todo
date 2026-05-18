<template>
  <div class="view-page">
    <div class="view-header">
      <h2>{{ $t('nav.recent') }}</h2>
    </div>
    <TaskQuickAdd :placeholder="$t('task.addRecent')" />
    <TaskList :tasks="taskStore.tasks" empty-icon="🕐" :empty-text="$t('task.emptyRecent')" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import TaskList from '@/components/task/TaskList.vue'
import TaskQuickAdd from '@/components/task/TaskQuickAdd.vue'

const taskStore = useTaskStore()

onMounted(() => {
  taskStore.fetchTasks({ view: 'recent' })
})
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
  font-size: var(--font-2xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}
</style>
