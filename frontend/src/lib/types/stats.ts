// Input types for creating/updating stats (frontend only)
export interface CreateCharacterStatInput {
  name: string;
  description: string;
  exampleActivities: import('$lib/types/stats').CharacterStatExampleActivity[];
}

export interface UpdateCharacterStatInput {
  name?: string;
  description?: string;
  exampleActivities?: import('$lib/types/stats').CharacterStatExampleActivity[];
}
// Import stat and XP types from shared folder (single source of truth)
export type {
  CharacterStat,
  NewCharacterStat,
  CharacterStatExampleActivity,
  CharacterStatLevelTitle,
  NewCharacterStatLevelTitle,
  CharacterStatWithProgress,
  LevelCalculation,
  PredefinedStat,
} from '../../../../shared/types/stats';

export type { XpGrant, NewXpGrant, XpEntityType, XpSourceType, CreateXpGrantRequest, XpGrantFilter, XpGrantWithEntity } from '../../../../shared/types/xp';
