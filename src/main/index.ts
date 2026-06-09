import { app, BrowserWindow, shell, globalShortcut, ipcMain, protocol, net } from 'electron'
import { join } from 'path'
import path from 'path'
import { readFileSync } from 'fs'
import { getDatabase, closeDatabase } from './database'
import { runMigrations } from './database/migrations'
import { registerAllIPC } from './ipc'
import { createTray, setWidgetDao, createAppIcon } from './tray'
import { initWidgetManager, restoreAllWidgets, setStickyNoteDao, toggleTodoWidget, setStickyTopMode } from './widget-manager'
import { WidgetDao } from './database/widget.dao'
import { StickyNoteDao } from './database/sticky-note.dao'
import { SettingsDao } from './database/settings.dao'
import { getWebPreferences, showWindow, hideWindow } from './window-utils'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

const gotTheLock = app.requestSingleInstanceLock()

// 注册自定义协议，让 renderer 可以直接加载本地音频文件
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-audio', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } }
])

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) showWindow(mainWindow)
  })

  app.whenReady().then(async () => {
    app.setAppUserModelId('com.focustodo.app')

    // 注册 local-audio:// 协议处理
    const audioDir = app.isPackaged
      ? path.join(process.resourcesPath, 'audio')
      : path.join(process.cwd(), 'public/audio')
    protocol.handle('local-audio', (request) => {
      const url = new URL(request.url)
      // 兼容 local-audio:///file.mp3（pathname）和 local-audio://file.mp3（hostname）
      const fileName = url.pathname.replace(/^\//, '') || url.hostname
      const filePath = path.join(audioDir, fileName)
      try {
        const data = readFileSync(filePath)
        return new Response(data, { headers: { 'content-type': 'audio/mpeg' } })
      } catch {
        return new Response('not found', { status: 404 })
      }
    })

    const db = await getDatabase()
    runMigrations(db)
    registerAllIPC(db)

    mainWindow = new BrowserWindow({
      width: 960,
      height: 700,
      minWidth: 860,
      minHeight: 560,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      icon: createAppIcon(),
      webPreferences: getWebPreferences()
    })

    mainWindow.on('ready-to-show', () => {
      mainWindow!.show()
    })

    mainWindow.on('close', (e) => {
      if (isQuitting) return
      e.preventDefault()
      hideWindow(mainWindow!)
    })

    // 主窗口最小化/恢复 → 控制便利贴层级（Win+D 适配）
    mainWindow.on('minimize', () => {
      setStickyTopMode(true)
    })
    mainWindow.on('restore', () => {
      setStickyTopMode(false)
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    createTray(mainWindow)

    const settingsDao = new SettingsDao(db)
    registerGlobalShortcut(mainWindow, settingsDao)

    ipcMain.on('shortcuts:updated', () => {
      registerGlobalShortcut(mainWindow!, settingsDao)
    })

    const widgetDao = new WidgetDao(db)
    setWidgetDao(widgetDao)
    initWidgetManager(mainWindow, widgetDao)
    setStickyNoteDao(new StickyNoteDao(db))
    restoreAllWidgets()

    app.on('activate', () => {
      if (mainWindow) showWindow(mainWindow)
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    isQuitting = true
    globalShortcut.unregisterAll()
    closeDatabase()
  })
}

function registerGlobalShortcut(win: BrowserWindow, dao: SettingsDao) {
  globalShortcut.unregisterAll()
  const raw = dao.get('shortcuts')
  if (!raw) return
  try {
    const map = JSON.parse(raw) as Record<string, string>
    const hideKeys = map['hide_window']
    if (hideKeys) {
      globalShortcut.register(hideKeys, () => {
        if (win.isMinimized()) {
          showWindow(win)
        } else {
          hideWindow(win)
        }
      })
    }
    const widgetKeys = map['toggle_widget']
    if (widgetKeys) {
      globalShortcut.register(widgetKeys, () => {
        toggleTodoWidget()
      })
    }
  } catch {}
}
