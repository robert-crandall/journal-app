// Daily questions types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface DailyQuestion {
  id: string;
  userId: string;
  questionText: string;
  dateAssigned: string; // Date in YYYY-MM-DD format
  answered: boolean;
  contextSource?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewDailyQuestion {
  id?: string;
  userId: string;
  questionText: string;
  dateAssigned: string;
  answered?: boolean;
  contextSource?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

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
