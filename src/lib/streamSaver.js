// Tiny streaming-download helper backed by our public/sw.js.
// Returns a WritableStream that the caller can pipe ZIP bytes into.
// The browser's standard download dialog appears the moment the user navigates
// to the synthetic /__eazip_dl__/<id>/<filename> URL we register with the SW.

let registration = null;

async function ensureWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not available.');
  }
  if (registration && registration.active) return registration;
  registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  if (!registration.active) {
    await new Promise((resolve) => {
      const sw = registration.installing || registration.waiting;
      if (!sw) return resolve();
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') resolve();
      });
    });
  }
  await navigator.serviceWorker.ready;
  return registration;
}

function randomId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a WritableStream that streams to the user's disk as a download.
 * @param {string} filename
 * @param {number} [size] optional total byte length, helps the browser show progress
 * @returns {Promise<WritableStream<Uint8Array>>}
 */
export async function createStreamSaver(filename, size) {
  const reg = await ensureWorker();
  const sw = reg.active || navigator.serviceWorker.controller;
  if (!sw) throw new Error('Service worker is not controlling the page yet. Reload and try again.');

  const id = randomId();
  const { readable, writable } = new TransformStream();

  const ack = new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      if (event.data?.type === 'eazip-ready') resolve();
      else reject(new Error('Service worker did not acknowledge stream registration.'));
    };
    sw.postMessage(
      { type: 'eazip-register', id, filename, size, stream: readable },
      [readable, channel.port2],
    );
  });

  await ack;

  // Trigger the download by navigating a hidden iframe to the synthetic URL.
  const downloadUrl = `/__eazip_dl__/${id}/${encodeURIComponent(filename)}`;
  const iframe = document.createElement('iframe');
  iframe.hidden = true;
  iframe.src = downloadUrl;
  document.body.appendChild(iframe);
  setTimeout(() => iframe.remove(), 30_000);

  return writable;
}

export function streamSaverSupported() {
  return 'serviceWorker' in navigator && typeof TransformStream !== 'undefined';
}
