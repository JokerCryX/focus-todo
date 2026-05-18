import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { SettingsDao } from '../database/settings.dao'
import { getDatabase, saveDatabase } from '../database'
import { validateImportData, TABLE_COLUMNS } from '../database/import-validator'

const IMPORT_TABLES = Object.keys(TABLE_COLUMNS)

export function registerSettingsIPC(dao: SettingsDao): void {
  ipcMain.handle('settings:get', (_e, key: string) => {
    return dao.get(key)
  })

  ipcMain.handle('settings:set', (_e, key: string, value: string) => {
    dao.set(key, value)
  })

  ipcMain.handle('settings:getAll', () => {
    return dao.getAll()
  })

  ipcMain.handle('data:export', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: `focustodo-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (!filePath) return { success: false, reason: 'cancelled' }

    const db = await getDatabase()
    const data: Record<string, any> = {}
    for (const table of IMPORT_TABLES) {
      const result = db.exec(`SELECT * FROM ${table}`)
      if (result[0]) {
        const cols = result[0].columns
        data[table] = result[0].values.map(row => {
          const obj: Record<string, any> = {}
          cols.forEach((col, i) => {
            let val = row[i]
            if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
              try { val = JSON.parse(val) } catch {}
            }
            obj[col] = val
          })
          return obj
        })
      }
    }
    data['_meta'] = { version: 1, exportedAt: Date.now(), appVersion: app.getVersion() }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true }
  })

  ipcMain.handle('data:import', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const { filePaths } = await dialog.showOpenDialog(win!, {
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (!filePaths || filePaths.length === 0) return { success: false, reason: 'cancelled' }

    const raw = fs.readFileSync(filePaths[0], 'utf-8')
    let data: any
    try {
      data = JSON.parse(raw)
    } catch {
      return { success: false, errors: ['JSON 解析失败'] }
    }

    const validation = validateImportData(data)
    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }

    const db = await getDatabase()

    // 清空目标表
    for (const table of IMPORT_TABLES) {
      db.run(`DELETE FROM ${table}`)
    }

    // 插入导入数据
    for (const table of IMPORT_TABLES) {
      const rows = data[table]
      if (!Array.isArray(rows) || rows.length === 0) continue
      const allowedCols = TABLE_COLUMNS[table]
      const cols = Object.keys(rows[0]).filter(c => allowedCols.includes(c))
      if (cols.length === 0) continue
      const placeholders = cols.map(() => '?').join(', ')
      for (const row of rows) {
        const values = cols.map(c => {
          const v = row[c]
          if (typeof v === 'object' && v !== null) return JSON.stringify(v)
          return v
        })
        db.run(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`, values)
      }
    }

    saveDatabase()

    for (const w of BrowserWindow.getAllWindows()) {
      w.webContents.send('data:imported')
    }

    return { success: true }
  })

  ipcMain.handle('data:reset', async () => {
    const db = await getDatabase()
    db.run('DELETE FROM tasks')
    db.run('DELETE FROM tomato_records')
    db.run('DELETE FROM widgets')
    db.run('DELETE FROM app_settings')
    db.run('DELETE FROM categories')
    // 重建默认分类
    const defaults = [
      { name: '工作', color: '#4A90D9', icon: '💼', sort_order: 0 },
      { name: '学习', color: '#F5A623', icon: '📚', sort_order: 1 },
      { name: '生活', color: '#7ED321', icon: '🏠', sort_order: 2 },
      { name: '健康', color: '#D0021B', icon: '❤️', sort_order: 3 }
    ]
    const now = Date.now()
    for (const cat of defaults) {
      db.run(
        'INSERT INTO categories (name, color, icon, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
        [cat.name, cat.color, cat.icon, cat.sort_order, now]
      )
    }
    saveDatabase()
    return { success: true }
  })
}
