import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilter } from './task'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from './category'
import type { Tag } from './tag'

export interface IpcAPI {
  task: {
    list(filter: TaskFilter): Promise<Task[]>
    create(input: CreateTaskInput): Promise<Task>
    update(input: UpdateTaskInput): Promise<Task>
    remove(taskId: string): Promise<void>
    batchUpdate(taskIds: string[], updates: Partial<UpdateTaskInput>): Promise<void>
    batchRemove(taskIds: string[]): Promise<void>
    restore(taskId: string): Promise<void>
    permanentDelete(taskId: string): Promise<void>
    emptyTrash(): Promise<void>
  }
  category: {
    list(): Promise<Category[]>
    create(input: CreateCategoryInput): Promise<Category>
    update(input: UpdateCategoryInput): Promise<Category>
    remove(id: number): Promise<void>
    reorder(ids: number[]): Promise<void>
  }
  tag: {
    list(): Promise<Tag[]>
    rename(oldName: string, newName: string): Promise<void>
    remove(name: string): Promise<void>
  }
  settings: {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
    getAll(): Promise<Record<string, string>>
  }
  window: {
    minimize(): Promise<void>
    maximize(): Promise<void>
    close(): Promise<void>
  }
  data: {
    export(): Promise<{ success: boolean; reason?: string }>
    reset(): Promise<{ success: boolean }>
  }
}

declare global {
  interface Window {
    api: IpcAPI
  }
}
