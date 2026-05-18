import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useTaskStore } from '@/stores/task'
import { useUIStore } from '@/stores/ui'
import { useTomatoStore } from '@/stores/tomato'

function parseKeys(keys: string): { ctrl: boolean; shift: boolean; alt: boolean; key: string } {
  const parts = keys.split('+').map(p => p.trim())
  return {
    ctrl: parts.includes('Ctrl'),
    shift: parts.includes('Shift'),
    alt: parts.includes('Alt'),
    key: parts[parts.length - 1]
  }
}

function matchShortcut(e: KeyboardEvent, binding: string): boolean {
  const parsed = parseKeys(binding)
  return (
    e.ctrlKey === parsed.ctrl &&
    e.shiftKey === parsed.shift &&
    e.altKey === parsed.alt &&
    e.key.toLowerCase() === parsed.key.toLowerCase()
  )
}

export function useShortcuts() {
  const router = useRouter()
  const settingsStore = useSettingsStore()
  const taskStore = useTaskStore()
  const uiStore = useUIStore()
  const tomatoStore = useTomatoStore()

  function handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

    for (const s of settingsStore.shortcuts) {
      if (matchShortcut(e, s.keys)) {
        e.preventDefault()
        executeAction(s.id)
        return
      }
    }
  }

  async function executeAction(id: string) {
    switch (id) {
      case 'new_task': {
        const task = await taskStore.createTask({ title: '' })
        uiStore.openEditor(task)
        break
      }
      case 'search':
        router.push('/search')
        break
      case 'tomato':
        if (tomatoStore.phase === 'idle') {
          tomatoStore.startFocus()
        } else {
          tomatoStore.togglePause()
        }
        break
      case 'theme':
        settingsStore.toggleTheme()
        break
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown, true)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown, true)
  })
}
