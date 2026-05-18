import { ipcMain } from 'electron'
import { readdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

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
    const { exec } = require('child_process')
    try {
      exec(`powershell -c "$s=New-Object Media.SoundPlayer '${path}';$s.Play();Start-Sleep -Milliseconds 500"`, { windowsHide: true })
    } catch {}
  })
}
