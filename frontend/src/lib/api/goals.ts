import { authenticatedClient } from '../api';

// Frontend types that match backend structure
// TODO: Import these from backend once module resolution is fixed
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  tags?: string | null;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalWithParsedTags {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  tags: string[];
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalWithTags {
  title: string;
  description?: string;
  tags?: string[];
  isActive?: boolean;
  isArchived?: boolean;
}

export interface UpdateGoalWithTags {
  title?: string;
  description?: string;
  tags?: string[];
  isActive?: boolean;
  isArchived?: boolean;
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

// Type-safe goals API using Hono client
export const goalsApi = {
  // Get user's goals
  async getUserGoals(): Promise<GoalWithParsedTags[]> {
    try {
      const response = await authenticatedClient.api.goals.$get({
        query: {},
      });

      if (!response.ok) {
        console.error('Get user goals API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<GoalWithParsedTags[]>;
      return result.data;
    } catch (error) {
      console.error('Get user goals API request failed:', error);
      throw error;
    }
  },

  // Get specific goal by ID
  async getGoal(goalId: string): Promise<GoalWithParsedTags> {
    try {
      const response = await authenticatedClient.api.goals[':id'].$get({
        param: { id: goalId },
      });

      if (!response.ok) {
        console.error('Get goal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<GoalWithParsedTags>;
      return result.data;
    } catch (error) {
      console.error('Get goal API request failed:', error);
      throw error;
    }
  },

  // Create a new goal
  async createGoal(data: CreateGoalWithTags): Promise<GoalWithParsedTags> {
    try {
      const response = await authenticatedClient.api.goals.$post({
        json: data,
      });

      if (!response.ok) {
        console.error('Create goal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<GoalWithParsedTags>;
      return result.data;
    } catch (error) {
      console.error('Create goal API request failed:', error);
      throw error;
    }
  },

  // Update an existing goal
  async updateGoal(goalId: string, data: UpdateGoalWithTags): Promise<GoalWithParsedTags> {
    try {
      const response = await authenticatedClient.api.goals[':id'].$put({
        param: { id: goalId },
        json: data,
      });

      if (!response.ok) {
        console.error('Update goal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<GoalWithParsedTags>;
      return result.data;
    } catch (error) {
      console.error('Update goal API request failed:', error);
      throw error;
    }
  },

  // Delete a goal
  async deleteGoal(goalId: string): Promise<void> {
    try {
      const response = await authenticatedClient.api.goals[':id'].$delete({
        param: { id: goalId },
      });

      if (!response.ok) {
        console.error('Delete goal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      // Delete returns success message, no data needed
    } catch (error) {
      console.error('Delete goal API request failed:', error);
      throw error;
    }
  },
};
