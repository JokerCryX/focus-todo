import type { Database } from 'sql.js'
import { randomUUID } from 'crypto'
import { saveDatabase } from './index'

export interface StickyNoteRecord {
  id: number
  note_id: string
  content: string
  color: string
  is_widget: number
  created_at: number
  updated_at: number
}

function rowToStickyNote(row: any[]): StickyNoteRecord {
  return {
    id: row[0] as number,
    note_id: row[1] as string,
    content: row[2] as string,
    color: row[3] as string,
    is_widget: row[4] as number,
    created_at: row[5] as number,
    updated_at: row[6] as number
  }
}

export class StickyNoteDao {
  constructor(private db: Database) {}

  list(): StickyNoteRecord[] {
    const result = this.db.exec('SELECT * FROM sticky_notes ORDER BY created_at')
    return result[0]?.values.map(rowToStickyNote) || []
  }

  getById(noteId: string): StickyNoteRecord | null {
    const result = this.db.exec('SELECT * FROM sticky_notes WHERE note_id = ?', [noteId])
    return result[0]?.values[0] ? rowToStickyNote(result[0].values[0]) : null
  }

  create(input: { color?: string }): StickyNoteRecord {
    const now = Date.now()
    const id = randomUUID()
    this.db.run(
      `INSERT INTO sticky_notes (note_id, content, color, is_widget, created_at, updated_at)
       VALUES (?, '', ?, 0, ?, ?)`,
      [id, input.color ?? '#FFF9C4', now, now]
    )
    saveDatabase()
    return this.getById(id)!
  }

  update(noteId: string, changes: Partial<Pick<StickyNoteRecord, 'content' | 'color' | 'is_widget'>>): void {
    const note = this.getById(noteId)
    if (!note) return
    const fields: string[] = []
    const values: any[] = []
    for (const [key, value] of Object.entries(changes)) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
    if (fields.length === 0) return
    fields.push('updated_at = ?')
    values.push(Date.now())
    values.push(noteId)
    this.db.run(`UPDATE sticky_notes SET ${fields.join(', ')} WHERE note_id = ?`, values)
    saveDatabase()
  }

  remove(noteId: string): void {
    this.db.run('DELETE FROM sticky_notes WHERE note_id = ?', [noteId])
    saveDatabase()
  }
}
