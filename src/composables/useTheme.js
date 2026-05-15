import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'eazip-theme'

function readInitial() {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref(readInitial())

export function useTheme() {
  watchEffect(() => {
    const root = document.documentElement
    if (theme.value === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem(STORAGE_KEY, theme.value) } catch (_) {}
  })

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
}
