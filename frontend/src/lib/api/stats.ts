import { authenticatedClient } from '../api';

// Local type definitions (should match backend types)
export interface CharacterStatExampleActivity {
	description: string;
	suggestedXp: number;
}

export interface CharacterStatXpGrant {
	id: string;
	statId: string;
	userId: string;
	xpAmount: number;
	sourceType: string;
	sourceId?: string | null;
	reason?: string | null;
	createdAt: string;
}

export interface CharacterStat {
	id: string;
	userId: string;
	name: string;
	description: string;
	exampleActivities: CharacterStatExampleActivity[];
	currentLevel: number;
	totalXp: number;
	createdAt: string;
	updatedAt: string;
}

export interface CharacterStatWithProgress extends CharacterStat {
	xpToNextLevel: number;
	canLevelUp: boolean;
	currentLevelTitle?: string;
	nextLevelTitle?: string;
}

export interface PredefinedStat {
	name: string;
	description: string;
	exampleActivities: CharacterStatExampleActivity[];
}

export interface CreateCharacterStatInput {
	name: string;
	description: string;
	exampleActivities: CharacterStatExampleActivity[];
}

export interface UpdateCharacterStatInput {
	name?: string;
	description?: string;
	exampleActivities?: CharacterStatExampleActivity[];
}

export interface GrantXpInput {
	statId: string;
	xpAmount: number;
	sourceType: 'task' | 'journal' | 'adhoc' | 'quest' | 'experiment';
	sourceId?: string;
	reason?: string;
}

// API response types
interface ApiResponse<T> {
	success: boolean;
	data: T;
}

interface ApiError {
	success: false;
	error: string;
}

// Type-safe stats API using Hono client
export const statsApi = {
	// Get predefined stats available for creation
	async getPredefinedStats(): Promise<PredefinedStat[]> {
		try {
			const response = await authenticatedClient.api.stats.predefined.$get();

			if (!response.ok) {
				console.error('Get predefined stats API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as ApiResponse<PredefinedStat[]>;
			return result.data;
		} catch (error) {
			console.error('Get predefined stats API request failed:', error);
			throw error;
		}
	},

	// Create multiple predefined stats for the user
	async createPredefinedStats(statNames: string[]): Promise<CharacterStatWithProgress[]> {
		try {
			const response = await authenticatedClient.api.stats.predefined.$post({
				json: { statNames }
			});

			if (!response.ok) {
				console.error('Create predefined stats API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as ApiResponse<CharacterStatWithProgress[]>;
			return result.data;
		} catch (error) {
			console.error('Create predefined stats API request failed:', error);
			throw error;
		}
	},

	// Get user's stats with progress information
	async getUserStats(): Promise<CharacterStatWithProgress[]> {
		try {
			const response = await authenticatedClient.api.stats.$get({
				query: {}
			});

			if (!response.ok) {
				console.error('Get user stats API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as ApiResponse<CharacterStatWithProgress[]>;
			return result.data;
		} catch (error) {
			console.error('Get user stats API request failed:', error);
			throw error;
		}
	},

	// Get specific stat by ID
	async getStat(statId: string): Promise<CharacterStatWithProgress> {
		try {
			const response = await authenticatedClient.api.stats[':id'].$get({
				param: { id: statId }
			});

			if (!response.ok) {
				console.error('Get stat API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as ApiResponse<CharacterStatWithProgress>;
			return result.data;
		} catch (error) {
			console.error('Get stat API request failed:', error);
			throw error;
		}
	},

	// Create a new custom stat
	async createStat(data: CreateCharacterStatInput): Promise<CharacterStatWithProgress> {
		try {
			const response = await authenticatedClient.api.stats.$post({
				json: data
			});

			if (!response.ok) {
				console.error('Create stat API error:', response.status, response.statusText);
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

			const result = (await response.json()) as ApiResponse<CharacterStatWithProgress>;
			return result.data;
		} catch (error) {
			console.error('Create stat API request failed:', error);
			throw error;
		}
	},

	// Update an existing stat
	async updateStat(
		statId: string,
		data: UpdateCharacterStatInput
	): Promise<CharacterStatWithProgress> {
		try {
			const response = await authenticatedClient.api.stats[':id'].$put({
				param: { id: statId },
				json: data
			});

			if (!response.ok) {
				console.error('Update stat API error:', response.status, response.statusText);
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

			const result = (await response.json()) as ApiResponse<CharacterStatWithProgress>;
			return result.data;
		} catch (error) {
			console.error('Update stat API request failed:', error);
			throw error;
		}
	},

	// Delete a stat
	async deleteStat(statId: string): Promise<void> {
		try {
			const response = await authenticatedClient.api.stats[':id'].$delete({
				param: { id: statId }
			});

			if (!response.ok) {
				console.error('Delete stat API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			// Delete returns success message, no data needed
		} catch (error) {
			console.error('Delete stat API request failed:', error);
			throw error;
		}
	},

	// Grant XP to a stat
	async grantXp(
		statId: string,
		xpAmount: number,
		sourceType: 'task' | 'journal' | 'adhoc' | 'quest' | 'experiment',
		reason?: string,
		sourceId?: string
	): Promise<CharacterStatWithProgress> {
		try {
			const response = await authenticatedClient.api.stats[':id'].xp.$post({
				param: { id: statId },
				json: { statId, xpAmount, sourceType, reason, sourceId }
			});

			if (!response.ok) {
				console.error('Grant XP API error:', response.status, response.statusText);
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

			const result = (await response.json()) as any;
			// Extract the stat from the response and add progress info
			return {
				...result.data.stat,
				xpToNextLevel: result.data.levelInfo.xpToNextLevel,
				canLevelUp: result.data.levelInfo.canLevelUp
			};
		} catch (error) {
			console.error('Grant XP API request failed:', error);
			throw error;
		}
	},

	// Level up a stat
	async levelUp(statId: string): Promise<CharacterStatWithProgress> {
		try {
			const response = await authenticatedClient.api.stats[':id']['level-up'].$post({
				param: { id: statId }
			});

			if (!response.ok) {
				console.error('Level up API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as any;
			// Extract the stat from the response and add progress info
			return {
				...result.data.stat,
				xpToNextLevel: result.data.levelInfo.xpToNextLevel,
				canLevelUp: result.data.levelInfo.canLevelUp
			};
		} catch (error) {
			console.error('Level up API request failed:', error);
			throw error;
		}
	},

	// Get XP history for a stat
	async getXpHistory(statId: string, limit = 50, offset = 0): Promise<CharacterStatXpGrant[]> {
		try {
			const response = await authenticatedClient.api.stats[':id']['xp-history'].$get({
				param: { id: statId },
				query: { limit: limit.toString(), offset: offset.toString() }
			});

			if (!response.ok) {
				console.error('Get XP history API error:', response.status, response.statusText);
				const result = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					(result as any).error || `Error ${response.status}: ${response.statusText}`
				);
			}

			const result = (await response.json()) as ApiResponse<CharacterStatXpGrant[]>;
			return result.data;
		} catch (error) {
			console.error('Get XP history API request failed:', error);
			throw error;
		}
	}
};
