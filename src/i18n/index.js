import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'
import de from './locales/de.json'
import it from './locales/it.json'

export const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'it']
export const LOCALE_NAMES = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
}
const STORAGE_KEY = 'eazip-locale'

function detectInitial() {
  if (typeof window === 'undefined') return 'en'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved
  } catch (_) {}
  const navLangs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const lang of navLangs) {
    if (!lang) continue
    const short = lang.slice(0, 2).toLowerCase()
    if (SUPPORTED_LOCALES.includes(short)) return short
  }
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectInitial(),
  fallbackLocale: 'en',
  messages: { en, fr, de, it },
})

export function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return
  i18n.global.locale.value = locale
  try { localStorage.setItem(STORAGE_KEY, locale) } catch (_) {}
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', locale)
  }
}
