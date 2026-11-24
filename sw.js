/* حساب‌یار ۴.۵ — offline-first: از کش باز می‌شود و در پس‌زمینه تازه می‌شود */
const VERSION = '4.5';
const CACHE = 'dakhel-' + VERSION;

/* مسیرها نسبت به جای sw.js حساب می‌شوند، پس چه روی /hesabdari-gk/ باشد
   چه روی ریشه‌ی دامنه، کش درست پر می‌شود */
const SCOPE = self.registration.scope;
const abs = function (p) { return new URL(p, SCOPE).href; };

const FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './widget.html',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon-180.png',
  './widget-icon.png'
];
const PRECACHE = FILES.map(abs);
const HOME = abs('./index.html');
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) {
        return Promise.all(PRECACHE.map(function (u) {
          /* cache:'reload' یعنی از CDN گیت‌هاب نسخه‌ی تازه گرفته شود */
          return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          /* فقط کش‌های همین برنامه؛ کش پروژه‌های دیگر روی همین دامنه پاک نشود */
          if (k !== CACHE && k.indexOf('dakhel-') === 0) return caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function save(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { return c.put(req, copy); }).catch(function () {});
  }
  return res;
}

/* اول کش (باز شدن فوری و بی‌اینترنت) و هم‌زمان تازه‌سازی بی‌صدا از شبکه */
function cachedFirst(req, fallbackUrl) {
  return caches.match(req, { ignoreSearch: true }).then(function (hit) {
    var net = fetch(req).then(function (res) {
      return res && res.ok ? save(req, res.clone()) : res;
    }).catch(function () { return null; });

    if (hit) { net.catch(function () {}); return hit; }

    return net.then(function (res) {
      if (res) return res;
      return fallbackUrl ? caches.match(fallbackUrl, { ignoreSearch: true }) : null;
    });
  }).then(function (res) {
    return res || Response.error();
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  /* فایل‌های خود برنامه: کش اول، شبکه برای تازه‌سازی */
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      e.respondWith(cachedFirst(req, HOME));
    } else {
      e.respondWith(cachedFirst(req));
    }
    return;
  }

  /* فونت وزیرمتن تا بعد از اولین بازدید آنلاین، آفلاین هم بیاید */
  if (FONT_HOSTS.indexOf(url.hostname) >= 0) {
    e.respondWith(cachedFirst(req));
  }
});
