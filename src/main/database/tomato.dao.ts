import type { Database } from 'sql.js'
import { randomUUID } from 'crypto'
import { saveDatabase } from './index'

interface TomatoRecord {
  id: number
  tomato_id: string
  start_time: number
  end_time: number
  focus_duration: number
  rest_duration: number
  is_focus: number
  task_id: string | null
  task_title: string | null
  created_at: number
}

function rowToTomato(row: any[]): TomatoRecord {
  return {
    id: row[0] as number,
    tomato_id: row[1] as string,
    start_time: row[2] as number,
    end_time: row[3] as number,
    focus_duration: row[4] as number,
    rest_duration: row[5] as number,
    is_focus: row[6] as number,
    task_id: row[7] as string | null,
    task_title: row[8] as string | null,
    created_at: row[9] as number
  }
}

export class TomatoDao {
  constructor(private db: Database) {}

  create(input: {
    start_time: number
    end_time: number
    focus_duration: number
    rest_duration: number
    is_focus: number
    task_id?: string
    task_title?: string
  }): TomatoRecord {
    const now = Date.now()
    const id = randomUUID()
    this.db.run(
      `INSERT INTO tomato_records (tomato_id, start_time, end_time, focus_duration, rest_duration, is_focus, task_id, task_title, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.start_time, input.end_time, input.focus_duration, input.rest_duration, input.is_focus, input.task_id || null, input.task_title || null, now]
    )
    saveDatabase()
    const result = this.db.exec('SELECT * FROM tomato_records WHERE tomato_id = ?', [id])
    return rowToTomato(result[0]!.values[0]!)
  }

  list(limit = 50): TomatoRecord[] {
    const sql = `SELECT * FROM tomato_records ORDER BY created_at DESC LIMIT ?`
    const result = this.db.exec(sql, [limit])
    return result[0]?.values.map(rowToTomato) || []
  }

  todayCount(): number {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const result = this.db.exec(
      `SELECT COUNT(*) FROM tomato_records WHERE is_focus = 1 AND start_time >= ?`,
      [start]
    )
    return (result[0]?.values[0]?.[0] as number) || 0
  }

  todayFocusMinutes(): number {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const result = this.db.exec(
      `SELECT COALESCE(SUM(focus_duration), 0) FROM tomato_records WHERE is_focus = 1 AND start_time >= ?`,
      [start]
    )
    return (result[0]?.values[0]?.[0] as number) || 0
  }

  recentDays(days: number): { date: string; count: number; minutes: number }[] {
    const now = new Date()
    const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1).getTime()
    const result = this.db.exec(
      `SELECT start_time, focus_duration FROM tomato_records WHERE is_focus = 1 AND start_time >= ?`,
      [startMs]
    )
    const map: Record<string, { count: number; minutes: number }> = {}
    for (const row of result[0]?.values || []) {
      const d = new Date(row[0] as number)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!map[key]) map[key] = { count: 0, minutes: 0 }
      map[key].count++
      map[key].minutes += (row[1] as number)
    }
    const arr: { date: string; count: number; minutes: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      arr.push({ date: key, count: map[key]?.count || 0, minutes: map[key]?.minutes || 0 })
    }
    return arr
  }

  remove(tomatoId: string): void {
    this.db.run('DELETE FROM tomato_records WHERE tomato_id = ?', [tomatoId])
    saveDatabase()
  }

  streak(): number {
    const startMs = Date.now() - 365 * 86400000
    const result = this.db.exec(
      `SELECT start_time FROM tomato_records WHERE is_focus = 1 AND start_time >= ? ORDER BY start_time DESC`,
      [startMs]
    )
    const dateSet = new Set<string>()
    for (const row of result[0]?.values || []) {
      const d = new Date(row[0] as number)
      dateSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    let count = 0
    const now = new Date()
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const startFrom = dateSet.has(todayKey) ? 0 : 1
    for (let i = startFrom; i < 365; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (dateSet.has(key)) count++
      else break
    }
    return count
  }

  weeklyComparison(): { thisWeek: { count: number; minutes: number }; lastWeek: { count: number; minutes: number } } {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1).getTime()
    const lastMonday = thisMonday - 7 * 86400000

    const r1 = this.db.exec(
      `SELECT COUNT(*), COALESCE(SUM(focus_duration), 0) FROM tomato_records WHERE is_focus = 1 AND start_time >= ?`,
      [thisMonday]
    )
    const r2 = this.db.exec(
      `SELECT COUNT(*), COALESCE(SUM(focus_duration), 0) FROM tomato_records WHERE is_focus = 1 AND start_time >= ? AND start_time < ?`,
      [lastMonday, thisMonday]
    )
    return {
      thisWeek: { count: (r1[0]?.values[0]?.[0] as number) || 0, minutes: (r1[0]?.values[0]?.[1] as number) || 0 },
      lastWeek: { count: (r2[0]?.values[0]?.[0] as number) || 0, minutes: (r2[0]?.values[0]?.[1] as number) || 0 }
    }
  }

  monthlyHeatmap(): { date: string; count: number }[] {
    const startMs = Date.now() - 365 * 86400000
    const result = this.db.exec(
      `SELECT start_time FROM tomato_records WHERE is_focus = 1 AND start_time >= ?`,
      [startMs]
    )
    const map: Record<string, number> = {}
    for (const row of result[0]?.values || []) {
      const d = new Date(row[0] as number)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = (map[key] || 0) + 1
    }
    const arr: { date: string; count: number }[] = []
    const now = new Date()
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      arr.push({ date: key, count: map[key] || 0 })
    }
    return arr
  }
}
