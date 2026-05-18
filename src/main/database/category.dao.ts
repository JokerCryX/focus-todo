import type { Database } from 'sql.js'
import { saveDatabase } from './index'

interface CategoryRow {
  id: number
  name: string
  color: string
  icon: string
  sort_order: number
  created_at: number
  task_count: number
}

export class CategoryDao {
  constructor(private db: Database) {}

  list(): CategoryRow[] {
    const result = this.db.exec(`
      SELECT c.id, c.name, c.color, c.icon, c.sort_order, c.created_at,
             COUNT(t.id) as task_count
      FROM categories c
      LEFT JOIN tasks t ON t.category_id = c.id AND t.is_deleted = 0
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `)
    if (!result[0]) return []
    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      color: row[2] as string,
      icon: row[3] as string,
      sort_order: row[4] as number,
      created_at: row[5] as number,
      task_count: row[6] as number
    }))
  }

  create(input: { name: string; color: string; icon: string }): CategoryRow {
    const now = Date.now()
    const maxResult = this.db.exec('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories')
    const sortOrder = (maxResult[0]?.values[0]?.[0] as number) || 0

    this.db.run(
      'INSERT INTO categories (name, color, icon, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
      [input.name, input.color, input.icon, sortOrder, now]
    )
    saveDatabase()

    const result = this.db.exec('SELECT * FROM categories WHERE name = ?', [input.name])
    const row = result[0]!.values[0]!
    return {
      id: row[0] as number,
      name: row[1] as string,
      color: row[2] as string,
      icon: row[3] as string,
      sort_order: row[4] as number,
      created_at: row[5] as number,
      task_count: 0
    }
  }

  update(input: { id: number; name?: string; color?: string; icon?: string; sort_order?: number }): CategoryRow {
    const fields: string[] = []
    const params: any[] = []

    if (input.name !== undefined) { fields.push('name = ?'); params.push(input.name) }
    if (input.color !== undefined) { fields.push('color = ?'); params.push(input.color) }
    if (input.icon !== undefined) { fields.push('icon = ?'); params.push(input.icon) }
    if (input.sort_order !== undefined) { fields.push('sort_order = ?'); params.push(input.sort_order) }

    if (fields.length > 0) {
      params.push(input.id)
      this.db.run(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params)
      saveDatabase()
    }

    const result = this.db.exec('SELECT * FROM categories WHERE id = ?', [input.id])
    const row = result[0]!.values[0]!
    return {
      id: row[0] as number,
      name: row[1] as string,
      color: row[2] as string,
      icon: row[3] as string,
      sort_order: row[4] as number,
      created_at: row[5] as number,
      task_count: 0
    }
  }

  counts(): Record<number, number> {
    const result = this.db.exec(
      `SELECT category_id, COUNT(*) as cnt FROM tasks WHERE is_deleted = 0 AND category_id IS NOT NULL GROUP BY category_id`
    )
    const counts: Record<number, number> = {}
    if (result[0]) {
      for (const row of result[0].values) {
        counts[row[0] as number] = row[1] as number
      }
    }
    return counts
  }

  remove(id: number): void {
    // 将该分类下的任务移至收集箱（category_id = NULL）
    this.db.run('UPDATE tasks SET category_id = NULL WHERE category_id = ?', [id])
    this.db.run('DELETE FROM categories WHERE id = ?', [id])
    saveDatabase()
  }

  reorder(ids: number[]): void {
    const stmt = this.db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?')
    ids.forEach((id, index) => {
      stmt.bind([index, id])
      stmt.step()
      stmt.reset()
    })
    stmt.free()
    saveDatabase()
  }
}
