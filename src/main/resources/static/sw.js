// Service worker: deixa o app instalável e abre a "casca" mesmo com a rede instável.
// Nunca guarda chamadas da API (/api/*) — dados sempre vêm do servidor.
const CACHE = "ecotronic-v2";
const SHELL = [
  "/", "/index.html", "/usuario.html", "/monitoramento.html",
  "/tailwind.css", "/styles.css", "/usuario.css", "/monitoramento.css",
  "/config.js", "/api.js", "/app.js", "/usuario.js", "/monitoramento.js", "/pwa.js", "/manifest.json", "/manifest-usuario.json", "/manifest-admin.json",
  "/icon-192.png", "/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro (sempre a versão mais nova); cache só se estiver offline.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/index.html")))
  );
});
