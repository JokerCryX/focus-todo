<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog">
      <h3>{{ $t(isEdit ? 'category.editTitle' : 'category.newTitle') }}</h3>
      <div class="form-group">
        <label>{{ $t('category.name') }}</label>
        <input v-model="form.name" :placeholder="$t('category.namePlaceholder')" maxlength="20" />
      </div>
      <div class="form-group">
        <label>{{ $t('category.color') }}</label>
        <div class="color-picker">
          <div
            v-for="c in presetColors"
            :key="c"
            class="color-dot"
            :class="{ active: form.color === c }"
            :style="{ background: c }"
            @click="form.color = c"
          />
        </div>
      </div>
      <div class="form-group">
        <label>{{ $t('category.icon') }}</label>
        <div class="icon-picker">
          <span
            v-for="icon in presetIcons"
            :key="icon"
            class="icon-option"
            :class="{ active: form.icon === icon }"
            @click="form.icon = icon"
          >{{ icon }}</span>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn-cancel" @click="$emit('close')">{{ $t('common.cancel') }}</button>
        <button class="btn-primary" @click="save" :disabled="!form.name.trim()">{{ $t('common.save') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useCategoryStore } from '@/stores/category'
import type { Category } from '@/types/category'

const props = defineProps<{ category?: Category | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const categoryStore = useCategoryStore()

const isEdit = computed(() => !!props.category)

const presetColors = [
  '#4A90D9', '#F5A623', '#7ED321', '#D0021B',
  '#9013FE', '#50E3C2', '#F8E71C', '#BD10E0',
  '#417505', '#8B572A', '#4990E2', '#E8734A'
]
const presetIcons = [
  '💼', '📚', '🏠', '❤️', '🎯', '🎮', '🎵', '✈️',
  '💡', '🔧', '📱', '🛒', '🎬', '📷', '🏆', '🌟',
  '📝', '💻', '🎨', '🌺'
]

const form = reactive({
  name: props.category?.name || '',
  color: props.category?.color || '#4A90D9',
  icon: props.category?.icon || '📁'
})

async function save() {
  if (!form.name.trim()) return
  const data = { name: form.name, color: form.color, icon: form.icon }
  if (props.category) {
    await categoryStore.updateCategory({ id: props.category.id, ...data })
  } else {
    await categoryStore.createCategory(data)
  }
  emit('saved')
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  width: 360px;
  box-shadow: var(--shadow-lg);
}

.dialog h3 {
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-lg);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.form-group input {
  width: 100%;
  padding: 8px var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  transition: border-color var(--transition-fast);
}

.form-group input:focus {
  border-color: var(--border-active);
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}

.color-dot.active {
  border-color: var(--text-primary);
  transform: scale(1.15);
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-option {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: 18px;
  transition: all var(--transition-fast);
}

.icon-option:hover {
  background: var(--bg-hover);
}

.icon-option.active {
  border-color: var(--accent-primary);
  background: var(--accent-light);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.btn-cancel, .btn-primary {
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-size: var(--font-sm);
  transition: all var(--transition-fast);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
