import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'child_process';

/**
 * Generate a deterministic version string for static builds
 * @returns {string} Version string
 */
function generateVersion() {
	// Allow override via environment variable
	if (process.env.APP_VERSION) {
		return process.env.APP_VERSION;
	}

	// Try to get git commit hash for deterministic versioning
	try {
		const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
		const isDirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0;
		
		if (process.env.NODE_ENV === 'production') {
			// In production, use clean git hash or git hash with dirty flag
			return isDirty ? `${gitHash}-dirty` : gitHash;
		} else {
			// In development, append timestamp to git hash for frequent updates
			return `${gitHash}-dev-${Date.now()}`;
		}
	} catch (error) {
		// Fallback to timestamp if git is not available
		console.warn('Git not available for versioning, falling back to timestamp');
		return process.env.NODE_ENV === 'production' 
			? Date.now().toString() 
			: 'dev-' + Date.now().toString();
	}
}

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
			// Use git commit hash for deterministic versioning in production
			// Falls back to timestamp if git is not available
			// Supports APP_VERSION environment variable override
			name: generateVersion(),
			// Poll for updates every 30 seconds in production, 10 seconds in dev
			pollInterval: process.env.NODE_ENV === 'production' ? 30000 : 10000
		}
	}
};

export default config;
