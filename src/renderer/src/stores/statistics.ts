import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStatisticsStore = defineStore('statistics', () => {
  // Task statistics
  const completionTrend = ref<{ date: string; count: number }[]>([])
  const creationTrend = ref<{ date: string; count: number }[]>([])
  const completionRate = ref<{ completed: number; total: number }>({ completed: 0, total: 0 })
  const categoryDistribution = ref<{ category_id: number; name: string; color: string; count: number }[]>([])
  const priorityDistribution = ref<{ priority: number; count: number }[]>([])
  const overdueCount = ref(0)
  const taskWeekComparison = ref<{ thisWeek: number; lastWeek: number }>({ thisWeek: 0, lastWeek: 0 })
  const cumulativeCompletion = ref<{ date: string; total: number }[]>([])

  // Tomato statistics
  const todayTomatoCount = ref(0)
  const todayFocusMinutes = ref(0)
  const streak = ref(0)
  const tomatoTrend = ref<{ date: string; count: number; minutes: number }[]>([])
  const tomatoWeekComparison = ref<{ thisWeek: { count: number; minutes: number }; lastWeek: { count: number; minutes: number } }>({
    thisWeek: { count: 0, minutes: 0 },
    lastWeek: { count: 0, minutes: 0 }
  })
  const monthlyHeatmap = ref<{ date: string; count: number }[]>([])

  const loading = ref(false)

  async function loadAll() {
    loading.value = true
    try {
      const [
        _completionTrend,
        _creationTrend,
        _completionRate,
        _categoryDist,
        _priorityDist,
        _overdue,
        _taskWeekComp,
        _cumulative,
        _todayCount,
        _todayMinutes,
        _streak,
        _tomatoTrend,
        _tomatoWeekComp,
        _heatmap
      ] = await Promise.all([
        window.api.stats.taskCompletionTrend(30),
        window.api.stats.taskCreationTrend(30),
        window.api.stats.taskCompletionRate(),
        window.api.stats.taskCategoryDistribution(),
        window.api.stats.taskPriorityDistribution(),
        window.api.stats.taskOverdueCount(),
        window.api.stats.taskWeekComparison(),
        window.api.stats.taskCumulativeCompletion(),
        window.api.tomato.todayCount(),
        window.api.tomato.todayFocusMinutes(),
        window.api.stats.tomatoStreak(),
        window.api.tomato.recentDays(30),
        window.api.stats.tomatoWeeklyComparison(),
        window.api.stats.tomatoMonthlyHeatmap()
      ])

      completionTrend.value = _completionTrend
      creationTrend.value = _creationTrend
      completionRate.value = _completionRate
      categoryDistribution.value = _categoryDist
      priorityDistribution.value = _priorityDist
      overdueCount.value = _overdue
      taskWeekComparison.value = _taskWeekComp
      cumulativeCompletion.value = _cumulative
      todayTomatoCount.value = _todayCount
      todayFocusMinutes.value = _todayMinutes
      streak.value = _streak
      tomatoTrend.value = _tomatoTrend
      tomatoWeekComparison.value = _tomatoWeekComp
      monthlyHeatmap.value = _heatmap
    } finally {
      loading.value = false
    }
  }

  return {
    completionTrend, creationTrend, completionRate, categoryDistribution,
    priorityDistribution, overdueCount, taskWeekComparison, cumulativeCompletion,
    todayTomatoCount, todayFocusMinutes, streak, tomatoTrend,
    tomatoWeekComparison, monthlyHeatmap, loading, loadAll
  }
})
