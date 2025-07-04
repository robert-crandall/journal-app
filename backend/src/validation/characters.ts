import { z } from 'zod';

export const createCharacterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  characterClass: z.string().min(1, 'Character class is required').max(100, 'Character class must be 100 characters or less'),
  motto: z.string().max(255, 'Motto must be 255 characters or less').optional(),
  backstory: z.string().optional(),
  goals: z.string().optional(),
});

export const updateCharacterSchema = createCharacterSchema.partial();
