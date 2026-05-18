import { BrowserWindow, screen } from 'electron'
import { WidgetDao } from './database/widget.dao'
import { getWebPreferences, loadWindowPage } from './window-utils'
import { createAppIcon } from './tray'

const widgetWindows = new Map<string, BrowserWindow>()
const STRIP_HEIGHT = 6
const programmaticMoving = new Set<string>()

interface DockState {
  isDocked: boolean
  savedBounds: Electron.Rectangle | null
  pollTimer: ReturnType<typeof setInterval> | null
  lastAction: number
}

const dockStates = new Map<string, DockState>()
const activeAnimations = new Map<string, ReturnType<typeof setInterval>>()

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function animateBounds(
  widgetId: string,
  win: BrowserWindow,
  targetY: number,
  duration: number,
  easing: (t: number) => number
): void {
  cancelAnimation(widgetId)
  programmaticMoving.add(widgetId)
  const startBounds = win.getBounds()
  const startY = startBounds.y
  const startTime = Date.now()

  const id = setInterval(() => {
    if (win.isDestroyed()) {
      cancelAnimation(widgetId)
      return
    }
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const currentY = Math.round(startY + (targetY - startY) * easing(progress))
    win.setBounds({
      x: startBounds.x,
      y: currentY,
      width: startBounds.width,
      height: startBounds.height
    })

    if (progress >= 1) {
      clearInterval(id)
      activeAnimations.delete(widgetId)
      setTimeout(() => programmaticMoving.delete(widgetId), 50)
    }
  }, 16)

  activeAnimations.set(widgetId, id)
}

function cancelAnimation(widgetId: string): void {
  const id = activeAnimations.get(widgetId)
  if (id !== undefined) {
    clearInterval(id)
    activeAnimations.delete(widgetId)
    programmaticMoving.delete(widgetId)
  }
}

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
    skipTaskbar: true,
    opacity: record.opacity / 100,
    icon: createAppIcon(),
    webPreferences: getWebPreferences()
  })

  loadWindowPage(win, 'widget', { widgetId })

  const dockState: DockState = { isDocked: false, savedBounds: null, pollTimer: null, lastAction: 0 }
  dockStates.set(widgetId, dockState)

  // -- Move: detect dock/undock --
  let moveTimer: ReturnType<typeof setTimeout> | null = null
  let moveEndTimer: ReturnType<typeof setTimeout> | null = null
  win.on('move', () => {
    if (programmaticMoving.has(widgetId)) return

    if (moveEndTimer) clearTimeout(moveEndTimer)
    moveEndTimer = setTimeout(() => {
      if (win.isDestroyed()) return
      const bounds = win.getBounds()

      if (dockState.isDocked) {
        if (bounds.y > 10) {
          dockState.isDocked = false
          dockState.savedBounds = null
          stopPoll(dockState)
          win.webContents.send('widget:dock-changed', false)
          dao?.update(widgetId, { x: bounds.x, y: bounds.y })
        }
      } else if (bounds.y <= 0) {
        dockState.savedBounds = { ...bounds }
        dockState.isDocked = true
        animateBounds(widgetId, win, -(bounds.height - STRIP_HEIGHT), 250, easeInCubic)
        win.webContents.send('widget:dock-changed', true)
        startPoll(widgetId, win, dockState)
      }
    }, 300)

    if (moveTimer) clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
      if (win.isDestroyed()) return
      const b = win.getBounds()
      if (!dockState.isDocked) {
        dao?.update(widgetId, { x: b.x, y: b.y })
      }
    }, 500)
  })

  // -- Resize --
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  win.on('resize', () => {
    if (programmaticMoving.has(widgetId)) return
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const bounds = win.getBounds()
      dao?.update(widgetId, { width: bounds.width, height: bounds.height })
      if (dockState.savedBounds) {
        dockState.savedBounds.width = bounds.width
        dockState.savedBounds.height = bounds.height
      }
    }, 500)
  })

  // -- Cleanup --
  win.on('closed', () => {
    cancelAnimation(widgetId)
    stopPoll(dockState)
    widgetWindows.delete(widgetId)
    dockStates.delete(widgetId)
  })

  win.webContents.on('render-process-gone', (_e, details) => {
    console.error('Widget render process gone:', details)
  })

  widgetWindows.set(widgetId, win)
}

// -- Cursor polling for expand/collapse --
function startPoll(widgetId: string, win: BrowserWindow, state: DockState): void {
  stopPoll(state)
  state.pollTimer = setInterval(() => {
    if (win.isDestroyed() || !state.isDocked) {
      stopPoll(state)
      return
    }
    if (activeAnimations.has(widgetId)) return

    const now = Date.now()
    const bounds = win.getBounds()
    const cursor = screen.getCursorScreenPoint()

    const isInsideX = cursor.x >= bounds.x && cursor.x <= bounds.x + bounds.width
    const isInsideY = cursor.y >= bounds.y && cursor.y <= bounds.y + bounds.height

    if (bounds.y < 0) {
      // Collapsed: expand if cursor is over the visible strip
      const stripBottom = bounds.y + bounds.height
      if (isInsideX && cursor.y >= 0 && cursor.y <= stripBottom && now - state.lastAction > 300) {
        state.lastAction = now
        animateBounds(widgetId, win, 0, 250, easeOutCubic)
      }
    } else {
      // Expanded: collapse if cursor left the window
      if (!(isInsideX && isInsideY) && now - state.lastAction > 500) {
        state.lastAction = now
        animateBounds(widgetId, win, -(bounds.height - STRIP_HEIGHT), 250, easeInCubic)
      }
    }
  }, 150)
}

function stopPoll(state: DockState): void {
  if (state.pollTimer) {
    clearInterval(state.pollTimer)
    state.pollTimer = null
  }
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

export function expandWidgetBySender(_wc: Electron.WebContents): void {
  // No-op: polling handles expand/collapse now
}

export function collapseWidgetBySender(_wc: Electron.WebContents): void {
  // No-op: polling handles expand/collapse now
}
