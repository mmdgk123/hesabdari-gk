// Force-update service worker: kills ALL old caches on install/activate
const CACHE = 'dakhel-v5';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type:'window'}).then(cs => cs.forEach(c => c.navigate(c.url))))
  );
});

// Network-first for EVERYTHING: always try fresh, fallback to cache only offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const cl = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, cl));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
