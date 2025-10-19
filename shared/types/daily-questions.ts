// Daily questions types - shared between backend and frontend
// Import base types from backend schema as single source of truth

import type { DailyQuestion, NewDailyQuestion } from '../../backend/src/db/schema/daily-questions';

export type { DailyQuestion, NewDailyQuestion };

// Derived types for API operations
export type UpdateDailyQuestion = Partial<Omit<NewDailyQuestion, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Request/Response types for API
export type CreateDailyQuestionRequest = {
  questionText: string;
  dateAssigned: string;
  contextSource?: string;
};

export type UpdateDailyQuestionRequest = {
  answered?: boolean;
};

export type DailyQuestionResponse = {
  id: string;
  questionText: string;
  dateAssigned: string;
  answered: boolean;
  contextSource?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GetTodayQuestionResponse = {
  question: DailyQuestionResponse | null;
};
