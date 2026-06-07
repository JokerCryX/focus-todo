<template>
  <div class="noise-panel">
    <div class="noise-header">
      <span class="noise-title">{{ $t('tomato.whiteNoise') }}</span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="noise-grid">
      <div
        v-for="scene in scenes"
        :key="scene.id"
        class="noise-card"
        :class="{ playing: isPlaying(scene.id), loading: loadingId === scene.id }"
        @click="toggleScene(scene.id)"
      >
        <span class="noise-icon">{{ sceneIcons[scene.id] || '🎵' }}</span>
        <span class="noise-name">{{ scene.name }}</span>
        <div v-if="isPlaying(scene.id)" class="noise-volume">
          <input
            type="range" min="0" max="100"
            :value="getVolume(scene.id)"
            @input.stop="setVolume(scene.id, ($event.target as HTMLInputElement).value)"
            @click.stop
          />
        </div>
      </div>
    </div>
    <div v-if="hasPlaying" class="noise-footer">
      <button class="stop-all" @click="stopAll">{{ $t('tomato.stopAll') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

defineEmits<{ (e: 'close'): void }>()

const sceneIcons: Record<string, string> = {
  cafe: '☕', forest: '🌲', rain: '🌧️', ocean: '🌊',
  thunder: '⛈️', train: '🚂', street: '🏙️', cave: '🕳️',
  fire: '🔥', wind: '💨'
}

// 场景音频源文件名（对应 public/audio/ 下的文件）
const audioFiles: Record<string, string> = {
  fire: 'fire.mp3'
}

// 静态场景列表
const scenes = [
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

// 模块级：Audio 实例 + Blob URL 缓存 + 播放状态（组件卸载后音频继续）
const audioMap = new Map<string, HTMLAudioElement>()
const blobUrlCache = new Map<string, string>()
const playingState = reactive<Record<string, number>>({})
const loadingId = computed(() => '')

const hasPlaying = computed(() => Object.keys(playingState).length > 0)

function isPlaying(id: string): boolean {
  return id in playingState
}

function getVolume(id: string): number {
  return playingState[id] ?? 50
}

// 通过 IPC 从主进程读取音频二进制，转 Blob URL
async function loadAudioUrl(id: string): Promise<string | null> {
  if (blobUrlCache.has(id)) return blobUrlCache.get(id)!
  const file = audioFiles[id]
  if (!file) return null
  try {
    const buffer: ArrayBuffer = await window.api.sound.audioBuffer(file)
    console.log('[NoisePanel] audioBuffer loaded, size:', buffer.byteLength)
    const blob = new Blob([buffer], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    console.log('[NoisePanel] blobUrl created:', url)
    blobUrlCache.set(id, url)
    return url
  } catch (e) {
    console.error('[NoisePanel] loadAudioUrl failed:', e)
    return null
  }
}

async function toggleScene(id: string) {
  console.log('[NoisePanel] toggleScene:', id, 'isPlaying:', isPlaying(id))
  if (isPlaying(id)) {
    const audio = audioMap.get(id)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    delete playingState[id]
  } else {
    const url = await loadAudioUrl(id)
    if (!url) {
      console.warn('[NoisePanel] no audio for scene:', id)
      return
    }
    let audio = audioMap.get(id)
    if (!audio) {
      audio = new Audio(url)
      audio.loop = true
      audioMap.set(id, audio)
    }
    audio.volume = 0.5
    try {
      await audio.play()
      console.log('[NoisePanel] audio.play() succeeded for:', id)
      playingState[id] = 50
    } catch (e) {
      console.error('[NoisePanel] audio.play() failed:', e)
    }
  }
}

function setVolume(id: string, vol: string) {
  const v = Number(vol)
  playingState[id] = v
  const audio = audioMap.get(id)
  if (audio) audio.volume = v / 100
}

function stopAll() {
  for (const id of Object.keys(playingState)) {
    const audio = audioMap.get(id)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    delete playingState[id]
  }
}
</script>

<style scoped>
.noise-panel {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: 280px;
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-md);
  z-index: 100;
  margin-bottom: 8px;
}

.noise-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.noise-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 13px;
  padding: 2px;
}

.noise-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.noise-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--bg-primary);
}

.noise-card:hover {
  border-color: var(--accent-primary);
}

.noise-card.playing {
  border-color: #00897B;
  background: rgba(0, 137, 123, 0.06);
}

.noise-icon {
  font-size: 20px;
}

.noise-name {
  font-size: var(--font-xs);
  color: var(--text-secondary);
}

.noise-card.playing .noise-name {
  color: #00897B;
  font-weight: 500;
}

.noise-volume {
  width: 100%;
  padding: 0 4px;
}

.noise-volume input {
  width: 100%;
  height: 3px;
  -webkit-appearance: none;
  background: var(--border-primary);
  border-radius: 2px;
  outline: none;
}

.noise-volume input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00897B;
  cursor: pointer;
}

.noise-footer {
  margin-top: var(--spacing-sm);
  text-align: center;
}

.stop-all {
  padding: 4px 16px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-secondary);
  font-size: var(--font-xs);
  cursor: pointer;
}

.stop-all:hover {
  border-color: var(--danger);
  color: var(--danger);
}
</style>
