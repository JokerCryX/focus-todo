import type { Database } from 'sql.js'
import { randomUUID } from 'crypto'
import { saveDatabase } from './index'
import { getNextOccurrence, type RepeatRule } from './repeat-engine'

interface TaskRow {
  id: number
  task_id: string
  title: string
  description: string
  due_date: number | null
  reminder_time: number | null
  category_id: number | null
  tags: string[]
  priority: number
  sort_order: number
  complete: number
  is_deleted: number
  repeat_rule: string | null
  subtasks: any[] | null
  files: any[]
  created_at: number
  updated_at: number
  duration_end: number | null
}

function rowToTask(row: any[]): TaskRow {
  return {
    id: row[0] as number,
    task_id: row[1] as string,
    title: row[2] as string,
    description: row[3] as string,
    due_date: row[4] as number | null,
    reminder_time: row[5] as number | null,
    category_id: row[6] as number | null,
    tags: JSON.parse((row[7] as string) || '[]'),
    priority: row[8] as number,
    sort_order: row[9] as number,
    complete: row[10] as number,
    is_deleted: row[11] as number,
    repeat_rule: row[12] as string | null,
    subtasks: row[13] ? JSON.parse(row[13] as string) : null,
    files: JSON.parse((row[14] as string) || '[]'),
    created_at: row[15] as number,
    updated_at: row[16] as number,
    duration_end: (row[17] as number | null) ?? null
  }
}

export class TaskDao {
  constructor(private db: Database) {}

  list(filter: {
    view: string
    category_id?: number
    sort_by?: string
    search?: string
  }): TaskRow[] {
    let where = '1=1'
    const params: any[] = []

    switch (filter.view) {
      case 'inbox':
        where += ' AND category_id IS NULL AND is_deleted = 0 AND complete = 0'
        break
      case 'today': {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime()
        where += ' AND due_date IS NOT NULL AND due_date >= ? AND due_date <= ? AND is_deleted = 0 AND complete = 0'
        params.push(startOfDay, endOfDay)
        break
      }
      case 'recent':
        where += ' AND is_deleted = 0 AND due_date IS NOT NULL'
        break
      case 'completed':
        where += ' AND complete = 1 AND is_deleted = 0'
        break
      case 'trash':
        where += ' AND is_deleted = 1'
        break
      case 'category':
        where += ' AND category_id = ? AND is_deleted = 0'
        params.push(filter.category_id)
        break
      case 'search':
        where += ' AND is_deleted = 0 AND complete = 0'
        break
    }

    if (filter.search) {
      where += ' AND (title LIKE ? OR description LIKE ?)'
      params.push(`%${filter.search}%`, `%${filter.search}%`)
    }

    const sortMap: Record<string, string> = {
      reminder: 'reminder_time ASC',
      created_asc: 'created_at ASC',
      created_desc: 'created_at DESC',
      priority_desc: 'priority DESC',
      priority_asc: 'priority ASC',
      due_date: 'due_date ASC',
      complete: 'complete ASC',
      custom: 'sort_order ASC'
    }
    const orderBy = sortMap[filter.sort_by || 'reminder'] || 'created_at DESC'

    if (filter.view === 'recent') {
      const sql = `SELECT * FROM tasks WHERE ${where} ORDER BY updated_at DESC LIMIT 50`
      const result = this.db.exec(sql, params)
      return result[0]?.values.map(rowToTask) || []
    }

    const sql = `SELECT * FROM tasks WHERE ${where} ORDER BY ${orderBy}`
    const result = this.db.exec(sql, params)
    return result[0]?.values.map(rowToTask) || []
  }

  create(input: {
    title: string
    description?: string
    due_date?: number | null
    reminder_time?: number | null
    category_id?: number | null
    tags?: string[]
    priority?: number
  }): TaskRow {
    const now = Date.now()
    const taskId = randomUUID()
    const tags = JSON.stringify(input.tags || [])
    this.db.run(
      `INSERT INTO tasks (task_id, title, description, due_date, reminder_time, category_id, tags, priority, sort_order, complete, is_deleted, files, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, '[]', ?, ?)`,
      [taskId, input.title, input.description || '', input.due_date ?? null, input.reminder_time ?? null, input.category_id ?? null, tags, input.priority || 0, now, now]
    )
    saveDatabase()
    const result = this.db.exec('SELECT * FROM tasks WHERE task_id = ?', [taskId])
    return rowToTask(result[0]!.values[0]!)
  }

  update(input: {
    task_id: string
    title?: string
    description?: string
    due_date?: number | null
    reminder_time?: number | null
    category_id?: number | null
    tags?: string[]
    priority?: number
    sort_order?: number
    complete?: number
    is_deleted?: number
    repeat_rule?: string | null
    subtasks?: any[] | null
    files?: any[]
    duration_end?: number | null
  }): TaskRow {
    const fields: string[] = ['updated_at = ?']
    const params: any[] = [Date.now()]

    if (input.title !== undefined) { fields.push('title = ?'); params.push(input.title) }
    if (input.description !== undefined) { fields.push('description = ?'); params.push(input.description) }
    if (input.due_date !== undefined) { fields.push('due_date = ?'); params.push(input.due_date) }
    if (input.reminder_time !== undefined) { fields.push('reminder_time = ?'); params.push(input.reminder_time) }
    if (input.category_id !== undefined) { fields.push('category_id = ?'); params.push(input.category_id) }
    if (input.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(input.tags)) }
    if (input.priority !== undefined) { fields.push('priority = ?'); params.push(input.priority) }
    if (input.sort_order !== undefined) { fields.push('sort_order = ?'); params.push(input.sort_order) }
    if (input.complete !== undefined) { fields.push('complete = ?'); params.push(input.complete) }
    if (input.is_deleted !== undefined) { fields.push('is_deleted = ?'); params.push(input.is_deleted) }
    if (input.repeat_rule !== undefined) { fields.push('repeat_rule = ?'); params.push(input.repeat_rule) }
    if (input.subtasks !== undefined) { fields.push('subtasks = ?'); params.push(input.subtasks ? JSON.stringify(input.subtasks) : null) }
    if (input.files !== undefined) { fields.push('files = ?'); params.push(JSON.stringify(input.files)) }
    if (input.duration_end !== undefined) { fields.push('duration_end = ?'); params.push(input.duration_end) }

    params.push(input.task_id)
    this.db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE task_id = ?`, params)

    if (input.complete === 1) {
      const current = this.db.exec('SELECT repeat_rule, title, description, category_id, tags, priority, subtasks FROM tasks WHERE task_id = ?', [input.task_id])
      const row = current[0]?.values[0]
      if (row && row[0]) {
        try {
          const rule = JSON.parse(row[0] as string) as RepeatRule
          const nextDue = getNextOccurrence(rule, Date.now())
          if (nextDue) {
            const now = Date.now()
            const newId = randomUUID()
            this.db.run(
              `INSERT INTO tasks (task_id, title, description, due_date, category_id, tags, priority, sort_order, complete, is_deleted, repeat_rule, subtasks, files, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, '[]', ?, ?)`,
              [newId, row[1], row[2], nextDue, row[3], row[4], row[5], row[0], row[6], now, now]
            )
          }
        } catch { /* ignore invalid repeat_rule */ }
      }
    }

    saveDatabase()

    const result = this.db.exec('SELECT * FROM tasks WHERE task_id = ?', [input.task_id])
    return rowToTask(result[0]!.values[0]!)
  }

  softDelete(taskId: string): void {
    const now = Date.now()
    this.db.run('UPDATE tasks SET is_deleted = 1, updated_at = ? WHERE task_id = ?', [now, taskId])
    saveDatabase()
  }

  restore(taskId: string): void {
    const now = Date.now()
    this.db.run('UPDATE tasks SET is_deleted = 0, updated_at = ? WHERE task_id = ?', [now, taskId])
    saveDatabase()
  }

  permanentDelete(taskId: string): void {
    this.db.run('DELETE FROM tasks WHERE task_id = ?', [taskId])
    saveDatabase()
  }

  emptyTrash(): void {
    this.db.run('DELETE FROM tasks WHERE is_deleted = 1')
    saveDatabase()
  }

  batchUpdate(taskIds: string[], updates: Record<string, any>): void {
    const fields: string[] = ['updated_at = ?']
    const now = Date.now()
    const params: any[] = [now]

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'tags') {
        fields.push('tags = ?')
        params.push(JSON.stringify(value))
      } else if (key === 'subtasks') {
        fields.push('subtasks = ?')
        params.push(value ? JSON.stringify(value) : null)
      } else if (key === 'files') {
        fields.push('files = ?')
        params.push(JSON.stringify(value))
      } else if (['title', 'description', 'due_date', 'reminder_time', 'category_id', 'priority', 'sort_order', 'complete', 'is_deleted', 'repeat_rule', 'duration_end'].includes(key)) {
        fields.push(`${key} = ?`)
        params.push(value)
      }
    }

    const placeholders = taskIds.map(() => '?').join(', ')
    params.push(...taskIds)
    this.db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE task_id IN (${placeholders})`, params)
    saveDatabase()
  }

  searchAll(): TaskRow[] {
    const sql = `SELECT * FROM tasks WHERE is_deleted = 0 ORDER BY updated_at DESC`
    const result = this.db.exec(sql)
    return result[0]?.values.map(rowToTask) || []
  }

  listByDateRange(startMs: number, endMs: number): TaskRow[] {
    const sql = `SELECT * FROM tasks WHERE is_deleted = 0 AND due_date IS NOT NULL AND due_date >= ? AND due_date <= ? ORDER BY due_date ASC`
    const result = this.db.exec(sql, [startMs, endMs])
    return result[0]?.values.map(rowToTask) || []
  }

  batchRemove(taskIds: string[]): void {
    const placeholders = taskIds.map(() => '?').join(', ')
    const now = Date.now()
    this.db.run(`UPDATE tasks SET is_deleted = 1, updated_at = ? WHERE task_id IN (${placeholders})`, [now, ...taskIds])
    saveDatabase()
  }

  // ---- Statistics methods ----

  private dateKey(ms: number): string {
    const d = new Date(ms)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  private dayStartMs(): number {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()
  }

  completionTrend(days: number): { date: string; count: number }[] {
    const startMs = new Date(Date.now()).setHours(0, 0, 0, 0) - (days - 1) * 86400000
    const result = this.db.exec(
      `SELECT updated_at FROM tasks WHERE complete = 1 AND is_deleted = 0 AND updated_at >= ?`,
      [startMs]
    )
    const map: Record<string, number> = {}
    for (const row of result[0]?.values || []) {
      const key = this.dateKey(row[0] as number)
      map[key] = (map[key] || 0) + 1
    }
    const arr: { date: string; count: number }[] = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = this.dateKey(d.getTime())
      arr.push({ date: key, count: map[key] || 0 })
    }
    return arr
  }

  creationTrend(days: number): { date: string; count: number }[] {
    const startMs = new Date(Date.now()).setHours(0, 0, 0, 0) - (days - 1) * 86400000
    const result = this.db.exec(
      `SELECT created_at FROM tasks WHERE is_deleted = 0 AND created_at >= ?`,
      [startMs]
    )
    const map: Record<string, number> = {}
    for (const row of result[0]?.values || []) {
      const key = this.dateKey(row[0] as number)
      map[key] = (map[key] || 0) + 1
    }
    const arr: { date: string; count: number }[] = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = this.dateKey(d.getTime())
      arr.push({ date: key, count: map[key] || 0 })
    }
    return arr
  }

  completionRate(): { completed: number; total: number } {
    const result = this.db.exec(
      `SELECT SUM(CASE WHEN complete = 1 AND is_deleted = 0 THEN 1 ELSE 0 END), SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) FROM tasks`
    )
    const row = result[0]?.values[0]
    return { completed: (row?.[0] as number) || 0, total: (row?.[1] as number) || 0 }
  }

  categoryDistribution(): { category_id: number; name: string; color: string; count: number }[] {
    const result = this.db.exec(
      `SELECT c.id, c.name, c.color, COUNT(t.id) as count FROM categories c LEFT JOIN tasks t ON t.category_id = c.id AND t.is_deleted = 0 GROUP BY c.id ORDER BY count DESC`
    )
    return (result[0]?.values || []).map(r => ({
      category_id: r[0] as number,
      name: r[1] as string,
      color: r[2] as string,
      count: r[3] as number
    }))
  }

  priorityDistribution(): { priority: number; count: number }[] {
    const result = this.db.exec(
      `SELECT priority, COUNT(*) as count FROM tasks WHERE is_deleted = 0 GROUP BY priority ORDER BY priority ASC`
    )
    return (result[0]?.values || []).map(r => ({
      priority: r[0] as number,
      count: r[1] as number
    }))
  }

  overdueCount(): number {
    const todayStart = this.dayStartMs()
    const result = this.db.exec(
      `SELECT COUNT(*) FROM tasks WHERE is_deleted = 0 AND complete = 0 AND due_date IS NOT NULL AND due_date < ?`,
      [todayStart]
    )
    return (result[0]?.values[0]?.[0] as number) || 0
  }

  weekComparison(): { thisWeek: number; lastWeek: number } {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1).getTime()
    const lastMonday = thisMonday - 7 * 86400000

    const r1 = this.db.exec(
      `SELECT COUNT(*) FROM tasks WHERE complete = 1 AND is_deleted = 0 AND updated_at >= ?`,
      [thisMonday]
    )
    const r2 = this.db.exec(
      `SELECT COUNT(*) FROM tasks WHERE complete = 1 AND is_deleted = 0 AND updated_at >= ? AND updated_at < ?`,
      [lastMonday, thisMonday]
    )
    return {
      thisWeek: (r1[0]?.values[0]?.[0] as number) || 0,
      lastWeek: (r2[0]?.values[0]?.[0] as number) || 0
    }
  }

  cumulativeCompletion(): { date: string; total: number }[] {
    const result = this.db.exec(
      `SELECT updated_at FROM tasks WHERE complete = 1 AND is_deleted = 0 ORDER BY updated_at ASC`
    )
    const rows = result[0]?.values || []
    const map: Record<string, number> = {}
    for (const row of rows) {
      const key = this.dateKey(row[0] as number)
      map[key] = (map[key] || 0) + 1
    }
    const arr: { date: string; total: number }[] = []
    let cum = 0
    for (const [date, count] of Object.entries(map)) {
      cum += count
      arr.push({ date, total: cum })
    }
    return arr
  }
}
