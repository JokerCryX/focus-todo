const TERM_NAMES = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
]

const C_21 = [
  5.4055, 20.12, 3.87, 18.73, 5.63, 20.646,
  4.81, 20.1, 5.52, 21.04, 5.678, 21.37,
  7.108, 22.83, 7.5, 23.13, 7.646, 23.042,
  8.318, 23.438, 7.438, 22.36, 7.18, 21.94
]

interface TermCache { [key: string]: string }
const cache: TermCache = {}

function solarTermDay(year: number, idx: number): number {
  const Y = year % 100
  const L = Y === 0 ? 0 : Math.floor(Y / 4)
  return Math.floor(Y * 0.2422 + C_21[idx]) - L
}

function getSolarTermsForYear(year: number): Map<string, string> {
  const key = String(year)
  if (cache[key]) return parseCache(cache[key])

  const map = new Map<string, string>()
  for (let i = 0; i < 24; i++) {
    const month = Math.floor(i / 2) + 1
    const day = solarTermDay(year, i)
    map.set(`${month}-${day}`, TERM_NAMES[i])
  }

  cache[key] = serializeCache(map)
  return map
}

function serializeCache(map: Map<string, string>): string {
  return JSON.stringify([...map.entries()])
}

function parseCache(json: string): Map<string, string> {
  return new Map(JSON.parse(json))
}

const HOLIDAYS: Record<string, string> = {
  '1-1': '元旦',
  '2-14': '情人节',
  '3-8': '妇女节',
  '3-12': '植树节',
  '4-1': '愚人节',
  '5-1': '劳动节',
  '5-4': '青年节',
  '6-1': '儿童节',
  '7-1': '建党节',
  '8-1': '建军节',
  '9-10': '教师节',
  '10-1': '国庆节',
  '10-31': '万圣节',
  '12-25': '圣诞节'
}

export function getCalendarLabel(year: number, month: number, date: number): string {
  const key = `${month + 1}-${date}`
  const holiday = HOLIDAYS[key]
  if (holiday) return holiday
  const terms = getSolarTermsForYear(year)
  return terms.get(key) || ''
}
