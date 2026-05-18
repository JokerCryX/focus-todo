<template>
  <div class="view-page">
    <div class="view-header">
      <h2>{{ $t('nav.trash') }}</h2>
      <button v-if="taskStore.tasks.length > 0" class="clear-btn" @click="onEmptyTrash">{{ $t('task.clearTrash') }}</button>
    </div>
    <div class="trash-list" v-if="taskStore.tasks.length > 0">
      <div v-for="task in taskStore.tasks" :key="task.task_id" class="trash-item">
        <span class="trash-title">{{ task.title }}</span>
        <div class="trash-actions">
          <button class="action-btn restore" @click="onRestore(task.task_id)">{{ $t('common.restore') }}</button>
          <button class="action-btn delete" @click="onPermanentDelete(task.task_id)">{{ $t('task.permanentDelete') }}</button>
        </div>
      </div>
    </div>
    <div class="empty-wrap" v-else>
      <EmptyState icon="🗑️" :text="$t('task.emptyTrash')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import EmptyState from '@/components/common/EmptyState.vue'

const taskStore = useTaskStore()

onMounted(() => {
  taskStore.fetchTasks({ view: 'trash' })
})

async function onRestore(taskId: string) {
  await taskStore.restoreTask(taskId)
}

async function onPermanentDelete(taskId: string) {
  await taskStore.permanentDeleteTask(taskId)
}

async function onEmptyTrash() {
  await taskStore.emptyTrash()
}
</script>

<style scoped>
.view-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm);
  flex-shrink: 0;
}

.view-header h2 {
  font-size: var(--font-2xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.clear-btn {
  padding: 6px 14px;
  border: 1px solid var(--danger);
  color: var(--danger);
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background: var(--danger-light);
}

.trash-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-lg);
}

.empty-wrap {
  padding: var(--spacing-sm) var(--spacing-lg);
}

.trash-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-secondary);
}

.trash-title {
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.trash-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  padding: 4px 10px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn.restore {
  background: var(--accent-light);
  color: var(--accent-primary);
}

.action-btn.restore:hover {
  background: var(--accent-primary);
  color: white;
}

.action-btn.delete {
  background: var(--danger-light);
  color: var(--danger);
}

.action-btn.delete:hover {
  background: var(--danger);
  color: white;
}
</style>
