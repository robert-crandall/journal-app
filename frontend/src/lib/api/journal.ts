import { authenticatedClient, createAuthenticatedFetch, createAuthenticatedClient } from '../api';

// Import types from backend - the single source of truth
import type { Journal, JournalWithTags, CreateJournalRequest, UpdateJournalRequest, FinalizeJournalRequest } from '../../../../backend/src/types/journals';

// API response types for JSON serialized data (dates become strings)
type JournalJsonResponse = Omit<Journal, 'createdAt' | 'updatedAt' | 'analyzedAt'> & {
  createdAt: string;
  updatedAt: string;
  analyzedAt: string | null;
};

type JournalWithTagsJsonResponse = Omit<JournalWithTags, 'createdAt' | 'updatedAt' | 'analyzedAt'> & {
  createdAt: string;
  updatedAt: string;
  analyzedAt: string | null;
};

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Helper functions to convert JSON responses to proper Date objects
function parseJournalFromJson(jsonJournal: JournalJsonResponse): Journal {
  return {
    ...jsonJournal,
    createdAt: new Date(jsonJournal.createdAt),
    updatedAt: new Date(jsonJournal.updatedAt),
    analyzedAt: jsonJournal.analyzedAt ? new Date(jsonJournal.analyzedAt) : null,
  };
}

function parseJournalWithTagsFromJson(jsonJournal: JournalWithTagsJsonResponse): JournalWithTags {
  return {
    ...jsonJournal,
    createdAt: new Date(jsonJournal.createdAt),
    updatedAt: new Date(jsonJournal.updatedAt),
    analyzedAt: jsonJournal.analyzedAt ? new Date(jsonJournal.analyzedAt) : null,
  };
}

interface ApiError {
  success: false;
  error: string;
  journalId?: string; // For cases where a journal already exists for a date
}

// Type-safe journal API using Hono client
export const journalApi = {
  // Get all journals for the authenticated user
  async getUserJournals(): Promise<Journal[]> {
    try {
      const client = createAuthenticatedClient();
      const response = await client.api.journal.$get();

      if (!response.ok) {
        console.error('Get user journals API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<JournalJsonResponse[]>;
      return result.data.map(parseJournalFromJson);
    } catch (error) {
      console.error('Get user journals API request failed:', error);
      throw error;
    }
  },

  // Get specific journal by ID with tags
  async getJournal(journalId: string): Promise<JournalWithTags> {
    try {
      const authFetch = createAuthenticatedFetch();
      const response = await authFetch(`/api/journal/${journalId}`);

      if (!response.ok) {
        console.error('Get journal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<JournalWithTagsJsonResponse>;
      return parseJournalWithTagsFromJson(result.data);
    } catch (error) {
      console.error('Get journal API request failed:', error);
      throw error;
    }
  },

  // Get journal by date
  async getJournalByDate(date: string): Promise<JournalWithTags> {
    try {
      const authFetch = createAuthenticatedFetch();
      const response = await authFetch(`/api/journal/date/${date}`);

      if (!response.ok) {
        console.error('Get journal by date API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<JournalWithTagsJsonResponse>;
      return parseJournalWithTagsFromJson(result.data);
    } catch (error) {
      console.error('Get journal by date API request failed:', error);
      throw error;
    }
  },

  // Create a new journal entry
  async createJournal(data: CreateJournalRequest): Promise<Journal> {
    try {
      const authFetch = createAuthenticatedFetch();
      const response = await authFetch('/api/journal', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Create journal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        // Handle conflict (journal already exists for date)
        if (response.status === 409) {
          const conflictError = new Error((result as any).error || 'Journal already exists for this date');
          (conflictError as any).existingJournalId = (result as any).journalId;
          throw conflictError;
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<JournalJsonResponse>;
      return parseJournalFromJson(result.data);
    } catch (error) {
      console.error('Create journal API request failed:', error);
      throw error;
    }
  },

  // Update an existing journal entry
  async updateJournal(journalId: string, data: UpdateJournalRequest): Promise<Journal> {
    try {
      const authFetch = createAuthenticatedFetch();
      const response = await authFetch(`/api/journal/${journalId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Update journal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<JournalJsonResponse>;
      return parseJournalFromJson(result.data);
    } catch (error) {
      console.error('Update journal API request failed:', error);
      throw error;
    }
  },

  // Delete a journal entry
  async deleteJournal(journalId: string): Promise<void> {
    try {
      const authFetch = createAuthenticatedFetch();
      const response = await authFetch(`/api/journal/${journalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Delete journal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      // Delete returns success message, no data needed
    } catch (error) {
      console.error('Delete journal API request failed:', error);
      throw error;
    }
  },

  // Finalize and analyze a journal entry
  async finalizeJournal(data: FinalizeJournalRequest): Promise<JournalWithTags> {
    try {
      const authFetch = createAuthenticatedFetch();
      const response = await authFetch('/api/journal/finalize', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Finalize journal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<JournalWithTagsJsonResponse>;
      return parseJournalWithTagsFromJson(result.data);
    } catch (error) {
      console.error('Finalize journal API request failed:', error);
      throw error;
    }
  },

  // Analyze journal content (for testing/preview)
  async analyzeJournal(content: string): Promise<any> {
    try {
      const authFetch = createAuthenticatedFetch();
      const response = await authFetch('/api/journal/analyze', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        console.error('Analyze journal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<any>;
      return result.data;
    } catch (error) {
      console.error('Analyze journal API request failed:', error);
      throw error;
    }
  },
};
