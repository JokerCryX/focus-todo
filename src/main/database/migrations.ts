import type { Database } from 'sql.js'

const DEFAULT_CATEGORIES = [
  { name: '工作', color: '#4A90D9', icon: '💼', sort_order: 0 },
  { name: '学习', color: '#F5A623', icon: '📚', sort_order: 1 },
  { name: '生活', color: '#7ED321', icon: '🏠', sort_order: 2 },
  { name: '健康', color: '#D0021B', icon: '❤️', sort_order: 3 }
]

export function runMigrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id         TEXT UNIQUE NOT NULL,
      title           TEXT NOT NULL,
      description     TEXT DEFAULT '',
      due_date        INTEGER,
      reminder_time   INTEGER,
      category_id     INTEGER,
      tags            TEXT DEFAULT '[]',
      priority        INTEGER DEFAULT 0,
      sort_order      INTEGER DEFAULT 0,
      complete        INTEGER DEFAULT 0,
      is_deleted      INTEGER DEFAULT 0,
      repeat_rule     TEXT DEFAULT NULL,
      subtasks        TEXT DEFAULT NULL,
      files           TEXT DEFAULT '[]',
      created_at      INTEGER NOT NULL,
      updated_at      INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL UNIQUE,
      color       TEXT NOT NULL DEFAULT '#4A90D9',
      icon        TEXT DEFAULT 'folder',
      sort_order  INTEGER DEFAULT 0,
      created_at  INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS tomato_records (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      tomato_id       TEXT UNIQUE NOT NULL,
      start_time      INTEGER NOT NULL,
      end_time        INTEGER NOT NULL,
      focus_duration  INTEGER NOT NULL,
      rest_duration   INTEGER NOT NULL,
      is_focus        INTEGER DEFAULT 1,
      task_id         TEXT,
      task_title      TEXT,
      created_at      INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS widgets (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      widget_id       TEXT UNIQUE NOT NULL,
      type            TEXT NOT NULL DEFAULT 'todo',
      x               INTEGER DEFAULT 100,
      y               INTEGER DEFAULT 100,
      width           INTEGER DEFAULT 300,
      height          INTEGER DEFAULT 400,
      always_on_top   INTEGER DEFAULT 0,
      opacity         INTEGER DEFAULT 100,
      background_color TEXT DEFAULT '#FFFFFF',
      category_id     INTEGER,
      selected_date   TEXT,
      config          TEXT DEFAULT '{}',
      created_at      INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key     TEXT PRIMARY KEY,
      value   TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS sticky_notes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id     TEXT UNIQUE NOT NULL,
      content     TEXT DEFAULT '',
      color       TEXT DEFAULT '#FFF9C4',
      is_widget   INTEGER DEFAULT 0,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )
  `)

  // 索引
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)')
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_complete ON tasks(complete)')
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(is_deleted)')
  db.run('CREATE INDEX IF NOT EXISTS idx_tomato_created ON tomato_records(created_at)')

  // 检查是否已有分类数据，没有则插入默认分类
  const result = db.exec('SELECT COUNT(*) as cnt FROM categories')
  const count = result[0]?.values[0]?.[0] as number
  if (count === 0) {
    const now = Date.now()
    for (const cat of DEFAULT_CATEGORIES) {
      db.run(
        'INSERT INTO categories (name, color, icon, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
        [cat.name, cat.color, cat.icon, cat.sort_order, now]
      )
    }
  }
}
