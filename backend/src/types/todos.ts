import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { simpleTodos } from '../db/schema/todos';

export type SimpleTodo = InferSelectModel<typeof simpleTodos>;
export type NewSimpleTodo = InferInsertModel<typeof simpleTodos>;
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
