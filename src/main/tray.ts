import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import { join } from 'path'
import { t } from './locales'
import { WidgetDao } from './database/widget.dao'
import { createWidgetWindow } from './widget-manager'
import { showWindow } from './window-utils'

let tray: Tray | null = null
let widgetDao: WidgetDao | null = null
let mainWindowRef: BrowserWindow | null = null

/** 获取应用图标（用于窗口标题栏 / 任务栏） */
export function createAppIcon(): Electron.NativeImage {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'icons', 'icon.png')
    : join(__dirname, '../../build/icons/icon.png')
  return nativeImage.createFromPath(iconPath)
}

/** 获取托盘图标（小尺寸，适配系统托盘） */
function createTrayIcon(): Electron.NativeImage {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'icons', 'tray.png')
    : join(__dirname, '../../build/icons/tray.png')
  return nativeImage.createFromPath(iconPath)
}

function buildMenu(): Menu {
  const items: Electron.MenuItemConstructorOptions[] = [
    {
      label: t('tray.show'),
      click: () => {
        if (mainWindowRef) showWindow(mainWindowRef)
      }
    },
    { type: 'separator' }
  ]

  if (widgetDao) {
    items.push(
      {
        label: t('tray.todoWidget') || '待办组件',
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
  tray = new Tray(createTrayIcon())
  tray.setToolTip('FocusTodo')
  tray.setContextMenu(buildMenu())

  tray.on('double-click', () => {
    showWindow(mainWindow)
  })
}

export function setWidgetDao(dao: WidgetDao): void {
  widgetDao = dao
  if (tray) {
    tray.setContextMenu(buildMenu())
  }
}
