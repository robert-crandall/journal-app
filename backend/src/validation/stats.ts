import { z } from 'zod';

// Character stat example activity validation
export const characterStatExampleActivitySchema = z.object({
  description: z.string().min(1, 'Activity description is required').max(200, 'Activity description must be 200 characters or less'),
  suggestedXp: z.number().int().min(1, 'Suggested XP must be at least 1').max(1000, 'Suggested XP cannot exceed 1000'),
});

// Character stat creation validation
export const createCharacterStatSchema = z.object({
  name: z.string()
    .min(1, 'Stat name is required')
    .max(100, 'Stat name must be 100 characters or less'),
  description: z.string()
    .min(1, 'Stat description is required')
    .max(500, 'Stat description must be 500 characters or less'),
  exampleActivities: z.array(characterStatExampleActivitySchema)
    .min(1, 'At least one example activity is required')
    .max(10, 'Maximum 10 example activities allowed'),
});

// Character stat update validation
export const updateCharacterStatSchema = createCharacterStatSchema.partial();

// XP grant validation
export const grantXpSchema = z.object({
  statId: z.string().uuid('Invalid stat ID'),
  xpAmount: z.number().int().min(1, 'XP amount must be at least 1').max(1000, 'XP amount cannot exceed 1000'),
  sourceType: z.enum(['task', 'journal', 'adhoc', 'quest', 'experiment']),
  sourceId: z.string().uuid().optional(),
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
});

// Level up validation
export const levelUpSchema = z.object({
  statId: z.string().uuid('Invalid stat ID'),
});

// Bulk create predefined stats
export const createPredefinedStatsSchema = z.object({
  statNames: z.array(z.string()).min(1, 'At least one stat must be selected'),
});

// Query validation for stats endpoints
export const statsQuerySchema = z.object({
  includeXpHistory: z.string().optional().transform(val => val === 'true'),
  includeLevelTitles: z.string().optional().transform(val => val === 'true'),
});

export const xpHistoryQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50).pipe(z.number().int().min(1).max(100)),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0).pipe(z.number().int().min(0)),
});
