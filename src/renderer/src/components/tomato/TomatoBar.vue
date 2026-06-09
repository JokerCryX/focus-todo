<template>
  <div class="tomato-bar" :class="{ active: tomatoStore.phase !== 'idle' }">
    <!-- 进度条 -->
    <div class="progress-track">
      <div
        class="progress-fill"
        :class="tomatoStore.phase"
        :style="{ width: (tomatoStore.progress * 100) + '%' }"
      />
    </div>

    <!-- 主体 -->
    <div class="bar-body">
      <!-- 左：计时器 -->
      <div class="timer-zone">
        <div class="ring-wrap" :class="tomatoStore.phase">
          <svg viewBox="0 0 58 58">
            <circle class="ring-bg" cx="29" cy="29" r="25" fill="none" stroke-width="3" />
            <circle
              class="ring-fg"
              cx="29" cy="29" r="25"
              fill="none" stroke-width="3"
              :stroke-dasharray="ringC"
              :stroke-dashoffset="ringC * (1 - tomatoStore.progress)"
              :class="tomatoStore.phase"
            />
          </svg>
          <span class="ring-icon">
            <template v-if="tomatoStore.phase === 'idle'">🍅</template>
            <template v-else-if="tomatoStore.phase === 'focus'">🔥</template>
            <template v-else>☕</template>
          </span>
        </div>
        <div class="timer-text">
          <span class="digits" :class="tomatoStore.phase">{{ tomatoStore.displayTime }}</span>
          <span class="phase" :class="tomatoStore.phase">{{ tomatoStore.phaseLabel }}</span>
          <div v-if="tomatoStore.linkedTaskTitle" class="task-link">
            <svg width="10" height="10" viewBox="0 0 16 16"><path d="M4 6h8M8 2v12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span>{{ tomatoStore.linkedTaskTitle }}</span>
            <button class="unlink" @click="tomatoStore.linkTask(null, null)">✕</button>
          </div>
        </div>
      </div>

      <!-- 右：操作区 -->
      <div class="action-zone">
        <!-- idle：时长分段 + 开始 -->
        <template v-if="tomatoStore.phase === 'idle'">
          <div class="dur-segmented">
            <button
              v-for="d in durOptions"
              :key="d.key"
              class="seg-item"
              @wheel.prevent="onDurWheel($event, d.key)"
            >
              <span class="seg-val">{{ d.value }}'</span>
              <span class="seg-name">{{ d.label }}</span>
            </button>
          </div>
          <button class="start-btn" @click="tomatoStore.startFocus()">
            <svg width="13" height="13" viewBox="0 0 16 16"><path d="M5 3l8 5-8 5V3z" fill="currentColor"/></svg>
            {{ $t('tomato.startFocus') }}
          </button>
        </template>

        <!-- 运行中：控制 -->
        <template v-else>
          <div class="running-controls">
            <button class="ctrl-btn main-ctrl" :class="{ playing: tomatoStore.isRunning }" @click="tomatoStore.togglePause()">
              <svg v-if="tomatoStore.isRunning" width="16" height="16" viewBox="0 0 16 16"><rect x="4" y="3" width="2.5" height="10" rx="1" fill="currentColor"/><rect x="9.5" y="3" width="2.5" height="10" rx="1" fill="currentColor"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 16 16"><path d="M5 3l8 5-8 5V3z" fill="currentColor"/></svg>
            </button>
            <button class="ctrl-btn" @click="tomatoStore.skip()" :title="$t('tomato.skip')">
              <svg width="14" height="14" viewBox="0 0 16 16"><path d="M3 3l6 5-6 5V3z" fill="currentColor"/><rect x="10" y="3" width="2" height="10" rx="0.5" fill="currentColor"/></svg>
            </button>
            <button class="ctrl-btn danger" @click="tomatoStore.reset()" :title="$t('tomato.reset')">
              <svg width="14" height="14" viewBox="0 0 16 16"><path d="M3 8a5 5 0 1 1 1.5 3.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5v3h3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </template>

        <!-- 白噪音 -->
        <div class="noise-wrapper">
          <button class="ctrl-btn noise-btn" :class="{ 'noise-playing': noisePlaying }" @click="noisePlaying = !noisePlaying" :title="$t('tomato.whiteNoise')">
            <svg v-if="!noisePlaying" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13 2.5v8.27a2.5 2.5 0 1 1-1.5-2.29V4.15L6.5 5.35v6.42a2.5 2.5 0 1 1-1.5-2.29V3.5l8-1.5z"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13 1.5v8.27a2.5 2.5 0 1 1-1.5-2.29V3.15L6.5 4.35v6.42a2.5 2.5 0 1 1-1.5-2.29V2.5l8-1.5z"/><path d="M14 5.5v5.77a2 2 0 1 1-1.2-1.83V5.5H14z"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTomatoStore } from '@/stores/tomato'

const { t } = useI18n()

const tomatoStore = useTomatoStore()
const ringC = 2 * Math.PI * 25

// 白噪音播放
const noisePlaying = ref(false)
let noiseAudio: HTMLAudioElement | null = null

watch(noisePlaying, async (playing) => {
  try {
    if (playing) {
      if (!noiseAudio) {
        noiseAudio = new Audio('local-audio:///fire.mp3')
        noiseAudio.loop = true
        noiseAudio.volume = 0.5
        noiseAudio.addEventListener('error', () => {
          console.error('[Noise] audio error:', noiseAudio?.error)
        })
      }
      await noiseAudio.play()
    } else {
      noiseAudio?.pause()
    }
  } catch (e) {
    console.error('[Noise] error:', e)
    noisePlaying.value = false
  }
})

const durOptions = computed(() => [
  { key: 'focus' as const, label: t('tomato.focus'), value: tomatoStore.focusDuration },
  { key: 'short' as const, label: t('tomato.shortBreak'), value: tomatoStore.shortBreakDuration },
  { key: 'long' as const, label: t('tomato.longBreak'), value: tomatoStore.longBreakDuration }
])

let statsTimer: ReturnType<typeof setInterval> | null = null

function onDurWheel(e: WheelEvent, type: 'focus' | 'short' | 'long') {
  if (tomatoStore.phase !== 'idle') return
  const delta = e.deltaY < 0 ? 1 : -1
  switch (type) {
    case 'focus':
      tomatoStore.focusDuration = Math.max(1, Math.min(120, tomatoStore.focusDuration + delta))
      break
    case 'short':
      tomatoStore.shortBreakDuration = Math.max(1, Math.min(30, tomatoStore.shortBreakDuration + delta))
      break
    case 'long':
      tomatoStore.longBreakDuration = Math.max(5, Math.min(60, tomatoStore.longBreakDuration + delta * 5))
      break
  }
}

onMounted(() => {
  tomatoStore.refreshStats()
  statsTimer = setInterval(() => tomatoStore.refreshStats(), 60000)
})

onUnmounted(() => {
  if (statsTimer) clearInterval(statsTimer)
})
</script>

<style scoped>
.tomato-bar {
  flex-shrink: 0;
  height: 96px;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  user-select: none;
  overflow: visible;
  position: relative;
  z-index: 201;
}

/* 进度条 */
.progress-track {
  height: 4px;
  width: 100%;
  background: var(--border-primary);
  flex-shrink: 0;
}

.progress-fill {
  height: 100%;
  background: var(--tomato-focus);
  transition: width 1s linear;
  border-radius: 0 2px 2px 0;
}

.progress-fill.shortBreak { background: var(--tomato-short); }
.progress-fill.longBreak { background: var(--tomato-long); }

.tomato-bar.active .progress-track {
  box-shadow: 0 1px 8px rgba(var(--tomato-focus-rgb), 0.15);
}

/* 主体 */
.bar-body {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 32px;
}

.tomato-bar.active .bar-body {
  background: linear-gradient(90deg, rgba(var(--tomato-focus-rgb), 0.05) 0%, transparent 50%);
}

/* 左区：计时器 */
.timer-zone {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.ring-wrap {
  position: relative;
  width: 58px;
  height: 58px;
  flex-shrink: 0;
}

.ring-wrap svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  stroke: var(--border-primary);
}

.ring-fg {
  stroke: var(--tomato-focus);
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.ring-fg.shortBreak { stroke: var(--tomato-short); }
.ring-fg.longBreak { stroke: var(--tomato-long); }

.ring-wrap.focus {
  filter: drop-shadow(0 0 6px rgba(var(--tomato-focus-rgb), 0.25));
}

.ring-wrap.shortBreak {
  filter: drop-shadow(0 0 6px rgba(var(--tomato-short-rgb), 0.2));
}

.ring-wrap.longBreak {
  filter: drop-shadow(0 0 6px rgba(var(--tomato-long-rgb), 0.2));
}

.ring-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  transform: translateX(1px);
}

.timer-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.digits {
  font-size: 36px;
  font-weight: 800;
  color: var(--tomato-focus);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  line-height: 1;
}

.digits.shortBreak { color: var(--tomato-short); }
.digits.longBreak { color: var(--tomato-long); }
.digits.idle { color: var(--text-secondary); }

.phase {
  font-size: 10px;
  color: var(--text-tertiary);
  font-weight: 500;
  letter-spacing: 0.06em;
}

.phase.focus { color: var(--tomato-accent); }
.phase.shortBreak { color: #43A047; }
.phase.longBreak { color: #F57C00; }

.task-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-tertiary);
  max-width: 180px;
  margin-top: 1px;
}

.task-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unlink {
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 9px;
  padding: 0;
  flex-shrink: 0;
}

.unlink:hover { color: var(--danger); }

/* 右区：操作 */
.action-zone {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  margin-left: auto;
}

/* 分段时长控件 */
.dur-segmented {
  display: flex;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 2px;
}

.seg-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 14px;
  border: none;
  border-radius: calc(var(--radius-md) - 3px);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 48px;
}

.seg-item:hover {
  background: var(--bg-hover);
}

.seg-val {
  font-size: var(--font-md);
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

.seg-name {
  font-size: 9px;
  color: var(--text-tertiary);
  letter-spacing: 0.03em;
}

/* 开始按钮 */
.start-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--tomato-accent);
  color: white;
  font-size: var(--font-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  letter-spacing: 0.03em;
}

.start-btn:hover {
  background: var(--tomato-accent-hover);
  box-shadow: 0 2px 12px rgba(var(--tomato-accent-rgb), 0.3);
}

.start-btn:active {
  transform: scale(0.97);
}

/* 运行中控制 */
.running-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ctrl-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.ctrl-btn:hover {
  border-color: var(--tomato-accent);
  color: var(--tomato-accent);
}

.ctrl-btn.main-ctrl {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--bg-primary);
  box-shadow: 0 0 0 2px var(--border-primary);
}

.ctrl-btn.main-ctrl:hover {
  box-shadow: 0 0 0 2px var(--tomato-accent);
  color: var(--tomato-accent);
}

.ctrl-btn.main-ctrl.playing {
  background: var(--tomato-accent);
  color: white;
  box-shadow: 0 2px 10px rgba(var(--tomato-accent-rgb), 0.3);
}

.ctrl-btn.main-ctrl.playing:hover {
  background: var(--tomato-accent-hover);
  box-shadow: 0 2px 14px rgba(var(--tomato-accent-rgb), 0.4);
}

.ctrl-btn.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.ctrl-btn.noise-playing {
  border-color: var(--tomato-accent);
  color: var(--tomato-accent);
  background: rgba(var(--tomato-accent-rgb), 0.08);
}
</style>
