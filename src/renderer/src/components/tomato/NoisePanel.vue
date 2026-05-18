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
        :class="{ playing: isPlaying(scene.id) }"
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
    <div v-if="playingTracks.length > 0" class="noise-footer">
      <button class="stop-all" @click="stopAll">{{ $t('tomato.stopAll') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineEmits<{ (e: 'close'): void }>()

const sceneIcons: Record<string, string> = {
  cafe: '☕', forest: '🌲', rain: '🌧️', ocean: '🌊',
  thunder: '⛈️', train: '🚂', street: '🏙️', cave: '🕳️',
  fire: '🔥', wind: '💨'
}

interface Scene { id: string; name: string }
interface Track { id: string; volume: number }

const scenes = ref<Scene[]>([])
const playingTracks = ref<Track[]>([])

let stateHandler: ((...args: any[]) => void) | null = null

onMounted(async () => {
  scenes.value = await window.api.noise.scenes()
  playingTracks.value = await window.api.noise.playing()
  stateHandler = (tracks: Track[]) => {
    playingTracks.value = tracks
  }
  window.api.on('noise:state', stateHandler)
})

onUnmounted(() => {
  stateHandler = null
})

function isPlaying(id: string): boolean {
  return playingTracks.value.some(t => t.id === id)
}

function getVolume(id: string): number {
  return playingTracks.value.find(t => t.id === id)?.volume || 50
}

async function toggleScene(id: string) {
  if (isPlaying(id)) {
    await window.api.noise.stop(id)
  } else {
    await window.api.noise.play(id, 50)
  }
}

async function setVolume(id: string, vol: string) {
  await window.api.noise.volume(id, Number(vol))
}

async function stopAll() {
  await window.api.noise.stopAll()
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
