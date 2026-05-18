<template>
  <div class="batch-bar" v-if="uiStore.batchMode && uiStore.selectedTaskIds.length > 0">
    <span class="batch-count">{{ $t('task.selected', { count: uiStore.selectedTaskIds.length }) }}</span>
    <div class="batch-actions">
      <button class="batch-btn" @click="batchComplete">{{ $t('task.markComplete') }}</button>
      <button class="batch-btn danger" @click="batchDelete">{{ $t('common.delete') }}</button>
      <button class="batch-btn" @click="uiStore.clearSelection()">{{ $t('common.cancel') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTaskStore } from '@/stores/task'
import { useUIStore } from '@/stores/ui'

const taskStore = useTaskStore()
const uiStore = useUIStore()

async function batchComplete() {
  await taskStore.batchComplete([...uiStore.selectedTaskIds])
  uiStore.clearSelection()
}

async function batchDelete() {
  await taskStore.batchRemove([...uiStore.selectedTaskIds])
  uiStore.clearSelection()
}
</script>

<style scoped>
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--accent-light);
  border-top: 1px solid var(--accent-primary);
}

.batch-count {
  font-size: var(--font-sm);
  color: var(--accent-primary);
  font-weight: 500;
}

.batch-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.batch-btn {
  padding: 4px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.batch-btn:hover {
  background: var(--bg-tertiary);
}

.batch-btn.danger {
  color: var(--danger);
}

.batch-btn.danger:hover {
  background: var(--danger-light);
}
</style>
