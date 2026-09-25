const SERVICE_WORKER_VERSION = 'bsmftek-install-shell-20260925-2';
const CACHE_NAME = SERVICE_WORKER_VERSION;
const CACHE_PREFIXES = ['shamie-app-', 'bsmftek-activation-', 'bsmftek-install-shell-'];
const APP_SHELL = [
  './install-app.html',
  './install-app.css?v=20260925-2',
  './install-app.js?v=20260925-3',
  './manifest.webmanifest',
  './assets/bluestar-logo.png',
  './assets/shamie-app-192.png',
  './assets/shamie-app-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => (
        key !== CACHE_NAME && CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))
      )).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'GET_VERSION') return;
  event.ports[0]?.postMessage({ version: SERVICE_WORKER_VERSION });
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const scopePath = new URL(self.registration.scope).pathname;
  const relativePath = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : '';
  if (relativePath === 'activation-api.json' || relativePath === 'app.js'
    || relativePath === 'index.html' || relativePath === '') {
    event.respondWith(fetch(new Request(event.request, { cache: 'no-store' })));
    return;
  }
  const cachedShellPath = new Set([
    'install-app.html', 'install-app.css', 'install-app.js', 'manifest.webmanifest',
    'assets/bluestar-logo.png', 'assets/shamie-app-192.png', 'assets/shamie-app-512.png'
  ]);
  if (!cachedShellPath.has(relativePath)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(new Request(event.request, { cache: 'no-store' }));
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw error;
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      return existing ? existing.focus() : self.clients.openWindow('./install-app.html?source=notification');
    })
  );
});
