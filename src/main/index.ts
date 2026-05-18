import { app, BrowserWindow, shell, globalShortcut, ipcMain } from 'electron'
import { join } from 'path'
import { getDatabase, closeDatabase } from './database'
import { runMigrations } from './database/migrations'
import { registerAllIPC } from './ipc'
import { createTray, setWidgetDao, createAppIcon } from './tray'
import { initWidgetManager, restoreAllWidgets } from './widget-manager'
import { WidgetDao } from './database/widget.dao'
import { SettingsDao } from './database/settings.dao'
import { getWebPreferences } from './window-utils'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    app.setAppUserModelId('com.focustodo.app')

    const db = await getDatabase()
    runMigrations(db)
    registerAllIPC(db)

    mainWindow = new BrowserWindow({
      width: 900,
      height: 600,
      minWidth: 800,
      minHeight: 500,
      show: false,
      frame: false,
      transparent: true,
      icon: createAppIcon(),
      webPreferences: getWebPreferences()
    })

    mainWindow.on('ready-to-show', () => {
      mainWindow!.show()
    })

    mainWindow.on('close', (e) => {
      if (isQuitting) return
      e.preventDefault()
      mainWindow!.hide()
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
    restoreAllWidgets()

    app.on('activate', () => {
      mainWindow?.show()
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
    const keys = map['hide_window']
    if (!keys) return
    const accel = keys.replace(/\+/g, '+')
    globalShortcut.register(accel, () => {
      if (win.isVisible()) {
        win.hide()
      } else {
        win.show()
        win.focus()
      }
    })
  } catch {}
}
