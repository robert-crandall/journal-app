import { api } from '../api';
import { authStore } from '../stores/auth';
import { get } from 'svelte/store';

// Type definition for the hello response
export interface HelloResponse {
	message: string;
	id: string;
	timestamp: string;
}

// Type-safe hello API using Hono client
export const helloApi = {
	// Get authenticated hello message
	async getHello(): Promise<HelloResponse> {
		const { token } = get(authStore);

		if (!token) {
			throw new Error('Authentication required');
		}

		try {
			const response = await api.api.hello.$get({
				header: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				console.error('Hello API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			return response.json();
		} catch (error) {
			console.error('Hello API request failed:', error);
			throw error;
		}
	}
};
