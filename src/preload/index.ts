import { contextBridge, ipcRenderer } from 'electron'

const api = {
  task: {
    list: (filter: any) => ipcRenderer.invoke('task:list', filter),
    create: (input: any) => ipcRenderer.invoke('task:create', input),
    update: (input: any) => ipcRenderer.invoke('task:update', input),
    remove: (taskId: string) => ipcRenderer.invoke('task:remove', taskId),
    restore: (taskId: string) => ipcRenderer.invoke('task:restore', taskId),
    permanentDelete: (taskId: string) => ipcRenderer.invoke('task:permanentDelete', taskId),
    emptyTrash: () => ipcRenderer.invoke('task:emptyTrash'),
    batchUpdate: (taskIds: string[], updates: any) => ipcRenderer.invoke('task:batchUpdate', taskIds, updates),
    batchRemove: (taskIds: string[]) => ipcRenderer.invoke('task:batchRemove', taskIds),
    searchAll: () => ipcRenderer.invoke('task:searchAll'),
    listByDateRange: (startMs: number, endMs: number) => ipcRenderer.invoke('task:listByDateRange', startMs, endMs)
  },
  category: {
    list: () => ipcRenderer.invoke('category:list'),
    counts: () => ipcRenderer.invoke('category:counts'),
    create: (input: any) => ipcRenderer.invoke('category:create', input),
    update: (input: any) => ipcRenderer.invoke('category:update', input),
    remove: (id: number) => ipcRenderer.invoke('category:remove', id),
    reorder: (ids: number[]) => ipcRenderer.invoke('category:reorder', ids)
  },
  tag: {
    list: () => ipcRenderer.invoke('tag:list'),
    rename: (oldName: string, newName: string) => ipcRenderer.invoke('tag:rename', oldName, newName),
    remove: (name: string) => ipcRenderer.invoke('tag:remove', name)
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll')
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', flag),
    isAlwaysOnTop: () => ipcRenderer.invoke('window:isAlwaysOnTop'),
    resize: (width: number, height: number) => ipcRenderer.invoke('window:resize', width, height),
    setBackgroundColor: (color: string) => ipcRenderer.invoke('window:setBackgroundColor', color)
  },
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    import: () => ipcRenderer.invoke('data:import'),
    reset: () => ipcRenderer.invoke('data:reset')
  },
  tomato: {
    create: (input: any) => ipcRenderer.invoke('tomato:create', input),
    list: (limit?: number) => ipcRenderer.invoke('tomato:list', limit),
    todayCount: () => ipcRenderer.invoke('tomato:todayCount'),
    todayFocusMinutes: () => ipcRenderer.invoke('tomato:todayFocusMinutes'),
    recentDays: (days: number) => ipcRenderer.invoke('tomato:recentDays', days),
    remove: (tomatoId: string) => ipcRenderer.invoke('tomato:remove', tomatoId)
  },
  stats: {
    taskCompletionTrend: (days: number) => ipcRenderer.invoke('stats:taskCompletionTrend', days),
    taskCreationTrend: (days: number) => ipcRenderer.invoke('stats:taskCreationTrend', days),
    taskCompletionRate: () => ipcRenderer.invoke('stats:taskCompletionRate'),
    taskCategoryDistribution: () => ipcRenderer.invoke('stats:taskCategoryDistribution'),
    taskPriorityDistribution: () => ipcRenderer.invoke('stats:taskPriorityDistribution'),
    taskOverdueCount: () => ipcRenderer.invoke('stats:taskOverdueCount'),
    taskWeekComparison: () => ipcRenderer.invoke('stats:taskWeekComparison'),
    taskCumulativeCompletion: () => ipcRenderer.invoke('stats:taskCumulativeCompletion'),
    tomatoStreak: () => ipcRenderer.invoke('stats:tomatoStreak'),
    tomatoWeeklyComparison: () => ipcRenderer.invoke('stats:tomatoWeeklyComparison'),
    tomatoMonthlyHeatmap: () => ipcRenderer.invoke('stats:tomatoMonthlyHeatmap')
  },
  noise: {
    scenes: () => ipcRenderer.invoke('noise:scenes'),
    playing: () => ipcRenderer.invoke('noise:playing'),
    play: (id: string, volume: number) => ipcRenderer.invoke('noise:play', id, volume),
    stop: (id: string) => ipcRenderer.invoke('noise:stop', id),
    volume: (id: string, vol: number) => ipcRenderer.invoke('noise:volume', id, vol),
    stopAll: () => ipcRenderer.invoke('noise:stopAll')
  },
  attachment: {
    select: () => ipcRenderer.invoke('attachment:select'),
    copy: (taskId: string, filePath: string) => ipcRenderer.invoke('attachment:copy', taskId, filePath),
    read: (filePath: string) => ipcRenderer.invoke('attachment:read', filePath),
    delete: (filePath: string) => ipcRenderer.invoke('attachment:delete', filePath),
    saveClipboard: (taskId: string) => ipcRenderer.invoke('attachment:saveClipboard', taskId)
  },
  widget: {
    list: () => ipcRenderer.invoke('widget:list'),
    create: (type: string) => ipcRenderer.invoke('widget:create', type),
    update: (id: string, changes: any) => ipcRenderer.invoke('widget:update', id, changes),
    remove: (id: string) => ipcRenderer.invoke('widget:remove', id),
    openTaskInMain: (taskId: string) => ipcRenderer.invoke('widget:openTaskInMain', taskId),
    getConfig: (id: string) => ipcRenderer.invoke('widget:getConfig', id),
    toggle: () => ipcRenderer.invoke('widget:toggle'),
    isOpen: () => ipcRenderer.invoke('widget:isOpen')
  },
  sound: {
    list: () => ipcRenderer.invoke('sound:list'),
    play: (file: string) => ipcRenderer.invoke('sound:play', file),
    buffer: (file: string) => ipcRenderer.invoke('sound:buffer', file)
  },
  popup: {
    openTask: (taskId: string, options?: { mode?: string, dueDate?: number }) => ipcRenderer.invoke('popup:openTask', taskId, options),
    close: () => ipcRenderer.invoke('popup:close')
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback as any)
  },
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args)
  }
}

contextBridge.exposeInMainWorld('api', api)
