<template>
  <div class="quick-add">
    <button class="plus-icon" @click="addTask">+</button>
    <input
      v-model="title"
      :placeholder="placeholder"
      @keydown.enter="addTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useUIStore } from '@/stores/ui'

const props = defineProps<{
  placeholder?: string
  defaultCategoryId?: number | null
  defaultDueDate?: number | null
  noEditor?: boolean
}>()

const taskStore = useTaskStore()
const uiStore = useUIStore()
const title = ref('')

async function addTask() {
  const trimmed = title.value.trim()
  if (!trimmed) return

  const task = await taskStore.createTask({
    title: trimmed,
    category_id: props.defaultCategoryId ?? undefined,
    due_date: props.defaultDueDate ?? undefined
  })
  title.value = ''
  if (!props.noEditor) {
    uiStore.openEditor(task)
  }
}
</script>

<style scoped>
.quick-add {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px var(--spacing-lg);
  border-bottom: 1px solid var(--border-secondary);
  background: var(--bg-primary);
}

.plus-icon {
  color: var(--accent-primary);
  font-size: 16px;
  font-weight: 300;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.7;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.plus-icon:hover {
  opacity: 1;
  background: var(--accent-light);
}

.quick-add input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--font-sm);
  padding: 5px 0;
  color: var(--text-secondary);
  letter-spacing: 0.01em;
}

.quick-add input:focus {
  color: var(--text-primary);
}
</style>
