// Nombre y versión del caché
const CACHE_NAME = 'lia-bibliotecapp-v1.0.1';

// Archivos que se cachearán
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

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        STATIC_CACHE_URLS.map(url =>
          fetch(url)
            .then(resp => {
              if (resp.ok) {
                cache.put(url, resp.clone());
              }
            })
            .catch(err => console.warn(`No se pudo cachear ${url}:`, err))
        )
      );
    }).then(() => {
      console.log('Service Worker: Instalación completada');
      return self.skipWaiting();
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      )
    ).then(() => {
      console.log('Service Worker: Activación completada');
      return self.clients.claim();
    })
  );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // No cachear solicitudes a Firebase REST
  if (event.request.url.includes('firebaseapp.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

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

// Escuchar mensajes para activar inmediatamente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Manejo opcional de sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Sincronización en segundo plano');
  }
});

// Manejo de notificaciones push
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de BibliotecApp',
    icon: 'icon-192.png',
    badge: 'icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver biblioteca',
        icon: 'icon-192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: 'icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BibliotecApp', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
