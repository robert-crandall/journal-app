/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

// Add routes that should be cached (app shell approach)
const ROUTES = ['/'];

// Combine all static assets with build files
const ASSETS = [
  ...build, // the app itself
  ...files, // everything in `static`
  ...ROUTES, // important app routes
];

// Log details of the service worker for debugging
console.log('Service worker version:', version);

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

// Install event: cache all static resources
sw.addEventListener('install', (event) => {
  // Skip waiting forces the waiting service worker to become the active service worker
  sw.skipWaiting();

  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    console.log('Service worker: All assets added to cache');
  }

  event.waitUntil(addFilesToCache());
});

// Activate event: clean up old caches
sw.addEventListener('activate', (event) => {
  // Claim control immediately
  event.waitUntil(sw.clients.claim());

  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) {
        await caches.delete(key);
        console.log(`Service worker: Old cache ${key} deleted`);
      }
    }
  }

  event.waitUntil(deleteOldCaches());
});

// Fetch event: serve from cache first, then network
sw.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  // Skip browser-sync and socket.io requests in development
  if (url.pathname.includes('browser-sync') || url.pathname.includes('socket.io')) return;

  async function respond() {
    const cache = await caches.open(CACHE);

    // Try the cache first for static assets
    if (ASSETS.includes(url.pathname)) {
      const cachedResponse = await cache.match(url.pathname);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // For everything else, try network first, with cache fallback
    try {
      const response = await fetch(event.request);

      // Only cache successful responses
      if (response.ok) {
        cache.put(event.request, response.clone());
      }

      return response;
    } catch (err) {
      // If offline, try to return from cache
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache and offline, return offline page or throw error
      if (url.pathname.startsWith('/api/')) {
        // For API requests, just throw the error
        throw err;
      } else {
        // For page requests, show offline page
        const offlineResponse = await cache.match('/offline.html');
        if (offlineResponse) {
          return offlineResponse;
        }
      }

      throw err;
    }
  }

  event.respondWith(respond());
});
