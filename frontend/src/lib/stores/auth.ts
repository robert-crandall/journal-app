import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// User type definition
export interface User {
	id: string;
	name: string;
	email: string;
	timezone?: string;
	zipCode?: string;
	createdAt: string;
	updatedAt: string;
}

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
	// Get initial token from localStorage
	const initialToken = browser ? localStorage.getItem('auth_token') : null;
	const initialUser = browser ? localStorage.getItem('auth_user') : null;

	// Parse stored user data
	let user: User | null = null;
	if (initialUser) {
		try {
			user = JSON.parse(initialUser);
		} catch {
			// Invalid stored user data
			if (browser) localStorage.removeItem('auth_user');
		}
	}

	// Initial state
	const initialState: AuthState = {
		user,
		token: initialToken,
		loading: false,
		error: null,
		initialized: !!initialToken
	};

	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,

		// Login function
		login: async (email: string, password: string) => {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const response = await fetch('/api/auth/login', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ email, password })
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Login failed');
				}

				const data = await response.json();
				
				if (browser) {
					localStorage.setItem('auth_token', data.data.token);
					localStorage.setItem('auth_user', JSON.stringify(data.data.user));
				}

				update(state => ({
					...state,
					user: data.data.user,
					token: data.data.token,
					loading: false,
					error: null,
					initialized: true
				}));

				return { success: true };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Login failed';
				update(state => ({ ...state, loading: false, error: errorMessage }));
				return { success: false, error: errorMessage };
			}
		},

		// Register function
		register: async (email: string, name: string, password: string, timezone?: string, zipCode?: string) => {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const response = await fetch('/api/auth/register', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ email, name, password, timezone, zipCode })
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Registration failed');
				}

				const data = await response.json();
				
				if (browser) {
					localStorage.setItem('auth_token', data.data.token);
					localStorage.setItem('auth_user', JSON.stringify(data.data.user));
				}

				update(state => ({
					...state,
					user: data.data.user,
					token: data.data.token,
					loading: false,
					error: null,
					initialized: true
				}));

				return { success: true };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Registration failed';
				update(state => ({ ...state, loading: false, error: errorMessage }));
				return { success: false, error: errorMessage };
			}
		},

		// Create demo user function
		createDemoUser: async () => {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const response = await fetch('/api/auth/create-demo-user', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					}
				});

				if (!response.ok) {
					throw new Error('Failed to create demo user');
				}

				const data = await response.json();
				
				if (browser) {
					localStorage.setItem('auth_token', data.data.token);
					localStorage.setItem('auth_user', JSON.stringify(data.data.user));
				}

				update(state => ({
					...state,
					user: data.data.user,
					token: data.data.token,
					loading: false,
					error: null,
					initialized: true
				}));

				return { success: true, credentials: data.data.credentials };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to create demo user';
				update(state => ({ ...state, loading: false, error: errorMessage }));
				return { success: false, error: errorMessage };
			}
		},

		// Logout function
		logout: async () => {
			const currentState = get({ subscribe });
			
			try {
				if (currentState.token) {
					await fetch('/api/auth/logout', {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${currentState.token}`
						}
					});
				}
			} catch {
				// Continue with logout even if backend call fails
			}

			if (browser) {
				localStorage.removeItem('auth_token');
				localStorage.removeItem('auth_user');
			}

			update(state => ({
				...state,
				user: null,
				token: null,
				loading: false,
				error: null,
				initialized: true
			}));
		},

		// Get auth headers for API calls
		getAuthHeaders: () => {
			const currentState = get({ subscribe });
			return currentState.token ? {
				'Authorization': `Bearer ${currentState.token}`,
				'Content-Type': 'application/json'
			} : {
				'Content-Type': 'application/json'
			};
		},

		// Set the user and token after successful authentication
		setAuth: (user: User, token: string) => {
			if (browser) {
				localStorage.setItem('auth_token', token);
				localStorage.setItem('auth_user', JSON.stringify(user));
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
				localStorage.removeItem('auth_token');
				localStorage.removeItem('auth_user');
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
		}
	};
}

// Helper function to get current store state
function get(store: any) {
	let value: any;
	store.subscribe((v: any) => value = v)();
	return value;
}

// Export the authentication store
export const authStore = createAuthStore();
