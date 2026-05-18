import { BrowserWindow } from 'electron'
import { join } from 'path'

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
