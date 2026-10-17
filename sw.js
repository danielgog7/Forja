// Forja — service worker: a app funciona sem internet e atualiza-se sozinha quando há ligação.
const CACHE = 'forja-v22';
const IMAGENS = 'forja-img';
const FICHEIROS = ['./', './index.html', './estilo.css', './app.js', './corpo.js', './exercicios.json', './cinzel.woff2', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './pictogramas/marcha_linha.svg', './pictogramas/anjos_parede.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEIROS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== IMAGENS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // Imagens dos exercícios: primeiro a cópia guardada, senão a internet (e guarda-se para a próxima).
  if (u.hostname === 'raw.githubusercontent.com' && u.pathname.includes('/free-exercise-db/')){
    e.respondWith(caches.open(IMAGENS).then(c => c.match(e.request.url).then(r => r || fetch(e.request.url, {mode: 'cors'}).then(res => {
      if (res.ok) c.put(e.request.url, res.clone());
      return res;
    }))));
    return;
  }
  // Só a própria app; os pedidos ao Gemini e ao GitHub passam diretos.
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'})
      .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
