import { apiFetch } from '../api';
import type { DailyQuestionResponse, GetTodayQuestionResponse, CreateDailyQuestionRequest, UpdateDailyQuestionRequest } from 'backend/src/db/schema';

export class DailyQuestionsService {
  /**
   * Get today's daily question (or generate if doesn't exist)
   */
  static async getTodaysQuestion(date?: string): Promise<GetTodayQuestionResponse> {
    const queryParam = date ? `?date=${date}` : '';
    const response = await apiFetch(`/api/daily-questions/today${queryParam}`);
    return response.data;
  }

  /**
   * Mark a daily question as answered
   */
  static async markQuestionAsAnswered(questionId: string): Promise<void> {
    await apiFetch(`/api/daily-questions/${questionId}/answered`, {
      method: 'PATCH',
    });
  }

  /**
   * Get a specific daily question by ID
   */
  static async getQuestionById(questionId: string): Promise<DailyQuestionResponse> {
    const response = await apiFetch(`/api/daily-questions/${questionId}`);
    return response.data;
  }

  /**
   * Get recent daily questions (for debugging/admin purposes)
   */
  static async getRecentQuestions(limit: number = 10): Promise<DailyQuestionResponse[]> {
    const response = await apiFetch(`/api/daily-questions?limit=${limit}`);
    return response.data;
  }

  /**
   * Create a daily question manually (for testing/admin purposes)
   */
  static async createQuestion(data: CreateDailyQuestionRequest): Promise<DailyQuestionResponse> {
    const response = await apiFetch('/api/daily-questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }
}
