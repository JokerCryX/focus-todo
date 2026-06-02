import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilter } from '@/types/task'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const currentFilter = ref<TaskFilter>({ view: 'inbox' })

  const soundCache: Record<string, string> = {}
  const audioBufferCache: Record<string, AudioBuffer> = {}
  const fallbackKeys = new Set<string>()
  let audioCtx: AudioContext | null = null

  const remindedIds = new Set<string>()
  let reminderTimer: ReturnType<typeof setInterval> | null = null

  async function loadSoundCache() {
    const keys = ['sound_new', 'sound_complete', 'sound_remove', 'sound_reminder']
    const results = await Promise.all(keys.map(k => window.api.settings.get(k)))
    const entries: [string, string][] = []
    keys.forEach((k, i) => {
      const file = (results[i] as string) || ''
      soundCache[k] = file
      if (file) entries.push([k, file])
    })
    fallbackKeys.clear()
    if (entries.length > 0) {
      audioCtx = new AudioContext()
      const buffers = await Promise.all(entries.map(([, f]) => window.api.sound.buffer(f)))
      for (let i = 0; i < entries.length; i++) {
        try {
          const ab = (buffers[i] as ArrayBuffer).slice(0)
          audioBufferCache[entries[i][0]] = await audioCtx.decodeAudioData(ab)
        } catch {
          fallbackKeys.add(entries[i][0])
        }
      }
    }
  }

  function playSound(key: string) {
    if (fallbackKeys.has(key)) {
      const file = soundCache[key]
      if (file) window.api.sound.play(file)
      return
    }
    const buffer = audioBufferCache[key]
    if (!buffer) return
    if (!audioCtx) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.connect(audioCtx.destination)
    source.start(0)
  }

  loadSoundCache()

  function checkReminders() {
    const now = Date.now()
    const cutoff = now - 60000
    const taskMap = new Map(tasks.value.map(t => [t.task_id, t]))
    for (const t of tasks.value) {
      if (t.complete || !t.due_date) continue
      if (t.due_date > now || t.due_date <= cutoff) continue
      if (remindedIds.has(t.task_id)) continue
      remindedIds.add(t.task_id)
      playSound('sound_reminder')
    }
    for (const id of remindedIds) {
      const task = taskMap.get(id)
      if (!task || task.complete) remindedIds.delete(id)
    }
  }

  function startReminderCheck() {
    if (reminderTimer) return
    reminderTimer = setInterval(checkReminders, 30000)
  }

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
      startReminderCheck()
    }
  }

  async function createTask(input: CreateTaskInput): Promise<Task> {
    const task = (await window.api.task.create(input)) as Task
    playSound('sound_new')
    fetchTasks()
    return task
  }

  async function updateTask(input: UpdateTaskInput): Promise<Task> {
    const task = (await window.api.task.update(input)) as Task
    if (input.complete === 1) playSound('sound_complete')
    fetchTasks()
    return task
  }

  async function toggleComplete(taskId: string, complete: boolean) {
    await window.api.task.update({ task_id: taskId, complete: complete ? 1 : 0 })
    if (complete) playSound('sound_complete')
    fetchTasks()
  }

  async function removeTask(taskId: string) {
    await window.api.task.remove(taskId)
    playSound('sound_remove')
    fetchTasks()
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
