import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import * as child_process from 'node:child_process';

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
			precompress: false
		}),
		version: {
			// Use git commit hash for deterministic versioning
			name:
				process.env.NODE_ENV === 'production'
					? child_process.execSync('git rev-parse HEAD').toString().trim()
					: Date.now().toString(),
			// Poll for version changes every 30 seconds
			pollInterval: 30000
		}
	}
};

export default config;
