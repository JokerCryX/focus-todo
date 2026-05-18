import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)

  async function fetchCategories() {
    loading.value = true
    try {
      categories.value = (await window.api.category.list()) as Category[]
    } finally {
      loading.value = false
    }
  }

  async function createCategory(input: CreateCategoryInput): Promise<Category> {
    const cat = (await window.api.category.create(input)) as Category
    await fetchCategories()
    return cat
  }

  async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
    const cat = (await window.api.category.update(input)) as Category
    await fetchCategories()
    return cat
  }

  async function removeCategory(id: number) {
    await window.api.category.remove(id)
    await fetchCategories()
  }

  async function reorderCategories(ids: number[]) {
    await window.api.category.reorder(ids)
    await fetchCategories()
  }

  function getCategoryById(id: number): Category | undefined {
    return categories.value.find(c => c.id === id)
  }

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    removeCategory,
    reorderCategories,
    getCategoryById
  }
})
