<template>
  <div class="app-layout" :class="{ 'focus-note': uiStore.focusNoteMode }">
    <TitleBar />
    <div class="app-body">
      <SideBar v-show="!uiStore.focusNoteMode" />
      <div class="main-content">
        <div class="content-row">
          <div class="content-scroll" @click="onMainClick($event)">
            <router-view />
          </div>
          <Transition name="editor">
            <TaskEditor v-if="uiStore.editorVisible" />
          </Transition>
        </div>
        <TomatoBar v-show="!uiStore.focusNoteMode && route.name !== 'calendar'" />
      </div>
    </div>
    <Transition name="backdrop">
      <div v-if="popupActive" class="popup-backdrop" @click="onBackdropClick" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import TitleBar from '@/components/titlebar/TitleBar.vue'
import SideBar from '@/components/sidebar/SideBar.vue'
import TaskEditor from '@/components/editor/TaskEditor.vue'
import TomatoBar from '@/components/tomato/TomatoBar.vue'
import { useCategoryStore } from '@/stores/category'
import { useTagStore } from '@/stores/tag'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useTaskStore } from '@/stores/task'
import { useShortcuts } from '@/composables/useShortcuts'

const uiStore = useUIStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()
const settingsStore = useSettingsStore()
const taskStore = useTaskStore()
const route = useRoute()

useShortcuts()

const popupActive = ref(false)

function onPopupOpened() {
  popupActive.value = true
}

function onPopupClosed() {
  popupActive.value = false
}

async function onBackdropClick() {
  await window.api.popup.close()
}

watch(() => route.fullPath, () => {
  if (uiStore.editorVisible) {
    uiStore.closeEditor()
  }
})

function onWidgetOpenTask(taskId: string) {
  uiStore.openEditor(taskId)
}

function onTaskChanged() {
  taskStore.fetchTasks()
}

onMounted(async () => {
  await settingsStore.loadSettings()
  await categoryStore.fetchCategories()
  await tagStore.fetchTags()
  window.api.on('widget:open-task', onWidgetOpenTask)
  window.api.on('task:changed', onTaskChanged)
  window.api.on('popup:opened', onPopupOpened)
  window.api.on('popup:closed', onPopupClosed)
})

onUnmounted(() => {
  window.api.removeListener?.('widget:open-task', onWidgetOpenTask)
  window.api.removeListener?.('task:changed', onTaskChanged)
  window.api.removeListener?.('popup:opened', onPopupOpened)
  window.api.removeListener?.('popup:closed', onPopupClosed)
})

function onMainClick(e: MouseEvent) {
  if (!uiStore.editorVisible) return
  const target = e.target as HTMLElement
  if (target.closest('.task-card')) return
  uiStore.closeEditor()
}
</script>

<style scoped>
.app-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 9px;
  background: var(--bg-primary);
  box-shadow: var(--shadow-window, none);
  position: relative;
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
  min-width: 0;
}

.content-row {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
}

.editor-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.editor-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.editor-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.editor-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.popup-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  z-index: 100;
  cursor: pointer;
  border-radius: 9px;
}

.backdrop-enter-active {
  transition: opacity 0.2s ease;
}

.backdrop-leave-active {
  transition: opacity 0.15s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>
