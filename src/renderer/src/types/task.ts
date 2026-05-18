export interface Task {
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
  subtasks: SubTask[] | null
  files: Attachment[]
  created_at: number
  updated_at: number
}

export interface SubTask {
  id: string
  title: string
  complete: boolean
  parent_id?: string
}

export interface Attachment {
  name: string
  path: string
  size: number
  type: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  due_date?: number | null
  reminder_time?: number | null
  category_id?: number | null
  tags?: string[]
  priority?: number
}

export interface UpdateTaskInput {
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
  subtasks?: SubTask[] | null
  files?: Attachment[]
}

export interface TaskFilter {
  view: 'inbox' | 'today' | 'recent' | 'completed' | 'trash' | 'category'
  category_id?: number
  sort_by?: string
  search?: string
}
