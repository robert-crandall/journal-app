// Daily intents types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface DailyIntent {
  id: string;
  userId: string;
  date: string; // Date in YYYY-MM-DD format
  importanceStatement: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewDailyIntent {
  id?: string;
  userId: string;
  date: string;
  importanceStatement: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateDailyIntent = Partial<Omit<NewDailyIntent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Request/Response types for API
export type CreateDailyIntentRequest = {
  date: string;
  importanceStatement: string;
};

export type UpdateDailyIntentRequest = {
  importanceStatement?: string;
};

export type DailyIntentResponse = {
  id: string;
  date: string;
  importanceStatement: string;
  createdAt: string;
  updatedAt: string;
};
