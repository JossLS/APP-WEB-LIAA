const CACHE_NAME = 'lia-bibliotecapp-v1.0.1';
const STATIC_CACHE_URLS = [
  'index.html',
  'style.css',
  'script.js',
  'firebase_config.js',
  'manifest.json',
  'icon-32.png',
  'icon-16.png',
  'icon-192.png',
  'icon-96.png',
  'icon-128.png',
  'icon-72.png',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js'
];

self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        STATIC_CACHE_URLS.map(url =>
          fetch(url)
            .then(resp => {
              if (resp.ok) cache.put(url, resp.clone());
            })
            .catch(err => console.warn(`No se pudo cachear ${url}:`, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resp.clone());
          });
        }
        return resp;
      }).catch(() => {
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('index.html');
        }
      });
    })
  );
});
