import { z } from 'zod';

// Family member validation schemas
export const createFamilyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  relationship: z.string().min(1, 'Relationship is required').max(100, 'Relationship must be 100 characters or less'),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be in YYYY-MM-DD format').optional(),
  likes: z.string().max(1000, 'Likes must be 1000 characters or less').optional(),
  dislikes: z.string().max(1000, 'Dislikes must be 1000 characters or less').optional(),
  energyLevel: z.number().int().min(1).max(100).default(50),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

export const updateFamilyMemberSchema = createFamilyMemberSchema.partial();

// Family task feedback validation schemas
export const createFamilyTaskFeedbackSchema = z.object({
  familyMemberId: z.string().uuid('Invalid family member ID'),
  taskDescription: z.string().min(1, 'Task description is required').max(500, 'Task description must be 500 characters or less'),
  feedback: z.string().max(1000, 'Feedback must be 1000 characters or less').optional(),
  enjoyedIt: z.enum(['yes', 'no']).optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

export const updateFamilyTaskFeedbackSchema = createFamilyTaskFeedbackSchema.partial().omit({ familyMemberId: true });

// Query validation for family endpoints
export const familyQuerySchema = z.object({
  includeFeedback: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const familyFeedbackQuerySchema = z.object({
  familyMemberId: z.string().uuid('Invalid family member ID').optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
});
