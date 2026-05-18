<template>
  <div class="stats-grid">
    <!-- 完成趋势 -->
    <div class="card span-2">
      <div class="card-title">{{ $t('statistics.completionTrend') }}</div>
      <div :ref="completionChart.refBinder"></div>
    </div>

    <!-- 新增趋势 -->
    <div class="card span-2">
      <div class="card-title">{{ $t('statistics.creationTrend') }}</div>
      <div :ref="creationChart.refBinder"></div>
    </div>

    <!-- 完成率 -->
    <div class="card">
      <div class="card-title">{{ $t('statistics.completionRate') }}</div>
      <div class="rate-center">
        <span class="rate-num">{{ ratePercent }}</span>
        <span class="rate-unit">%</span>
      </div>
      <div class="rate-sub">{{ store.completionRate.completed }} / {{ store.completionRate.total }}</div>
      <div :ref="rateChart.refBinder"></div>
    </div>

    <!-- 分类分布 -->
    <div class="card">
      <div class="card-title">{{ $t('statistics.categoryDistribution') }}</div>
      <div :ref="categoryChart.refBinder"></div>
    </div>

    <!-- 优先级分布 -->
    <div class="card">
      <div class="card-title">{{ $t('statistics.priorityDistribution') }}</div>
      <div :ref="priorityChart.refBinder"></div>
    </div>

    <!-- 逾期任务 -->
    <div class="card">
      <div class="card-title">{{ $t('statistics.overdue') }}</div>
      <div class="big-num danger">{{ store.overdueCount }}</div>
      <div class="big-label">{{ $t('statistics.overdueCount', { count: store.overdueCount }) }}</div>
    </div>

    <!-- 周对比 -->
    <div class="card">
      <div class="card-title">{{ $t('statistics.weekComparison') }}</div>
      <div :ref="weekChart.refBinder"></div>
    </div>

    <!-- 累计完成 -->
    <div class="card span-2">
      <div class="card-title">{{ $t('statistics.cumulativeCompletion') }}</div>
      <div :ref="cumulativeChart.refBinder"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStatisticsStore } from '@/stores/statistics'
import { useChart, getTheme } from './useChart'
import type { EChartsOption } from 'echarts'

const { t: $t } = useI18n()
const store = useStatisticsStore()
const t = getTheme()

const ratePercent = computed(() => {
  const { completed, total } = store.completionRate
  return total === 0 ? 0 : Math.round((completed / total) * 100)
})

const priorityLabels = computed<Record<number, string>>(() => ({ 0: $t('task.priorityNone'), 1: $t('task.priorityDaily'), 2: $t('task.priorityImportant'), 3: $t('task.priorityUrgent') }))

const completionChart = useChart(computed<EChartsOption>(() => ({
  color: t.accent,
  grid: { top: 10, right: 16, bottom: 24, left: 40 },
  xAxis: { type: 'category', data: store.completionTrend.map(d => d.date.slice(5)), axisLabel: { fontSize: 10, color: t.textSecondary }, axisLine: { lineStyle: { color: t.border } } },
  yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: t.textSecondary }, splitLine: { lineStyle: { color: t.border } } },
  series: [{ type: 'line', data: store.completionTrend.map(d => d.count), smooth: true, areaStyle: { opacity: 0.15 }, symbol: 'none' }],
  tooltip: { trigger: 'axis' }
})))

const creationChart = useChart(computed<EChartsOption>(() => ({
  color: '#00897B',
  grid: { top: 10, right: 16, bottom: 24, left: 40 },
  xAxis: { type: 'category', data: store.creationTrend.map(d => d.date.slice(5)), axisLabel: { fontSize: 10, color: t.textSecondary }, axisLine: { lineStyle: { color: t.border } } },
  yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: t.textSecondary }, splitLine: { lineStyle: { color: t.border } } },
  series: [{ type: 'line', data: store.creationTrend.map(d => d.count), smooth: true, areaStyle: { opacity: 0.15 }, symbol: 'none' }],
  tooltip: { trigger: 'axis' }
})))

const rateChart = useChart(computed<EChartsOption>(() => ({
  series: [{
    type: 'pie', radius: ['60%', '78%'], center: ['50%', '50%'],
    data: [
      { value: store.completionRate.completed, name: $t('statistics.completed'), itemStyle: { color: t.accent } },
      { value: store.completionRate.total - store.completionRate.completed, name: $t('statistics.uncompleted'), itemStyle: { color: t.border } }
    ],
    label: { show: false }, emphasis: { disabled: true }
  }]
})))

const categoryChart = useChart(computed<EChartsOption>(() => ({
  color: t.series,
  series: [{
    type: 'pie', radius: '65%',
    data: store.categoryDistribution.map(c => ({ value: c.count, name: c.name, itemStyle: { color: c.color } })),
    label: { fontSize: 10, color: t.textSecondary },
    labelLine: { length: 8, length2: 6 }
  }]
})))

const priorityChart = useChart(computed<EChartsOption>(() => ({
  color: t.series,
  grid: { top: 10, right: 16, bottom: 24, left: 40 },
  xAxis: { type: 'category', data: store.priorityDistribution.map(d => priorityLabels.value[d.priority] || `P${d.priority}`), axisLabel: { fontSize: 10, color: t.textSecondary }, axisLine: { lineStyle: { color: t.border } } },
  yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: t.textSecondary }, splitLine: { lineStyle: { color: t.border } } },
  series: [{ type: 'bar', data: store.priorityDistribution.map(d => d.count), barWidth: 24, itemStyle: { borderRadius: [4, 4, 0, 0] } }],
  tooltip: { trigger: 'axis' }
})))

const weekChart = useChart(computed<EChartsOption>(() => ({
  color: [t.accent, t.border],
  grid: { top: 10, right: 16, bottom: 24, left: 40 },
  xAxis: { type: 'category', data: [$t('statistics.lastWeek'), $t('statistics.thisWeek')], axisLabel: { fontSize: 10, color: t.textSecondary }, axisLine: { lineStyle: { color: t.border } } },
  yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: t.textSecondary }, splitLine: { lineStyle: { color: t.border } } },
  series: [{ type: 'bar', data: [store.taskWeekComparison.lastWeek, store.taskWeekComparison.thisWeek], barWidth: 32, itemStyle: { borderRadius: [4, 4, 0, 0] } }],
  tooltip: { trigger: 'axis' }
})))

const cumulativeChart = useChart(computed<EChartsOption>(() => ({
  color: t.accent,
  grid: { top: 10, right: 16, bottom: 24, left: 48 },
  xAxis: { type: 'category', data: store.cumulativeCompletion.map(d => d.date.slice(5)), axisLabel: { fontSize: 10, color: t.textSecondary, interval: 'auto' }, axisLine: { lineStyle: { color: t.border } } },
  yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: t.textSecondary }, splitLine: { lineStyle: { color: t.border } } },
  series: [{ type: 'line', data: store.cumulativeCompletion.map(d => d.total), smooth: true, areaStyle: { opacity: 0.2 }, symbol: 'none' }],
  tooltip: { trigger: 'axis' }
})))
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: var(--spacing-lg);
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-card);
}

.card.span-2 {
  grid-column: span 2;
}

.card-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.rate-center {
  text-align: center;
  margin-bottom: 4px;
}

.rate-num {
  font-size: 36px;
  font-weight: 700;
  color: var(--accent-primary);
}

.rate-unit {
  font-size: var(--font-lg);
  color: var(--text-tertiary);
}

.rate-sub {
  text-align: center;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.big-num {
  font-size: 40px;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
}

.big-num.danger {
  color: var(--danger);
}

.big-label {
  text-align: center;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-top: 4px;
}
</style>
