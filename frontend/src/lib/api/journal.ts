import { apiFetch } from '../api';
import type {
  JournalResponse,
  TodayJournalResponse,
  CreateJournalRequest,
  UpdateJournalRequest,
  AddChatMessageRequest,
  ListJournalsRequest,
  ListJournalsResponse,
} from '../types/journal';
import { getTodayDateString } from '../utils/date';

export class JournalService {
  /**
   * Get today's journal status for homepage
   */
  static async getTodaysJournal(): Promise<TodayJournalResponse> {
    // Get today's date in YYYY-MM-DD format using browser timezone
    const todayDate = getTodayDateString();

    try {
      // Use the date-specific endpoint
      const response = await apiFetch(`/api/journals/${todayDate}`);
      const journalData = response.data;

      // Transform JournalResponse to TodayJournalResponse
      return {
        exists: true,
        journal: journalData,
        status: journalData.status,
        actionText: this.getActionTextBasedOnStatus(journalData.status),
      };
    } catch (error) {
      // If no journal exists for today (404 error)
      return {
        exists: false,
        actionText: 'Write Journal',
      };
    }
  }

  /**
   * Get journal by specific date
   */
  static async getJournalByDate(date: string): Promise<JournalResponse> {
    const response = await apiFetch(`/api/journals/${date}`);
    return response.data;
  }

  /**
   * Helper to determine the appropriate action text based on journal status
   */
  private static getActionTextBasedOnStatus(status?: 'draft' | 'in_review' | 'complete'): string {
    switch (status) {
      case 'draft':
        return 'Continue Writing';
      case 'in_review':
        return 'Resume Reflection';
      case 'complete':
        return 'View Entry';
      default:
        return 'Write Journal';
    }
  }

  /**
   * Create a new journal entry
   */
  static async createJournal(data: CreateJournalRequest): Promise<JournalResponse> {
    const response = await apiFetch('/api/journals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Update an existing journal entry
   */
  static async updateJournal(date: string, data: UpdateJournalRequest): Promise<JournalResponse> {
    const response = await apiFetch(`/api/journals/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Start reflection process (draft -> in_review)
   */
  static async startReflection(date: string): Promise<JournalResponse> {
    const response = await apiFetch(`/api/journals/${date}/start-reflection`, {
      method: 'POST',
    });
    return response.data;
  }

  /**
   * Add a message to the chat session
   */
  static async addChatMessage(date: string, data: AddChatMessageRequest): Promise<JournalResponse> {
    const response = await apiFetch(`/api/journals/${date}/chat`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Finish journal (in_review -> complete)
   */
  static async finishJournal(date: string): Promise<JournalResponse> {
    const response = await apiFetch(`/api/journals/${date}/finish`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return response.data;
  }

  /**
   * Delete a journal entry
   */
  static async deleteJournal(date: string): Promise<void> {
    await apiFetch(`/api/journals/${date}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get list of journals with filtering and pagination
   */
  static async listJournals(params: Partial<ListJournalsRequest> = {}): Promise<ListJournalsResponse> {
    const searchParams = new URLSearchParams();

    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) searchParams.set('offset', params.offset.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.search) searchParams.set('search', params.search);
    if (params.tagId) searchParams.set('tagId', params.tagId);

    const queryString = searchParams.toString();
    const url = queryString ? `/api/journals?${queryString}` : '/api/journals';

    const response = await apiFetch(url);
    return response.data;
  }
}
