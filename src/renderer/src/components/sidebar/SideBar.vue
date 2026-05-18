<template>
  <aside class="sidebar">
    <NavItems />
    <div class="sidebar-section-title">
      <span>{{ $t('nav.categories') }}</span>
      <button class="add-btn" @click="showCategoryDialog = true" :title="$t('nav.newCategory')">+</button>
    </div>
    <CategoryList @edit="editCategory" />
    <div class="sidebar-actions">
      <button class="sidebar-item" :class="{ active: widgetOpen }" @click="toggleWidget" :title="$t('widget.manage')">
        <span class="icon">🧩</span>
        <span>{{ $t('nav.widget') }}</span>
      </button>
      <router-link to="/statistics" class="sidebar-item" active-class="active">
        <span class="icon">📊</span>
        <span>{{ $t('nav.statistics') }}</span>
      </router-link>
      <router-link to="/trash" class="sidebar-item" active-class="active">
        <span class="icon">🗑️</span>
        <span>{{ $t('nav.trash') }}</span>
      </router-link>
    </div>
    <div class="sidebar-bottom">
      <router-link to="/settings" class="sidebar-item" active-class="active">
        <span class="icon">⚙️</span>
        <span>{{ $t('nav.settings') }}</span>
      </router-link>
    </div>
    <CategoryEditDialog
      v-if="showCategoryDialog"
      :category="editingCategory"
      @close="showCategoryDialog = false; editingCategory = null"
      @saved="showCategoryDialog = false; editingCategory = null"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import NavItems from './NavItems.vue'
import CategoryList from './CategoryList.vue'
import CategoryEditDialog from './CategoryEditDialog.vue'
import type { Category } from '@/types/category'

const showCategoryDialog = ref(false)
const editingCategory = ref<Category | null>(null)
const widgetOpen = ref(false)

async function toggleWidget() {
  widgetOpen.value = await window.api.widget.toggle()
}

window.api.widget.isOpen().then(v => widgetOpen.value = v)

function editCategory(cat: Category) {
  editingCategory.value = cat
  showCategoryDialog.value = true
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-secondary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-xs);
  font-size: 10.5px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.add-btn {
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 15px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.add-btn:hover {
  background: var(--bg-hover);
  color: var(--accent-primary);
}

.sidebar-actions {
  margin-top: auto;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-secondary);
}

.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid var(--border-secondary);
  height: 48px;
  display: flex;
  align-items: center;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
  width: 100%;
  border: none;
  background: none;
  font-family: var(--font-family);
  text-align: left;
}

.sidebar-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: var(--bg-active);
  color: var(--accent-primary);
  font-weight: 500;
}

.icon {
  font-size: 15px;
  width: 20px;
  text-align: center;
}
</style>
