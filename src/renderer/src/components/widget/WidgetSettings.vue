<template>
  <div class="widget-settings">
    <div class="setting-row">
      <span class="setting-label">{{ $t('widget.alwaysOnTop') }}</span>
      <button class="toggle-btn" :class="{ active: !!config?.always_on_top }" @click="toggleAlwaysOnTop">
        <span class="toggle-track">
          <span class="toggle-thumb" />
        </span>
      </button>
    </div>
    <div class="setting-row">
      <span class="setting-label">{{ $t('widget.opacity') }}</span>
      <div class="slider-wrap">
        <input
          type="range" min="30" max="100"
          :value="config?.opacity ?? 100"
          @input="updateOpacity(($event.target as HTMLInputElement).value)"
          class="opacity-slider"
        />
        <span class="opacity-val">{{ config?.opacity ?? 100 }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ widgetId: string }>()
defineEmits<{ (e: 'close'): void }>()

const config = ref<any>(null)

onMounted(async () => {
  config.value = await window.api.widget.getConfig(props.widgetId)
})

async function toggleAlwaysOnTop() {
  const newVal = config.value?.always_on_top ? 0 : 1
  await window.api.widget.update(props.widgetId, { always_on_top: newVal })
  config.value = { ...config.value, always_on_top: newVal }
}

async function updateSetting(field: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  await window.api.widget.update(props.widgetId, { [field]: checked ? 1 : 0 })
  config.value = { ...config.value, [field]: checked ? 1 : 0 }
}

async function updateOpacity(val: string) {
  const num = Number(val)
  await window.api.widget.update(props.widgetId, { opacity: num })
  config.value = { ...config.value, opacity: num }
}
</script>

<style scoped>
.widget-settings {
  min-width: 170px;
  background: var(--bg-glass);
  backdrop-filter: blur(24px) saturate(1.5);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(59, 158, 255, 0.04);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.setting-label {
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* ── Toggle switch ── */
.toggle-btn {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.toggle-track {
  display: block;
  width: 30px;
  height: 17px;
  border-radius: 9px;
  background: var(--border-primary);
  position: relative;
  transition: background 0.25s var(--ease-out);
}

.toggle-btn.active .toggle-track {
  background: var(--accent-primary);
  box-shadow: 0 0 6px rgba(59, 158, 255, 0.25);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: white;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}

.toggle-btn.active .toggle-thumb {
  transform: translateX(13px);
}

/* ── Slider ── */
.slider-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  max-width: 100px;
}

.opacity-slider {
  flex: 1;
  height: 3px;
  -webkit-appearance: none;
  background: var(--border-primary);
  border-radius: 2px;
  outline: none;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  box-shadow: 0 0 0 2px var(--accent-light);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.opacity-slider::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

.opacity-val {
  font-size: 10px;
  color: var(--text-tertiary);
  min-width: 28px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
