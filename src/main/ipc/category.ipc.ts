import { ipcMain } from 'electron'
import { CategoryDao } from '../database/category.dao'

export function registerCategoryIPC(dao: CategoryDao): void {
  ipcMain.handle('category:list', () => {
    return dao.list()
  })

  ipcMain.handle('category:counts', () => {
    return dao.counts()
  })

  ipcMain.handle('category:create', (_e, input) => {
    return dao.create(input)
  })

  ipcMain.handle('category:update', (_e, input) => {
    return dao.update(input)
  })

  ipcMain.handle('category:remove', (_e, id: number) => {
    dao.remove(id)
  })

  ipcMain.handle('category:reorder', (_e, ids: number[]) => {
    dao.reorder(ids)
  })
}
