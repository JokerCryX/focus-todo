import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import en from './en'

const savedLang = localStorage.getItem('language') || 'zh-CN'

const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en': en
  }
})

export async function initLocale(): Promise<void> {
  try {
    const settings = await window.api.settings.getAll()
    const lang = settings['language'] || 'zh-CN'
    i18n.global.locale.value = lang as any
    localStorage.setItem('language', lang)
  } catch {}
}

export async function setLanguage(lang: string): Promise<void> {
  i18n.global.locale.value = lang as any
  localStorage.setItem('language', lang)
  await window.api.settings.set('language', lang)
  document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en'
}

export default i18n
