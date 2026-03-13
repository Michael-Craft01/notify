// ──────────────────────────────────────────────
// Notify - Service Worker
// Handles: push notifications, notification clicks, offline caching
// ──────────────────────────────────────────────

const CACHE_NAME = 'notify-cache-v1';
const OFFLINE_URL = '/';

// ── Install: pre-cache the shell ──────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL]))
    );
    self.skipWaiting();
});

// ── Activate: claim clients immediately ───────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ── Push: show notification ───────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: 'Notify', body: event.data.text() };
    }

    const { title = 'Notify', body = '', url = '/', urgency = 'normal' } = payload;

    // Vibration pattern based on urgency
    const vibrate =
        urgency === 'critical' ? [200, 50, 200, 50, 200] :
        urgency === 'high'     ? [150, 50, 150] :
                                  [100, 50, 100];

    const options = {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate,
        tag: url,            // Collapse duplicate notifications for same task
        renotify: true,      // Re-notify even if same tag
        requireInteraction: urgency === 'critical',
        data: { url },
        actions: [
            { action: 'open', title: 'View Task' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ── Notification click ────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if already open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// ── Background sync (future-proof) ───────────
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-progress') {
        // Reserved for future offline progress sync
        console.log('[SW] Background sync triggered');
    }
});

// ── Fetch: required for PWA installability ────
self.addEventListener('fetch', (event) => {
    // Basic pass-through for now, satisfies Chrome's PWA criteria
    // In a full offline app, you'd add caching logic here
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
