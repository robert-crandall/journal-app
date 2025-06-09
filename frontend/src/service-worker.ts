/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="es2020" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

// Cache names
const CACHE_NAME = `journal-app-${version}`;
const STATIC_CACHE = `static-${version}`;

// Files to cache
const toCache = build.concat(files);

// Install event - cache static resources
self.addEventListener('install', (event: ExtendableEvent) => {
	console.log('Service Worker: Installing version', version);
	
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log('Service Worker: Caching static resources');
				return cache.addAll(toCache);
			})
			.then(() => {
				console.log('Service Worker: Skip waiting for automatic updates');
				return self.skipWaiting();
			})
	);
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event: ExtendableEvent) => {
	console.log('Service Worker: Activating version', version);
	
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
							console.log('Service Worker: Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log('Service Worker: Claiming clients for automatic updates');
				return self.clients.claim();
			})
	);
});

// Fetch event - serve from cache when offline, update cache when online
self.addEventListener('fetch', (event: FetchEvent) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	// Skip API requests (handle them differently for offline support)
	if (event.request.url.includes('/api/')) {
		return;
	}

	// Skip chrome-extension requests
	if (event.request.url.startsWith('chrome-extension://')) {
		return;
	}

	event.respondWith(
		caches
			.match(event.request)
			.then((cachedResponse) => {
				// Return cached version if available
				if (cachedResponse) {
					return cachedResponse;
				}

				// Otherwise, fetch from network
				return fetch(event.request)
					.then((response) => {
						// Don't cache if not a valid response
						if (!response || response.status !== 200 || response.type !== 'basic') {
							return response;
						}

						// Clone the response before caching
						const responseToCache = response.clone();

						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseToCache);
						});

						return response;
					})
					.catch(() => {
						// If both cache and network fail, return a fallback page for navigation requests
						if (event.request.mode === 'navigate') {
							return caches.match('/').then(fallback => fallback || new Response('Offline', { status: 503 }));
						}
						return new Response('Offline', { status: 503 });
					});
			})
	);
});

// Handle messages from the main thread
self.addEventListener('message', (event: ExtendableMessageEvent) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
