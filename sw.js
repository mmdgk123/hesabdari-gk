/* حساب‌یار ۴.۳ — network-first، تا آپدیت‌ها فوری بیایند ولی آفلاین هم باز شود */
const CACHE = 'dakhel-4.3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './widget.html',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon-180.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(u => c.add(u).catch(() => {})))
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(req).then(hit =>
        hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
      )
    )
  );
});
