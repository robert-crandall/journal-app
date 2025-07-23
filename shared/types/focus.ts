// Focus types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface Focus {
  id: string;
  userId: string;
  dayOfWeek: number;
  title: string;
  description: string;
  createdAt: Date;
}

export interface NewFocus {
  id?: string;
  userId: string;
  dayOfWeek: number;
  title: string;
  description: string;
  createdAt?: Date;
}

export type FocusUpdate = Partial<Omit<NewFocus, 'id' | 'userId' | 'createdAt'>>;

// Request types
export interface CreateFocusRequest {
  dayOfWeek: number;
  title: string;
  description: string;
}

export interface UpdateFocusRequest {
  dayOfWeek?: number;
  title?: string;
  description?: string;
}

export interface BatchUpdateFocusesRequest {
  focuses: {
    dayOfWeek: number;
    title: string;
    description: string;
  }[];
}
