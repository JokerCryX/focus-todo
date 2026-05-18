const VALID_TABLES = ['tasks', 'categories', 'tomato_records', 'widgets', 'app_settings']

export const TABLE_COLUMNS: Record<string, string[]> = {
  tasks: ['id', 'task_id', 'title', 'description', 'due_date', 'reminder_time', 'category_id', 'tags', 'priority', 'sort_order', 'complete', 'is_deleted', 'repeat_rule', 'subtasks', 'files', 'created_at', 'updated_at'],
  categories: ['id', 'name', 'color', 'icon', 'sort_order', 'created_at'],
  tomato_records: ['id', 'tomato_id', 'start_time', 'end_time', 'focus_duration', 'rest_duration', 'is_focus', 'task_id', 'task_title', 'created_at'],
  widgets: ['id', 'widget_id', 'type', 'x', 'y', 'width', 'height', 'always_on_top', 'opacity', 'background_color', 'category_id', 'selected_date', 'config', 'created_at'],
  app_settings: ['key', 'value']
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateImportData(data: any): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['导入文件格式无效'] }
  }

  const tables = Object.keys(data).filter(k => k !== '_meta')
  const unknownTables = tables.filter(t => !VALID_TABLES.includes(t))
  if (unknownTables.length > 0) {
    errors.push(`未知的表: ${unknownTables.join(', ')}`)
  }

  for (const table of tables) {
    if (!VALID_TABLES.includes(table)) continue
    const rows = data[table]
    if (!Array.isArray(rows)) {
      errors.push(`表 ${table} 数据格式错误，应为数组`)
      continue
    }
    const expectedCols = TABLE_COLUMNS[table]
    if (!expectedCols) continue
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || typeof row !== 'object') {
        errors.push(`表 ${table} 第 ${i + 1} 行格式错误`)
        continue
      }
      const missingCols = expectedCols.filter(c => !(c in row))
      if (missingCols.length > 0) {
        errors.push(`表 ${table} 第 ${i + 1} 行缺少列: ${missingCols.join(', ')}`)
      }
      const extraCols = Object.keys(row).filter(c => !expectedCols.includes(c))
      if (extraCols.length > 0) {
        errors.push(`表 ${table} 第 ${i + 1} 行含未知列: ${extraCols.join(', ')}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
