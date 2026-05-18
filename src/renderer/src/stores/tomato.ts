import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type Phase = 'idle' | 'focus' | 'shortBreak' | 'longBreak'

export const useTomatoStore = defineStore('tomato', () => {
  const phase = ref<Phase>('idle')
  const totalSeconds = ref(25 * 60)
  const remainingSeconds = ref(25 * 60)
  const isRunning = ref(false)
  const completedCount = ref(0)
  const linkedTaskId = ref<string | null>(null)
  const linkedTaskTitle = ref<string | null>(null)

  const focusDuration = ref(25)
  const shortBreakDuration = ref(5)
  const longBreakDuration = ref(15)
  const longBreakInterval = ref(4)

  const todayCount = ref(0)
  const todayMinutes = ref(0)

  let timerId: ReturnType<typeof setInterval> | null = null

  const progress = computed(() => {
    if (totalSeconds.value === 0) return 0
    return 1 - remainingSeconds.value / totalSeconds.value
  })

  const phaseLabel = computed(() => {
    switch (phase.value) {
      case 'focus': return '专注中'
      case 'shortBreak': return '短休息'
      case 'longBreak': return '长休息'
      default: return '就绪'
    }
  })

  const displayTime = computed(() => {
    const m = Math.floor(remainingSeconds.value / 60)
    const s = remainingSeconds.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  function startFocus() {
    phase.value = 'focus'
    totalSeconds.value = focusDuration.value * 60
    remainingSeconds.value = totalSeconds.value
    startTimer()
  }

  function startBreak(isLong: boolean) {
    phase.value = isLong ? 'longBreak' : 'shortBreak'
    const duration = isLong ? longBreakDuration.value : shortBreakDuration.value
    totalSeconds.value = duration * 60
    remainingSeconds.value = totalSeconds.value
    startTimer()
  }

  function startTimer() {
    stopTimer()
    isRunning.value = true
    timerId = setInterval(() => {
      remainingSeconds.value--
      if (remainingSeconds.value <= 0) {
        stopTimer()
        onPhaseComplete()
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    isRunning.value = false
  }

  function togglePause() {
    if (isRunning.value) {
      stopTimer()
    } else {
      startTimer()
    }
  }

  function reset() {
    stopTimer()
    phase.value = 'idle'
    remainingSeconds.value = totalSeconds.value
  }

  async function skip() {
    stopTimer()
    await onPhaseComplete()
  }

  async function onPhaseComplete() {
    if (phase.value === 'focus') {
      completedCount.value++
      await recordTomato()
      await refreshStats()
      const isLong = completedCount.value % longBreakInterval.value === 0
      startBreak(isLong)
    } else {
      phase.value = 'idle'
      isRunning.value = false
    }
  }

  async function recordTomato() {
    const duration = focusDuration.value
    const now = Date.now()
    await window.api.tomato.create({
      start_time: now - duration * 60 * 1000,
      end_time: now,
      focus_duration: duration,
      rest_duration: 0,
      is_focus: 1,
      task_id: linkedTaskId.value,
      task_title: linkedTaskTitle.value
    })
  }

  async function refreshStats() {
    todayCount.value = await window.api.tomato.todayCount()
    todayMinutes.value = await window.api.tomato.todayFocusMinutes()
  }

  function linkTask(taskId: string | null, taskTitle: string | null) {
    linkedTaskId.value = taskId
    linkedTaskTitle.value = taskTitle
  }

  return {
    phase, totalSeconds, remainingSeconds, isRunning, completedCount,
    focusDuration, shortBreakDuration, longBreakDuration, longBreakInterval,
    todayCount, todayMinutes, linkedTaskId, linkedTaskTitle,
    progress, phaseLabel, displayTime,
    startFocus, startBreak, togglePause, reset, skip, linkTask, refreshStats
  }
})
