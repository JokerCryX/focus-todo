import { ipcMain } from 'electron'
import { TagDao } from '../database/tag.dao'

export function registerTagIPC(dao: TagDao): void {
  ipcMain.handle('tag:list', () => {
    return dao.list()
  })

  ipcMain.handle('tag:rename', (_e, oldName: string, newName: string) => {
    dao.rename(oldName, newName)
  })

  ipcMain.handle('tag:remove', (_e, name: string) => {
    dao.remove(name)
  })
}
