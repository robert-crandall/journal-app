// Character types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface Character {
  id: string;
  userId: string;
  name: string;
  characterClass: string;
  backstory: string | null;
  goals: string | null;
  motto: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCharacter {
  id?: string;
  userId: string;
  name: string;
  characterClass: string;
  backstory?: string | null;
  goals?: string | null;
  motto?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateCharacter = Partial<Omit<CreateCharacter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Response types with serialized dates
export type CharacterResponse = Omit<Character, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};
