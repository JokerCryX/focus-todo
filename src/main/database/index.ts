import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'

let db: SqlJsDatabase | null = null
let dbPath: string = ''

function getDbPath(): string {
  if (!dbPath) {
    const userData = app.getPath('userData')
    dbPath = path.join(userData, 'focus-todo.db')
  }
  return dbPath
}

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) return db

  const SQL = await initSqlJs()
  const filePath = getDbPath()

  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA journal_mode = WAL')

  return db
}

export function saveDatabase(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(getDbPath(), buffer)
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}
