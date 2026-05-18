<template>
  <div class="view-page">
    <div class="view-header">
      <h2>{{ $t('nav.today') }}</h2>
      <SortSelector v-model="sortBy" />
    </div>
    <TaskQuickAdd :placeholder="$t('task.addToday')" :default-due-date="todayTimestamp" />
    <TaskList :tasks="taskStore.tasks" empty-icon="☀️" :empty-text="$t('task.emptyToday')" :empty-sub-text="$t('task.emptyTodaySub')" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useSettingsStore } from '@/stores/settings'
import TaskList from '@/components/task/TaskList.vue'
import TaskQuickAdd from '@/components/task/TaskQuickAdd.vue'
import SortSelector from '@/components/task/SortSelector.vue'

const taskStore = useTaskStore()
const settingsStore = useSettingsStore()
const sortBy = ref(settingsStore.defaultSort)

const todayTimestamp = computed(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime()
})

function loadTasks() {
  taskStore.fetchTasks({ view: 'today', sort_by: sortBy.value })
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
</style>
