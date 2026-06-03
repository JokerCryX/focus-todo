import { BrowserWindow } from 'electron'
import { join } from 'path'

/** 恢复窗口并聚焦（用于从最小化恢复到托盘） */
export function showWindow(win: BrowserWindow): void {
  if (win.isMinimized()) {
    win.restore()
    win.setSkipTaskbar(false)
  }
  win.focus()
}

/** 最小化窗口并隐藏任务栏图标（用于隐藏到托盘） */
export function hideWindow(win: BrowserWindow): void {
  win.setSkipTaskbar(true)
  win.minimize()
}

export function getWebPreferences(): Electron.WebPreferences {
  return {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false,
    contextIsolation: true,
    nodeIntegration: false
  }
}

export function loadWindowPage(win: BrowserWindow, htmlFile: string, query?: Record<string, string>): void {
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    if (htmlFile === 'index') {
      win.loadURL(devUrl)
    } else {
      const baseUrl = devUrl.endsWith('/') ? devUrl : devUrl + '/'
      const qs = query ? '?' + new URLSearchParams(query).toString() : ''
      win.loadURL(`${baseUrl}${htmlFile}.html${qs}`)
    }
  } else {
    win.loadFile(join(__dirname, `../renderer/${htmlFile}.html`), query ? { query } : undefined)
  }
}
