import { apiFetch } from '../api';
import type { 
  JournalEntry, 
  CreateJournalEntryRequest, 
  UpdateJournalEntryRequest 
} from '../../../../backend/src/types/journal';

export interface JournalFilters {
  startDate?: string;
  endDate?: string;
  questId?: string;
  limit?: number;
  offset?: number;
}

export interface JournalStats {
  totalEntries: number;
  totalXpGranted: number;
  averageXpPerEntry: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  longestStreak: number;
  currentStreak: number;
}

class JournalApi {
  /**
   * Get all journal entries for the authenticated user
   */
  async getUserJournalEntries(filters?: JournalFilters): Promise<JournalEntry[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.questId) queryParams.append('questId', filters.questId);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/journal${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiFetch(endpoint);
    return response.data;
  }

  /**
   * Get a specific journal entry by ID
   */
  async getJournalEntry(entryId: string): Promise<JournalEntry> {
    const response = await apiFetch(`/api/journal/${entryId}`);
    return response.data;
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(entryData: CreateJournalEntryRequest): Promise<JournalEntry> {
    const response = await apiFetch('/api/journal', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return response.data;
  }

  /**
   * Update an existing journal entry
   */
  async updateJournalEntry(entryId: string, entryData: UpdateJournalEntryRequest): Promise<JournalEntry> {
    const response = await apiFetch(`/api/journal/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
    return response.data;
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(entryId: string): Promise<void> {
    await apiFetch(`/api/journal/${entryId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get journal statistics
   */
  async getJournalStats(): Promise<JournalStats> {
    const response = await apiFetch('/api/journal/stats');
    return response.data;
  }

  /**
   * Analyze journal entry with GPT (if implemented)
   */
  async analyzeEntry(entryId: string): Promise<JournalEntry> {
    const response = await apiFetch(`/api/journal/${entryId}/analyze`, {
      method: 'POST',
    });
    return response.data;
  }
}

// Export a singleton instance
export const journalApi = new JournalApi();

// Export types for components to use
export type { 
  JournalEntry, 
  CreateJournalEntryRequest, 
  UpdateJournalEntryRequest
};
