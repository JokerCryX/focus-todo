import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import { t } from './locales'
import { WidgetDao } from './database/widget.dao'
import { createWidgetWindow } from './widget-manager'

let tray: Tray | null = null
let widgetDao: WidgetDao | null = null
let mainWindowRef: BrowserWindow | null = null

function createAppIcon(): Electron.NativeImage {
  const S = 64
  const buf = Buffer.alloc(S * S * 4)
  const pad = 4, rr = 14
  const w = S - 2 * pad, h = S - 2 * pad
  const bgR = 59, bgG = 158, bgB = 255 // #3B9EFF

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = x + 0.5, py = y + 0.5
      const idx = (y * S + x) * 4

      const qx = Math.abs(px - pad - w / 2) - w / 2 + rr
      const qy = Math.abs(py - pad - h / 2) - h / 2 + rr
      const bgDist = Math.min(Math.max(qx, qy), 0) +
        Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) - rr

      if (bgDist < 1) {
        const aa = clamp01(1 - bgDist)
        const grad = 1.08 - ((py - pad) / h) * 0.16
        buf[idx] = Math.min(255, Math.round(bgR * grad))
        buf[idx + 1] = Math.min(255, Math.round(bgG * grad))
        buf[idx + 2] = Math.min(255, Math.round(bgB * grad))
        buf[idx + 3] = Math.round(aa * 255)
      }

      if (bgDist < 0) {
        const d1 = segDist(px, py, 19, 35, 28, 46)
        const d2 = segDist(px, py, 28, 46, 48, 20)
        const cd = Math.min(d1, d2)
        const thick = 5
        if (cd < thick) {
          const ca = clamp01(1 - (cd - thick + 1.5))
          buf[idx] = Math.round(buf[idx] * (1 - ca) + 255 * ca)
          buf[idx + 1] = Math.round(buf[idx + 1] * (1 - ca) + 255 * ca)
          buf[idx + 2] = Math.round(buf[idx + 2] * (1 - ca) + 255 * ca)
          buf[idx + 3] = 255
        }
      }
    }
  }

  return nativeImage.createFromBuffer(buf, { width: S, height: S })
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function segDist(px: number, py: number, x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0, dy = y1 - y0
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((px - x0) ** 2 + (py - y0) ** 2)
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / lenSq))
  return Math.sqrt((px - x0 - t * dx) ** 2 + (py - y0 - t * dy) ** 2)
}

function buildMenu(): Menu {
  const items: Electron.MenuItemConstructorOptions[] = [
    {
      label: t('tray.show'),
      click: () => {
        mainWindowRef?.show()
        mainWindowRef?.focus()
      }
    },
    { type: 'separator' },
    {
      label: t('tray.newTask'),
      click: () => {
        mainWindowRef?.show()
        mainWindowRef?.webContents.send('action:new-task')
      }
    },
    { type: 'separator' }
  ]

  if (widgetDao) {
    items.push(
      {
        label: 'Todo Widget',
        click: () => {
          const existing = widgetDao!.list().find(w => w.type !== 'calendar')
          if (existing) {
            createWidgetWindow(existing.widget_id)
          } else {
            const record = widgetDao!.create({ type: 'todo' })
            createWidgetWindow(record.widget_id)
          }
        }
      },
      { type: 'separator' }
    )
  }

  items.push({
    label: t('tray.quit'),
    click: () => {
      app.quit()
    }
  })

  return Menu.buildFromTemplate(items)
}

export function createTray(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow
  const icon = createAppIcon()

  tray = new Tray(icon)
  tray.setToolTip('FocusTodo')
  tray.setContextMenu(buildMenu())

  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })
}

export function setWidgetDao(dao: WidgetDao): void {
  widgetDao = dao
  if (tray) {
    tray.setContextMenu(buildMenu())
  }
}
