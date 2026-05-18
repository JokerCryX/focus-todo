<template>
  <div class="view-page">
    <div class="view-header">
      <h2>{{ $t('nav.completed') }}</h2>
      <div class="header-actions">
        <SortSelector v-model="sortBy" />
        <button v-if="taskStore.tasks.length > 0" class="clear-btn" @click="clearAll">{{ $t('task.clearCompleted') }}</button>
      </div>
    </div>
    <TaskList :tasks="taskStore.tasks" empty-icon="✅" :empty-text="$t('task.emptyCompleted')" context-mode="completed" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTaskStore } from '@/stores/task'
import { useSettingsStore } from '@/stores/settings'
import TaskList from '@/components/task/TaskList.vue'
import SortSelector from '@/components/task/SortSelector.vue'

const taskStore = useTaskStore()
const settingsStore = useSettingsStore()
const { t } = useI18n()
const sortBy = ref(settingsStore.defaultSort)

async function clearAll() {
  const ids = taskStore.tasks.map(t => t.task_id)
  if (ids.length === 0) return
  await taskStore.batchRemove(ids)
}

function loadTasks() {
  taskStore.fetchTasks({ view: 'completed', sort_by: sortBy.value })
}

watch(sortBy, (val) => {
  settingsStore.setDefaultSort(val)
  loadTasks()
})

onMounted(loadTasks)
</script>

<style scoped>
.view-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.view-header h2 {
  font-size: var(--font-2xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.clear-btn {
  padding: 5px 12px;
  border: 1px solid var(--danger);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--danger);
  font-size: var(--font-xs);
  cursor: pointer;
  font-family: var(--font-family);
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background: var(--danger);
  color: white;
}
</style>
