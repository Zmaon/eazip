<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LOCALE_NAMES, SUPPORTED_LOCALES, setLocale } from '../i18n'

const { locale, t } = useI18n()
const open = ref(false)
const root = ref(null)

const currentCode = computed(() => locale.value.toUpperCase())

function toggle() {
  open.value = !open.value
}
function pick(code) {
  setLocale(code)
  open.value = false
}
function onDocClick(e) {
  if (!root.value) return
  if (!root.value.contains(e.target)) open.value = false
}
function onKey(e) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex cursor-pointer items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
      :aria-label="t('header.language')"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15 15 0 0 1 0 20" />
        <path d="M12 2a15 15 0 0 0 0 20" />
      </svg>
      <span>{{ currentCode }}</span>
      <svg class="h-3 w-3 transition-transform" :class="{ 'rotate-180': open }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
    <ul
      v-if="open"
      class="absolute right-0 z-30 mt-2 min-w-[10rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      role="listbox"
    >
      <li v-for="code in SUPPORTED_LOCALES" :key="code">
        <button
          type="button"
          class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          :class="{ 'font-bold text-brand-600 dark:text-brand-300': locale === code }"
          role="option"
          :aria-selected="locale === code"
          @click="pick(code)"
        >
          <span>{{ LOCALE_NAMES[code] }}</span>
          <span class="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{{ code }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
