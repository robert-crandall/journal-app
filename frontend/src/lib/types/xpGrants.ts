// Barrel file for XP grant types, re-exporting from backend
import type {
  XpGrant,
  NewXpGrant,
  XpEntityType,
  XpSourceType,
  CreateXpGrantRequest,
  XpGrantFilter,
  XpGrantWithEntity
} from '../../../../backend/src/types/xp';

export type {
  XpGrant,
  NewXpGrant,
  XpEntityType,
  XpSourceType,
  CreateXpGrantRequest,
  XpGrantFilter,
  XpGrantWithEntity
};

// For frontend-specific display details
export interface XpGrantWithDetails extends XpGrantWithEntity {
  // All fields from XpGrantWithEntity, plus:
  // Optionally add frontend-only fields here if needed
}
