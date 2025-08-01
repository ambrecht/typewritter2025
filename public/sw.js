const CACHE_NAME = "typewriter-v1"
const STATIC_CACHE = "typewriter-static-v1"

// Dateien, die gecacht werden sollen
const STATIC_FILES = ["/", "/manifest.json", "/favicon.ico"]

// Service Worker Installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting()),
  )
})

// Service Worker Aktivierung
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch-Events abfangen
self.addEventListener("fetch", (event) => {
  // Nur GET-Requests cachen
  if (event.request.method !== "GET") return

  // API-Requests nicht cachen
  if (event.request.url.includes("/api/")) return

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }

      // Cache miss - fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }),
  )
})

// Background Sync für Offline-Speicherung
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Hier könnten offline gespeicherte Daten synchronisiert werden
      console.log("Background sync triggered"),
    )
  }
})
