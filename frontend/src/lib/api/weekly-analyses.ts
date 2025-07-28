import type {
  WeeklyAnalysisResponse,
  CreateWeeklyAnalysisRequest,
  GenerateWeeklyAnalysisRequest,
  ListWeeklyAnalysesResponse,
} from '../../../../shared/types/weekly-analyses';
import { apiFetch } from '../api';

export interface GetWeeklyAnalysesOptions {
  page?: number;
  limit?: number;
  year?: number;
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

  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysToSubtract);

  // Friday is 6 days after Saturday
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);

  return {
    startDate: saturday.toISOString().split('T')[0], // YYYY-MM-DD
    endDate: friday.toISOString().split('T')[0], // YYYY-MM-DD
  };
}

/**
 * Format a date range for display
 */
export function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startFormatted = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endFormatted = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startFormatted} - ${endFormatted}`;
}
