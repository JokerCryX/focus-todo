const messages: Record<string, Record<string, string>> = {
  'zh-CN': {
    'tray.show': '显示窗口',
    'tray.newTask': '新建任务',
    'tray.quit': '退出',
    'tray.tomato': '开始番茄钟',
    'tray.todoWidget': '待办组件'
  },
  'en': {
    'tray.show': 'Show Window',
    'tray.newTask': 'New Task',
    'tray.quit': 'Quit',
    'tray.tomato': 'Start Pomodoro',
    'tray.todoWidget': 'Todo Widget'
  }
}

let currentLang = 'zh-CN'

export function setMainLocale(lang: string): void {
  currentLang = lang
}

export function t(key: string): string {
  return messages[currentLang]?.[key] || messages['zh-CN']?.[key] || key
}
