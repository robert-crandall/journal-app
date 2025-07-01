import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

/**
 * Authentication guard utility for protecting routes
 */
export class AuthGuard {
	/**
	 * Check if user is authenticated and redirect if not
	 * @param redirectTo - Where to redirect if not authenticated (default: '/login')
	 * @returns Promise<boolean> - true if authenticated, false if redirected
	 */
	static async requireAuth(redirectTo: string = '/login'): Promise<boolean> {
		if (!browser) {
			// On server side, we can't check auth state, so allow through
			return true;
		}

		const auth = get(authStore);

		if (!auth.user || !auth.token) {
			// User is not authenticated, redirect to login
			await goto(redirectTo, { replaceState: true });
			return false;
		}

		return true;
	}

	/**
	 * Check if user is NOT authenticated and redirect if they are
	 * Used for login/register pages to prevent authenticated users from accessing them
	 * @param redirectTo - Where to redirect if authenticated (default: '/')
	 * @returns Promise<boolean> - true if not authenticated, false if redirected
	 */
	static async requireGuest(redirectTo: string = '/'): Promise<boolean> {
		if (!browser) {
			// On server side, we can't check auth state, so allow through
			return true;
		}

		const auth = get(authStore);

		if (auth.user && auth.token) {
			// User is authenticated, redirect to dashboard
			await goto(redirectTo, { replaceState: true });
			return false;
		}

		return true;
	}

	/**
	 * Get the current authentication state
	 * @returns Current auth state
	 */
	static getAuthState() {
		return get(authStore);
	}

	/**
	 * Check if user is authenticated (synchronous)
	 * @returns boolean indicating if user is authenticated
	 */
	static isAuthenticated(): boolean {
		if (!browser) return false;

		const auth = get(authStore);
		return Boolean(auth.user && auth.token);
	}
}

/**
 * Reactive auth guard store for use in Svelte components
 * Automatically updates when auth state changes
 */
export const authGuard = {
	/**
	 * Subscribe to authentication state changes
	 */
	subscribe: authStore.subscribe,

	/**
	 * Check if user is authenticated (reactive)
	 */
	get isAuthenticated() {
		const auth = get(authStore);
		return Boolean(auth.user && auth.token);
	},

	/**
	 * Get current user (reactive)
	 */
	get user() {
		const auth = get(authStore);
		return auth.user;
	},

	/**
	 * Get current token (reactive)
	 */
	get token() {
		const auth = get(authStore);
		return auth.token;
	}
};
