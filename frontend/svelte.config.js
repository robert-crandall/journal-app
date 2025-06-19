import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using static adapter for PWA deployment
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		serviceWorker: {
			register: true // Let SvelteKit handle service worker registration
		},
		// Version management for automatic updates
		version: {
			// Use build timestamp for version detection (ensures each build has unique version)
			name:
				process.env.NODE_ENV === 'production'
					? Date.now().toString()
					: 'dev-' + Date.now().toString(),
			// Poll for updates every 30 seconds in production, 10 seconds in dev
			pollInterval: process.env.NODE_ENV === 'production' ? 30000 : 10000
		}
	}
};

export default config;
