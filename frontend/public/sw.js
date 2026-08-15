// Doodo Service Worker for Background Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push Event Listener
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "Doodo 🔔",
    body: "You have an upcoming event notification.",
    icon: "/icon-192.png",
    badge: "/badge.png",
    data: { url: "/" },
  };

  try {
    const data = event.data.json();
    payload = {
      title: data.title || payload.title,
      body: data.body || payload.body,
      icon: data.icon || payload.icon,
      badge: data.badge || payload.badge,
      data: data.data || payload.data,
    };
  } catch (e) {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    data: payload.data,
    vibrate: [100, 50, 100],
    tag: payload.data?.eventId || "doodo-reminder",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Notification Click Event Listener
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
