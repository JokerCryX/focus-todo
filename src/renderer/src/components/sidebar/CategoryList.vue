<template>
  <div class="category-list" @click="closeMenu" @contextmenu="closeMenu">
    <div
      v-for="cat in categories"
      :key="cat.id"
      class="category-item"
      :class="{ active: isActive(cat.id) }"
      @click="navigateTo(cat.id)"
      @contextmenu.prevent.stop="onContextMenu($event, cat)"
      @dblclick="$emit('edit', cat)"
    >
      <span class="cat-icon">{{ cat.icon }}</span>
      <span class="cat-name">{{ cat.name }}</span>
      <span class="cat-count">{{ getCount(cat.id) }}</span>
    </div>

    <Teleport to="body">
      <div
        v-if="menuVisible"
        class="ctx-menu"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
        @click.stop
      >
        <div class="ctx-item" @click="onEdit">{{ $t('common.edit') }}</div>
        <div class="ctx-item danger" @click="onDelete">{{ $t('common.delete') }}</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCategoryStore } from '@/stores/category'
import type { Category } from '@/types/category'

const emit = defineEmits<{ edit: [cat: Category] }>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const categories = computed(() => categoryStore.categories)
const taskCounts = ref<Record<number, number>>({})

async function loadCounts() {
  taskCounts.value = await window.api.category.counts()
}

function getCount(catId: number): number {
  return taskCounts.value[catId] || 0
}

onMounted(loadCounts)
watch(() => categoryStore.categories, loadCounts, { deep: true })

const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuCat = ref<Category | null>(null)

function isActive(id: number): boolean {
  return route.name === 'category' && Number(route.params.id) === id
}

function navigateTo(id: number) {
  router.push(`/category/${id}`)
}

function onContextMenu(e: MouseEvent, cat: Category) {
  menuX.value = e.clientX
  menuY.value = e.clientY
  menuCat.value = cat
  menuVisible.value = true
}

function closeMenu() {
  menuVisible.value = false
}

function onEdit() {
  if (menuCat.value) emit('edit', menuCat.value)
  closeMenu()
}

async function onDelete() {
  if (!menuCat.value) return
  const name = menuCat.value.name
  if (!confirm(t('category.deleteConfirm', { name }))) {
    closeMenu()
    return
  }
  await categoryStore.removeCategory(menuCat.value.id)
  if (isActive(menuCat.value.id)) {
    router.push('/inbox')
  }
  closeMenu()
}
</script>

<style scoped>
.category-list {
  padding: 0;
}

.category-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px var(--spacing-lg);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.category-item:hover {
  background: var(--bg-hover);
}

.category-item.active {
  background: var(--bg-active);
  color: var(--text-primary);
  font-weight: 500;
}

.cat-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
}

.cat-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-count {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  min-width: 18px;
  text-align: center;
}

.ctx-menu {
  position: fixed;
  z-index: 9999;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 120px;
}

.ctx-item {
  padding: 6px 16px;
  font-size: var(--font-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.ctx-item:hover {
  background: var(--bg-hover);
}

.ctx-item.danger {
  color: var(--danger);
}
</style>
