export interface Category {
  id: number
  name: string
  color: string
  icon: string
  sort_order: number
  created_at: number
  task_count?: number
}

export interface CreateCategoryInput {
  name: string
  color: string
  icon: string
}

export interface UpdateCategoryInput {
  id: number
  name?: string
  color?: string
  icon?: string
  sort_order?: number
}
