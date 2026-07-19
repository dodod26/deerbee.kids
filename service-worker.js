// Ganti angka ini setiap kali kamu update isi web (css/js/html penting),
// supaya versi lama di HP anak-anak ke-refresh otomatis.
const CACHE_VERSION = 'deerbee-v1';

const CORE_ASSETS = [
  '/index.html',
  '/mewarnai.html',
  '/minigame.html',
  '/cerita.html',
  '/musik.html',
  '/css/style.css',
  '/css/coloring.css',
  '/css/pages.css',
  '/js/shared.js',
  '/assets/logo/logo.png',
  '/assets/logo/favicon.png',
  '/manifest.json',
];

// ===== INSTALL: simpan file inti =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// ===== ACTIVATE: buang cache versi lama =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ===== FETCH =====
// Halaman HTML: coba internet dulu (biar update kelihatan langsung),
// kalau gagal (offline) baru pakai yang tersimpan di cache.
// File lain (gambar, css, js, svg, mp3): pakai cache dulu kalau ada,
// sambil diam-diam update cache di background.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
  } else {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const resClone = res.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
