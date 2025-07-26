import { apiFetch } from '../api';
import type {
  MetricSummaryResponse,
  ListMetricSummariesResponse,
  GenerateMetricsRequest,
  ListMetricSummariesRequest,
  MetricSummaryUIFilters,
} from '../types/metric-summaries';
import { parseDateTime } from '../utils/date';

// Type-safe metric summaries API using fetch wrapper
export const metricSummariesApi = {
  // Generate metrics for a time period
  async generateMetrics(data: GenerateMetricsRequest): Promise<MetricSummaryResponse> {
    const response = await apiFetch('/api/metric-summaries/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Generate and save metrics for a journal summary
  async generateForJournalSummary(sourceId: string): Promise<MetricSummaryResponse> {
    const response = await apiFetch(`/api/metric-summaries/journal-summary/${sourceId}`, {
      method: 'POST',
    });
    return response.data;
  },

  // Generate and save metrics for an experiment
  async generateForExperiment(sourceId: string): Promise<MetricSummaryResponse> {
    const response = await apiFetch(`/api/metric-summaries/experiment/${sourceId}`, {
      method: 'POST',
    });
    return response.data;
  },

  // Get user's metric summaries with filtering and pagination
  async getMetricSummaries(params: Partial<MetricSummaryUIFilters> = {}): Promise<ListMetricSummariesResponse> {
    const searchParams = new URLSearchParams();

    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) searchParams.set('offset', params.offset.toString());
    if (params.type) searchParams.set('type', params.type);
    if (params.sourceType) searchParams.set('sourceType', params.sourceType);
    if (params.minAvgDayRating !== undefined) searchParams.set('minAvgDayRating', params.minAvgDayRating.toString());
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const url = queryString ? `/api/metric-summaries?${queryString}` : '/api/metric-summaries';

    const response = await apiFetch(url);
    return response.data;
  },

  // Get specific metric summary by ID
  async getMetricSummary(summaryId: string): Promise<MetricSummaryResponse> {
    const response = await apiFetch(`/api/metric-summaries/${summaryId}`);
    return response.data;
  },

  // Delete a metric summary
  async deleteMetricSummary(summaryId: string): Promise<void> {
    await apiFetch(`/api/metric-summaries/${summaryId}`, {
      method: 'DELETE',
    });
  },
};

// Helper functions for metric calculations and display
export const metricSummariesUtils = {
  /**
   * Format period for display
   */
  formatPeriod(startDate: string, endDate: string): string {
    const start = parseDateTime(startDate);
    const end = parseDateTime(endDate);

    // Check if it's likely a week or month period
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      // Week format
      const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startFormatted} - ${endFormatted}`;
    } else if (daysDiff <= 31) {
      // Month format
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      // Custom range
      const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startFormatted} - ${endFormatted}`;
    }
  },

  /**
   * Get XP percentage breakdown by stat
   */
  getXpPercentages(xpByStat: Record<string, number>): Array<{ statName: string; xp: number; percentage: number }> {
    const total = Object.values(xpByStat).reduce((sum, xp) => sum + xp, 0);
    if (total === 0) return [];

    return Object.entries(xpByStat)
      .map(([statName, xp]) => ({
        statName,
        xp,
        percentage: Math.round((xp / total) * 100),
      }))
      .sort((a, b) => b.xp - a.xp);
  },

  /**
   * Get tone tag percentages
   */
  getToneTagPercentages(toneCounts: Record<string, number>): Array<{ tag: string; count: number; percentage: number }> {
    const total = Object.values(toneCounts).reduce((sum, count) => sum + count, 0);
    if (total === 0) return [];

    return Object.entries(toneCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Format XP value for display
   */
  formatXp(value: number): string {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  },

  /**
   * Get rating emoji
   */
  getRatingEmoji(rating: number): string {
    if (rating >= 4.5) return '🌟';
    if (rating >= 4.0) return '😊';
    if (rating >= 3.5) return '🙂';
    if (rating >= 3.0) return '😐';
    if (rating >= 2.5) return '😕';
    if (rating >= 2.0) return '😞';
    return '😢';
  },

  /**
   * Get color for metric type
   */
  getTypeColor(type: 'generated' | 'journal-summary' | 'experiment'): string {
    switch (type) {
      case 'generated':
        return 'primary';
      case 'journal-summary':
        return 'secondary';
      case 'experiment':
        return 'accent';
      default:
        return 'neutral';
    }
  },

  /**
   * Calculate trend from previous period (if available)
   */
  calculateTrend(current: number, previous?: number): { value: number; direction: 'up' | 'down' | 'same' } | null {
    if (previous === undefined || previous === 0) return null;

    const change = ((current - previous) / previous) * 100;

    return {
      value: Math.abs(Math.round(change)),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    };
  },
};
