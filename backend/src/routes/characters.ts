import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { characters } from '../db/schema/characters';
import { createCharacterSchema, updateCharacterSchema } from '../validation/characters';
import { HTTPException } from 'hono/http-exception';
import { handleApiError } from '../utils/logger';

// Chain methods for RPC compatibility
const app = new Hono()
  // Get user's character
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const character = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);

      if (character.length === 0) {
        return c.json({
          success: true,
          data: null,
        });
      }

      return c.json({
        success: true,
        data: character[0],
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch character');
      return; // This should never be reached, but added for completeness
    }
  })

  // Create a new character
  .post('/', jwtAuth, zValidator('json', createCharacterSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json');

      // Check if user already has a character
      const existingCharacter = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);

      if (existingCharacter.length > 0) {
        return c.json(
          {
            success: false,
            error: 'User already has a character',
          },
          400,
        );
      }

      const newCharacter = await db
        .insert(characters)
        .values({
          userId,
          name: data.name,
          characterClass: data.characterClass,
          backstory: data.backstory,
          goals: data.goals,
          motto: data.motto,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: newCharacter[0],
        },
        201,
      );
    } catch (error) {
      handleApiError(error, 'Failed to create character');
      return; // This should never be reached, but added for completeness
    }
  })

  // Update user's character
  .put('/', jwtAuth, zValidator('json', updateCharacterSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json');

      // Check if character exists
      const existingCharacter = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);

      if (existingCharacter.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Character not found',
          },
          404,
        );
      }

      const updatedCharacter = await db
        .update(characters)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(characters.userId, userId))
        .returning();

      return c.json({
        success: true,
        data: updatedCharacter[0],
      });
    } catch (error) {
      handleApiError(error, 'Failed to update character');
      return; // This should never be reached, but added for completeness
    }
  })

  // Delete user's character
  .delete('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const deletedCharacter = await db.delete(characters).where(eq(characters.userId, userId)).returning();

      if (deletedCharacter.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Character not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: deletedCharacter[0],
      });
    } catch (error) {
      handleApiError(error, 'Failed to delete character');
      return; // This should never be reached, but added for completeness
    }
  });

export default app;
