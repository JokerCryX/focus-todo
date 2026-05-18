import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Tag } from '@/types/tag'

export const useTagStore = defineStore('tag', () => {
  const tags = ref<Tag[]>([])

  async function fetchTags() {
    tags.value = (await window.api.tag.list()) as Tag[]
  }

  async function renameTag(oldName: string, newName: string) {
    await window.api.tag.rename(oldName, newName)
    await fetchTags()
  }

  async function removeTag(name: string) {
    await window.api.tag.remove(name)
    await fetchTags()
  }

  return { tags, fetchTags, renameTag, removeTag }
})
