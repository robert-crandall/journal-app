const CACHE_NAME = 'journal-app-v1';
const STATIC_CACHE_URLS = [
	'/',
	'/dashboard',
	'/focuses',
	'/family',
	'/manifest.webmanifest',
	'/icon-192.png',
	'/icon-512.png',
	'/apple-touch-icon.png',
	'/favicon.png'
];

// Cache for API responses (separate from static cache)
const API_CACHE_NAME = 'journal-app-api-v1';

// Install event - cache static resources
self.addEventListener('install', (event) => {
	console.log('Service Worker: Installing...');
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log('Service Worker: Caching static resources');
				return cache.addAll(STATIC_CACHE_URLS);
			})
			.then(() => {
				console.log('Service Worker: Skip waiting');
				return self.skipWaiting();
			})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	console.log('Service Worker: Activating...');
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME) {
							console.log('Service Worker: Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log('Service Worker: Claiming clients');
				return self.clients.claim();
			})
	);
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	// Skip API requests for now (handle them differently later when adding offline support)
	if (event.request.url.includes('/api/')) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
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
						return caches.match('/');
					}
				});
		})
	);
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
