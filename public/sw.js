/* ══════════════════════════════════════════
   WriteUP UPGC — Service Worker v1
   Gère le cache offline et les notifications push
══════════════════════════════════════════ */

const CACHE_NAME = "writeup-upgc-v1";

const OFFLINE_FILES = [
  "/",
  "/index.html",
];

/* ── Installation ── */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_FILES))
  );
  self.skipWaiting();
});

/* ── Activation ── */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch (cache-first pour les assets) ── */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});

/* ── Notifications Push (depuis serveur) ── */
self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || "WriteUP UPGC";
  const options = {
    body: data.body || "Your daily challenge is waiting! 📚",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    actions: [
      { action: "open",    title: "Open App 📚" },
      { action: "dismiss", title: "Later" },
    ],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

/* ── Clic sur notification ── */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  if (e.action === "dismiss") return;
  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].focus();
          clientList[0].navigate("/");
        } else {
          clients.openWindow("/");
        }
      })
  );
});

/* ── Messages depuis l'application ──
   NOTE : setTimeout supprimé — non fiable dans un Service Worker.
   Le navigateur peut terminer le SW avant l'exécution du timer.
   Pour des notifications programmées, gérez le délai côté React
   (setTimeout dans l'app) ou via un backend qui envoie un push.
── */
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
