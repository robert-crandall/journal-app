import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	id: string;
	email: string;
	name: string;
	type: 'user' | 'family';
	isFamily: boolean;
	gptContext?: any;
	attributes?: Array<{ id: string; key: string; value: string }>;
	createdAt: string;
	updatedAt: string;
}

interface AuthState {
	user: User | null;
	loading: boolean;
	error: string | null;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		loading: true,
		error: null
	});

	return {
		subscribe,

		async init() {
			if (!browser) return;

			update((state) => ({ ...state, loading: true }));

			try {
				const response = await fetch('/api/auth/me', {
					credentials: 'include'
				});

				if (response.ok) {
					const data = await response.json();
					set({ user: data.user, loading: false, error: null });
				} else {
					set({ user: null, loading: false, error: null });
				}
			} catch (error) {
				set({ user: null, loading: false, error: 'Failed to initialize auth' });
			}
		},

		async login(email: string, password: string) {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const response = await fetch('/api/auth/login', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({ email, password })
				});

				const data = await response.json();

				if (response.ok) {
					set({ user: data.user, loading: false, error: null });
					return { success: true };
				} else {
					set({ user: null, loading: false, error: data.error });
					return { success: false, error: data.error };
				}
			} catch (error) {
				const errorMessage = 'Failed to login';
				set({ user: null, loading: false, error: errorMessage });
				return { success: false, error: errorMessage };
			}
		},

		async register(email: string, password: string, name: string) {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const response = await fetch('/api/auth/register', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({ email, password, name })
				});

				const data = await response.json();

				if (response.ok) {
					set({ user: data.user, loading: false, error: null });
					return { success: true };
				} else {
					set({ user: null, loading: false, error: data.error });
					return { success: false, error: data.error };
				}
			} catch (error) {
				const errorMessage = 'Failed to register';
				set({ user: null, loading: false, error: errorMessage });
				return { success: false, error: errorMessage };
			}
		},

		async logout() {
			update((state) => ({ ...state, loading: true }));

			try {
				await fetch('/api/auth/logout', {
					method: 'POST',
					credentials: 'include'
				});
			} catch (error) {
				console.error('Logout error:', error);
			}

			set({ user: null, loading: false, error: null });
		}
	};
}

export const auth = createAuthStore();
