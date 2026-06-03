import { ipcMain, BrowserWindow, screen } from 'electron'
import type { Database } from 'sql.js'
import { TaskDao } from '../database/task.dao'
import { CategoryDao } from '../database/category.dao'
import { TagDao } from '../database/tag.dao'
import { SettingsDao } from '../database/settings.dao'
import { TomatoDao } from '../database/tomato.dao'
import { WidgetDao } from '../database/widget.dao'
import { registerTaskIPC } from './task.ipc'
import { registerCategoryIPC } from './category.ipc'
import { registerTagIPC } from './tag.ipc'
import { registerSettingsIPC } from './settings.ipc'
import { registerTomatoIPC } from './tomato.ipc'
import { registerStatisticsIPC } from './statistics.ipc'
import { registerNoiseIPC } from './noise.ipc'
import { registerAttachmentIPC } from './attachment.ipc'
import { registerWidgetIPC } from './widget.ipc'
import { registerSoundIPC } from './sound.ipc'
import { openTaskPopup, closeAllPopups } from '../popup-manager'

function registerWindowIPC(): void {
  ipcMain.handle('window:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })
  ipcMain.handle('window:maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.handle('window:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })
  ipcMain.handle('window:setAlwaysOnTop', (e, flag: boolean) => {
    BrowserWindow.fromWebContents(e.sender)?.setAlwaysOnTop(flag)
  })
  ipcMain.handle('window:isAlwaysOnTop', (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isAlwaysOnTop() ?? false
  })
  ipcMain.handle('window:resize', (e, width: number, height: number) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    win.setMinimumSize(width, height)
    win.setSize(width, height)
  })
  ipcMain.handle('window:setBackgroundColor', (e, color: string) => {
    BrowserWindow.fromWebContents(e.sender)?.setBackgroundColor(color)
  })

  ipcMain.handle('popup:openTask', (_e, taskId: string, options?: { mode?: string, dueDate?: number }) => {
    openTaskPopup(taskId, options)
  })
  ipcMain.handle('popup:close', () => {
    closeAllPopups()
  })

  // 主窗口自定义 resize
  let mainResizeTimer: ReturnType<typeof setInterval> | undefined
  ipcMain.on('main:startResize', (e, direction: string) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    if (mainResizeTimer !== undefined) clearInterval(mainResizeTimer)

    const startBounds = win.getBounds()
    const startCursor = screen.getCursorScreenPoint()

    mainResizeTimer = setInterval(() => {
      if (win.isDestroyed()) { stopMainResize(); return }
      const cursor = screen.getCursorScreenPoint()
      const dx = cursor.x - startCursor.x
      const dy = cursor.y - startCursor.y
      const b = { ...startBounds }
      const minW = 450, minH = 400

      if (direction.includes('e')) b.width = Math.max(minW, startBounds.width + dx)
      if (direction.includes('w')) {
        const newW = Math.max(minW, startBounds.width - dx)
        b.x = startBounds.x + startBounds.width - newW
        b.width = newW
      }
      if (direction.includes('s')) b.height = Math.max(minH, startBounds.height + dy)
      if (direction.includes('n')) {
        const newH = Math.max(minH, startBounds.height - dy)
        b.y = startBounds.y + startBounds.height - newH
        b.height = newH
      }
      win.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height })
    }, 16)
  })

  ipcMain.on('main:stopResize', () => {
    stopMainResize()
  })

  function stopMainResize() {
    if (mainResizeTimer !== undefined) {
      clearInterval(mainResizeTimer)
      mainResizeTimer = undefined
    }
  }
}

export function registerAllIPC(db: Database): void {
  const taskDao = new TaskDao(db)
  const tomatoDao = new TomatoDao(db)

  registerTaskIPC(taskDao)
  registerCategoryIPC(new CategoryDao(db))
  registerTagIPC(new TagDao(db))
  registerSettingsIPC(new SettingsDao(db))
  registerTomatoIPC(tomatoDao)
  registerStatisticsIPC(taskDao, tomatoDao)
  registerNoiseIPC()
  registerAttachmentIPC()
  registerWidgetIPC(new WidgetDao(db))
  registerSoundIPC()
  registerWindowIPC()
}
