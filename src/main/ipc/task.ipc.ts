import { ipcMain } from 'electron'
import { TaskDao } from '../database/task.dao'

export function registerTaskIPC(dao: TaskDao): void {
  ipcMain.handle('task:list', (_e, filter) => {
    return dao.list(filter)
  })

  ipcMain.handle('task:create', (_e, input) => {
    return dao.create(input)
  })

  ipcMain.handle('task:update', (_e, input) => {
    return dao.update(input)
  })

  ipcMain.handle('task:remove', (_e, taskId: string) => {
    dao.softDelete(taskId)
  })

  ipcMain.handle('task:restore', (_e, taskId: string) => {
    dao.restore(taskId)
  })

  ipcMain.handle('task:permanentDelete', (_e, taskId: string) => {
    dao.permanentDelete(taskId)
  })

  ipcMain.handle('task:emptyTrash', () => {
    dao.emptyTrash()
  })

  ipcMain.handle('task:batchUpdate', (_e, taskIds: string[], updates: Record<string, any>) => {
    dao.batchUpdate(taskIds, updates)
  })

  ipcMain.handle('task:batchRemove', (_e, taskIds: string[]) => {
    dao.batchRemove(taskIds)
  })

  ipcMain.handle('task:searchAll', () => {
    return dao.searchAll()
  })

  ipcMain.handle('task:listByDateRange', (_e, startMs: number, endMs: number) => {
    return dao.listByDateRange(startMs, endMs)
  })
}
