import { hc } from 'hono/client';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { authStore } from './stores/auth';

import type { AppType } from '../../../backend/src/index';

// For SPA deployment, we need to handle different environments
const getBaseUrl = () => {
  if (browser) {
    // In browser: use current origin for production, localhost for development
    const origin = window.location.origin;
    // If we're on localhost:4173 (SvelteKit preview) or other dev ports, use backend port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:3030';
    }
    // In production, assume API is on same origin or configure via env
    return origin;
  }
  // Fallback for SSR (though we've disabled SSR)
  return 'http://localhost:3030';
};

const baseUrl = getBaseUrl();

// Create a basic type-safe API client without headers
export const api = hc<AppType>(baseUrl);

/**
 * Creates a new API client with auth token set in headers
 * Use this function when you need to make authenticated API calls
 */
function createAuthenticatedClient() {
  const { token } = get(authStore);

  if (!token) {
    throw new Error('Authentication required');
  }

  // Create a client with authentication headers
  return hc<AppType>(baseUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Lazy-initialized authenticated API client
 * Access this as a property to get a fresh authenticated client
 * Example: authApi.users.list.$get()
 */
export const authenticatedClient = new Proxy({} as ReturnType<typeof createAuthenticatedClient>, {
  get(target, prop) {
    // Create fresh client on each property access to get current auth state
    const client = createAuthenticatedClient();
    return client[prop as keyof typeof client];
  },
});
// Types for API responses (inferred from backend)
export type { AppType } from '../../../backend/src/index';
