import type { IpcAPI } from '../renderer/src/types/ipc'

declare global {
  interface Window {
    api: IpcAPI & {
      on: (channel: string, callback: (...args: any[]) => void) => void
    }
  }
}
