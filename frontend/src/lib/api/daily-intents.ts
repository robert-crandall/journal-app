import { createAuthenticatedFetch } from '../api';
import type { DailyIntentResponse, CreateDailyIntentRequest } from '$lib/types/daily-intents';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

class DailyIntentsApi {
  // Get daily intent for a specific date
  async getDailyIntent(date: string): Promise<DailyIntentResponse | null> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/daily-intents/${date}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        console.error('Get daily intent API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<DailyIntentResponse>;
      return result.data;
    } catch (error) {
      console.error('Get daily intent API request failed:', error);
      throw error;
    }
  }

  // Create or update a daily intent
  async createOrUpdateDailyIntent(data: CreateDailyIntentRequest): Promise<DailyIntentResponse> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch('/api/daily-intents', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Create/update daily intent API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<DailyIntentResponse>;
      return result.data;
    } catch (error) {
      console.error('Create/update daily intent API request failed:', error);
      throw error;
    }
  }

  // Get recent daily intents (for history/context)
  async getRecentDailyIntents(limit: number = 10): Promise<DailyIntentResponse[]> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/daily-intents?limit=${limit}`, {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Get recent daily intents API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<DailyIntentResponse[]>;
      return result.data;
    } catch (error) {
      console.error('Get recent daily intents API request failed:', error);
      throw error;
    }
  }
}

export const dailyIntentsApi = new DailyIntentsApi();
