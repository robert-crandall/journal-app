import type {
  WeeklyAnalysisResponse,
  CreateWeeklyAnalysisRequest,
  GenerateWeeklyAnalysisRequest,
  ListWeeklyAnalysesResponse,
  AnalysisType,
} from '../../../../shared/types/weekly-analyses';
import { apiFetch } from '../api';
import { formatDateTime } from '../utils/date';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface GetWeeklyAnalysesOptions {
  page?: number;
  limit?: number;
  year?: number;
  analysisType?: AnalysisType;
}

/**
 * Get a list of weekly analyses for the authenticated user
 */
export async function getWeeklyAnalyses(options: GetWeeklyAnalysesOptions = {}): Promise<ListWeeklyAnalysesResponse> {
  const searchParams = new URLSearchParams();

  if (options.limit !== undefined) {
    searchParams.set('limit', options.limit.toString());
  }
  if (options.page !== undefined) {
    const offset = (options.page - 1) * (options.limit || 10);
    searchParams.set('offset', offset.toString());
  }
  if (options.year !== undefined) {
    searchParams.set('year', options.year.toString());
  }
  if (options.analysisType !== undefined) {
    searchParams.set('analysisType', options.analysisType);
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/weekly-analyses?${queryString}` : '/api/weekly-analyses';

  const response = await apiFetch(url);
  return response.data;
}

/**
 * Get a specific weekly analysis by ID
 */
export async function getWeeklyAnalysis(id: string): Promise<WeeklyAnalysisResponse> {
  const response = await apiFetch(`/api/weekly-analyses/${id}`);
  return response.data;
}

/**
 * Create a new weekly analysis manually
 */
export async function createWeeklyAnalysis(data: CreateWeeklyAnalysisRequest): Promise<WeeklyAnalysisResponse> {
  const response = await apiFetch('/api/weekly-analyses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Generate a weekly analysis using GPT
 */
export async function generateWeeklyAnalysis(data: GenerateWeeklyAnalysisRequest): Promise<WeeklyAnalysisResponse> {
  const response = await apiFetch('/api/weekly-analyses/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Update an existing weekly analysis
 */
export async function updateWeeklyAnalysis(id: string, data: Partial<CreateWeeklyAnalysisRequest>): Promise<WeeklyAnalysisResponse> {
  const response = await apiFetch(`/api/weekly-analyses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Delete a weekly analysis
 */
export async function deleteWeeklyAnalysis(id: string): Promise<void> {
  await apiFetch(`/api/weekly-analyses/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get current week's date range (Saturday to Friday)
 */
export function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  // Find the Saturday that starts this week
  const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Saturday = 0 days back

  // eslint-disable-next-line custom/no-direct-date-conversion
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysToSubtract);

  // Friday is 6 days after Saturday
  // eslint-disable-next-line custom/no-direct-date-conversion
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);

  return {
    startDate: formatDateTime(saturday, 'yyyy-mm-dd'),
    endDate: formatDateTime(friday, 'yyyy-mm-dd'),
  };
}

/**
 * Format a date range for display
 */
export function formatWeekRange(startDate: string, endDate: string): string {
  const start = formatDateTime(startDate, 'date-only');
  const end = formatDateTime(endDate, 'date-only');

  // Simple format for now - could be enhanced with proper date parsing
  return `${start} - ${end}`;
}

/**
 * Get current month's date range
 */
export function getCurrentMonthRange(): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // First day of current month
  // eslint-disable-next-line custom/no-direct-date-conversion
  const startDate = new Date(year, month, 1);
  // Last day of current month
  // eslint-disable-next-line custom/no-direct-date-conversion
  const endDate = new Date(year, month + 1, 0);

  return {
    startDate: formatDateTime(startDate, 'yyyy-mm-dd'),
    endDate: formatDateTime(endDate, 'yyyy-mm-dd'),
  };
}

/**
 * Get current quarter's date range
 */
export function getCurrentQuarterRange(): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3);

  // First day of current quarter
  // eslint-disable-next-line custom/no-direct-date-conversion
  const startDate = new Date(year, quarter * 3, 1);
  // Last day of current quarter
  // eslint-disable-next-line custom/no-direct-date-conversion
  const endDate = new Date(year, (quarter + 1) * 3, 0);

  return {
    startDate: formatDateTime(startDate, 'yyyy-mm-dd'),
    endDate: formatDateTime(endDate, 'yyyy-mm-dd'),
  };
}

/**
 * Get date range for a specific analysis type
 */
export function getDateRangeForType(type: AnalysisType): DateRange {
  switch (type) {
    case 'weekly':
      return getCurrentWeekRange();
    case 'monthly':
      return getCurrentMonthRange();
    case 'quarterly':
      return getCurrentQuarterRange();
    default:
      return getCurrentWeekRange();
  }
}

/**
 * Format analysis type for display
 */
export function formatAnalysisType(type: AnalysisType): string {
  switch (type) {
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    default:
      return 'Weekly';
  }
}

/**
 * Get custom date range based on user input
 */
export function getCustomDateRange(startDate: string, endDate: string): { startDate: string; endDate: string } {
  return { startDate, endDate };
}
