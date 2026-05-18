import { BrowserWindow } from 'electron'
import { getWebPreferences, loadWindowPage } from './window-utils'

const popupWindows = new Map<string, BrowserWindow>()

function getParentWindow(): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find(w => !w.isDestroyed() && !popupWindows.has(w.id as any) && !w.webContents.getURL().includes('widget'))
}

export function openTaskPopup(taskId: string, options?: { mode?: string, dueDate?: number }): void {
  if (popupWindows.has(taskId)) {
    popupWindows.get(taskId)!.focus()
    return
  }

  const parentWin = getParentWindow()
  const parentBounds = parentWin?.getBounds()

  const width = 360
  const height = 270

  const x = parentBounds ? parentBounds.x + Math.round((parentBounds.width - width) / 2) : undefined
  const y = parentBounds ? parentBounds.y + Math.round((parentBounds.height - height) / 2) : undefined

  const win = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    parent: parentWin || undefined,
    show: false,
    webPreferences: getWebPreferences()
  })

  const queryParams: Record<string, string> = { taskId }
  if (options?.mode) queryParams.mode = options.mode
  if (options?.dueDate) queryParams.dueDate = String(options.dueDate)
  loadWindowPage(win, 'task-popup', queryParams)

  win.once('ready-to-show', () => {
    win.show()
    parentWin?.webContents.send('popup:opened')
  })

  win.on('closed', () => {
    popupWindows.delete(taskId)
    parentWin?.webContents.send('popup:closed')
  })

  win.on('blur', () => {
    setTimeout(() => {
      if (!win.isDestroyed() && !win.isFocused()) {
        win.close()
      }
    }, 150)
  })

  popupWindows.set(taskId, win)
}

export function closeTaskPopup(taskId: string): void {
  const win = popupWindows.get(taskId)
  if (win && !win.isDestroyed()) {
    win.close()
  }
}

export function closeAllPopups(): void {
  for (const [, win] of popupWindows) {
    if (!win.isDestroyed()) win.close()
  }
}
