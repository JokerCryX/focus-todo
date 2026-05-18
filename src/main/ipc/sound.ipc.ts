import { ipcMain } from 'electron'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { exec } from 'child_process'

function getSoundDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'sound')
  }
  return join(__dirname, '../../sound')
}

export function registerSoundIPC(): void {
  ipcMain.handle('sound:list', () => {
    const dir = getSoundDir()
    try {
      return readdirSync(dir)
        .filter(f => f.endsWith('.wav'))
        .map(f => ({ name: f.replace(/\.wav$/, ''), file: f }))
    } catch {
      return []
    }
  })

  ipcMain.handle('sound:play', (_e, file: string) => {
    const dir = getSoundDir()
    const path = join(dir, file).replace(/\\/g, '/')
    try {
      exec(`powershell -NoProfile -NonInteractive -Command "$s=New-Object Media.SoundPlayer '${path}';$s.PlaySync()`, { windowsHide: true })
    } catch {}
  })

  ipcMain.handle('sound:buffer', (_e, file: string) => {
    const dir = getSoundDir()
    const buf = readFileSync(join(dir, file))
    return new Uint8Array(buf).buffer
  })
}
