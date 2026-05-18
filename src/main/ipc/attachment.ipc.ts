import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

let _attachRoot: string | null = null

function getAttachRoot(): string {
  if (!_attachRoot) {
    _attachRoot = path.join(app.getPath('userData'), 'attachments')
  }
  return _attachRoot
}

function isSafePath(filePath: string): boolean {
  const resolved = path.resolve(filePath)
  return resolved.startsWith(getAttachRoot())
}

function getAttachDir(taskId: string): string {
  if (taskId.includes('..') || taskId.includes('/') || taskId.includes('\\')) {
    throw new Error('Invalid taskId')
  }
  const dir = path.join(getAttachRoot(), taskId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function registerAttachmentIPC(): void {
  ipcMain.handle('attachment:select', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return []
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    if (result.canceled) return []
    return result.filePaths
  })

  ipcMain.handle('attachment:copy', async (_e, taskId: string, filePath: string) => {
    const dir = getAttachDir(taskId)
    const fileName = path.basename(filePath)
    const dest = path.join(dir, fileName)
    if (!dest.startsWith(dir)) return { error: 'Invalid file path' }
    const stat = fs.statSync(filePath)
    if (stat.size > 50 * 1024 * 1024) {
      return { error: '文件超过 50MB 限制' }
    }
    let finalDest = dest
    let counter = 1
    while (fs.existsSync(finalDest)) {
      const ext = path.extname(fileName)
      const base = path.basename(fileName, ext)
      finalDest = path.join(dir, `${base}_${counter}${ext}`)
      counter++
    }
    fs.copyFileSync(filePath, finalDest)
    return {
      name: path.basename(finalDest),
      path: finalDest,
      size: stat.size,
      isImage: /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(finalDest)
    }
  })

  ipcMain.handle('attachment:read', async (_e, filePath: string) => {
    if (!isSafePath(filePath)) return null
    if (!fs.existsSync(filePath)) return null
    const buffer = fs.readFileSync(filePath)
    return buffer.toString('base64')
  })

  ipcMain.handle('attachment:delete', async (_e, filePath: string) => {
    if (!isSafePath(filePath)) return false
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    return true
  })

  ipcMain.handle('attachment:saveClipboard', async (_e, taskId: string) => {
    const { clipboard } = await import('electron')
    const image = clipboard.readImage()
    if (image.isEmpty()) return null
    const dir = getAttachDir(taskId)
    const fileName = `paste_${Date.now()}.png`
    const dest = path.join(dir, fileName)
    fs.writeFileSync(dest, image.toPNG())
    return {
      name: fileName,
      path: dest,
      size: fs.statSync(dest).size,
      isImage: true
    }
  })
}
