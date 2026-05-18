<template>
  <div class="view-page">
    <div class="view-header">
      <h2>{{ categoryIcon }} {{ categoryName }}</h2>
      <SortSelector v-model="sortBy" />
    </div>
    <TaskQuickAdd :default-category-id="categoryId" :placeholder="addCategoryPlaceholder" />
    <div class="category-list" v-if="taskStore.tasks.length > 0">
      <div class="category-group">
        <div class="group-header" @click="plannedOpen = !plannedOpen">
          <svg class="collapse-arrow" :class="{ open: plannedOpen }" width="10" height="10" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ $t('inbox.planned') }} ({{ plannedTasks.length }})
        </div>
        <Transition name="collapse">
          <div v-show="plannedOpen">
            <TaskCard v-for="task in plannedTasks" :key="task.task_id" :task="task" />
          </div>
        </Transition>
      </div>
      <div class="category-group" v-if="readyTasks.length > 0">
        <div class="group-header" @click="readyOpen = !readyOpen">
          <svg class="collapse-arrow" :class="{ open: readyOpen }" width="10" height="10" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ $t('inbox.ready') }} ({{ readyTasks.length }})
        </div>
        <Transition name="collapse">
          <div v-show="readyOpen">
            <TaskCard v-for="task in readyTasks" :key="task.task_id" :task="task" />
          </div>
        </Transition>
      </div>
    </div>
    <EmptyState v-else icon="📂" :text="$t('task.emptyCategory')" :sub-text="$t('task.emptyCategorySub')" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTaskStore } from '@/stores/task'
import { useCategoryStore } from '@/stores/category'
import { useSettingsStore } from '@/stores/settings'
import TaskCard from '@/components/task/TaskCard.vue'
import TaskQuickAdd from '@/components/task/TaskQuickAdd.vue'
import SortSelector from '@/components/task/SortSelector.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const { t } = useI18n()
const route = useRoute()
const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()
const sortBy = ref(settingsStore.defaultSort)

const plannedOpen = ref(true)
const readyOpen = ref(true)

const categoryId = computed(() => Number(route.params.id))
const category = computed(() => categoryStore.getCategoryById(categoryId.value))
const categoryName = computed(() => category.value?.name || t('nav.categories'))
const categoryIcon = computed(() => category.value?.icon || '📂')
const addCategoryPlaceholder = computed(() => t('task.addCategory', { name: categoryName.value }))

const plannedTasks = computed(() =>
  taskStore.tasks.filter(t => !t.due_date)
)

const readyTasks = computed(() =>
  taskStore.tasks.filter(t => !!t.due_date)
)

function loadTasks() {
  taskStore.fetchTasks({ view: 'category', category_id: categoryId.value, sort_by: sortBy.value })
}

watch(sortBy, (val) => {
  settingsStore.setDefaultSort(val)
  loadTasks()
})

onMounted(loadTasks)
watch(() => route.params.id, loadTasks)
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
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.category-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm) var(--spacing-lg);
  animation: fadeIn 0.25s var(--ease-out);
}

.category-group {
  margin-bottom: var(--spacing-md);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  padding: var(--spacing-sm) 4px;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  user-select: none;
  transition: color var(--transition-fast);
}

.group-header:hover {
  color: var(--text-secondary);
}

.collapse-arrow {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.collapse-arrow.open {
  transform: rotate(90deg);
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
}
</style>
