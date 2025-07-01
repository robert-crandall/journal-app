import { apiClient } from './client';

// Type-safe authentication API using the existing API client
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
		const response = await apiClient.register(data);

		if (!response.success) {
			throw new Error(response.error || 'Registration failed');
		}

		// Type the response data properly
		const authData = response.data as { user: any; token: string };
		return {
			user: {
				id: authData.user.id,
				name: authData.user.name,
				email: authData.user.email,
				createdAt: authData.user.createdAt
			},
			token: authData.token
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
		const response = await apiClient.login({
			email: data.email,
			password: data.password
		});

		if (!response.success) {
			throw new Error(response.error || 'Login failed');
		}

		// Type the response data properly
		const authData = response.data as { user: any; token: string };
		return {
			user: {
				id: authData.user.id,
				name: authData.user.name,
				email: authData.user.email,
				createdAt: authData.user.createdAt
			},
			token: authData.token
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
		const response = await apiClient.getCurrentUser();

		if (!response.success) {
			throw new Error(response.error || 'Failed to get profile');
		}

		return response.data as any;
	},

	// Update user profile
	async updateProfile(
		token: string,
		data: { name?: string; timezone?: string; zipCode?: string }
	): Promise<{
		id: string;
		name: string;
		email: string;
		timezone?: string;
		zipCode?: string;
		createdAt: string;
		updatedAt?: string;
	}> {
		// For now, return the same data since we don't have update endpoint implemented
		const profileResponse = await this.getProfile(token);
		return { ...profileResponse, ...data };
	},

	// Logout
	async logout(token: string): Promise<void> {
		await apiClient.logout();
	},

	// Verify token
	async verifyToken(token: string): Promise<{ userId: string; email: string; valid: boolean }> {
		try {
			const response = await apiClient.getCurrentUser();
			if (response.success && response.data) {
				const user = response.data as any;
				return {
					userId: user.id,
					email: user.email,
					valid: true
				};
			}
			return { userId: '', email: '', valid: false };
		} catch {
			return { userId: '', email: '', valid: false };
		}
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
		// For now, create a mock demo user response
		// This will be implemented properly in Task 4.0
		const mockUser = {
			user: {
				id: 'demo-user-id',
				name: 'Demo User',
				email: 'demo@example.com',
				createdAt: new Date().toISOString()
			},
			token: 'demo-token',
			credentials: {
				email: 'demo@example.com',
				password: 'demo123'
			}
		};
		return mockUser;
	}
};
