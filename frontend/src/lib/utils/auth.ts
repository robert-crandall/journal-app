import { authStore } from '$lib/stores/auth';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { get } from 'svelte/store';

/**
 * Requires authentication for the current page
 * Redirects to login if user is not authenticated
 */
export function requireAuth(): void {
  if (!browser) return; // Only run in browser

  const { token, initialized } = get(authStore);

  // If not authenticated and initialization is complete, redirect to login
  if (initialized && !token) {
    const currentPath = window.location.pathname;
    goto(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
  }
}
