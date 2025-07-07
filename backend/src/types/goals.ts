import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { goals } from '../db/schema/goals';
import type { Tag } from './tags';

export type Goal = InferSelectModel<typeof goals>;
export type CreateGoal = InferInsertModel<typeof goals>;
export type UpdateGoal = Partial<Omit<CreateGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Helper type for goals with tags populated - replaces GoalWithParsedTags
export type GoalWithTags = Omit<Goal, 'createdAt' | 'updatedAt'> & {
  tags: Tag[]; // Array of full tag objects
  createdAt: string; // Serialized date
  updatedAt: string; // Serialized date
};

// Helper type for creating goals with string array tags
export type CreateGoalWithTags = Omit<CreateGoal, 'userId' | 'createdAt' | 'updatedAt'> & {
  tags?: string[];
};

// Helper type for updating goals with string array tags
export type UpdateGoalWithTags = Omit<UpdateGoal, never> & {
  tags?: string[];
};

// Backwards compatibility - deprecated, use GoalWithTags instead
/** @deprecated Use GoalWithTags instead */
export type GoalWithParsedTags = Omit<Goal, 'createdAt' | 'updatedAt'> & {
  tags: string[]; // Array of tag names for backwards compatibility
  createdAt: string; // Serialized date
  updatedAt: string; // Serialized date
};
