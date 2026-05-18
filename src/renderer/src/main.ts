import { createApp, computed } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import enEl from 'element-plus/dist/locale/en.mjs'
import router from './router'
import i18n, { initLocale } from './locales'
import App from './App.vue'
import './styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)

const epLocale = computed(() => {
  return (i18n.global.locale.value as string).startsWith('zh') ? zhCn : enEl
})
app.use(ElementPlus, { locale: epLocale.value })

app.mount('#app')

initLocale()
