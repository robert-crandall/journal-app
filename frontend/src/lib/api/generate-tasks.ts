import { createAuthenticatedFetch } from '../api';
import type { GeneratedTasksResponse, GenerateTasksRequest, GeneratedTasksForDateResponse } from '$lib/types/generate-tasks';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

class GenerateTasksApi {
  // Generate daily tasks for a specific date
  async generateTasks(data: GenerateTasksRequest): Promise<GeneratedTasksResponse> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch('/api/generate-tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Generate tasks API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<GeneratedTasksResponse>;
      return result.data;
    } catch (error) {
      console.error('Generate tasks API request failed:', error);
      throw error;
    }
  }

  // Get generated tasks for a specific date
  async getGeneratedTasksForDate(date: string): Promise<GeneratedTasksForDateResponse> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/generate-tasks/${date}`, {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Get generated tasks API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<GeneratedTasksForDateResponse>;
      return result.data;
    } catch (error) {
      console.error('Get generated tasks API request failed:', error);
      throw error;
    }
  }
}

export const generateTasksApi = new GenerateTasksApi();
