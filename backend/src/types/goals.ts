import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { goals } from '../db/schema/goals';

export type Goal = InferSelectModel<typeof goals>;
export type CreateGoal = InferInsertModel<typeof goals>;
export type UpdateGoal = Partial<Omit<CreateGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Helper type for parsed tags - transforms the raw goal data for frontend use
export type GoalWithParsedTags = Omit<Goal, 'tags' | 'createdAt' | 'updatedAt'> & {
  tags: string[]; // Parsed from JSON string
  createdAt: string; // Serialized date
  updatedAt: string; // Serialized date
};

// Helper type for creating goals with string array tags
export type CreateGoalWithTags = Omit<CreateGoal, 'tags' | 'userId' | 'createdAt' | 'updatedAt'> & {
  tags?: string[];
};

// Helper type for updating goals with string array tags
export type UpdateGoalWithTags = Omit<UpdateGoal, 'tags'> & {
  tags?: string[];
};
