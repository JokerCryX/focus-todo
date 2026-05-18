<template>
  <span v-if="priority > 0" class="priority-badge" :class="`p${priority}`">
    {{ labels[priority] }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{ priority: number }>()

const { t } = useI18n()

const labels = computed<Record<number, string>>(() => ({
  1: t('task.priorityDaily'),
  2: t('task.priorityImportant'),
  3: t('task.priorityUrgent')
}))
</script>

<style scoped>
.priority-badge {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.p1 { color: #6B7280; background: rgba(107, 114, 128, 0.1); }
.p2 { color: #F59E0B; background: rgba(245, 158, 11, 0.1); }
.p3 { color: #EF4444; background: rgba(239, 68, 68, 0.1); }
</style>
