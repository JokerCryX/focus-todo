import { BrowserWindow } from 'electron'

interface PlayingTrack {
  id: string
  volume: number
}

const tracks = new Map<string, PlayingTrack>()
let audioInitialized = false

const SCENES = [
  { id: 'cafe', name: '咖啡馆' },
  { id: 'forest', name: '森林' },
  { id: 'rain', name: '雨声' },
  { id: 'ocean', name: '海浪' },
  { id: 'thunder', name: '雷电' },
  { id: 'train', name: '火车' },
  { id: 'street', name: '街道' },
  { id: 'cave', name: '洞穴' },
  { id: 'fire', name: '火声' },
  { id: 'wind', name: '风声' }
]

export function getScenes() {
  return SCENES
}

export function getPlayingTracks() {
  return Array.from(tracks.values())
}

export function playScene(win: BrowserWindow, id: string, volume: number) {
  tracks.set(id, { id, volume })
  win.webContents.send('noise:state', getPlayingTracks())
}

export function stopScene(win: BrowserWindow, id: string) {
  tracks.delete(id)
  win.webContents.send('noise:state', getPlayingTracks())
}

export function setVolume(win: BrowserWindow, id: string, volume: number) {
  const track = tracks.get(id)
  if (track) {
    track.volume = volume
    win.webContents.send('noise:state', getPlayingTracks())
  }
}

export function stopAll(win: BrowserWindow) {
  tracks.clear()
  win.webContents.send('noise:state', getPlayingTracks())
}
