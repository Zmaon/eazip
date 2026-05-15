import {
  ZipWriter,
  BlobReader,
  configure,
} from '@zip.js/zip.js';
import { createStreamSaver, streamSaverSupported } from './streamSaver.js';

configure({ useWebWorkers: true });

/**
 * Encryption modes supported by eazip.ch.
 * - none:   no password, no encryption.
 * - legacy: ZipCrypto (universally opens, cryptographically weak).
 * - modern: AES-256 / WinZip AE-2 (secure, needs 7-Zip/Keka/WinRAR/etc).
 */
export const MODES = Object.freeze({
  NONE: 'none',
  LEGACY: 'legacy',
  MODERN: 'modern',
});

export function fsAccessSupported() {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/**
 * Open a writable destination for the ZIP bytes.
 * Tries File System Access API first, then a streaming-download service worker.
 * Throws if neither is available so the UI can show an unsupported-browser message.
 *
 * @param {string} filename
 * @returns {Promise<{ writable: WritableStream<Uint8Array>, mode: 'fs' | 'sw' }>}
 */
export async function openZipDestination(filename) {
  if (fsAccessSupported()) {
    let handle;
    try {
      handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'ZIP archive',
            accept: { 'application/zip': ['.zip'] },
          },
        ],
      });
    } catch (err) {
      if (err && err.name === 'AbortError') throw err;
      // Fall through to SW path if FS Access errored for any other reason.
    }
    if (handle) {
      const writable = await handle.createWritable();
      return { writable, mode: 'fs' };
    }
  }
  if (streamSaverSupported()) {
    const writable = await createStreamSaver(filename);
    return { writable, mode: 'sw' };
  }
  const err = new Error('UNSUPPORTED_BROWSER');
  err.code = 'UNSUPPORTED_BROWSER';
  throw err;
}

/**
 * Build a ZIP from `files` and stream it to `writable`.
 *
 * @param {object} opts
 * @param {File[]} opts.files
 * @param {WritableStream<Uint8Array>} opts.writable
 * @param {'none'|'legacy'|'modern'} opts.mode
 * @param {string} [opts.password]
 * @param {(progress: { entry: string, loaded: number, total: number, entryIndex: number, entryCount: number }) => void} [opts.onProgress]
 */
export async function createZip({ files, writable, mode, password, onProgress }) {
  const usesPassword = mode === MODES.LEGACY || mode === MODES.MODERN;
  if (usesPassword && (!password || password.length === 0)) {
    throw new Error('Password is required for legacy and modern modes.');
  }

  const writerOptions = {
    bufferedWrite: true,
    keepOrder: true,
  };
  if (usesPassword) {
    writerOptions.password = password;
    writerOptions.encryptionStrength = mode === MODES.MODERN ? 3 : undefined;
    writerOptions.zipCrypto = mode === MODES.LEGACY;
  }

  const zipWriter = new ZipWriter(writable, writerOptions);

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath && file.webkitRelativePath.length > 0
        ? file.webkitRelativePath
        : file.name;
      await zipWriter.add(relPath, new BlobReader(file), {
        onprogress: (loaded, total) => {
          onProgress?.({
            entry: relPath,
            loaded,
            total,
            entryIndex: i,
            entryCount: files.length,
          });
          return undefined;
        },
      });
    }
    await zipWriter.close();
  } catch (err) {
    try { await writable.abort?.(err); } catch (_) {}
    throw err;
  }
}
