import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface ShortcutBinding {
  id: string
  label: string
  keys: string
  defaultKeys: string
}

const defaultShortcuts: ShortcutBinding[] = [
  { id: 'new_task', label: '新建任务', keys: 'Ctrl+N', defaultKeys: 'Ctrl+N' },
  { id: 'search', label: '搜索', keys: 'Ctrl+F', defaultKeys: 'Ctrl+F' },
  { id: 'tomato', label: '开始/暂停番茄钟', keys: 'Ctrl+T', defaultKeys: 'Ctrl+T' },
  { id: 'theme', label: '切换主题', keys: 'Ctrl+D', defaultKeys: 'Ctrl+D' },
  { id: 'hide_window', label: '显示/隐藏窗口', keys: 'Ctrl+Shift+H', defaultKeys: 'Ctrl+Shift+H' }
]

export const useSettingsStore = defineStore('settings', () => {
  type ThemeKey = 'light' | 'dark' | 'transparent-dark' | 'transparent-light'
  const theme = ref<ThemeKey>('light')
  const settings = ref<Record<string, string>>({})

  const shortcuts = ref<ShortcutBinding[]>([])

  async function loadSettings() {
    settings.value = await window.api.settings.getAll()
    if (settings.value['theme']) {
      theme.value = settings.value['theme'] as ThemeKey
      // 兼容旧版 'transparent' 值
      if (theme.value === 'transparent' as any) theme.value = 'transparent-dark'
    }
    applyTheme()
    defaultSort.value = settings.value['default_sort'] || 'reminder'
    loadShortcuts()
  }

  function loadShortcuts() {
    const saved = settings.value['shortcuts']
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, string>
        shortcuts.value = defaultShortcuts.map(s => ({
          ...s,
          keys: parsed[s.id] || s.defaultKeys
        }))
      } catch {
        shortcuts.value = defaultShortcuts.map(s => ({ ...s }))
      }
    } else {
      shortcuts.value = defaultShortcuts.map(s => ({ ...s }))
    }
  }

  async function saveShortcut(id: string, keys: string) {
    const binding = shortcuts.value.find(s => s.id === id)
    if (binding) binding.keys = keys
    const map: Record<string, string> = {}
    for (const s of shortcuts.value) {
      map[s.id] = s.keys
    }
    await setSetting('shortcuts', JSON.stringify(map))
    ;(window as any).api.send?.('shortcuts:updated')
  }

  function resetShortcut(id: string) {
    const def = defaultShortcuts.find(s => s.id === id)
    if (def) saveShortcut(id, def.defaultKeys)
  }

  function checkConflict(id: string, keys: string): string | null {
    const conflict = shortcuts.value.find(s => s.id !== id && s.keys === keys)
    return conflict ? conflict.label : null
  }

  async function setSetting(key: string, value: string) {
    await window.api.settings.set(key, value)
    settings.value[key] = value
    if (key === 'theme') {
      theme.value = value as ThemeKey
      applyTheme()
    }
  }

  function applyTheme() {
    document.documentElement.className = theme.value
    window.api.window.setBackgroundColor('#00000000')
    window.api.send('theme:changed')
  }

  function toggleTheme() {
    const order: ThemeKey[] = ['light', 'dark', 'transparent-dark', 'transparent-light']
    const idx = order.indexOf(theme.value)
    setSetting('theme', order[(idx + 1) % order.length])
  }

  const defaultSort = ref('reminder')

  async function setDefaultSort(value: string) {
    defaultSort.value = value
    await setSetting('default_sort', value)
  }

  return {
    theme, settings, defaultSort, shortcuts,
    loadSettings, setSetting, toggleTheme, setDefaultSort,
    saveShortcut, resetShortcut, checkConflict
  }
})
