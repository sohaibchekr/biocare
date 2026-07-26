const CACHE_NAME = 'biocare-v2';
const ASSETS = [
  './',
  './index.html',
  './alerte.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes Firebase/Firestore ou celles qui ne sont pas GET
  if (event.request.method !== 'GET' || 
      event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('google.com') ||
      event.request.url.includes('identitytoolkit')
  ) {
    return;
  }
  
  // Stratégie : Réseau en premier, puis cache (Network First)
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      // Si la réponse réseau est bonne, on la met en cache et on la retourne
      if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
        return networkResponse;
      }
      const responseToCache = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseToCache);
      });
      return networkResponse;
    }).catch(async (err) => {
      // Si on est hors ligne (fetch échoue), on vérifie le cache
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
    })
  );
});
