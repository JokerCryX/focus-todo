<template>
  <div class="view-page">
    <div class="view-header">
      <h2>{{ $t('nav.inbox') }}</h2>
    </div>
    <TaskQuickAdd :placeholder="$t('task.addInbox')" no-editor />
    <div class="inbox-list" v-if="taskStore.tasks.length > 0">
      <div class="inbox-group">
        <div class="group-header" @click="plannedOpen = !plannedOpen">
          <svg class="collapse-arrow" :class="{ open: plannedOpen }" width="10" height="10" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ $t('inbox.planned') }} ({{ plannedTasks.length }})
        </div>
        <Transition name="collapse">
          <div v-show="plannedOpen" class="drag-list">
            <div
              v-for="(task, index) in plannedTasks"
              :key="task.task_id"
              @mousedown="onItemMouseDown($event, index)"
              :class="{ 'drag-over': dragOverIndex === index && dragIndex !== index, 'drag-after': dragOverIndex === plannedTasks.length && index === plannedTasks.length - 1, 'dragging': dragIndex === index }"
            >
              <TaskCard :task="task" />
            </div>
          </div>
        </Transition>
      </div>
      <div class="inbox-group" v-if="readyTasks.length > 0">
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
    <EmptyState v-else icon="📥" :text="$t('task.emptyInbox')" :sub-text="$t('task.emptyInboxSub')" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import TaskCard from '@/components/task/TaskCard.vue'
import TaskQuickAdd from '@/components/task/TaskQuickAdd.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const taskStore = useTaskStore()

const plannedOpen = ref(true)
const readyOpen = ref(true)

const dragIndex = ref(-1)
const dragOverIndex = ref(-1)
let dragStartY = 0
let dragStarted = false

const plannedTasks = computed(() =>
  taskStore.tasks.filter(t => !t.due_date)
)

const readyTasks = computed(() =>
  taskStore.tasks.filter(t => !!t.due_date).sort((a, b) => a.due_date! - b.due_date!)
)

function loadTasks() {
  taskStore.fetchTasks({ view: 'inbox', sort_by: 'custom' })
}

onMounted(loadTasks)

function onItemMouseDown(e: MouseEvent, index: number) {
  if (e.button !== 0) return
  dragIndex.value = index
  dragStartY = e.clientY
  dragStarted = false
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (dragIndex.value === -1) return
  if (!dragStarted && Math.abs(e.clientY - dragStartY) < 5) return
  if (!dragStarted) dragStarted = true
  const container = document.querySelector('.drag-list')
  if (!container) return
  const items = [...container.querySelectorAll('.drag-list > div')]
  const mouseY = e.clientY
  let target = plannedTasks.value.length
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    if (mouseY < rect.top + rect.height / 2) {
      target = i
      break
    }
  }
  dragOverIndex.value = target
}

async function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  if (dragIndex.value !== -1 && dragStarted && dragOverIndex.value !== -1 && dragIndex.value !== dragOverIndex.value) {
    const reordered = [...plannedTasks.value]
    const [moved] = reordered.splice(dragIndex.value, 1)
    const insertIndex = dragOverIndex.value > dragIndex.value ? dragOverIndex.value - 1 : dragOverIndex.value
    reordered.splice(insertIndex, 0, moved)
    const updates: Promise<any>[] = []
    for (let i = 0; i < reordered.length; i++) {
      updates.push(window.api.task.update({ task_id: reordered[i].task_id, sort_order: i }))
    }
    await Promise.all(updates)
  }
  dragIndex.value = -1
  dragOverIndex.value = -1
  dragStarted = false
  loadTasks()
}
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

.inbox-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm) var(--spacing-lg);
  animation: fadeIn 0.25s var(--ease-out);
}

.inbox-group {
  margin-bottom: var(--spacing-md);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
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

.drag-list > div {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.drag-list > div.drag-over {
  border-top: 2px solid var(--accent-primary);
  padding-top: 6px;
}

.drag-list > div.drag-after {
  border-bottom: 2px solid var(--accent-primary);
  padding-bottom: 6px;
}

.drag-list > div.dragging {
  opacity: 0.4;
}
</style>
