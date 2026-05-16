<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  files: { type: Array, required: true },
})
const emit = defineEmits(['add', 'remove', 'clear'])

const { t } = useI18n()
const input = ref(null)
const isDragging = ref(false)

const totalSize = computed(() =>
  props.files.reduce((sum, f) => sum + f.size, 0),
)

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let n = bytes / 1024
  let i = 0
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n >= 10 ? 0 : 1)} ${units[i]}`
}

function onPick() {
  input.value?.click()
}
function onFiles(e) {
  const list = Array.from(e.target.files ?? [])
  if (list.length) emit('add', list)
  e.target.value = ''
}

async function readAllEntries(reader) {
  const all = []
  while (true) {
    const batch = await new Promise((resolve, reject) =>
      reader.readEntries(resolve, reject),
    )
    if (!batch.length) break
    all.push(...batch)
  }
  return all
}

async function walkEntry(entry, parentPath, out) {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject))
    file._relPath = parentPath ? `${parentPath}/${file.name}` : file.name
    out.push(file)
    return
  }
  if (entry.isDirectory) {
    const dirPath = parentPath ? `${parentPath}/${entry.name}` : entry.name
    const reader = entry.createReader()
    const children = await readAllEntries(reader)
    for (const child of children) {
      await walkEntry(child, dirPath, out)
    }
  }
}

async function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const items = e.dataTransfer?.items
  const entries = []
  if (items && items.length) {
    for (const item of items) {
      if (item.kind !== 'file') continue
      const entry = item.webkitGetAsEntry?.()
      if (entry) entries.push(entry)
    }
  }
  if (entries.length) {
    const collected = []
    for (const entry of entries) {
      await walkEntry(entry, '', collected)
    }
    if (collected.length) emit('add', collected)
    return
  }
  const list = Array.from(e.dataTransfer?.files ?? [])
  if (list.length) emit('add', list)
}
function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}
function onDragLeave() {
  isDragging.value = false
}
</script>

<template>
  <div>
    <div
      class="group relative cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-200"
      :class="[
        isDragging
          ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
          : 'border-zinc-300 hover:border-brand-400 hover:bg-brand-500/5 dark:border-zinc-700 dark:hover:border-brand-400',
      ]"
      @click="onPick"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <input
        ref="input"
        type="file"
        multiple
        class="hidden"
        @change="onFiles"
      />
      <div class="flex flex-col items-center gap-3">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-flame-500 text-white shadow-lg shadow-brand-500/30 transition-transform duration-200 group-hover:scale-110">
          <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <p class="font-display text-xl font-bold tracking-tight">
          {{ t('dropzone.drop') }}
        </p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
          {{ t('dropzone.browsePrefix') }}
          <span class="font-semibold text-brand-600 dark:text-brand-300 underline-offset-2 group-hover:underline">{{ t('dropzone.browseLink') }}</span>
        </p>
        <p class="text-xs text-zinc-400 dark:text-zinc-500">
          {{ t('dropzone.subnote') }}
        </p>
      </div>
    </div>

    <ul v-if="files.length" class="mt-5 max-h-80 space-y-2 overflow-y-auto pr-1">
      <li
        v-for="(f, idx) in files"
        :key="`${f.name}-${idx}`"
        class="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60"
      >
        <div class="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ f._relPath || f.webkitRelativePath || f.name }}</p>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ formatBytes(f.size) }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-rose-500 dark:hover:bg-zinc-800"
          :aria-label="t('dropzone.removeLabel')"
          @click.stop="emit('remove', idx)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </li>
    </ul>

    <div v-if="files.length" class="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
      <span>{{ t('dropzone.summary', { count: files.length, size: formatBytes(totalSize) }, files.length) }}</span>
      <button type="button" class="font-semibold uppercase tracking-wider hover:text-rose-500" @click="emit('clear')">
        {{ t('dropzone.clear') }}
      </button>
    </div>
  </div>
</template>
