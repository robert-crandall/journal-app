import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { TokenManager } from '../utils/auth';
import type { users } from '../../../../backend/src/db/schema';

// User type definition from backend
export type User = typeof users.$inferSelect;

// Authentication store state
interface AuthState {
	user: User | null;
	token: string | null;
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

// Create the authentication store
function createAuthStore() {
	// Get initial token from TokenManager
	const initialToken = browser ? TokenManager.getValidToken() : null;

	// Initial state
	const initialState: AuthState = {
		user: null,
		token: initialToken,
		loading: false,
		error: null,
		initialized: false
	};

	const { subscribe, set, update } = writable<AuthState>(initialState);

	// Auto-initialize auth when store is created (if token exists)
	if (browser && initialToken) {
		// Set loading immediately if we have a token
		update((state) => ({ ...state, loading: true }));

		// Initialize user data from token
		initializeFromToken();
	} else {
		// No token, mark as initialized
		update((state) => ({ ...state, initialized: true }));
	}

	// Initialize user data from stored token
	async function initializeFromToken() {
		try {
			// Import apiClient here to avoid circular dependencies
			const { apiClient } = await import('../api/client');

			const response = await apiClient.getCurrentUser();

			if (response.success && response.data) {
				// Successfully got user data, update store
				update((state) => ({
					...state,
					user: response.data!,
					loading: false,
					error: null,
					initialized: true
				}));
			} else {
				// Token is invalid, clear auth
				if (browser) {
					TokenManager.clearAll();
				}
				update((state) => ({
					...state,
					user: null,
					token: null,
					loading: false,
					error: 'Session expired',
					initialized: true
				}));
			}
		} catch (err) {
			console.warn('Failed to initialize user from token:', err);
			// Token is invalid, clear auth
			if (browser) {
				TokenManager.clearAll();
			}
			update((state) => ({
				...state,
				user: null,
				token: null,
				loading: false,
				error: 'Authentication failed',
				initialized: true
			}));
		}
	}

	return {
		subscribe,

		// Set the user and token after successful authentication
		setAuth: (user: User, token: string) => {
			if (browser) {
				TokenManager.setToken(token);
				TokenManager.setStoredUser(user);
			}

			update((state) => ({
				...state,
				user,
				token,
				loading: false,
				error: null,
				initialized: true
			}));
		},

		// Clear authentication state on logout
		clearAuth: () => {
			if (browser) {
				TokenManager.clearAll();
			}

			update((state) => ({
				...state,
				user: null,
				token: null,
				loading: false,
				error: null,
				initialized: true
			}));
		},

		// Set loading state
		setLoading: (isLoading: boolean) => {
			update((state) => ({ ...state, loading: isLoading }));
		},

		// Set error state
		setError: (errorMessage: string | null) => {
			update((state) => ({ ...state, error: errorMessage, loading: false }));
		},

		// Set initialized state
		setInitialized: (initialized: boolean = true) => {
			update((state) => ({ ...state, initialized }));
		},

		// Manual refresh of user data
		async refreshUser() {
			const currentState = getCurrentAuthState();
			if (!currentState.token) {
				return;
			}

			try {
				update((state) => ({ ...state, loading: true, error: null }));

				const { apiClient } = await import('../api/client');
				const response = await apiClient.getCurrentUser();

				if (response.success && response.data) {
					update((state) => ({
						...state,
						user: response.data!,
						loading: false,
						error: null
					}));
				} else {
					// Token is invalid, clear auth
					if (browser) {
						TokenManager.clearAll();
					}
					update((state) => ({
						...state,
						user: null,
						token: null,
						loading: false,
						error: 'Session expired'
					}));
				}
			} catch (err) {
				console.warn('Failed to refresh user data:', err);
				update((state) => ({
					...state,
					loading: false,
					error: 'Failed to refresh user data'
				}));
			}
		}
	};
}

// Export the authentication store
export const authStore = createAuthStore();

// Helper to get current auth state
export function getCurrentAuthState() {
	return get(authStore);
}
