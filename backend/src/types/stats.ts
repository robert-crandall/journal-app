import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { stats, statGroups, statLevelTitles, sampleActivities, statTemplates } from '../db/schema/stats';

// Stat Group Types
export type StatGroup = InferSelectModel<typeof statGroups>;
export type CreateStatGroup = InferInsertModel<typeof statGroups>;
export type UpdateStatGroup = Partial<Omit<CreateStatGroup, 'id' | 'createdAt' | 'updatedAt'>>;

// Stat Types
export type Stat = InferSelectModel<typeof stats>;
export type CreateStat = InferInsertModel<typeof stats>;
export type UpdateStat = Partial<Omit<CreateStat, 'id' | 'characterId' | 'createdAt' | 'updatedAt'>>;

// Stat Level Title Types
export type StatLevelTitle = InferSelectModel<typeof statLevelTitles>;
export type CreateStatLevelTitle = InferInsertModel<typeof statLevelTitles>;
export type UpdateStatLevelTitle = Partial<Omit<CreateStatLevelTitle, 'id' | 'statId' | 'createdAt' | 'updatedAt'>>;

// Sample Activity Types
export type SampleActivity = InferSelectModel<typeof sampleActivities>;
export type CreateSampleActivity = InferInsertModel<typeof sampleActivities>;
export type UpdateSampleActivity = Partial<Omit<CreateSampleActivity, 'id' | 'statId' | 'createdAt' | 'updatedAt'>>;

// Stat Template Types
export type StatTemplate = InferSelectModel<typeof statTemplates>;
export type CreateStatTemplate = InferInsertModel<typeof statTemplates>;
export type UpdateStatTemplate = Partial<Omit<CreateStatTemplate, 'id' | 'createdAt' | 'updatedAt'>>;

// Extended Stat Type with related data
export interface StatWithDetails extends Stat {
  group?: StatGroup;
  levelTitles?: StatLevelTitle[];
  sampleActivities?: SampleActivity[];
}

// XP granting request
export interface GrantXpRequest {
  statId: string;
  xp: number;
  reason?: string;
}

// Level Up request
export interface LevelUpRequest {
  statId: string;
}

// Calculate XP required for next level
export const calculateRequiredXp = (level: number): number => level * 100;
