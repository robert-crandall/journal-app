// Import and re-export all the types from the backend
// This ensures we have a single source of truth for types
import type {
  Stat,
  StatGroup,
  StatTemplate,
  StatSampleActivity,
  StatLevelTitle,
  CreateStatData,
  UpdateStatData,
  GrantXPData,
  AssignTemplatesData,
  CreateSampleActivityData,
  UpdateSampleActivityData,
  CreateStatLevelTitleData,
  UpdateStatLevelTitleData
} from '../../../backend/src/types/stats';

// Re-export all types
export type {
  Stat,
  StatGroup,
  StatTemplate,
  StatSampleActivity,
  StatLevelTitle,
  CreateStatData,
  UpdateStatData,
  GrantXPData,
  AssignTemplatesData,
  CreateSampleActivityData,
  UpdateSampleActivityData,
  CreateStatLevelTitleData,
  UpdateStatLevelTitleData
};
