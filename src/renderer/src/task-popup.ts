import { createApp } from 'vue'
import { createPinia } from 'pinia'
import i18n, { initLocale } from './locales'
import TaskPopup from './views/TaskPopup.vue'
import './styles/global.css'

const app = createApp(TaskPopup)
app.use(createPinia())
app.use(i18n)
app.mount('#app')

initLocale().catch(() => {})
