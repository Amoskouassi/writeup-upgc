/* ══════════════════════════════════════════
   WriteUP UPGC — Service Worker
   Gère les notifications push en arrière-plan
══════════════════════════════════════════ */

const CACHE_NAME = "writeup-upgc-v1";

// Fichiers à mettre en cache pour le mode hors ligne
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
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
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

/* ── Notifications Push ── */
self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || "WriteUP UPGC";
  const options = {
    body: data.body || "Your daily challenge is waiting!",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Open App 📚" },
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
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
        clientList[0].navigate("/");
      } else {
        clients.openWindow("/");
      }
    })
  );
});

/* ── Notifications programmées (via messages) ── */
self.addEventListener("message", (e) => {
  if (e.data?.type === "SCHEDULE_NOTIFICATION") {
    const { title, body, delay } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        vibrate: [200, 100, 200],
        actions: [{ action: "open", title: "Open App 📚" }],
      });
    }, delay);
  }
});
