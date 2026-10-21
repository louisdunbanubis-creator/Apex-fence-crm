const CACHE_NAME = "apex-fence-v6";
const APP_SHELL = ["/","/crm","/app.js?v=6","/styles.css","/manifest.json","/icon-192.png","/icon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => { const u = new URL(e.request.url); if (e.request.method !== "GET" || u.origin !== self.location.origin || u.pathname.startsWith("/api/")) return; e.respondWith(fetch(e.request, {cache:"no-cache"}).then(r => { if (r.ok && !r.redirected) caches.open(CACHE_NAME).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("/crm")))); });
self.addEventListener("push", event => {
  const fallback = { title: "Apex Fence", body: "A new estimate request is in Apex Hub.", url: "/crm" };
  let payload = fallback;
  try { if (event.data) payload = { ...fallback, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(payload.title || fallback.title, {
    body: payload.body || fallback.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "apex-lead",
    data: { url: payload.url || "/crm" }
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/crm";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const client of list) {
      if (new URL(client.url).pathname.startsWith("/crm") && "focus" in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});