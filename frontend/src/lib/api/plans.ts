import { authenticatedClient } from '../api';

// Import types directly from backend for type safety
import type {
  PlanResponse,
  PlanSubtaskResponse,
  PlanWithSubtasksResponse,
  CreatePlanRequest,
  UpdatePlanRequest,
  CreatePlanSubtaskRequest,
  UpdatePlanSubtaskRequest,
  PlanType,
} from '../../../../backend/src/types/plans';

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

// Type-safe plans API using Hono client
export const plansApi = {
  // Get user's plans
  async getUserPlans(): Promise<PlanResponse[]> {
    try {
      const response = await authenticatedClient.api.plans.$get({
        query: {},
      });

      if (!response.ok) {
        console.error('Get user plans API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<PlanResponse[]>;
      return result.data;
    } catch (error) {
      console.error('Get user plans API request failed:', error);
      throw error;
    }
  },

  // Get specific plan with subtasks by ID
  async getPlan(planId: string): Promise<PlanWithSubtasksResponse> {
    try {
      const response = await authenticatedClient.api.plans[':id'].$get({
        param: { id: planId },
      });

      if (!response.ok) {
        console.error('Get plan API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<PlanWithSubtasksResponse>;
      return result.data;
    } catch (error) {
      console.error('Get plan API request failed:', error);
      throw error;
    }
  },

  // Create a new plan
  async createPlan(data: CreatePlanRequest): Promise<PlanResponse> {
    try {
      const response = await authenticatedClient.api.plans.$post({
        json: data,
      });

      if (!response.ok) {
        console.error('Create plan API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (Number(response.status) === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<PlanResponse>;
      return result.data;
    } catch (error) {
      console.error('Create plan API request failed:', error);
      throw error;
    }
  },

  // Update an existing plan
  async updatePlan(planId: string, data: UpdatePlanRequest): Promise<PlanResponse> {
    try {
      const response = await authenticatedClient.api.plans[':id'].$put({
        param: { id: planId },
        json: data,
      });

      if (!response.ok) {
        console.error('Update plan API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<PlanResponse>;
      return result.data;
    } catch (error) {
      console.error('Update plan API request failed:', error);
      throw error;
    }
  },

  // Delete a plan
  async deletePlan(planId: string): Promise<void> {
    try {
      const response = await authenticatedClient.api.plans[':id'].$delete({
        param: { id: planId },
      });

      if (!response.ok) {
        console.error('Delete plan API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      // Delete returns success message, no data needed
    } catch (error) {
      console.error('Delete plan API request failed:', error);
      throw error;
    }
  },

  // Create a subtask for a plan
  async createSubtask(planId: string, data: CreatePlanSubtaskRequest): Promise<PlanSubtaskResponse> {
    try {
      const response = await authenticatedClient.api.plans[':id'].subtasks.$post({
        param: { id: planId },
        json: data,
      });

      if (!response.ok) {
        console.error('Create subtask API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<PlanSubtaskResponse>;
      return result.data;
    } catch (error) {
      console.error('Create subtask API request failed:', error);
      throw error;
    }
  },

  // Update a subtask
  async updateSubtask(planId: string, subtaskId: string, data: UpdatePlanSubtaskRequest): Promise<PlanSubtaskResponse> {
    try {
      const response = await authenticatedClient.api.plans[':planId'].subtasks[':subtaskId'].$put({
        param: { planId, subtaskId },
        json: data,
      });

      if (!response.ok) {
        console.error('Update subtask API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<PlanSubtaskResponse>;
      return result.data;
    } catch (error) {
      console.error('Update subtask API request failed:', error);
      throw error;
    }
  },

  // Complete/uncomplete a subtask
  async completeSubtask(planId: string, subtaskId: string, isCompleted: boolean): Promise<PlanSubtaskResponse> {
    try {
      const response = await authenticatedClient.api.plans[':planId'].subtasks[':subtaskId'].complete.$patch({
        param: { planId, subtaskId },
        json: { isCompleted },
      });

      if (!response.ok) {
        console.error('Complete subtask API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<PlanSubtaskResponse>;
      return result.data;
    } catch (error) {
      console.error('Complete subtask API request failed:', error);
      throw error;
    }
  },

  // Delete a subtask
  async deleteSubtask(planId: string, subtaskId: string): Promise<void> {
    try {
      const response = await authenticatedClient.api.plans[':planId'].subtasks[':subtaskId'].$delete({
        param: { planId, subtaskId },
      });

      if (!response.ok) {
        console.error('Delete subtask API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      // Delete returns success message, no data needed
    } catch (error) {
      console.error('Delete subtask API request failed:', error);
      throw error;
    }
  },

  // Reorder subtasks (for ordered plans)
  async reorderSubtasks(planId: string, subtaskIds: string[]): Promise<void> {
    try {
      const response = await authenticatedClient.api.plans[':id'].subtasks.reorder.$patch({
        param: { id: planId },
        json: { subtaskIds },
      });

      if (!response.ok) {
        console.error('Reorder subtasks API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      // Reorder returns success message, no data needed
    } catch (error) {
      console.error('Reorder subtasks API request failed:', error);
      throw error;
    }
  },
};

// Re-export types for convenience
export type {
  PlanResponse,
  PlanSubtaskResponse,
  PlanWithSubtasksResponse,
  CreatePlanRequest,
  UpdatePlanRequest,
  CreatePlanSubtaskRequest,
  UpdatePlanSubtaskRequest,
  PlanType,
};
