<template>
  <div class="settings-page">
    <h2>{{ $t('settings.title') }}</h2>

    <div class="settings-section">
      <h3>{{ $t('settings.general') }}</h3>
      <div class="setting-item">
        <span>{{ $t('settings.languageLabel') }}</span>
        <div class="theme-toggle">
          <button :class="{ active: currentLang === 'zh-CN' }" @click="changeLang('zh-CN')">简体中文</button>
          <button :class="{ active: currentLang === 'en' }" @click="changeLang('en')">English</button>
        </div>
      </div>
      <div class="setting-item">
        <span>{{ $t('settings.themeLabel') }}</span>
        <div class="theme-toggle">
          <button :class="{ active: settingsStore.theme === 'light' }" @click="settingsStore.setSetting('theme', 'light')">{{ $t('settings.light') }}</button>
          <button :class="{ active: settingsStore.theme === 'dark' }" @click="settingsStore.setSetting('theme', 'dark')">{{ $t('settings.dark') }}</button>
          <button :class="{ active: settingsStore.theme === 'transparent-light' }" @click="settingsStore.setSetting('theme', 'transparent-light')">{{ $t('settings.transparentLight') }}</button>
          <button :class="{ active: settingsStore.theme === 'transparent-dark' }" @click="settingsStore.setSetting('theme', 'transparent-dark')">{{ $t('settings.transparentDark') }}</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>{{ $t('settings.shortcuts') }}</h3>
      <div class="shortcut-list">
        <div v-for="s in settingsStore.shortcuts" :key="s.id" class="shortcut-item">
          <span class="shortcut-label">{{ s.label }}</span>
          <ShortcutRecorder
            :shortcut="s"
            @recorded="keys => onRecorded(s.id, keys)"
            @reset="settingsStore.resetShortcut(s.id)"
          />
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>{{ $t('settings.soundSettings') }}</h3>
      <div class="setting-item">
        <span>{{ $t('settings.soundNew') }}</span>
        <select class="setting-select" v-model="soundNew" @change="saveSound('sound_new', soundNew)">
          <option value="">{{ $t('settings.noSound') }}</option>
          <option v-for="s in soundFiles" :key="s.file" :value="s.file">{{ s.name }}</option>
        </select>
      </div>
      <div class="setting-item">
        <span>{{ $t('settings.soundComplete') }}</span>
        <select class="setting-select" v-model="soundComplete" @change="saveSound('sound_complete', soundComplete)">
          <option value="">{{ $t('settings.noSound') }}</option>
          <option v-for="s in soundFiles" :key="s.file" :value="s.file">{{ s.name }}</option>
        </select>
      </div>
      <div class="setting-item">
        <span>{{ $t('settings.soundRemove') }}</span>
        <select class="setting-select" v-model="soundRemove" @change="saveSound('sound_remove', soundRemove)">
          <option value="">{{ $t('settings.noSound') }}</option>
          <option v-for="s in soundFiles" :key="s.file" :value="s.file">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <div class="settings-section">
      <h3>{{ $t('settings.dataManagement') }}</h3>
      <div class="setting-item">
        <span>{{ $t('settings.dataExport') }}</span>
        <button class="setting-btn" @click="handleExport" :disabled="exporting">
          {{ exporting ? $t('settings.exporting') : $t('settings.exportJson') }}
        </button>
      </div>
      <div class="setting-item">
        <span>{{ $t('settings.dataImport') }}</span>
        <button class="setting-btn" @click="handleImport" :disabled="importing">
          {{ importing ? $t('settings.importing') : $t('settings.importJson') }}
        </button>
      </div>
      <div class="setting-item">
        <span>{{ $t('settings.resetData') }}</span>
        <button class="setting-btn danger" @click="handleReset" :disabled="resetting">
          {{ resetting ? $t('settings.resetting') : $t('settings.resetAll') }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/locales'
import { useSettingsStore } from '@/stores/settings'
import { useTaskStore } from '@/stores/task'
import { useCategoryStore } from '@/stores/category'
import { useTagStore } from '@/stores/tag'
import ShortcutRecorder from '@/components/settings/ShortcutRecorder.vue'

const { t, locale } = useI18n()
const currentLang = computed(() => locale.value)

const settingsStore = useSettingsStore()
const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()

const exporting = ref(false)
const importing = ref(false)
const resetting = ref(false)

const soundFiles = ref<{ name: string; file: string }[]>([])
const soundNew = ref('')
const soundComplete = ref('')
const soundRemove = ref('')

async function loadSoundSettings() {
  soundFiles.value = await window.api.sound.list()
  soundNew.value = (await window.api.settings.get('sound_new')) || ''
  soundComplete.value = (await window.api.settings.get('sound_complete')) || ''
  soundRemove.value = (await window.api.settings.get('sound_remove')) || ''
}

function saveSound(key: string, value: string) {
  window.api.settings.set(key, value)
  taskStore.loadSoundCache()
  if (value) window.api.sound.play(value)
}

loadSoundSettings()

async function changeLang(lang: string) {
  await setLanguage(lang)
  location.reload()
}

function onRecorded(id: string, keys: string) {
  const conflict = settingsStore.checkConflict(id, keys)
  if (conflict) {
    alert(t('settings.shortcutConflict', { keys, conflict }))
    return
  }
  settingsStore.saveShortcut(id, keys)
}

async function handleExport() {
  exporting.value = true
  try {
    const result = await window.api.data.export()
    if (result.success) {
      alert(t('settings.exportSuccess'))
    }
  } finally {
    exporting.value = false
  }
}

async function handleImport() {
  if (!confirm(t('settings.importConfirm'))) return

  importing.value = true
  try {
    const result = await window.api.data.import()
    if (result.success) {
      await Promise.all([
        settingsStore.loadSettings(),
        categoryStore.fetchCategories(),
        tagStore.fetchTags(),
        taskStore.fetchTasks()
      ])
      alert(t('settings.importSuccess'))
    } else if (result.errors) {
      alert(t('settings.importFail', { errors: result.errors.join('\n') }))
    }
  } finally {
    importing.value = false
  }
}

async function handleReset() {
  if (!confirm(t('settings.resetConfirm1'))) return
  if (!confirm(t('settings.resetConfirm2'))) return

  resetting.value = true
  try {
    await window.api.data.reset()
    await Promise.all([
      settingsStore.loadSettings(),
      categoryStore.fetchCategories(),
      tagStore.fetchTags(),
      taskStore.fetchTasks()
    ])
    alert(t('settings.resetSuccess'))
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped>
.settings-page {
  padding: var(--spacing-xl);
  max-width: 600px;
}

.settings-page h2 {
  font-size: var(--font-2xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xl);
}

.settings-section {
  margin-bottom: var(--spacing-xl);
}

.settings-section h3 {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-md);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-secondary);
  color: var(--text-primary);
  font-size: var(--font-md);
}

.theme-toggle {
  display: flex;
  gap: 4px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.theme-toggle button {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-toggle button.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.setting-btn {
  padding: 6px 14px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
}

.setting-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-btn.danger {
  border-color: var(--danger);
  color: var(--danger);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-secondary);
  position: relative;
}

.shortcut-label {
  font-size: var(--font-md);
  color: var(--text-primary);
}

.setting-select {
  height: 28px;
  padding: 0 24px 0 10px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  font-family: var(--font-family);
  cursor: pointer;
  outline: none;
  transition: all var(--transition-fast);
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%239ca3af' stroke-width='1.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  max-width: 160px;
}

.setting-select:hover {
  border-color: var(--accent-primary);
  color: var(--text-primary);
}

.setting-select:focus {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-accent);
}
</style>
