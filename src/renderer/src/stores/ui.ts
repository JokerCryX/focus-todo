import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task } from '@/types/task'

export const useUIStore = defineStore('ui', () => {
  const editorVisible = ref(false)
  const editingTask = ref<Task | null>(null)
  const batchMode = ref(false)
  const selectedTaskIds = ref<string[]>([])
  const searchQuery = ref('')
  const focusNoteMode = ref(false)

  function openEditor(task: Task) {
    editingTask.value = task
    editorVisible.value = true
  }

  function closeEditor() {
    editorVisible.value = false
    editingTask.value = null
  }

  function toggleBatchMode() {
    batchMode.value = !batchMode.value
    if (!batchMode.value) {
      selectedTaskIds.value = []
    }
  }

  function toggleTaskSelection(taskId: string) {
    const idx = selectedTaskIds.value.indexOf(taskId)
    if (idx === -1) {
      selectedTaskIds.value.push(taskId)
    } else {
      selectedTaskIds.value.splice(idx, 1)
    }
  }

  function clearSelection() {
    selectedTaskIds.value = []
    batchMode.value = false
  }

  function toggleFocusNote() {
    focusNoteMode.value = !focusNoteMode.value
  }

  return {
    editorVisible,
    editingTask,
    batchMode,
    selectedTaskIds,
    searchQuery,
    openEditor,
    closeEditor,
    toggleBatchMode,
    toggleTaskSelection,
    clearSelection,
    focusNoteMode,
    toggleFocusNote
  }
})
