// Character types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface Character {
  id: string;
  userId: string;
  name: string;
  class: string | null;
  level: number;
  xp: number;
  avatar: string | null;
  background: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCharacter {
  id?: string;
  userId: string;
  name: string;
  class?: string | null;
  level?: number;
  xp?: number;
  avatar?: string | null;
  background?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateCharacter = Partial<Omit<CreateCharacter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
