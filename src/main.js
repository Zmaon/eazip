import { createApp } from 'vue'
import '@fontsource/space-grotesk/700.css'
import './style.css'
import App from './App.vue'
import { i18n } from './i18n'

createApp(App).use(i18n).mount('#app')
