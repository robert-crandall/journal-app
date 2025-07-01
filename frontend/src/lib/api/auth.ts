import { api } from '../api';

// Type-safe authentication API using Hono client
export const authApi = {
	// Check if registration is enabled (always return true for now since backend doesn't have this endpoint)
	async getRegistrationStatus(): Promise<{ enabled: boolean }> {
		// For now, registration is always enabled
		return { enabled: true };
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
		const response = await api.api.auth.register.$post({
			json: data
		});

		const result = await response.json();

		if (!response.ok) {
			// Type narrowing: if response is not ok, result has error property
			const errorResult = result as { message: string };
			throw new Error(errorResult.message || 'Registration failed');
		}

		// Backend returns { success: true, data: { user, token } }
		const successResult = result as { success: true; data: { user: any; token: string } };
		return {
			user: {
				id: successResult.data.user.id,
				name: successResult.data.user.name,
				email: successResult.data.user.email,
				createdAt: successResult.data.user.createdAt,
			},
			token: successResult.data.token
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
		const response = await api.api.auth.login.$post({
			json: { email: data.email, password: data.password }
		});

		const result = await response.json();

		if (!response.ok) {
			// Type narrowing: if response is not ok, result has error property
			const errorResult = result as { message: string };
			throw new Error(errorResult.message || 'Login failed');
		}

		// Backend returns { success: true, data: { user, token } }
		const successResult = result as { success: true; data: { user: any; token: string } };
		return {
			user: {
				id: successResult.data.user.id,
				name: successResult.data.user.name,
				email: successResult.data.user.email,
				createdAt: successResult.data.user.createdAt,
			},
			token: successResult.data.token
		};
	},

	// Get current user profile
	async getProfile(token: string): Promise<{
		id: string;
		name: string;
		email: string;
		timezone?: string;
		zipCode?: string;
		createdAt: string;
		updatedAt?: string;
	}> {
		const response = await api.api.auth.me.$get({}, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		const result = await response.json();

		if (!response.ok) {
			const errorResult = result as { message: string };
			throw new Error(errorResult.message || 'Failed to get profile');
		}

		const successResult = result as { success: true; data: any };
		return successResult.data;
	},

	// Update user profile
	async updateProfile(token: string, data: { name?: string; timezone?: string; zipCode?: string }): Promise<{
		id: string;
		name: string;
		email: string;
		timezone?: string;
		zipCode?: string;
		createdAt: string;
		updatedAt?: string;
	}> {
		const response = await api.api.auth.profile.$put({
			json: data
		}, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		const result = await response.json();

		if (!response.ok) {
			const errorResult = result as { message: string };
			throw new Error(errorResult.message || 'Failed to update profile');
		}

		const successResult = result as { success: true; data: any };
		return successResult.data;
	},

	// Logout
	async logout(token: string): Promise<void> {
		const response = await api.api.auth.logout.$post({}, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const result = await response.json();
			const errorResult = result as { message: string };
			throw new Error(errorResult.message || 'Logout failed');
		}
	},

	// Verify token
	async verifyToken(token: string): Promise<{ userId: string; email: string; valid: boolean }> {
		const response = await api.api.auth['verify-token'].$post({}, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		const result = await response.json();

		if (!response.ok) {
			return { userId: '', email: '', valid: false };
		}

		const successResult = result as { success: true; data: { userId: string; email: string; valid: boolean } };
		return successResult.data;
	},

	// Create demo user for testing
	async createDemoUser(): Promise<{
		user: {
			id: string;
			name: string;
			email: string;
			createdAt: string;
		};
		token: string;
		credentials: {
			email: string;
			password: string;
		};
	}> {
		const response = await api.api.auth['create-demo-user'].$post();

		const result = await response.json();

		if (!response.ok) {
			const errorResult = result as { message: string };
			throw new Error(errorResult.message || 'Failed to create demo user');
		}

		const successResult = result as { success: true; data: any };
		return {
			user: {
				id: successResult.data.user.id,
				name: successResult.data.user.name,
				email: successResult.data.user.email,
				createdAt: successResult.data.user.createdAt,
			},
			token: successResult.data.token,
			credentials: successResult.data.credentials
		};
	}
};
