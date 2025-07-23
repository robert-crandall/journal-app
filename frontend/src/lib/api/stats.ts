import { authenticatedClient } from '../api';
import type {
  CharacterStat,
  NewCharacterStat,
  CharacterStatExampleActivity,
  CharacterStatLevelTitle,
  NewCharacterStatLevelTitle,
  CharacterStatWithProgress,
  LevelCalculation,
  PredefinedStat,
  XpGrant,
  NewXpGrant,
  XpEntityType,
  XpSourceType,
  CreateXpGrantRequest,
  XpGrantFilter,
  XpGrantWithEntity,
  CreateCharacterStatInput,
  UpdateCharacterStatInput,
} from '$lib/types/stats';

// Serialized version of XpGrant for API responses (Date becomes string)
export type XpGrantResponse = Omit<XpGrant, 'createdAt'> & {
  createdAt: string;
};

export type {
  CharacterStat,
  NewCharacterStat,
  CharacterStatExampleActivity,
  CharacterStatLevelTitle,
  NewCharacterStatLevelTitle,
  CharacterStatWithProgress,
  LevelCalculation,
  PredefinedStat,
  XpGrant,
  NewXpGrant,
  XpEntityType,
  XpSourceType,
  CreateXpGrantRequest,
  XpGrantFilter,
  XpGrantWithEntity,
};

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
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<PredefinedStat[]>;
  // No date conversion needed for PredefinedStat
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
        json: { statNames },
      });

      if (!response.ok) {
        console.error('Create predefined stats API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<CharacterStatWithProgress[]>;
      // Convert date strings to Date objects for CharacterStatWithProgress
      return result.data.map((stat) => ({
        ...stat,
        createdAt: new Date(stat.createdAt),
        updatedAt: new Date(stat.updatedAt),
      }));
    } catch (error) {
      console.error('Create predefined stats API request failed:', error);
      throw error;
    }
  },

  // Get user's stats with progress information
  async getUserStats(): Promise<CharacterStatWithProgress[]> {
    try {
      const response = await authenticatedClient.api.stats.$get({
        query: {},
      });

      if (!response.ok) {
        console.error('Get user stats API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;
      // Convert date strings to Date objects for CharacterStatWithProgress[]
      const data = (result as { success: boolean; data: any[] }).data;
      return data.map((stat) => ({
        ...stat,
        createdAt: new Date(stat.createdAt),
        updatedAt: new Date(stat.updatedAt),
      })) as CharacterStatWithProgress[];
    } catch (error) {
      console.error('Get user stats API request failed:', error);
      throw error;
    }
  },

  // Get specific stat by ID
  async getStat(statId: string): Promise<CharacterStatWithProgress> {
    try {
      const response = await authenticatedClient.api.stats[':id'].$get({
        param: { id: statId },
      });

      if (!response.ok) {
        console.error('Get stat API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<CharacterStatWithProgress>;
      // Convert date strings to Date objects for CharacterStatWithProgress
      return {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };
    } catch (error) {
      console.error('Get stat API request failed:', error);
      throw error;
    }
  },

  // Create a new custom stat
  async createStat(data: CreateCharacterStatInput): Promise<CharacterStatWithProgress> {
    try {
      const response = await authenticatedClient.api.stats.$post({
        json: data,
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

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<CharacterStatWithProgress>;
      // Convert date strings to Date objects for CharacterStatWithProgress
      return {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };
    } catch (error) {
      console.error('Create stat API request failed:', error);
      throw error;
    }
  },

  // Update an existing stat
  async updateStat(statId: string, data: UpdateCharacterStatInput): Promise<CharacterStatWithProgress> {
    try {
      const response = await authenticatedClient.api.stats[':id'].$put({
        param: { id: statId },
        json: data,
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

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const updateResult = (await response.json()) as unknown;
      // Convert date strings to Date objects for CharacterStatWithProgress
      const updateData = (updateResult as { success: boolean; data: any }).data;
      return {
        ...updateData,
        createdAt: new Date(updateData.createdAt),
        updatedAt: new Date(updateData.updatedAt),
      } as CharacterStatWithProgress;
    } catch (error) {
      console.error('Update stat API request failed:', error);
      throw error;
    }
  },

  // Delete a stat
  async deleteStat(statId: string): Promise<void> {
    try {
      const response = await authenticatedClient.api.stats[':id'].$delete({
        param: { id: statId },
      });

      if (!response.ok) {
        console.error('Delete stat API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
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
    sourceId?: string,
  ): Promise<CharacterStatWithProgress> {
    try {
      const response = await authenticatedClient.api.stats[':id'].xp.$post({
        param: { id: statId },
        json: { statId, xpAmount, sourceType, reason, sourceId },
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

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as any;
      // Extract the stat from the response and add progress info
      return {
        ...result.data.stat,
        xpToNextLevel: result.data.levelInfo.xpToNextLevel,
        canLevelUp: result.data.levelInfo.canLevelUp,
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
        param: { id: statId },
      });

      if (!response.ok) {
        console.error('Level up API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as any;
      // Extract the stat from the response and add progress info
      return {
        ...result.data.stat,
        xpToNextLevel: result.data.levelInfo.xpToNextLevel,
        canLevelUp: result.data.levelInfo.canLevelUp,
      };
    } catch (error) {
      console.error('Level up API request failed:', error);
      throw error;
    }
  },

  // Get XP history for a stat
  async getXpHistory(statId: string, limit = 50, offset = 0): Promise<XpGrantResponse[]> {
    try {
      const response = await authenticatedClient.api.stats[':id']['xp-history'].$get({
        param: { id: statId },
        query: { limit: limit.toString(), offset: offset.toString() },
      });

      if (!response.ok) {
        console.error('Get XP history API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<XpGrantResponse[]>;
      return result.data;
    } catch (error) {
      console.error('Get XP history API request failed:', error);
      throw error;
    }
  },
};
