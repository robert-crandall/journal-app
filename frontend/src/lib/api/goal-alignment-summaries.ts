import { apiFetch } from '../api';
import type {
  GoalAlignmentSummaryResponse,
  ListGoalAlignmentSummariesResponse,
  CreateGoalAlignmentSummaryRequest,
  UpdateGoalAlignmentSummaryRequest,
  GetGoalAlignmentSummariesQuery,
  GenerateGoalAlignmentSummaryRequest,
} from '../types/goal-alignment-summaries';
import { parseDateTime, formatDate } from '../utils/date';

// Type-safe goal alignment summaries API using fetch wrapper
export const goalAlignmentSummariesApi = {
  // Get user's goal alignment summaries with filtering and pagination
  async getSummaries(query: GetGoalAlignmentSummariesQuery = {}): Promise<ListGoalAlignmentSummariesResponse> {
    const searchParams = new URLSearchParams();

    if (query.limit !== undefined) searchParams.set('limit', query.limit.toString());
    if (query.offset !== undefined) searchParams.set('offset', query.offset.toString());
    if (query.year !== undefined) searchParams.set('year', query.year.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `/api/goal-alignment-summaries?${queryString}` : '/api/goal-alignment-summaries';

    const response = await apiFetch(url);
    return response.data;
  },

  // Get specific goal alignment summary by ID
  async getSummary(summaryId: string): Promise<GoalAlignmentSummaryResponse> {
    const response = await apiFetch(`/api/goal-alignment-summaries/${summaryId}`);
    return response.data;
  },

  // Create a new goal alignment summary (manual creation)
  async createSummary(data: CreateGoalAlignmentSummaryRequest): Promise<GoalAlignmentSummaryResponse> {
    const response = await apiFetch('/api/goal-alignment-summaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Generate a goal alignment summary using GPT
  async generateSummary(data: GenerateGoalAlignmentSummaryRequest): Promise<GoalAlignmentSummaryResponse> {
    const response = await apiFetch('/api/goal-alignment-summaries/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update an existing goal alignment summary
  async updateSummary(summaryId: string, data: UpdateGoalAlignmentSummaryRequest): Promise<GoalAlignmentSummaryResponse> {
    const response = await apiFetch(`/api/goal-alignment-summaries/${summaryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete a goal alignment summary
  async deleteSummary(summaryId: string): Promise<void> {
    await apiFetch(`/api/goal-alignment-summaries/${summaryId}`, {
      method: 'DELETE',
    });
  },
};

// Helper functions for date calculations and formatting
export const goalAlignmentSummariesUtils = {
  /**
   * Format period dates for display
   */
  formatPeriod(startDate: string, endDate: string): string {
    const start = parseDateTime(startDate);
    const end = parseDateTime(endDate);

    const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  },

  /**
   * Get current week boundaries (Saturday to Friday to match journal summaries)
   */
  getCurrentWeekBoundaries(): { startDate: string; endDate: string } {
    const inputDate = new Date();

    // Find the Saturday that starts this week
    const dayOfWeek = inputDate.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Saturday = 0 days back

    // eslint-disable-next-line custom/no-direct-date-conversion
    const saturday = new Date(inputDate);
    saturday.setDate(inputDate.getDate() - daysToSubtract);

    // Friday is 6 days after Saturday
    // eslint-disable-next-line custom/no-direct-date-conversion
    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6);

    return {
      startDate: saturday.toISOString().split('T')[0], // YYYY-MM-DD
      endDate: friday.toISOString().split('T')[0], // YYYY-MM-DD
    };
  },

  /**
   * Get current month boundaries
   */
  getCurrentMonthBoundaries(): { startDate: string; endDate: string } {
    const inputDate = new Date();

    const firstDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);
    const lastDay = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0);

    return {
      startDate: firstDay.toISOString().split('T')[0], // YYYY-MM-DD
      endDate: lastDay.toISOString().split('T')[0], // YYYY-MM-DD
    };
  },

  /**
   * Format alignment score as percentage with color
   */
  formatAlignmentScore(score: number | null): { text: string; class: string } {
    if (score === null) {
      return { text: 'N/A', class: 'text-base-content/60' };
    }

    const percentage = Math.round(score * 100);
    let colorClass = '';

    if (percentage >= 80) {
      colorClass = 'text-success';
    } else if (percentage >= 60) {
      colorClass = 'text-warning';
    } else {
      colorClass = 'text-error';
    }

    return { text: `${percentage}%`, class: colorClass };
  },
};
