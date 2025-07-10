import { authenticatedClient } from '../api';

// Import types from backend - the single source of truth
import type { Journal, JournalWithTags, CreateJournalRequest, UpdateJournalRequest, FinalizeJournalRequest } from '../../../../backend/src/types/journals';

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
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
      const response = await authenticatedClient.api.journal.$get();

      if (!response.ok) {
        console.error('Get user journals API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<Journal[]>;
      return result.data;
    } catch (error) {
      console.error('Get user journals API request failed:', error);
      throw error;
    }
  },

  // Get specific journal by ID with tags
  async getJournal(journalId: string): Promise<JournalWithTags> {
    try {
      const response = await authenticatedClient.api.journal[':id'].$get({
        param: { id: journalId },
      });

      if (!response.ok) {
        console.error('Get journal API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<JournalWithTags>;
      return result.data;
    } catch (error) {
      console.error('Get journal API request failed:', error);
      throw error;
    }
  },

  // Get journal by date
  async getJournalByDate(date: string): Promise<JournalWithTags> {
    try {
      const response = await authenticatedClient.api.journal.date[':date'].$get({
        param: { date },
      });

      if (!response.ok) {
        console.error('Get journal by date API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<JournalWithTags>;
      return result.data;
    } catch (error) {
      console.error('Get journal by date API request failed:', error);
      throw error;
    }
  },

  // Create a new journal entry
  async createJournal(data: CreateJournalRequest): Promise<Journal> {
    try {
      const response = await authenticatedClient.api.journal.$post({
        json: data,
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

      const result = (await response.json()) as ApiResponse<Journal>;
      return result.data;
    } catch (error) {
      console.error('Create journal API request failed:', error);
      throw error;
    }
  },

  // Update an existing journal entry
  async updateJournal(journalId: string, data: UpdateJournalRequest): Promise<Journal> {
    try {
      const response = await authenticatedClient.api.journal[':id'].$put({
        param: { id: journalId },
        json: data,
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

      const result = (await response.json()) as ApiResponse<Journal>;
      return result.data;
    } catch (error) {
      console.error('Update journal API request failed:', error);
      throw error;
    }
  },

  // Delete a journal entry
  async deleteJournal(journalId: string): Promise<void> {
    try {
      const response = await authenticatedClient.api.journal[':id'].$delete({
        param: { id: journalId },
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
      const response = await authenticatedClient.api.journal.finalize.$post({
        json: data,
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

      const result = (await response.json()) as ApiResponse<JournalWithTags>;
      return result.data;
    } catch (error) {
      console.error('Finalize journal API request failed:', error);
      throw error;
    }
  },

  // Analyze journal content (for testing/preview)
  async analyzeJournal(content: string): Promise<any> {
    try {
      const response = await authenticatedClient.api.journal.analyze.$post({
        json: { content },
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
