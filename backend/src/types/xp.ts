import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { xpGrants } from '../db/schema/stats';

// XP Grant types (generic for all entity types)
export type XpGrant = InferSelectModel<typeof xpGrants>;
export type NewXpGrant = InferInsertModel<typeof xpGrants>;

// Supported entity types for XP grants
export type XpEntityType = 'character_stat' | 'family_member' | 'goal' | 'project' | 'adventure';

// Supported source types for XP grants
export type XpSourceType = 'task' | 'journal' | 'adhoc' | 'quest' | 'experiment' | 'interaction';

// Helper interface for creating XP grants with additional context
export interface CreateXpGrantRequest {
  entityType: XpEntityType;
  entityId: string;
  xpAmount: number;
  sourceType: XpSourceType;
  sourceId?: string;
  reason?: string;
}

// Interface for filtering XP grants by entity
export interface XpGrantFilter {
  entityType?: XpEntityType;
  entityId?: string;
  sourceType?: XpSourceType;
  limit?: number;
  offset?: number;
}

// Interface for XP grant with related entity information
export interface XpGrantWithEntity extends XpGrant {
  entityName?: string; // Name of the entity (stat name, family member name, etc.)
  entityDescription?: string; // Description for context
}
