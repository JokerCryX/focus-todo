import { ipcMain, BrowserWindow } from 'electron'
import { TomatoDao } from '../database/tomato.dao'

export function registerTomatoIPC(dao: TomatoDao): void {
  ipcMain.handle('tomato:create', (_e, input) => {
    const record = dao.create(input)
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('tomato:completed', record)
    }
    return record
  })

  ipcMain.handle('tomato:list', (_e, limit?: number) => {
    return dao.list(limit)
  })

  ipcMain.handle('tomato:todayCount', () => {
    return dao.todayCount()
  })

  ipcMain.handle('tomato:todayFocusMinutes', () => {
    return dao.todayFocusMinutes()
  })

  ipcMain.handle('tomato:recentDays', (_e, days: number) => {
    return dao.recentDays(days)
  })

  ipcMain.handle('tomato:remove', (_e, tomatoId: string) => {
    dao.remove(tomatoId)
  })
}
