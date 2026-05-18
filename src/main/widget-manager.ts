import { BrowserWindow, screen } from 'electron'
import { WidgetDao } from './database/widget.dao'
import { getWebPreferences, loadWindowPage } from './window-utils'

const widgetWindows = new Map<string, BrowserWindow>()

let mainWindow: BrowserWindow | null = null
let dao: WidgetDao | null = null

export function initWidgetManager(mainWin: BrowserWindow, widgetDao: WidgetDao): void {
  mainWindow = mainWin
  dao = widgetDao
}

export function createWidgetWindow(widgetId: string): void {
  if (!dao || !mainWindow) return
  if (widgetWindows.has(widgetId)) {
    widgetWindows.get(widgetId)!.focus()
    return
  }

  const record = dao.getById(widgetId)
  if (!record) return

  const win = new BrowserWindow({
    x: record.x,
    y: record.y,
    width: record.width,
    height: record.height,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: !!record.always_on_top,
    opacity: record.opacity / 100,
    webPreferences: getWebPreferences()
  })

  loadWindowPage(win, 'widget', { widgetId })

  let moveTimer: ReturnType<typeof setTimeout> | null = null
  win.on('move', () => {
    if (moveTimer) clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
      const bounds = win.getBounds()
      dao?.update(widgetId, { x: bounds.x, y: bounds.y })
    }, 500)
  })

  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  win.on('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const bounds = win.getBounds()
      dao?.update(widgetId, { width: bounds.width, height: bounds.height })
    }, 500)
  })

  win.on('closed', () => {
    widgetWindows.delete(widgetId)
  })

  win.webContents.on('render-process-gone', (_e, details) => {
    console.error('Widget render process gone:', details)
  })

  widgetWindows.set(widgetId, win)
}

export function closeWidgetWindow(widgetId: string): void {
  const win = widgetWindows.get(widgetId)
  if (win) {
    win.close()
    widgetWindows.delete(widgetId)
  }
}

export function isWidgetOpen(widgetId: string): boolean {
  return widgetWindows.has(widgetId)
}

export function broadcastToWidgets(channel: string, ...args: any[]): void {
  for (const win of widgetWindows.values()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args)
    }
  }
}

export function restoreAllWidgets(): void {
  if (!dao) return
  const widgets = dao.list().filter(w => w.type !== 'calendar')
  // Deduplicate: keep only the first todo widget, remove extras
  if (widgets.length > 1) {
    for (let i = 1; i < widgets.length; i++) {
      dao.remove(widgets[i].widget_id)
    }
  }
  if (widgets.length > 0) {
    createWidgetWindow(widgets[0].widget_id)
  }
}

export function sendToMainWindow(channel: string, ...args: any[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}
