<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MODES } from '../lib/zip.js'

defineProps({
  modelValue: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const options = computed(() => [
  {
    value: MODES.NONE,
    title: t('modes.none.title'),
    blurb: t('modes.none.blurb'),
    tag: t('modes.none.tag'),
    tagClass: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    gradient: 'from-zinc-400 to-zinc-600',
    icon: 'unlock',
  },
  {
    value: MODES.LEGACY,
    title: t('modes.legacy.title'),
    blurb: t('modes.legacy.blurb'),
    tag: t('modes.legacy.tag'),
    tagClass: 'bg-flame-500/15 text-flame-600 dark:text-flame-400',
    gradient: 'from-flame-400 to-flame-600',
    icon: 'lock',
  },
  {
    value: MODES.MODERN,
    title: t('modes.modern.title'),
    blurb: t('modes.modern.blurb'),
    tag: t('modes.modern.tag'),
    tagClass: 'bg-brand-500/15 text-brand-600 dark:text-brand-300',
    gradient: 'from-brand-500 to-brand-700',
    icon: 'shield',
  },
])

function pick(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-3">
    <label
      v-for="opt in options"
      :key="opt.value"
      class="group relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200"
      :class="[
        modelValue === opt.value
          ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/20 dark:bg-brand-500/10'
          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700',
      ]"
    >
      <input
        type="radio"
        name="mode"
        class="sr-only"
        :value="opt.value"
        :checked="modelValue === opt.value"
        @change="pick(opt.value)"
      />
      <div class="flex items-start justify-between">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md"
          :class="opt.gradient"
        >
          <svg v-if="opt.icon === 'unlock'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
          <svg v-else-if="opt.icon === 'lock'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <span class="chip" :class="opt.tagClass">{{ opt.tag }}</span>
      </div>
      <div class="mt-4">
        <p class="font-display text-lg font-bold tracking-tight">{{ opt.title }}</p>
        <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{{ opt.blurb }}</p>
      </div>
      <div
        v-if="modelValue === opt.value"
        class="absolute right-4 top-4 hidden h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white sm:flex"
        aria-hidden="true"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12l5 5 9-11" />
        </svg>
      </div>
    </label>
  </div>
</template>
