<template>
  <div class="stats-grid">
    <!-- 今日数据 -->
    <div class="card">
      <div class="card-title">{{ $t('statistics.todayTomato') }}</div>
      <div class="big-num tomato">{{ store.todayTomatoCount }}</div>
      <div class="big-label">{{ $t('statistics.tomatoUnit') }}</div>
    </div>

    <!-- 今日专注 -->
    <div class="card">
      <div class="card-title">{{ $t('statistics.todayFocus') }}</div>
      <div class="big-num tomato">{{ store.todayFocusMinutes }}</div>
      <div class="big-label">{{ $t('statistics.minuteUnit') }}</div>
    </div>

    <!-- 连续天数 -->
    <div class="card">
      <div class="card-title">{{ $t('statistics.streak') }}</div>
      <div class="streak-row">
        <span class="big-num streak">{{ store.streak }}</span>
        <span class="streak-label">{{ $t('statistics.dayUnit') }}</span>
      </div>
    </div>

    <!-- 日趋势 -->
    <div class="card span-2">
      <div class="card-title">{{ $t('statistics.trend30') }}</div>
      <div :ref="trendChart.refBinder"></div>
    </div>

    <!-- 周概览 -->
    <div class="card">
      <div class="card-title">{{ $t('statistics.weekOverview') }}</div>
      <div :ref="weekChart.refBinder"></div>
    </div>

    <!-- 月度热力图 -->
    <div class="card span-3">
      <div class="card-title">{{ $t('statistics.yearlyHeatmap') }}</div>
      <div :ref="heatmapChart.refBinder"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStatisticsStore } from '@/stores/statistics'
import { useChart, getTheme } from './useChart'
import type { EChartsOption } from 'echarts'

const { t: $t } = useI18n()
const store = useStatisticsStore()
const t = getTheme()

const trendChart = useChart(computed<EChartsOption>(() => ({
  color: ['#00897B', '#3B9EFF'],
  legend: { right: 0, top: 0, textStyle: { fontSize: 10, color: t.textSecondary } },
  grid: { top: 24, right: 16, bottom: 24, left: 40 },
  xAxis: { type: 'category', data: store.tomatoTrend.map(d => d.date.slice(5)), axisLabel: { fontSize: 10, color: t.textSecondary }, axisLine: { lineStyle: { color: t.border } } },
  yAxis: [
    { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: t.textSecondary }, splitLine: { lineStyle: { color: t.border } } },
    { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: t.textSecondary }, splitLine: { show: false } }
  ],
  series: [
    { name: $t('statistics.tomatoSeries'), type: 'bar', data: store.tomatoTrend.map(d => d.count), barWidth: 8, itemStyle: { borderRadius: [3, 3, 0, 0] } },
    { name: $t('statistics.minuteUnit'), type: 'line', yAxisIndex: 1, data: store.tomatoTrend.map(d => d.minutes), smooth: true, symbol: 'none' }
  ],
  tooltip: { trigger: 'axis' }
})))

const weekChart = useChart(computed<EChartsOption>(() => {
  const wc = store.tomatoWeekComparison
  return {
    color: ['#00897B', t.border],
    grid: { top: 10, right: 16, bottom: 24, left: 40 },
    xAxis: { type: 'category', data: [$t('statistics.lastWeek'), $t('statistics.thisWeek')], axisLabel: { fontSize: 10, color: t.textSecondary }, axisLine: { lineStyle: { color: t.border } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10, color: t.textSecondary }, splitLine: { lineStyle: { color: t.border } } },
    series: [{ type: 'bar', data: [wc.lastWeek.count, wc.thisWeek.count], barWidth: 32, itemStyle: { borderRadius: [4, 4, 0, 0] } }],
    tooltip: { trigger: 'axis' }
  }
}))

const heatmapChart = useChart(computed<EChartsOption>(() => {
  const data = store.monthlyHeatmap.map(d => [d.date, d.count])
  const maxCount = Math.max(...store.monthlyHeatmap.map(d => d.count), 1)
  const firstDate = data[0]?.[0]
  const lastDate = data[data.length - 1]?.[0]
  return {
    visualMap: {
      min: 0, max: maxCount, show: false,
      inRange: { color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] }
    },
    calendar: {
      range: firstDate && lastDate ? [firstDate, lastDate] : String(new Date().getFullYear()),
      cellSize: 12,
      left: 40, right: 20, top: 40, bottom: 10,
      itemStyle: { borderWidth: 2, borderColor: 'transparent' },
      yearLabel: { show: false },
      monthLabel: { fontSize: 10, color: t.textSecondary },
      dayLabel: { fontSize: 9, color: t.textSecondary, nameMap: 'ZH' }
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data
    }],
    tooltip: {
      formatter: (params: any) => `${params.value[0]}：${params.value[1]} ${$t('statistics.tomatoUnit')}`
    }
  }
}))
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

.card.span-2 { grid-column: span 2; }
.card.span-3 { grid-column: span 3; }

.card-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.big-num {
  font-size: 40px;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
}

.big-num.tomato { color: #00897B; }
.big-num.streak { color: #F5A623; }

.big-label {
  text-align: center;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-top: 4px;
}

.streak-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.streak-label {
  font-size: var(--font-lg);
  color: var(--text-tertiary);
}
</style>
