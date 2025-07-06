import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { goals } from '../db/schema/goals';

export type Goal = InferSelectModel<typeof goals>;
export type CreateGoal = InferInsertModel<typeof goals>;
export type UpdateGoal = Partial<Omit<CreateGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Helper type for parsed tags
export type GoalWithParsedTags = Omit<Goal, 'tags'> & {
  tags: string[];
};

// Helper type for creating goals with string array tags
export type CreateGoalWithTags = Omit<CreateGoal, 'tags'> & {
  tags?: string[];
};
