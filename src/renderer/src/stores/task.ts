import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilter } from '@/types/task'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const currentFilter = ref<TaskFilter>({ view: 'inbox' })

  const soundCache: Record<string, string> = {}

  async function loadSoundCache() {
    const keys = ['sound_new', 'sound_complete', 'sound_remove']
    const results = await Promise.all(keys.map(k => window.api.settings.get(k)))
    keys.forEach((k, i) => { soundCache[k] = (results[i] as string) || '' })
  }

  function playSound(key: string) {
    const file = soundCache[key]
    if (file) window.api.sound.play(file)
  }

  loadSoundCache()

  async function fetchTasks(filter?: Partial<TaskFilter>) {
    loading.value = true
    try {
      const f = { ...currentFilter.value, ...filter }
      currentFilter.value = f
      const result = await window.api.task.list(f)
      tasks.value = result as Task[]
      window.api.send('task:changed')
    } finally {
      loading.value = false
    }
  }

  async function createTask(input: CreateTaskInput): Promise<Task> {
    const task = (await window.api.task.create(input)) as Task
    await fetchTasks()
    playSound('sound_new')
    return task
  }

  async function updateTask(input: UpdateTaskInput): Promise<Task> {
    const task = (await window.api.task.update(input)) as Task
    await fetchTasks()
    if (input.complete === 1) playSound('sound_complete')
    return task
  }

  async function toggleComplete(taskId: string, complete: boolean) {
    await window.api.task.update({ task_id: taskId, complete: complete ? 1 : 0 })
    await fetchTasks()
    if (complete) playSound('sound_complete')
  }

  async function removeTask(taskId: string) {
    await window.api.task.remove(taskId)
    await fetchTasks()
    playSound('sound_remove')
  }

  async function restoreTask(taskId: string) {
    await window.api.task.restore(taskId)
    await fetchTasks()
  }

  async function permanentDeleteTask(taskId: string) {
    await window.api.task.permanentDelete(taskId)
    await fetchTasks()
  }

  async function emptyTrash() {
    await window.api.task.emptyTrash()
    await fetchTasks()
  }

  async function batchComplete(taskIds: string[]) {
    await window.api.task.batchUpdate(taskIds, { complete: 1 })
    await fetchTasks()
  }

  async function batchRemove(taskIds: string[]) {
    await window.api.task.batchRemove(taskIds)
    await fetchTasks()
  }

  async function batchMoveCategory(taskIds: string[], categoryId: number | null) {
    await window.api.task.batchUpdate(taskIds, { category_id: categoryId })
    await fetchTasks()
  }

  return {
    tasks,
    loading,
    currentFilter,
    fetchTasks,
    createTask,
    updateTask,
    toggleComplete,
    removeTask,
    restoreTask,
    permanentDeleteTask,
    emptyTrash,
    batchComplete,
    batchRemove,
    batchMoveCategory,
    loadSoundCache
  }
})
