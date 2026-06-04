import { BrowserWindow, screen } from 'electron'
import { WidgetDao } from './database/widget.dao'
import { getWebPreferences, loadWindowPage } from './window-utils'
import { createAppIcon } from './tray'

const widgetWindows = new Map<string, BrowserWindow>()
const STRIP_HEIGHT = 6
const SHADOW_PADDING = 30
const programmaticMoving = new Set<string>()

interface DockState {
  isDocked: boolean
  isExpanded: boolean
  savedBounds: Electron.Rectangle | null
  pollTimer: ReturnType<typeof setInterval> | null
  lastAction: number
}

const dockStates = new Map<string, DockState>()
const activeAnimations = new Map<string, ReturnType<typeof setInterval>>()
const activeResizes = new Map<string, ReturnType<typeof setInterval>>()

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
  }, 33)

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

  // 修复负数 y 坐标（停靠收缩时可能保存了负值）
  let winY = record.y
  if (winY < 0) {
    winY = 100
    dao.update(widgetId, { y: winY })
  }

  const win = new BrowserWindow({
    x: record.x,
    y: winY,
    width: record.width,
    height: record.height,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: !!record.always_on_top,
    skipTaskbar: true,
    opacity: record.opacity / 100,
    icon: createAppIcon(),
    webPreferences: getWebPreferences()
  })

  loadWindowPage(win, 'widget', { widgetId })

  const dockState: DockState = { isDocked: false, isExpanded: false, savedBounds: null, pollTimer: null, lastAction: 0 }
  dockStates.set(widgetId, dockState)

  // -- Move: detect dock/undock --
  let moveTimer: ReturnType<typeof setTimeout> | null = null
  let moveEndTimer: ReturnType<typeof setTimeout> | null = null
  let pendingDock = false
  win.on('move', () => {
    if (programmaticMoving.has(widgetId)) return

    // 拖拽过程中：检查光标是否到达屏幕顶部（不受窗口 padding 和回弹影响）
    if (!pendingDock) {
      const cursor = screen.getCursorScreenPoint()
      if (cursor.y <= 3) {
        pendingDock = true
      }
    }

    if (moveEndTimer) clearTimeout(moveEndTimer)
    moveEndTimer = setTimeout(() => {
      if (win.isDestroyed()) return
      const bounds = win.getBounds()

      if (pendingDock) {
        // 松手后执行收缩
        pendingDock = false
        dockState.savedBounds = { ...bounds }
        dockState.isDocked = true
        dockState.isExpanded = false
        animateBounds(widgetId, win, -(bounds.height - STRIP_HEIGHT), 250, easeInCubic)
        win.webContents.send('widget:dock-changed', true)
        startPoll(widgetId, win, dockState)
      } else if (dockState.isDocked) {
        if (bounds.y > -SHADOW_PADDING + 10) {
          dockState.isDocked = false
          dockState.savedBounds = null
          stopPoll(dockState)
          win.webContents.send('widget:dock-changed', false)
          dao?.update(widgetId, { x: bounds.x, y: bounds.y })
        }
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
    stopWidgetResize(widgetId)
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

    if (!state.isExpanded) {
      // Collapsed: expand if cursor is over the visible strip
      const stripBottom = bounds.y + bounds.height
      if (isInsideX && cursor.y >= -SHADOW_PADDING && cursor.y <= stripBottom && now - state.lastAction > 300) {
        state.lastAction = now
        state.isExpanded = true
        animateBounds(widgetId, win, -SHADOW_PADDING, 250, easeOutCubic)
      }
    } else {
      // Expanded: if dragged far from top, undock instead of collapse
      if (bounds.y > 0) {
        state.isDocked = false
        state.isExpanded = false
        state.savedBounds = null
        stopPoll(state)
        win.webContents.send('widget:dock-changed', false)
        dao?.update(widgetId, { x: bounds.x, y: bounds.y })
        return
      }
      // Collapse if cursor left the window
      if (!(isInsideX && isInsideY) && now - state.lastAction > 500) {
        state.lastAction = now
        state.isExpanded = false
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

// -- Custom resize (content-border handles) --
export function findWidgetIdByWebContents(wc: Electron.WebContents): string | null {
  for (const [id, win] of widgetWindows) {
    if (win.webContents.equal(wc)) return id
  }
  return null
}

export function startWidgetResize(widgetId: string, direction: string): void {
  const win = widgetWindows.get(widgetId)
  if (!win) return
  stopWidgetResize(widgetId)

  const startBounds = win.getBounds()
  const startCursor = screen.getCursorScreenPoint()
  programmaticMoving.add(widgetId)

  const timer = setInterval(() => {
    if (win.isDestroyed()) { stopWidgetResize(widgetId); return }

    const cursor = screen.getCursorScreenPoint()
    const dx = cursor.x - startCursor.x
    const dy = cursor.y - startCursor.y
    const b = { ...startBounds }
    const minW = 280, minH = 200

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

  activeResizes.set(widgetId, timer)
}

export function stopWidgetResize(widgetId: string): void {
  const timer = activeResizes.get(widgetId)
  if (timer !== undefined) {
    clearInterval(timer)
    activeResizes.delete(widgetId)
    setTimeout(() => programmaticMoving.delete(widgetId), 50)

    const win = widgetWindows.get(widgetId)
    if (win && !win.isDestroyed()) {
      const bounds = win.getBounds()
      dao?.update(widgetId, { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height })
      const dockState = dockStates.get(widgetId)
      if (dockState?.savedBounds) {
        dockState.savedBounds.width = bounds.width
        dockState.savedBounds.height = bounds.height
      }
    }
  }
}

export function sendToMainWindow(channel: string, ...args: any[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}