/* Service worker — cachea el "shell" de la app para que funcione offline
   y sea instalable. Subí el número de versión cuando cambies archivos. */
const CACHE = "control-gastos-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Solo gestionamos los archivos propios; Firebase, fuentes, etc. van directo a la red.
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    // Network-first para el HTML: toma la versión nueva si hay red, si no la cacheada.
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Cache-first para el resto de archivos propios (íconos, manifest).
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
