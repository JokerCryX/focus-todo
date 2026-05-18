<template>
  <div class="view-page stats-page">
    <div class="view-header">
      <h2>{{ $t('statistics.title') }}</h2>
      <div class="tab-bar">
        <button :class="{ active: activeTab === 'task' }" @click="activeTab = 'task'">{{ $t('statistics.taskTab') }}</button>
        <button :class="{ active: activeTab === 'tomato' }" @click="activeTab = 'tomato'">{{ $t('statistics.tomatoTab') }}</button>
      </div>
    </div>
    <div class="stats-scroll">
      <div v-if="statsStore.loading" class="stats-loading">{{ $t('common.loading') }}</div>
      <template v-else>
        <TaskStatistics v-if="activeTab === 'task'" />
        <TomatoStatistics v-else />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useStatisticsStore } from '@/stores/statistics'
import TaskStatistics from './statistics/TaskStatistics.vue'
import TomatoStatistics from './statistics/TomatoStatistics.vue'

const statsStore = useStatisticsStore()
const activeTab = ref<'task' | 'tomato'>('task')

function onTomatoCompleted() {
  statsStore.loadAll()
}

onMounted(() => {
  statsStore.loadAll()
  window.api.on('tomato:completed', onTomatoCompleted)
})

onUnmounted(() => {
  window.api.removeListener?.('tomato:completed', onTomatoCompleted)
})
</script>

<style scoped>
.view-header {
  padding: var(--spacing-lg) var(--spacing-lg) 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-header h2 {
  font-size: var(--font-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.tab-bar {
  display: flex;
  gap: 2px;
  background: var(--bg-tertiary);
  padding: 2px;
  border-radius: var(--radius-md);
}

.tab-bar button {
  padding: 5px 16px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: 500;
}

.tab-bar button.active {
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.stats-scroll {
  flex: 1;
  overflow-y: auto;
}

.stats-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-tertiary);
  font-size: var(--font-md);
}
</style>
