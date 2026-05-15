<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section class="mt-20 space-y-12">
    <header class="text-center">
      <p class="font-display text-sm font-bold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-300">
        {{ t('info.kicker') }}
      </p>
      <h2 class="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
        {{ t('info.title') }}
      </h2>
      <p class="mx-auto mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
        {{ t('info.intro') }}
      </p>
    </header>

    <div class="grid gap-6 md:grid-cols-3">
      <div class="card p-6">
        <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-400 to-zinc-600 text-white shadow-md">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        </div>
        <h3 class="font-display text-lg font-bold">{{ t('info.noneTitle') }}</h3>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{{ t('info.noneBody') }}</p>
      </div>

      <div class="card p-6">
        <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-flame-400 to-flame-600 text-white shadow-md">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 class="font-display text-lg font-bold">{{ t('info.legacyTitle') }}</h3>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{{ t('info.legacyBody') }}</p>
        <p class="mt-3 text-xs font-semibold uppercase tracking-wider text-flame-600 dark:text-flame-400">
          {{ t('info.legacyTag') }}
        </p>
      </div>

      <div class="card p-6">
        <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h3 class="font-display text-lg font-bold">{{ t('info.modernTitle') }}</h3>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{{ t('info.modernBody') }}</p>
        <p class="mt-3 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
          {{ t('info.modernTag') }}
        </p>
      </div>
    </div>

    <div class="card p-8">
      <h3 class="font-display text-xl font-bold">{{ t('info.guideTitle') }}</h3>
      <div class="mt-5 space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
        <div class="flex gap-3">
          <span class="mt-0.5 inline-block h-5 w-5 flex-none rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <p v-html="t('info.guideNone')" />
        </div>
        <div class="flex gap-3">
          <span class="mt-0.5 inline-block h-5 w-5 flex-none rounded-full bg-flame-500" />
          <p v-html="t('info.guideLegacy')" />
        </div>
        <div class="flex gap-3">
          <span class="mt-0.5 inline-block h-5 w-5 flex-none rounded-full bg-brand-500" />
          <p v-html="t('info.guideModern')" />
        </div>
      </div>
    </div>

    <div class="card p-8">
      <h3 class="font-display text-xl font-bold">{{ t('info.passwordsTitle') }}</h3>
      <p class="mt-3 text-sm text-zinc-700 dark:text-zinc-300" v-html="t('info.passwordsPara1')" />
      <p class="mt-3 text-sm text-zinc-700 dark:text-zinc-300" v-html="t('info.passwordsPara2')" />
    </div>

    <div class="card p-8">
      <h3 class="font-display text-xl font-bold">{{ t('info.privacyTitle') }}</h3>
      <ul class="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
        <li class="flex gap-2"><span class="text-brand-600 dark:text-brand-300">✓</span> {{ t('info.privacyItem1') }}</li>
        <li class="flex gap-2"><span class="text-brand-600 dark:text-brand-300">✓</span> {{ t('info.privacyItem2') }}</li>
        <li class="flex gap-2"><span class="text-brand-600 dark:text-brand-300">✓</span> {{ t('info.privacyItem3') }}</li>
        <li class="flex gap-2"><span class="text-brand-600 dark:text-brand-300">✓</span> {{ t('info.privacyItem4') }}</li>
      </ul>
    </div>
  </section>
</template>
