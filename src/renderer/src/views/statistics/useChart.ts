import * as echarts from 'echarts'
import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'

export function useChart(optionSource: Ref<echarts.EChartsOption>, height = 200) {
  const el = ref<HTMLElement>()
  let chart: echarts.ECharts | null = null
  let ro: ResizeObserver | null = null

  function refBinder(n: Element | ComponentPublicInstance | null) {
    el.value = n as HTMLElement
  }

  onMounted(() => {
    if (!el.value) return
    el.value.style.height = height + 'px'
    chart = echarts.init(el.value)
    chart.setOption(optionSource.value)
    ro = new ResizeObserver(() => chart?.resize())
    ro.observe(el.value)
  })

  watch(optionSource, (opt) => {
    chart?.setOption(opt, true)
  })

  onUnmounted(() => {
    ro?.disconnect()
    chart?.dispose()
    chart = null
  })

  function updateOption(opt: echarts.EChartsOption) {
    optionSource.value = opt
    chart?.setOption(opt, true)
  }

  return { el, refBinder, updateOption }
}

export const lightColors = {
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  bg: '#FFFFFF',
  accent: '#3B9EFF',
  series: ['#3B9EFF', '#00897B', '#F5A623', '#7ED321', '#D0021B', '#9B59B6']
}

export const darkColors = {
  text: '#E5E7EB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  bg: '#1F2937',
  accent: '#60A5FA',
  series: ['#60A5FA', '#34D399', '#FBBF24', '#A3E635', '#F87171', '#C084FC']
}

export function getTheme() {
  return document.documentElement.classList.contains('dark') ? darkColors : lightColors
}
