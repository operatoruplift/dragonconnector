// Dragon Connector service worker. It caches the whole app when installed, so it opens offline,
// and a new version waits until the person chooses to reload (see src/main.js).
importScripts('precache.js'); // defines self.PRECACHE = { version, files }

const CACHE = `dragonconnector-${self.PRECACHE.version}`;
const SCOPE = new URL(self.registration.scope).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(self.PRECACHE.files)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('dragonconnector-') && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // The app shell: every navigation within the app is the same page with a different #route.
  if (request.mode === 'navigate' && (url.pathname === SCOPE || url.pathname === `${SCOPE}index.html`)) {
    event.respondWith(caches.match('index.html').then((cached) => cached || fetch(request)));
    return;
  }

  event.respondWith(caches.match(request, { ignoreSearch: true }).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});
