import { api } from '../api';

// Type-safe authentication API using Hono client
export const authApi = {
	// Check if registration is enabled
	async getRegistrationStatus(): Promise<{ enabled: boolean }> {
		const response = await api.api.users['registration-status'].$get();
		if (!response.ok) {
			throw new Error('Failed to check registration status');
		}
		return response.json();
	},

	// Register a new user
	async register(data: { name: string; email: string; password: string }): Promise<{
		user: {
			id: string;
			name: string;
			email: string;
			createdAt: string;
		};
		token: string;
	}> {
		const response = await api.api.users.$post({
			json: data
		});

		const result = await response.json();

		if (!response.ok) {
			// Type narrowing: if response is not ok, result has error property
			const errorResult = result as { error: string };
			throw new Error(errorResult.error || 'Registration failed');
		}

		// Type narrowing: if response is ok, result has user and token
		return result as {
			user: {
				id: string;
				name: string;
				email: string;
				createdAt: string;
			};
			token: string;
		};
	},

	// Login
	async login(data: { email: string; password: string; rememberMe?: boolean }): Promise<{
		user: {
			id: string;
			name: string;
			email: string;
			createdAt: string;
		};
		token: string;
	}> {
		const response = await api.api.users.login.$post({
			json: data
		});

		const result = await response.json();

		if (!response.ok) {
			// Type narrowing: if response is not ok, result has error property
			const errorResult = result as { error: string };
			throw new Error(errorResult.error || 'Login failed');
		}

		// Type narrowing: if response is ok, result has user and token
		return result as {
			user: {
				id: string;
				name: string;
				email: string;
				createdAt: string;
			};
			token: string;
		};
	}
};
