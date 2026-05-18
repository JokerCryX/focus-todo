import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import i18n, { initLocale } from './locales'
import TodoWidget from './components/widget/TodoWidget.vue'
import './styles/global.css'

const app = createApp(TodoWidget)
app.use(createPinia())
app.use(i18n)
app.mount('#widget-app')

// Remove test overlay if present
document.getElementById('test-overlay')?.remove()

initLocale().catch(() => {})
