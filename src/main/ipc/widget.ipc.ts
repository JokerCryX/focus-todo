import { ipcMain, BrowserWindow } from 'electron'
import { WidgetDao } from '../database/widget.dao'
import { createWidgetWindow, closeWidgetWindow, sendToMainWindow, getMainWindow, isWidgetOpen, isWidgetVisible, toggleTodoWidget, broadcastToWidgets, findWidgetIdByWebContents, startWidgetResize, stopWidgetResize } from '../widget-manager'
import { showWindow } from '../window-utils'

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
    const mainWin = getMainWindow()
    if (mainWin) showWindow(mainWin)
    sendToMainWindow('widget:open-task', taskId)
  })

  ipcMain.handle('widget:getConfig', (_e, widgetId: string) => {
    return dao.getById(widgetId)
  })

  ipcMain.handle('widget:toggle', () => {
    return toggleTodoWidget()
  })

  ipcMain.handle('widget:isOpen', () => {
    const widgets = dao.list().filter(w => w.type !== 'calendar')
    if (widgets.length === 0) return false
    return isWidgetVisible(widgets[0].widget_id)
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
