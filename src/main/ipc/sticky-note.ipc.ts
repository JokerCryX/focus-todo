import { ipcMain } from 'electron'
import { StickyNoteDao } from '../database/sticky-note.dao'
import { WidgetDao } from '../database/widget.dao'
import { createWidgetWindow, closeWidgetWindow, broadcastToWidgets, sendToMainWindow } from '../widget-manager'

export function registerStickyNoteIPC(dao: StickyNoteDao, widgetDao: WidgetDao): void {
  ipcMain.handle('stickyNote:list', () => {
    return dao.list()
  })

  ipcMain.handle('stickyNote:get', (_e, noteId: string) => {
    return dao.getById(noteId)
  })

  ipcMain.handle('stickyNote:create', (_e, input: { color?: string }) => {
    return dao.create(input)
  })

  ipcMain.handle('stickyNote:update', (_e, noteId: string, changes: { content?: string; color?: string }) => {
    dao.update(noteId, changes)
  })

  ipcMain.handle('stickyNote:remove', (_e, noteId: string) => {
    const note = dao.getById(noteId)
    if (note?.is_widget) {
      // 找到对应的 widget 记录并关闭窗口
      const widgets = widgetDao.list().filter(w => w.type === 'sticky')
      for (const w of widgets) {
        try {
          const config = JSON.parse(w.config || '{}')
          if (config.note_id === noteId) {
            closeWidgetWindow(w.widget_id)
            widgetDao.remove(w.widget_id)
            break
          }
        } catch { /* ignore parse errors */ }
      }
    }
    dao.remove(noteId)
  })

  ipcMain.handle('stickyNote:toWidget', (_e, noteId: string) => {
    const note = dao.getById(noteId)
    if (!note || note.is_widget) return

    // 创建 widget 记录
    const widget = widgetDao.create({
      type: 'sticky',
      width: 280,
      height: 320,
      category_id: undefined
    })
    widgetDao.update(widget.widget_id, {
      background_color: note.color,
      config: JSON.stringify({ note_id: noteId })
    })

    // 更新便利贴状态
    dao.update(noteId, { is_widget: 1 })

    // 打开小组件窗口
    createWidgetWindow(widget.widget_id)
  })

  ipcMain.handle('stickyNote:fromWidget', (_e, noteId: string) => {
    const widgets = widgetDao.list().filter(w => w.type === 'sticky')
    for (const w of widgets) {
      try {
        const config = JSON.parse(w.config || '{}')
        if (config.note_id === noteId) {
          closeWidgetWindow(w.widget_id)
          widgetDao.remove(w.widget_id)
          break
        }
      } catch { /* ignore parse errors */ }
    }
    dao.update(noteId, { is_widget: 0 })
  })

  // 广播便利贴内容变更
  ipcMain.on('stickyNote:changed', (_e, noteId: string) => {
    broadcastToWidgets('stickyNote:changed', noteId)
    sendToMainWindow('stickyNote:changed', noteId)
  })
}
