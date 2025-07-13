import { apiFetch } from '../api';
import type {
  JournalResponse,
  TodayJournalResponse,
  CreateJournalRequest,
  UpdateJournalRequest,
  AddChatMessageRequest,
} from '../types/journal';

export class JournalService {
  /**
   * Get today's journal status for homepage
   */
  static async getTodaysJournal(): Promise<TodayJournalResponse> {
    const response = await apiFetch('/api/journals/today');
    return response.data;
  }

  /**
   * Get journal by specific date
   */
  static async getJournalByDate(date: string): Promise<JournalResponse> {
    const response = await apiFetch(`/api/journals/${date}`);
    return response.data;
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
   * Format date for API calls (YYYY-MM-DD)
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get today's date formatted for API
   */
  static getTodayDate(): string {
    return this.formatDate(new Date());
  }
}
