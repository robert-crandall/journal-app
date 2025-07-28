import { hc } from 'hono/client';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { authStore } from './stores/auth';

import type { AppType } from '../../../backend/src/index';

// For SPA deployment, we need to handle different environments
export const getBaseUrl = () => {
  if (browser) {
    // In browser: use current origin for production, localhost for development
    const origin = window.location.origin;
    // If we're on localhost:4173 (SvelteKit preview) or other dev ports, use backend port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      // Try to get port from environment variable, fallback to default
      const port = import.meta.env.VITE_API_PORT || '3001';
      return `http://localhost:${port}`;
    }
    // In production, assume API is on same origin or configure via env
    return origin;
  }
  // Fallback for SSR (though we've disabled SSR) - use env var or default
  const port = import.meta.env.VITE_API_PORT || '3001';
  return `http://localhost:${port}`;
};

const baseUrl = getBaseUrl();

// Create a basic type-safe API client without headers
export const api = hc<AppType>(baseUrl);

/**
 * Creates a new API client with auth token set in headers
 * Use this function when you need to make authenticated API calls
 */
export function createAuthenticatedClient() {
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
 * Creates authenticated fetch function with auth headers
 * Use this for direct fetch calls when Hono client doesn't have the route
 */
export function createAuthenticatedFetch() {
  const { token } = get(authStore);

  if (!token) {
    throw new Error('Authentication required');
  }

  const baseUrl = getBaseUrl();

  // Return a fetch function with auth headers pre-configured
  return async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    return fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };
}

/**
 * Generic API fetch function with authentication and JSON response handling
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const fetchFn = createAuthenticatedFetch();
  const response = await fetchFn(endpoint, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
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
