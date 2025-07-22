import { apiFetch } from '../api';
import type {
  JournalSummaryResponse,
  ListJournalSummariesResponse,
  CreateJournalSummaryRequest,
  UpdateJournalSummaryRequest,
  ListJournalSummariesRequest,
  GenerateJournalSummaryRequest,
} from '../types/journal-summaries';
import { parseDateTime } from '../utils/date';

// Type-safe journal summaries API using fetch wrapper
export const journalSummariesApi = {
  // Get user's journal summaries with filtering and pagination
  async getJournalSummaries(params: Partial<ListJournalSummariesRequest> = {}): Promise<ListJournalSummariesResponse> {
    const searchParams = new URLSearchParams();

    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) searchParams.set('offset', params.offset.toString());
    if (params.period) searchParams.set('period', params.period);
    if (params.year !== undefined) searchParams.set('year', params.year.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `/api/journal-summaries?${queryString}` : '/api/journal-summaries';

    const response = await apiFetch(url);
    return response.data;
  },

  // Get specific journal summary by ID
  async getJournalSummary(summaryId: string): Promise<JournalSummaryResponse> {
    const response = await apiFetch(`/api/journal-summaries/${summaryId}`);
    return response.data;
  },

  // Create a new journal summary (manual creation)
  async createJournalSummary(data: CreateJournalSummaryRequest): Promise<JournalSummaryResponse> {
    const response = await apiFetch('/api/journal-summaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Generate a journal summary using GPT
  async generateJournalSummary(data: GenerateJournalSummaryRequest): Promise<JournalSummaryResponse> {
    const response = await apiFetch('/api/journal-summaries/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update an existing journal summary
  async updateJournalSummary(summaryId: string, data: UpdateJournalSummaryRequest): Promise<JournalSummaryResponse> {
    const response = await apiFetch(`/api/journal-summaries/${summaryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete a journal summary
  async deleteJournalSummary(summaryId: string): Promise<JournalSummaryResponse> {
    const response = await apiFetch(`/api/journal-summaries/${summaryId}`, {
      method: 'DELETE',
    });
    return response.data;
  },
};

// Helper functions for date calculations
export const journalSummariesUtils = {
  /**
   * Calculate week boundaries (Saturday to Friday)
   */
  getWeekBoundaries(date: Date): { startDate: string; endDate: string } {
    const inputDate = new Date(date);

    // Find the Saturday that starts this week
    const dayOfWeek = inputDate.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Saturday = 0 days back

    const saturday = new Date(inputDate);
    saturday.setDate(inputDate.getDate() - daysToSubtract);

    // Friday is 6 days after Saturday
    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6);

    return {
      startDate: saturday.toISOString().split('T')[0], // YYYY-MM-DD
      endDate: friday.toISOString().split('T')[0], // YYYY-MM-DD
    };
  },

  /**
   * Calculate month boundaries
   */
  getMonthBoundaries(date: Date): { startDate: string; endDate: string } {
    const inputDate = parseDateTime(date);

    const firstDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);
    const lastDay = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0);

    return {
      startDate: firstDay.toISOString().split('T')[0], // YYYY-MM-DD
      endDate: lastDay.toISOString().split('T')[0], // YYYY-MM-DD
    };
  },

  /**
   * Format period for display
   */
  formatPeriod(period: 'week' | 'month', startDate: string, endDate: string): string {
    const start = parseDateTime(startDate);
    const end = parseDateTime(endDate);

    if (period === 'month') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startFormatted} - ${endFormatted}`;
    }
  },

  /**
   * Get current week boundaries
   */
  getCurrentWeekBoundaries(): { startDate: string; endDate: string } {
    return this.getWeekBoundaries(new Date());
  },

  /**
   * Get current month boundaries
   */
  getCurrentMonthBoundaries(): { startDate: string; endDate: string } {
    return this.getMonthBoundaries(new Date());
  },
};
