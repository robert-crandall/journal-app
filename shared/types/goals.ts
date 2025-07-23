// Goal types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies
import type { Tag } from './tags';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoal {
  id?: string;
  userId: string;
  title: string;
  description?: string | null;
  isActive?: boolean;
  isArchived?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

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
  isActive?: boolean;
  isArchived?: boolean;
};

// Helper type for updating goals with string array tags
export type UpdateGoalWithTags = Omit<UpdateGoal, never> & {
  tags?: string[];
  isActive?: boolean;
  isArchived?: boolean;
};

// Backwards compatibility - deprecated, use GoalWithTags instead
/** @deprecated Use GoalWithTags instead */
export type GoalWithParsedTags = Omit<Goal, 'createdAt' | 'updatedAt'> & {
  tags: string[]; // Array of tag names for backwards compatibility
  createdAt: string; // Serialized date
  updatedAt: string; // Serialized date
};
