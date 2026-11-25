const CACHE = "royxat-v2";
const SHELL = [
  "./", "index.html", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
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

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    // Stale-while-revalidate: serve cached shell now, refresh in background.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match("index.html", { ignoreSearch: true });
      const refresh = fetch(req).then((res) => {
        if (res.ok) cache.put("index.html", res.clone());
        return res;
      });
      if (cached) { e.waitUntil(refresh.catch(() => {})); return cached; }
      return refresh;
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  })());
});
