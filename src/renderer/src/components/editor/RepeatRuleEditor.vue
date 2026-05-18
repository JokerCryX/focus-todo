<template>
  <div class="repeat-editor" v-if="visible">
    <div class="repeat-header">
      <label class="field-label">{{ $t('repeat.label') }}</label>
      <label class="toggle">
        <input type="checkbox" :checked="!!modelValue" @change="toggleRepeat" />
        <span>{{ $t('repeat.enable') }}</span>
      </label>
    </div>

    <div v-if="modelValue" class="repeat-config">
      <div class="config-row">
        <span class="config-label">{{ $t('repeat.mode') }}</span>
        <select :value="modelValue.type" @change="updateField('type', ($event.target as HTMLSelectElement).value)">
          <option value="daily">{{ $t('repeat.daily') }}</option>
          <option value="weekday">{{ $t('repeat.weekday') }}</option>
          <option value="weekly">{{ $t('repeat.weekly') }}</option>
          <option value="monthly">{{ $t('repeat.monthly') }}</option>
          <option value="monthly_last">{{ $t('repeat.monthlyLast') }}</option>
          <option value="yearly">{{ $t('repeat.yearly') }}</option>
          <option value="yearly_lunar">{{ $t('repeat.yearlyLunar') }}</option>
        </select>
      </div>

      <div v-if="modelValue.type === 'daily'" class="config-row">
        <span class="config-label">{{ $t('repeat.interval') }}</span>
        <div class="num-ctrl">
          <button @click="updateField('interval', Math.max(1, modelValue!.interval - 1))">-</button>
          <span>{{ modelValue.interval }} {{ $t('repeat.day') }}</span>
          <button @click="updateField('interval', modelValue!.interval + 1)">+</button>
        </div>
      </div>

      <div v-if="modelValue.type === 'weekly'" class="config-row">
        <span class="config-label">{{ $t('repeat.weekDay') }}</span>
        <div class="week-days">
          <button
            v-for="d in weekDayOptions" :key="d.value"
            :class="{ active: modelValue.week_days.includes(d.value) }"
            @click="toggleWeekDay(d.value)"
          >{{ d.label }}</button>
        </div>
      </div>

      <div v-if="modelValue.type === 'monthly'" class="config-row">
        <span class="config-label">{{ $t('repeat.date') }}</span>
        <div class="num-ctrl">
          <button @click="adjustMonthDay(-1)">-</button>
          <span>{{ modelValue.month_days[0] || 1 }} {{ $t('repeat.day') }}</span>
          <button @click="adjustMonthDay(1)">+</button>
        </div>
      </div>

      <div v-if="modelValue.type === 'yearly'" class="config-row">
        <span class="config-label">{{ $t('repeat.date') }}</span>
        <span class="config-value">{{ modelValue.year_month }}{{ $t('repeat.month') }}{{ modelValue.year_month_day }}{{ $t('repeat.daySuffix') }}</span>
      </div>

      <div v-if="modelValue.type === 'yearly_lunar'" class="config-row">
        <span class="config-label">{{ $t('repeat.lunarDate') }}</span>
        <div class="num-ctrl">
          <button @click="adjustLunar('month', -1)">-</button>
          <span>{{ lunarMonthLabel }}</span>
          <button @click="adjustLunar('month', 1)">+</button>
        </div>
      </div>

      <div v-if="modelValue.type === 'yearly_lunar'" class="config-row">
        <span class="config-label">{{ $t('repeat.lunarDay') }}</span>
        <div class="num-ctrl">
          <button @click="adjustLunar('day', -1)">-</button>
          <span>{{ modelValue.lunar_day || 1 }}</span>
          <button @click="adjustLunar('day', 1)">+</button>
        </div>
      </div>

      <div class="config-row">
        <span class="config-label">{{ $t('repeat.skipWeekends') }}</span>
        <label class="toggle">
          <input type="checkbox" :checked="modelValue.skip_weekends" @change="updateField('skip_weekends', !modelValue!.skip_weekends)" />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  modelValue: any
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const weekDayOptions = computed(() => {
  const labels = t('repeat.weekDays') as unknown as string[]
  return labels.map((label, i) => ({ value: i, label }))
})

const lunarMonthLabel = computed(() => {
  const months = t('repeat.lunarMonths') as unknown as string[]
  const m = props.modelValue?.lunar_month || 1
  return months[m - 1]
})

function defaultRule() {
  return {
    type: 'daily', interval: 1, end_count: 90, end_date: null,
    week_days: [1, 2, 3, 4, 5], month_days: [15],
    year_month: new Date().getMonth() + 1, year_month_day: new Date().getDate(),
    lunar_month: null, lunar_day: null,
    skip_holidays: false, skip_weekends: false, use_workdays: false
  }
}

function toggleRepeat() {
  emit('update:modelValue', props.modelValue ? null : defaultRule())
}

function updateField(field: string, value: any) {
  if (!props.modelValue) return
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function adjustLunar(field: 'month' | 'day', delta: number) {
  if (!props.modelValue) return
  if (field === 'month') {
    const cur = props.modelValue.lunar_month || 1
    const next = Math.max(1, Math.min(12, cur + delta))
    updateField('lunar_month', next)
  } else {
    const cur = props.modelValue.lunar_day || 1
    const next = Math.max(1, Math.min(30, cur + delta))
    updateField('lunar_day', next)
  }
}

function toggleWeekDay(day: number) {
  if (!props.modelValue) return
  const days = [...props.modelValue.week_days]
  const idx = days.indexOf(day)
  if (idx >= 0) days.splice(idx, 1)
  else days.push(day)
  updateField('week_days', days.sort())
}

function adjustMonthDay(delta: number) {
  if (!props.modelValue) return
  const current = props.modelValue.month_days[0] || 15
  const next = Math.max(1, Math.min(31, current + delta))
  updateField('month_days', [next])
}
</script>

<style scoped>
.repeat-editor {
  margin-top: 4px;
}

.repeat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-xs);
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle input {
  accent-color: var(--accent-primary);
}

.repeat-config {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-label {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.config-value {
  font-size: var(--font-sm);
  color: var(--text-primary);
}

select {
  padding: 4px 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-xs);
}

.num-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
}

.num-ctrl span {
  font-size: var(--font-sm);
  color: var(--text-primary);
  min-width: 40px;
  text-align: center;
}

.num-ctrl button {
  width: 22px;
  height: 22px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.num-ctrl button:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.week-days {
  display: flex;
  gap: 3px;
}

.week-days button {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-secondary);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.week-days button.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}
</style>
