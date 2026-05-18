import { ipcMain, BrowserWindow } from 'electron'
import { getScenes, playScene, stopScene, setVolume, stopAll, getPlayingTracks } from '../audio-player'

export function registerNoiseIPC(): void {
  ipcMain.handle('noise:scenes', () => getScenes())
  ipcMain.handle('noise:playing', () => getPlayingTracks())

  ipcMain.handle('noise:play', (e, id: string, volume: number) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win) playScene(win, id, volume)
  })

  ipcMain.handle('noise:stop', (e, id: string) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win) stopScene(win, id)
  })

  ipcMain.handle('noise:volume', (e, id: string, volume: number) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win) setVolume(win, id, volume)
  })

  ipcMain.handle('noise:stopAll', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win) stopAll(win)
  })
}
