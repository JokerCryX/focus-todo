import { ipcMain, BrowserWindow } from 'electron'
import { WidgetDao } from '../database/widget.dao'
import { createWidgetWindow, closeWidgetWindow, sendToMainWindow, isWidgetOpen, broadcastToWidgets, findWidgetIdByWebContents, startWidgetResize, stopWidgetResize } from '../widget-manager'

export function registerWidgetIPC(dao: WidgetDao): void {
  ipcMain.handle('widget:list', () => {
    return dao.list()
  })

  ipcMain.handle('widget:create', (_e, type: string) => {
    const record = dao.create({ type })
    createWidgetWindow(record.widget_id)
    return record
  })

  ipcMain.handle('widget:update', (_e, widgetId: string, changes: any) => {
    dao.update(widgetId, changes)
  })

  ipcMain.handle('widget:remove', (_e, widgetId: string) => {
    closeWidgetWindow(widgetId)
    dao.remove(widgetId)
  })

  ipcMain.handle('widget:openTaskInMain', (_e, taskId: string) => {
    sendToMainWindow('widget:open-task', taskId)
  })

  ipcMain.handle('widget:getConfig', (_e, widgetId: string) => {
    return dao.getById(widgetId)
  })

  ipcMain.handle('widget:toggle', () => {
    const widgets = dao.list().filter(w => w.type !== 'calendar')
    if (widgets.length === 0) {
      const record = dao.create({ type: 'todo' })
      createWidgetWindow(record.widget_id)
      return true
    }
    const wid = widgets[0].widget_id
    if (isWidgetOpen(wid)) {
      closeWidgetWindow(wid)
      return false
    } else {
      createWidgetWindow(wid)
      return true
    }
  })

  ipcMain.handle('widget:isOpen', () => {
    const widgets = dao.list().filter(w => w.type !== 'calendar')
    if (widgets.length === 0) return false
    return isWidgetOpen(widgets[0].widget_id)
  })

  ipcMain.on('task:changed', (e) => {
    const sender = e.sender
    broadcastToWidgets('task:changed')
    const mainWin = BrowserWindow.getAllWindows().find(w => !w.webContents.equal(sender))
    if (mainWin) {
      mainWin.webContents.send('task:changed')
    }
  })

  ipcMain.on('theme:changed', (_e, theme?: string) => {
    broadcastToWidgets('theme:changed', theme)
    sendToMainWindow('theme:changed', theme)
  })

  ipcMain.on('widget:startResize', (e, direction: string) => {
    const id = findWidgetIdByWebContents(e.sender)
    if (id) startWidgetResize(id, direction)
  })

  ipcMain.on('widget:stopResize', (e) => {
    const id = findWidgetIdByWebContents(e.sender)
    if (id) stopWidgetResize(id)
  })
}
