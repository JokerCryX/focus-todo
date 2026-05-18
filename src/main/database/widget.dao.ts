import type { Database } from 'sql.js'
import { randomUUID } from 'crypto'
import { saveDatabase } from './index'

interface WidgetRecord {
  id: number
  widget_id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  always_on_top: number
  opacity: number
  background_color: string
  category_id: number | null
  selected_date: string | null
  config: string
  created_at: number
}

function rowToWidget(row: any[]): WidgetRecord {
  return {
    id: row[0] as number,
    widget_id: row[1] as string,
    type: row[2] as string,
    x: row[3] as number,
    y: row[4] as number,
    width: row[5] as number,
    height: row[6] as number,
    always_on_top: row[7] as number,
    opacity: row[8] as number,
    background_color: row[9] as string,
    category_id: row[10] as number | null,
    selected_date: row[11] as string | null,
    config: row[12] as string,
    created_at: row[13] as number
  }
}

export class WidgetDao {
  constructor(private db: Database) {}

  list(): WidgetRecord[] {
    const result = this.db.exec('SELECT * FROM widgets ORDER BY created_at')
    return result[0]?.values.map(rowToWidget) || []
  }

  getById(widgetId: string): WidgetRecord | null {
    const result = this.db.exec('SELECT * FROM widgets WHERE widget_id = ?', [widgetId])
    return result[0]?.values[0] ? rowToWidget(result[0].values[0]) : null
  }

  create(input: {
    type: string
    x?: number
    y?: number
    width?: number
    height?: number
    category_id?: number
  }): WidgetRecord {
    const now = Date.now()
    const id = randomUUID()
    this.db.run(
      `INSERT INTO widgets (widget_id, type, x, y, width, height, always_on_top, opacity, background_color, category_id, selected_date, config, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 100, '#FFFFFF', ?, NULL, '{}', ?)`,
      [id, input.type, input.x ?? 100, input.y ?? 100, input.width ?? 300, input.height ?? 400, input.category_id ?? null, now]
    )
    saveDatabase()
    return this.getById(id)!
  }

  update(widgetId: string, changes: Partial<Pick<WidgetRecord, 'x' | 'y' | 'width' | 'height' | 'always_on_top' | 'opacity' | 'background_color' | 'category_id' | 'selected_date' | 'config'>>): void {
    const widget = this.getById(widgetId)
    if (!widget) return
    const fields: string[] = []
    const values: any[] = []
    for (const [key, value] of Object.entries(changes)) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
    if (fields.length === 0) return
    values.push(widgetId)
    this.db.run(`UPDATE widgets SET ${fields.join(', ')} WHERE widget_id = ?`, values)
    saveDatabase()
  }

  remove(widgetId: string): void {
    this.db.run('DELETE FROM widgets WHERE widget_id = ?', [widgetId])
    saveDatabase()
  }
}
