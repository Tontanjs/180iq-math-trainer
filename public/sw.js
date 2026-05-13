const CACHE = '180iq-v1';
const PRECACHE = ['/', '/puzzle', '/practice', '/progress'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Only cache same-origin requests; skip _next/webpack HMR in dev
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchAndCache = fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
      // Network-first for navigation, cache-first for assets
      if (e.request.mode === 'navigate') {
        return fetchAndCache.catch(() => cached || new Response('Offline', { status: 503 }));
      }
      return cached || fetchAndCache;
    })
  );
});
