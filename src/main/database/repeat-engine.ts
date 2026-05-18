import { Lunar } from 'lunar-javascript'

export interface RepeatRule {
  type: 'daily' | 'weekday' | 'weekly' | 'monthly' | 'monthly_last' | 'yearly' | 'yearly_lunar'
  interval: number
  end_count: number
  end_date: number | null
  week_days: number[]
  month_days: number[]
  year_month: number
  year_month_day: number
  lunar_month: number | null
  lunar_day: number | null
  skip_holidays: boolean
  skip_weekends: boolean
  use_workdays: boolean
}

export function getNextOccurrence(rule: RepeatRule, afterMs: number): number | null {
  if (isRuleExpired(rule, afterMs)) return null

  const after = new Date(afterMs)
  const candidate = new Date(after.getFullYear(), after.getMonth(), after.getDate() + 1)

  for (let i = 0; i < 400; i++) {
    const d = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + i)
    if (rule.end_date && d.getTime() > rule.end_date) return null

    if (matchesRule(rule, d, after)) {
      if (rule.skip_weekends && (d.getDay() === 0 || d.getDay() === 6)) continue
      return d.getTime()
    }
  }
  return null
}

function isRuleExpired(rule: RepeatRule, afterMs: number): boolean {
  if (rule.end_date && afterMs > rule.end_date) return true
  return false
}

function matchesRule(rule: RepeatRule, d: Date, after: Date): boolean {
  switch (rule.type) {
    case 'daily': {
      if (rule.interval <= 1) return true
      const dayStart = new Date(after.getFullYear(), after.getMonth(), after.getDate())
      const diffDays = Math.round((d.getTime() - dayStart.getTime()) / 86400000)
      return diffDays % rule.interval === 0
    }
    case 'weekday':
      return d.getDay() >= 1 && d.getDay() <= 5
    case 'weekly':
      return rule.week_days.includes(d.getDay())
    case 'monthly':
      return rule.month_days.includes(d.getDate())
    case 'monthly_last': {
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      return d.getDate() === lastDay
    }
    case 'yearly':
      return d.getMonth() + 1 === rule.year_month && d.getDate() === rule.year_month_day
    case 'yearly_lunar': {
      if (!rule.lunar_month || !rule.lunar_day) return false
      const lunar = Lunar.fromDate(d)
      return lunar.getMonth() === rule.lunar_month && lunar.getDay() === rule.lunar_day
    }
    default:
      return false
  }
}
