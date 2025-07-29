// Tag types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface Tag {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTag {
  id?: string;
  userId: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateTag = Partial<Omit<CreateTag, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface GoalTag {
  id: string;
  goalId: string;
  tagId: string;
  createdAt: Date;
}

export interface CreateGoalTag {
  id?: string;
  goalId: string;
  tagId: string;
  createdAt?: Date;
}

// Helper type for tags with their usage count
export type TagWithCount = Tag & {
  usageCount: number;
};

// Helper type for creating tags with names
export type CreateTagWithName = {
  name: string;
};
