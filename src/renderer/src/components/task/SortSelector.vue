<template>
  <div class="sort-selector" ref="selectorRef">
    <button class="sort-btn" @click="open = !open">
      <svg width="12" height="12" viewBox="0 0 16 16"><path d="M3 4h10M3 8h6M3 12h3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span>{{ currentLabel }}</span>
    </button>
    <div v-if="open" class="sort-dropdown">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="sort-option"
        :class="{ active: modelValue === opt.value }"
        @click="select(opt.value)"
      >{{ opt.label }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const selectorRef = ref<HTMLElement>()
const { t } = useI18n()

const options = computed(() => [
  { value: 'reminder', label: t('sort.reminder') },
  { value: 'created_desc', label: t('sort.createdDesc') },
  { value: 'created_asc', label: t('sort.createdAsc') },
  { value: 'priority_desc', label: t('sort.priorityDesc') },
  { value: 'priority_asc', label: t('sort.priorityAsc') },
  { value: 'due_date', label: t('sort.dueDate') },
  { value: 'complete', label: t('sort.complete') },
  { value: 'custom', label: t('sort.custom') }
])

const currentLabel = computed(() => {
  return options.value.find(o => o.value === props.modelValue)?.label || t('sort.label')
})

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (selectorRef.value && !selectorRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.sort-selector {
  position: relative;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  font-size: var(--font-xs);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.sort-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.sort-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-dropdown, 0 4px 16px rgba(0,0,0,0.12));
  z-index: 100;
  min-width: 180px;
  padding: 4px;
  animation: fadeIn 0.15s var(--ease-out);
}

.sort-option {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  padding: 7px 10px;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.sort-option:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sort-option.active {
  color: var(--accent-primary);
  font-weight: 500;
}
</style>
