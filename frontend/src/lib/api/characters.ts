import { api } from '../api';
import { authStore } from '../stores/auth';
import { get } from 'svelte/store';

// Type definitions for character data
export interface Character {
	id: string;
	userId: string;
	name: string;
	characterClass: string;
	motto: string | null;
	backstory: string | null;
	goals: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCharacterData {
	name: string;
	characterClass: string;
	motto?: string;
	backstory?: string;
	goals?: string;
}

export interface UpdateCharacterData {
	name?: string;
	characterClass?: string;
	motto?: string;
	backstory?: string;
	goals?: string;
}

// Type-safe character API using Hono client
export const characterApi = {
	// Get user's character
	async getCharacter(): Promise<Character | null> {
		const { token } = get(authStore);

		if (!token) {
			throw new Error('Authentication required');
		}

		try {
			const response = await api.api.characters.$get({
				header: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				console.error('Character API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as { success: boolean; data: Character };
			return result.success ? result.data : null;
		} catch (error) {
			console.error('Get character API request failed:', error);
			throw error;
		}
	},

	// Create a new character
	async createCharacter(data: CreateCharacterData): Promise<Character> {
		const { token } = get(authStore);

		if (!token) {
			throw new Error('Authentication required');
		}

		try {
			const response = await api.api.characters.$post({
				// @ts-expect-error Hono expects 'header', not 'headers'
				header: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				json: data
			});

			if (!response.ok) {
				console.error('Create character API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));

				// Handle validation errors specifically
				if (response.status === 400 && (result as any).error?.issues) {
					const issues = (result as any).error.issues;
					const messages = issues.map((issue: any) => issue.message).join(', ');
					throw new Error(`Validation error: ${messages}`);
				}

				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as { data: Character };
			return result.data;
		} catch (error) {
			console.error('Create character API request failed:', error);
			throw error;
		}
	},

	// Update user's character
	async updateCharacter(data: UpdateCharacterData): Promise<Character> {
		const { token } = get(authStore);

		if (!token) {
			throw new Error('Authentication required');
		}

		try {
			const response = await api.api.characters.$put({
				// @ts-expect-error Hono expects 'header', not 'headers'
				header: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				json: data
			});

			if (!response.ok) {
				console.error('Update character API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));

				// Handle validation errors specifically
				if (response.status === 400 && (result as any).error?.issues) {
					const issues = (result as any).error.issues;
					const messages = issues.map((issue: any) => issue.message).join(', ');
					throw new Error(`Validation error: ${messages}`);
				}

				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as { data: Character };
			return result.data;
		} catch (error) {
			console.error('Update character API request failed:', error);
			throw error;
		}
	},

	// Delete user's character
	async deleteCharacter(): Promise<Character> {
		const { token } = get(authStore);

		if (!token) {
			throw new Error('Authentication required');
		}

		try {
			const response = await api.api.characters.$delete({
				header: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				console.error('Delete character API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as { data: Character };
			return result.data;
		} catch (error) {
			console.error('Delete character API request failed:', error);
			throw error;
		}
	}
};
