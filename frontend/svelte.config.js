import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// SPA mode: serve index.html for all routes
			fallback: 'index.html',
			// Disable prerendering for SPA
			precompress: false,
			// Build configuration for SPA
			pages: 'build',
			assets: 'build',
			strict: true
		}),
		// Disable SSR for SPA mode
		prerender: {
			handleHttpError: 'ignore'
		},
		// Configure path resolution
		alias: {
			$lib: 'src/lib'
		}
	}
};

export default config;
