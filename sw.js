/* Offline asset cache. No requests are made to any server by application code. */
const CACHE = 'ml-check-v31-20261113';
const ASSETS = ['./','./index.html','./styles.css','./questions.js','./logic.js','./pdf.js','./audit.js','./policy.js','./actions.js','./app.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(x => x.startsWith('ml-check-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request, copy));}return response;})));
});
