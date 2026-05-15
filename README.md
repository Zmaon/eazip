<p align="center">
  <picture>
    <img alt="eazip" src="public/eazip-logo-dark.svg" width="240">
  </picture>
</p>

# eazip.ch

> Zip it. Lock it. Send it.

The easiest way to make a password-protected ZIP file. Drop files, pick a
security level, download the archive. **Nothing is ever uploaded**: compression
and encryption run entirely in your browser.

Available in English, French, German and Italian.

## Why

Creating a password-protected ZIP is needlessly hard for non-technical users:
macOS Finder has no UI for it, Windows Explorer can do ZipCrypto but not AES,
and every online "ZIP password" service silently uploads your files. eazip.ch
fixes all three at once: it runs in the browser, the UI is one page with three
clear choices, and files never leave the device.

## Encryption modes

| Mode | Format | Strength | Compatibility |
|------|--------|----------|---------------|
| **No password** | Plain ZIP, deflate | none | universal |
| **Legacy password** | ZipCrypto | weak (broken by known-plaintext attacks) | universal |
| **Modern password** | AES-256 (WinZip AE-2) | secure | recent macOS opens it natively; Windows recipients need 7-Zip / WinRAR; any modern Linux archiver works |

The "modern" mode produces files with compression method 99 and the WinZip AES
extra field (`0x9901`) with strength byte `0x03`, verified by unit tests, see
[`src/lib/zip.test.js`](src/lib/zip.test.js).

## Privacy

- Files never leave the device. There is no backend.
- Compression and encryption run in a Web Worker via [zip.js].
- The output is streamed straight to disk: via the File System Access API on
  Chromium browsers, or via a service worker that pipes bytes into a normal
  download on Firefox/Safari. Archives are not buffered in memory, so file size
  is limited by disk space, not RAM.
- No analytics, no tracking, no account.

## Passphrase generator

The "Generate" button produces a 5-word Diceware-style passphrase drawn from
the EFF Long Wordlist (7776 words). Five words is roughly 64 bits of entropy:
unbreakable in practice for AES-256 ZIPs and dramatically easier to read,
retype and remember than a random character string. Indices are picked with
`crypto.getRandomValues` and rejection sampling to avoid modulo bias.

## Browser support

| Browser | File System Access API | Service Worker streaming |
|---------|------------------------|--------------------------|
| Chrome / Edge / Opera | yes (save dialog up front) | fallback |
| Firefox | no | yes |
| Safari | no | yes |

Browsers without either path show a "browser too old" notice rather than
silently buffering huge archives in memory.

## Tech stack

- [Vue 3](https://vuejs.org/) (composition API, `<script setup>`)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [vue-i18n](https://vue-i18n.intlify.dev/) (en, fr, de, it)
- [zip.js](https://gildas-lormeau.github.io/zip.js/) for compression and AES
- [eff-diceware-passphrase](https://github.com/dignifiedquire/eff-diceware-passphrase) (wordlist only)
- [Vitest](https://vitest.dev/) for the encryption tests
- All assets (fonts, wordlist) are self-hosted: no CDN calls at runtime

## Getting started

Requires Node 20+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev           # local dev server on http://localhost:5173
pnpm test          # run unit tests once
pnpm test:watch    # run unit tests in watch mode
pnpm build         # production build into dist/
pnpm preview       # preview the production build
```

## Project layout

```
public/
  favicon.svg
  sw.js                       service worker for streaming downloads
src/
  App.vue                     page layout, form orchestration
  main.js                     app entrypoint, font + i18n wiring
  style.css                   Tailwind v4 imports, brand tokens, .eazip-wordmark
  components/
    Dropzone.vue              file picker / drag & drop / list
    ModePicker.vue            three radio cards (none / legacy / modern)
    PasswordField.vue         input, reveal, copy, Generate, strength meter
    LanguagePicker.vue        EN / FR / DE / IT switcher
    InfoSection.vue           bottom-of-page explanations
  composables/
    useTheme.js               dark/light mode with localStorage persistence
  i18n/
    index.js                  vue-i18n config + browser language detection
    locales/{en,fr,de,it}.json
  lib/
    zip.js                    encryption-mode wiring around zip.js
    zip.test.js               byte-level assertions on the produced archives
    streamSaver.js            registers sw.js and exposes a WritableStream
    passphrase.js             Diceware generator (bias-free)
```

## Testing

Unit tests focus on the one place a silent regression would actively harm
users: the mapping from UI mode (`none` / `legacy` / `modern`) to the bytes
that end up in the archive. A test that asserts "encrypted" without checking
the AES extra field would have passed even when the code was producing weak
ZipCrypto.

```bash
pnpm test
```

## License

MIT - see [LICENSE](LICENSE).

[zip.js]: https://gildas-lormeau.github.io/zip.js/
