<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import * as zxcvbnCommon from '@zxcvbn-ts/language-common'
import { generatePassphrase } from '../lib/passphrase.js'

zxcvbnOptions.setOptions({
  dictionary: zxcvbnCommon.dictionary,
  graphs: zxcvbnCommon.adjacencyGraphs,
})

const props = defineProps({
  modelValue: { type: String, required: true },
  mode: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const reveal = ref(false)
const copied = ref(false)
let copyTimer = null

const strength = computed(() => {
  const pwd = props.modelValue
  if (!pwd) return { score: 0, label: t('password.strengthEmpty'), color: 'bg-zinc-300 dark:bg-zinc-700' }
  const result = zxcvbn(pwd)
  const score = result.score === 4 && result.guessesLog10 >= 13 ? 5 : result.score
  const palette = [
    'bg-rose-500',
    'bg-rose-400',
    'bg-flame-400',
    'bg-acid-500',
    'bg-emerald-500',
    'bg-emerald-500',
  ]
  return {
    score,
    label: t(`password.strength${score}`),
    color: palette[score],
  }
})

function update(e) {
  emit('update:modelValue', e.target.value)
}

function generate() {
  emit('update:modelValue', generatePassphrase(5))
  reveal.value = true
}

async function copy() {
  if (!props.modelValue) return
  try {
    await navigator.clipboard.writeText(props.modelValue)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 1600)
  } catch (_) {
    // Clipboard unavailable (insecure context, denied permission). Silent.
  }
}
</script>

<template>
  <div>
    <label class="mb-2 block font-display text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
      {{ t('password.label') }}
    </label>
    <div class="relative">
      <input
        :type="reveal ? 'text' : 'password'"
        :value="modelValue"
        autocomplete="new-password"
        spellcheck="false"
        :placeholder="t('password.placeholder')"
        class="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 pr-32 font-mono text-base shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-brand-400"
        @input="update"
      />
      <div class="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        <button
          type="button"
          class="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          :aria-label="reveal ? t('password.hide') : t('password.show')"
          :title="reveal ? t('password.hide') : t('password.show')"
          @click="reveal = !reveal"
        >
          <svg v-if="reveal" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3l18 18" />
            <path d="M10.6 6.1A9.2 9.2 0 0 1 12 6c7 0 10 6 10 6a14 14 0 0 1-3.3 4.2" />
            <path d="M6.6 6.6A14 14 0 0 0 2 12s3 6 10 6c1.8 0 3.4-.4 4.8-1" />
            <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
          </svg>
          <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button
          type="button"
          class="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white disabled:opacity-40"
          :aria-label="t('password.copy')"
          :title="t('password.copy')"
          :disabled="!modelValue"
          @click="copy"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 hover:bg-brand-500/10 dark:text-brand-300"
          :title="t('password.generateTitle')"
          @click="generate"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 1-15.5 6.3L3 21" />
            <path d="M21 3v6h-6" />
            <path d="M3 12a9 9 0 0 1 15.5-6.3L21 3" />
            <path d="M3 21v-6h6" />
          </svg>
          <span>{{ t('password.generate') }}</span>
        </button>
      </div>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <span
          v-if="copied"
          class="pointer-events-none absolute -top-3 right-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md"
          role="status"
        >
          {{ t('password.copied') }}
        </span>
      </transition>
    </div>

    <div class="mt-3 flex items-center gap-3">
      <div class="flex h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          class="h-full transition-all duration-300"
          :class="strength.color"
          :style="{ width: `${Math.min(strength.score, 5) * 20}%` }"
        />
      </div>
      <span class="w-28 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {{ strength.label }}
      </span>
    </div>

    <p class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
      {{ t('password.generateHint') }}
    </p>

    <p v-if="mode === 'legacy'" class="mt-3 rounded-xl bg-flame-500/10 px-3 py-2 text-xs text-flame-700 dark:text-flame-400">
      {{ t('password.warnLegacy') }}
    </p>
    <p v-else-if="mode === 'modern'" class="mt-3 rounded-xl bg-brand-500/10 px-3 py-2 text-xs text-brand-700 dark:text-brand-300">
      {{ t('password.warnModern') }}
    </p>
  </div>
</template>
