import { ipcMain } from 'electron'
import { TaskDao } from '../database/task.dao'
import { TomatoDao } from '../database/tomato.dao'

export function registerStatisticsIPC(taskDao: TaskDao, tomatoDao: TomatoDao): void {
  // Task statistics
  ipcMain.handle('stats:taskCompletionTrend', (_e, days: number) => taskDao.completionTrend(days))
  ipcMain.handle('stats:taskCreationTrend', (_e, days: number) => taskDao.creationTrend(days))
  ipcMain.handle('stats:taskCompletionRate', () => taskDao.completionRate())
  ipcMain.handle('stats:taskCategoryDistribution', () => taskDao.categoryDistribution())
  ipcMain.handle('stats:taskPriorityDistribution', () => taskDao.priorityDistribution())
  ipcMain.handle('stats:taskOverdueCount', () => taskDao.overdueCount())
  ipcMain.handle('stats:taskWeekComparison', () => taskDao.weekComparison())
  ipcMain.handle('stats:taskCumulativeCompletion', () => taskDao.cumulativeCompletion())

  // Tomato statistics
  ipcMain.handle('stats:tomatoStreak', () => tomatoDao.streak())
  ipcMain.handle('stats:tomatoWeeklyComparison', () => tomatoDao.weeklyComparison())
  ipcMain.handle('stats:tomatoMonthlyHeatmap', () => tomatoDao.monthlyHeatmap())
}
