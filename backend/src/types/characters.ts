import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { characters } from '../db/schema/characters';

export type Character = InferSelectModel<typeof characters>;
export type CreateCharacter = InferInsertModel<typeof characters>;
export type UpdateCharacter = Partial<Omit<CreateCharacter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
