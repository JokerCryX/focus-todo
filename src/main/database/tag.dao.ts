import type { Database } from 'sql.js'
import { saveDatabase } from './index'

interface TagRow {
  name: string
  count: number
}

export class TagDao {
  constructor(private db: Database) {}

  list(): TagRow[] {
    const result = this.db.exec(`
      SELECT value, COUNT(*) as cnt
      FROM tasks, json_each(tags)
      WHERE is_deleted = 0
      GROUP BY value
      ORDER BY cnt DESC
    `)
    if (!result[0]) return []
    return result[0].values.map(row => ({
      name: row[0] as string,
      count: row[1] as number
    }))
  }

  rename(oldName: string, newName: string): void {
    const tasks = this.db.exec(
      `SELECT rowid, tags FROM tasks WHERE tags LIKE ? AND is_deleted = 0`,
      [`%"${oldName}"%`]
    )
    if (!tasks[0]) return

    for (const row of tasks[0].values) {
      const tags: string[] = JSON.parse(row[1] as string)
      const idx = tags.indexOf(oldName)
      if (idx !== -1) {
        tags[idx] = newName
        this.db.run('UPDATE tasks SET tags = ?, updated_at = ? WHERE rowid = ?', [
          JSON.stringify(tags),
          Date.now(),
          row[0]
        ])
      }
    }
    saveDatabase()
  }

  remove(name: string): void {
    const tasks = this.db.exec(
      `SELECT rowid, tags FROM tasks WHERE tags LIKE ? AND is_deleted = 0`,
      [`%"${name}"%`]
    )
    if (!tasks[0]) return

    for (const row of tasks[0].values) {
      const tags: string[] = JSON.parse(row[1] as string)
      const filtered = tags.filter(t => t !== name)
      this.db.run('UPDATE tasks SET tags = ?, updated_at = ? WHERE rowid = ?', [
        JSON.stringify(filtered),
        Date.now(),
        row[0]
      ])
    }
    saveDatabase()
  }
}
