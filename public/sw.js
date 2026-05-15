// eazip.ch streaming-download service worker.
// Receives a stream over a MessageChannel and serves it back as a normal download
// when the page navigates to /__eazip_dl__/<id>/<filename>.
//
// This is how Firefox / Safari get true streaming-to-disk without buffering the
// whole archive in memory.

const streams = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'eazip-register') return;
  const { id, filename, stream, size } = data;
  streams.set(id, { filename, stream, size, created: Date.now() });
  // Tell the page we're ready.
  event.ports[0]?.postMessage({ type: 'eazip-ready', id });
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/__eazip_dl__/')) return;

  const parts = url.pathname.split('/');
  // /__eazip_dl__/<id>/<filename>
  const id = parts[2];
  const entry = streams.get(id);
  if (!entry) {
    event.respondWith(new Response('Download expired', { status: 404 }));
    return;
  }
  streams.delete(id);

  const headers = new Headers({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(entry.filename)}"`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (entry.size && Number.isFinite(entry.size)) {
    headers.set('Content-Length', String(entry.size));
  }

  event.respondWith(new Response(entry.stream, { headers }));
});
