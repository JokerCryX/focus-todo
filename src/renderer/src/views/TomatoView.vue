<template>
  <div class="view-page tomato-page">
    <div class="view-header">
      <h2>{{ $t('tomato.title') }}</h2>
      <div class="today-stats">
        <span class="stat-item">
          <svg width="12" height="12" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          {{ tomatoStore.todayCount }} {{ $t('statistics.tomatoUnit') }}
        </span>
        <span class="stat-item">
          <svg width="12" height="12" viewBox="0 0 16 16"><path d="M3 4h10M3 8h6M3 12h3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ tomatoStore.todayMinutes }} {{ $t('statistics.minuteUnit') }}
        </span>
      </div>
    </div>

    <div class="tomato-main">
      <div class="timer-ring">
        <svg class="ring-svg" viewBox="0 0 200 200">
          <circle class="ring-bg" cx="100" cy="100" r="88" fill="none" stroke-width="6" />
          <circle
            class="ring-progress"
            cx="100" cy="100" r="88"
            fill="none" stroke-width="6"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="circumference * (1 - tomatoStore.progress)"
            :class="tomatoStore.phase"
          />
        </svg>
        <div class="timer-center">
          <div class="timer-display">{{ tomatoStore.displayTime }}</div>
          <div class="timer-phase" :class="tomatoStore.phase">{{ tomatoStore.phaseLabel }}</div>
        </div>
      </div>

      <div v-if="tomatoStore.linkedTaskTitle" class="linked-task">
        <svg width="12" height="12" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        {{ tomatoStore.linkedTaskTitle }}
        <button class="unlink-btn" @click="tomatoStore.linkTask(null, null)">✕</button>
      </div>

      <div class="timer-controls">
        <button v-if="tomatoStore.phase === 'idle'" class="ctrl-btn start" @click="tomatoStore.startFocus()">
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M5 3l8 5-8 5V3z" fill="currentColor"/></svg>
          {{ $t('tomato.startFocus') }}
        </button>
        <template v-else>
          <button class="ctrl-btn" @click="tomatoStore.togglePause()">
            <svg v-if="tomatoStore.isRunning" width="14" height="14" viewBox="0 0 16 16"><rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 16 16"><path d="M5 3l8 5-8 5V3z" fill="currentColor"/></svg>
            {{ tomatoStore.isRunning ? $t('tomato.pause') : $t('tomato.resume') }}
          </button>
          <button class="ctrl-btn skip" @click="tomatoStore.skip()">
            <svg width="14" height="14" viewBox="0 0 16 16"><path d="M3 3l6 5-6 5V3z" fill="currentColor"/><rect x="10" y="3" width="2" height="10" rx="0.5" fill="currentColor"/></svg>
            {{ $t('tomato.skip') }}
          </button>
          <button class="ctrl-btn reset" @click="tomatoStore.reset()">
            <svg width="14" height="14" viewBox="0 0 16 16"><path d="M3 8a5 5 0 1 1 1.5 3.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5v3h3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </template>
      </div>

      <div class="completed-count">
        {{ $t('tomato.completed', { count: tomatoStore.completedCount }) }}
      </div>

      <div class="timer-settings">
        <div class="setting-row">
          <span class="setting-label">{{ $t('tomato.focus') }}</span>
          <div class="setting-ctrl">
            <button @click="adjustDuration('focus', -5)">-</button>
            <span>{{ tomatoStore.focusDuration }} {{ $t('statistics.minuteUnit') }}</span>
            <button @click="adjustDuration('focus', 5)">+</button>
          </div>
        </div>
        <div class="setting-row">
          <span class="setting-label">{{ $t('tomato.shortBreakLabel') }}</span>
          <div class="setting-ctrl">
            <button @click="adjustDuration('short', -1)">-</button>
            <span>{{ tomatoStore.shortBreakDuration }} {{ $t('statistics.minuteUnit') }}</span>
            <button @click="adjustDuration('short', 1)">+</button>
          </div>
        </div>
        <div class="setting-row">
          <span class="setting-label">{{ $t('tomato.longBreakLabel') }}</span>
          <div class="setting-ctrl">
            <button @click="adjustDuration('long', -5)">-</button>
            <span>{{ tomatoStore.longBreakDuration }} {{ $t('statistics.minuteUnit') }}</span>
            <button @click="adjustDuration('long', 5)">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTomatoStore } from '@/stores/tomato'

const { t } = useI18n()

const tomatoStore = useTomatoStore()
const circumference = 2 * Math.PI * 88

let statsTimer: ReturnType<typeof setInterval> | null = null

function adjustDuration(type: 'focus' | 'short' | 'long', delta: number) {
  if (tomatoStore.phase !== 'idle') return
  switch (type) {
    case 'focus':
      tomatoStore.focusDuration = Math.max(1, Math.min(120, tomatoStore.focusDuration + delta))
      break
    case 'short':
      tomatoStore.shortBreakDuration = Math.max(1, Math.min(30, tomatoStore.shortBreakDuration + delta))
      break
    case 'long':
      tomatoStore.longBreakDuration = Math.max(5, Math.min(60, tomatoStore.longBreakDuration + delta))
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
.tomato-page {
  align-items: center;
}

.view-header {
  padding: var(--spacing-lg) var(--spacing-lg) 0;
  flex-shrink: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-header h2 {
  font-size: var(--font-2xl);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.today-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.tomato-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: var(--spacing-lg);
}

.timer-ring {
  position: relative;
  width: 200px;
  height: 200px;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  stroke: var(--border-primary);
}

.ring-progress {
  stroke: var(--accent-primary);
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.ring-progress.shortBreak {
  stroke: var(--success);
}

.ring-progress.longBreak {
  stroke: var(--warning);
}

.timer-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer-display {
  font-size: 42px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.timer-phase {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.timer-phase.focus {
  color: var(--accent-primary);
}

.timer-phase.shortBreak {
  color: var(--success);
}

.timer-phase.longBreak {
  color: var(--warning);
}

.linked-task {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 4px 12px;
  border-radius: var(--radius-md);
}

.unlink-btn {
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 11px;
  padding: 2px;
}

.unlink-btn:hover {
  color: var(--danger);
}

.timer-controls {
  display: flex;
  gap: 8px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ctrl-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.ctrl-btn.start {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
  padding: 10px 28px;
  font-weight: 500;
}

.ctrl-btn.start:hover {
  background: var(--accent-hover);
}

.completed-count {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.timer-settings {
  width: 100%;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.setting-ctrl {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-ctrl span {
  font-size: var(--font-sm);
  color: var(--text-primary);
  min-width: 60px;
  text-align: center;
}

.setting-ctrl button {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.setting-ctrl button:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
</style>
