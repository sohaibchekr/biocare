const CACHE_NAME = 'biocare-v1';
const ASSETS = [
  './',
  './index.html',
  './alerte.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
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
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retourne le cache s'il existe
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Sinon on fetch, et on cache la réponse pour la prochaine fois
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch((err) => {
        console.warn('Serveur injoignable, ressource hors-ligne : ' + event.request.url);
      });
    })
  );
});
