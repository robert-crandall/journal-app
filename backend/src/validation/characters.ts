import { z } from 'zod';

export const createCharacterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  characterClass: z.string().max(100, 'Character class must be 100 characters or less').optional(),
  backstory: z.string().optional(),
  goals: z.string().optional(),
  motto: z.string().max(200, 'Motto must be 200 characters or less').optional(),
});

export const updateCharacterSchema = createCharacterSchema.partial();
