// Todo types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface SimpleTodo {
  id: string;
  userId: string;
  description: string;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSimpleTodo {
  id?: string;
  userId: string;
  description: string;
  isCompleted?: boolean;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateSimpleTodo = Partial<Omit<NewSimpleTodo, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Request/Response types for API
export type CreateSimpleTodoRequest = {
  description: string;
};

export type UpdateSimpleTodoRequest = {
  description?: string;
  isCompleted?: boolean;
};

export type SimpleTodoResponse = {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
