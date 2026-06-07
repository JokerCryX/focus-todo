import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import i18n, { initLocale } from './locales'
import StickyNoteWidget from './components/stickynote/StickyNoteWidget.vue'
import './styles/global.css'

const app = createApp(StickyNoteWidget)
app.use(createPinia())
app.use(i18n)
app.mount('#sticky-widget-app')

initLocale().catch(() => {})
