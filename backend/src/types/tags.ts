import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tags, goalTags } from '../db/schema/tags';

export type Tag = InferSelectModel<typeof tags>;
export type CreateTag = InferInsertModel<typeof tags>;
export type UpdateTag = Partial<Omit<CreateTag, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export type GoalTag = InferSelectModel<typeof goalTags>;
export type CreateGoalTag = InferInsertModel<typeof goalTags>;

// Helper type for tags with their usage count
export type TagWithCount = Tag & {
  usageCount: number;
};

// Helper type for creating tags with names
export type CreateTagWithName = {
  name: string;
};
