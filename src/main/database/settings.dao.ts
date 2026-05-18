import type { Database } from 'sql.js'
import { saveDatabase } from './index'

export class SettingsDao {
  constructor(private db: Database) {}

  get(key: string): string | null {
    const result = this.db.exec('SELECT value FROM app_settings WHERE key = ?', [key])
    if (!result[0] || !result[0].values[0]) return null
    return result[0].values[0][0] as string
  }

  set(key: string, value: string): void {
    this.db.run(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      [key, value]
    )
    saveDatabase()
  }

  getAll(): Record<string, string> {
    const result = this.db.exec('SELECT key, value FROM app_settings')
    if (!result[0]) return {}
    const settings: Record<string, string> = {}
    for (const row of result[0].values) {
      settings[row[0] as string] = row[1] as string
    }
    return settings
  }
}
