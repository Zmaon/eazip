<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import Dropzone from './components/Dropzone.vue'
import ModePicker from './components/ModePicker.vue'
import PasswordField from './components/PasswordField.vue'
import InfoSection from './components/InfoSection.vue'
import LanguagePicker from './components/LanguagePicker.vue'
import { useTheme } from './composables/useTheme.js'
import {
  MODES,
  createZip,
  openZipDestination,
  fsAccessSupported,
} from './lib/zip.js'
import { streamSaverSupported } from './lib/streamSaver.js'

const { theme, toggle: toggleTheme } = useTheme()
const { t, locale } = useI18n()

const files = ref([])
const mode = ref(MODES.NONE)
const password = ref('')
const archiveName = ref('eazip')
const progress = ref(null)
const status = ref({ kind: 'idle', message: '' })

const isBusy = computed(() => status.value.kind === 'working')
const needsPassword = computed(() => mode.value !== MODES.NONE)
const canSubmit = computed(() => {
  if (files.value.length === 0) return false
  if (needsPassword.value && password.value.length === 0) return false
  if (isBusy.value) return false
  return true
})

const browserSupported = computed(
  () => fsAccessSupported() || streamSaverSupported(),
)

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const [, name, key] = selector.match(/\[(name|property)="([^"]+)"\]/) || []
    if (name && key) el.setAttribute(name, key)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

watchEffect(() => {
  if (typeof document === 'undefined') return
  const title = t('meta.title')
  const desc = t('meta.description')
  const ogLocale = t('meta.ogLocale')
  document.title = title
  document.documentElement.setAttribute('lang', locale.value)
  setMeta('meta[name="description"]', 'content', desc)
  setMeta('meta[property="og:title"]', 'content', title)
  setMeta('meta[property="og:description"]', 'content', desc)
  setMeta('meta[property="og:locale"]', 'content', ogLocale)
  setMeta('meta[name="twitter:title"]', 'content', title)
  setMeta('meta[name="twitter:description"]', 'content', desc)
})

function addFiles(list) {
  files.value = [...files.value, ...list]
}
function removeFile(idx) {
  files.value = files.value.filter((_, i) => i !== idx)
}
function clearFiles() {
  files.value = []
}

const progressText = computed(() => {
  const p = progress.value
  if (!p) return ''
  const percent = p.total ? Math.round((p.loaded / p.total) * 100) : 0
  return t('form.statusProgress', {
    entry: p.entry,
    percent,
    index: p.entryIndex + 1,
    count: p.entryCount,
  })
})

const statusLabel = computed(() => {
  if (status.value.kind === 'working') {
    return progressText.value || t('form.submitBusy')
  }
  if (status.value.kind === 'idle') {
    if (files.value.length === 0) return t('form.statusAddFile')
    if (needsPassword.value && !password.value) return t('form.statusPickPassword')
    return t('form.statusReady')
  }
  return status.value.message
})

async function onSubmit() {
  if (!canSubmit.value) return
  status.value = { kind: 'working', message: t('form.submitBusy') }
  progress.value = null

  const filename = (archiveName.value.trim() || 'eazip') + '.zip'

  let destination
  try {
    destination = await openZipDestination(filename)
  } catch (err) {
    if (err && err.name === 'AbortError') {
      status.value = { kind: 'idle', message: '' }
      return
    }
    if (err && err.code === 'UNSUPPORTED_BROWSER') {
      status.value = { kind: 'error', message: t('form.errorUnsupported') }
      return
    }
    status.value = { kind: 'error', message: err?.message || t('form.errorOpen') }
    return
  }

  try {
    await createZip({
      files: files.value,
      writable: destination.writable,
      mode: mode.value,
      password: password.value,
      onProgress: (p) => {
        progress.value = p
      },
    })
    status.value = {
      kind: 'success',
      message:
        destination.mode === 'fs'
          ? t('form.statusSavedFs', { filename })
          : t('form.statusDownloading', { filename }),
    }
    progress.value = null
  } catch (err) {
    status.value = {
      kind: 'error',
      message: err?.message || t('form.errorGeneric'),
    }
  }
}
</script>

<template>
  <div class="relative flex min-h-full flex-col">
    <header class="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
      <a href="/" class="eazip-wordmark" style="font-size: 35px" aria-label="eazip"><span class="ea">ea</span><span class="zip">zip</span></a>
      <div class="flex items-center gap-2">
        <LanguagePicker />
        <button
          type="button"
          class="cursor-pointer rounded-2xl border border-zinc-200 bg-white/80 p-2.5 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
          :aria-label="theme === 'dark' ? t('header.themeToLight') : t('header.themeToDark')"
          @click="toggleTheme"
        >
          <svg v-if="theme === 'dark'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
          </svg>
        </button>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-6 pb-20">
      <section class="pt-6 pb-10 sm:pt-12">
        <p class="font-display text-sm font-bold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-300">
          {{ t('hero.kicker') }}
        </p>
        <h1 class="mt-3 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
          {{ t('hero.title1') }}
          <span class="bg-gradient-to-r from-brand-500 via-flame-500 to-flame-400 bg-clip-text text-transparent">{{ t('hero.title2') }}</span>
          <br />{{ t('hero.title3') }}
        </h1>
        <p class="mt-5 max-w-xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
          {{ t('hero.subtitle') }}
        </p>
      </section>

      <form class="card relative space-y-8 p-6 sm:p-8" @submit.prevent="onSubmit">
        <div
          v-if="!browserSupported"
          class="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <p class="font-bold">{{ t('form.unsupportedTitle') }}</p>
          <p class="mt-1">{{ t('form.unsupportedBody') }}</p>
        </div>

        <div>
          <h2 class="mb-3 font-display text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {{ t('form.stepFiles', { n: 1 }) }}
          </h2>
          <Dropzone
            :files="files"
            @add="addFiles"
            @remove="removeFile"
            @clear="clearFiles"
          />
        </div>

        <div>
          <h2 class="mb-3 font-display text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {{ t('form.stepMode', { n: 2 }) }}
          </h2>
          <ModePicker v-model="mode" />
        </div>

        <div v-if="needsPassword">
          <h2 class="mb-3 font-display text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {{ t('form.stepPassword', { n: 3 }) }}
          </h2>
          <PasswordField v-model="password" :mode="mode" />
        </div>

        <div>
          <h2 class="mb-3 font-display text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {{ t('form.stepName', { n: needsPassword ? 4 : 3 }) }}
          </h2>
          <div class="flex items-stretch gap-0 overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-brand-400">
            <input
              v-model="archiveName"
              type="text"
              spellcheck="false"
              :placeholder="t('form.archivePlaceholder')"
              class="flex-1 bg-transparent px-4 py-3 text-base focus:outline-none"
            />
            <span class="flex items-center bg-zinc-100 px-4 font-mono text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              .zip
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-sm text-zinc-500 dark:text-zinc-400">
            <span v-if="status.kind === 'working'" class="flex items-center gap-2 text-brand-600 dark:text-brand-300">
              <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              <span>{{ statusLabel }}</span>
            </span>
            <span v-else-if="status.kind === 'success'" class="font-semibold text-emerald-600 dark:text-emerald-400">
              {{ statusLabel }}
            </span>
            <span v-else-if="status.kind === 'error'" class="font-semibold text-rose-600 dark:text-rose-400">
              {{ statusLabel }}
            </span>
            <span v-else>{{ statusLabel }}</span>
          </div>
          <button type="submit" class="btn-primary" :disabled="!canSubmit">
            <span>{{ isBusy ? t('form.submitBusy') : t('form.submitIdle') }}</span>
            <svg v-if="!isBusy" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </form>

      <InfoSection />
    </main>

    <footer class="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-900 dark:text-zinc-500">
      <p>eazip.ch · {{ t('footer.tagline') }}</p>
    </footer>
  </div>
</template>

<style>
.info-link {
  color: var(--color-brand-600);
  text-underline-offset: 4px;
  font-weight: 600;
}
.info-link:hover { text-decoration: underline; }
html.dark .info-link { color: var(--color-brand-300); }
</style>
