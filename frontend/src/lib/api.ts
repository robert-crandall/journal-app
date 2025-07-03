import { hc } from 'hono/client';
import { browser } from '$app/environment';

import type { AppType } from '../../../backend/src/index';

// For SPA deployment, we need to handle different environments
const getBaseUrl = () => {
	if (browser) {
		// In browser: use current origin for production, localhost for development
		const origin = window.location.origin;
		// If we're on localhost:4173 (SvelteKit preview) or other dev ports, use backend port
		if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
			return 'http://localhost:3000';
		}
		// In production, assume API is on same origin or configure via env
		return origin;
	}
	// Fallback for SSR (though we've disabled SSR)
	return 'http://localhost:3000';
};

const baseUrl = getBaseUrl();
// Create type-safe API client
export const api = hc<AppType>(baseUrl);

// Types for API responses (inferred from backend)
export type { AppType } from '../../../backend/src/index';
