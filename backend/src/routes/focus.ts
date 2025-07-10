import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { focuses } from '../db/schema/focus';
import { eq, and } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { HTTPException } from 'hono/http-exception';
import { createFocusSchema, updateFocusSchema, batchUpdateFocusesSchema } from '../validation/focus';
import logger, { handleApiError } from '../utils/logger';

// Chain methods for RPC compatibility
const app = new Hono()
  // Get all focuses for the current user
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      
      const userFocuses = await db
        .select()
        .from(focuses)
        .where(eq(focuses.userId, userId))
        .orderBy(focuses.dayOfWeek);
      
      return c.json({ success: true, data: userFocuses });
    } catch (error) {
      return handleApiError(error, 'Failed to get focuses');
    }
  })

  // Get a specific focus by dayOfWeek
  .get('/:dayOfWeek', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const dayOfWeek = parseInt(c.req.param('dayOfWeek'), 10);

      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return c.json(
          { 
            success: false, 
            error: 'Invalid day of week. Must be between 0 (Sunday) and 6 (Saturday)' 
          },
          400
        );
      }

      const userFocus = await db
        .select()
        .from(focuses)
        .where(and(
          eq(focuses.userId, userId),
          eq(focuses.dayOfWeek, dayOfWeek)
        ))
        .limit(1);

      if (userFocus.length === 0) {
        return c.json(
          { 
            success: false, 
            error: 'Focus not found for this day of week' 
          },
          404
        );
      }

      return c.json({ success: true, data: userFocus[0] });
    } catch (error) {
      return handleApiError(error, 'Failed to get focus');
    }
  })

  // Create or update focus for a specific day
  .put('/:dayOfWeek', jwtAuth, zValidator('json', createFocusSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const dayOfWeek = parseInt(c.req.param('dayOfWeek'), 10);
      const data = c.req.valid('json');
      
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return c.json(
          { 
            success: false, 
            error: 'Invalid day of week. Must be between 0 (Sunday) and 6 (Saturday)' 
          },
          400
        );
      }

      // First, check if a focus for this day already exists
      const existingFocus = await db
        .select()
        .from(focuses)
        .where(and(
          eq(focuses.userId, userId),
          eq(focuses.dayOfWeek, dayOfWeek)
        ))
        .limit(1);

      let result;

      if (existingFocus.length > 0) {
        // Update existing focus
        result = await db
          .update(focuses)
          .set({
            title: data.title,
            description: data.description,
            updatedAt: new Date(),
          })
          .where(eq(focuses.id, existingFocus[0].id))
          .returning();
      } else {
        // Create new focus
        result = await db
          .insert(focuses)
          .values({
            userId,
            dayOfWeek: data.dayOfWeek,
            title: data.title,
            description: data.description,
          })
          .returning();
      }

      return c.json({ success: true, data: result[0] });
    } catch (error) {
      return handleApiError(error, 'Failed to create or update focus');
    }
  })

  // Batch update multiple focuses at once
  .post('/batch', jwtAuth, zValidator('json', batchUpdateFocusesSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const batchFocuses = c.req.valid('json');

      const results = [];

      // Process each focus in the batch
      for (const focusData of batchFocuses) {
        const existingFocus = await db
          .select()
          .from(focuses)
          .where(and(
            eq(focuses.userId, userId),
            eq(focuses.dayOfWeek, focusData.dayOfWeek)
          ))
          .limit(1);

        let result;

        if (existingFocus.length > 0) {
          // Update existing focus
          result = await db
            .update(focuses)
            .set({
              title: focusData.title,
              description: focusData.description,
              updatedAt: new Date(),
            })
            .where(eq(focuses.id, existingFocus[0].id))
            .returning();
        } else {
          // Create new focus
          result = await db
            .insert(focuses)
            .values({
              userId,
              dayOfWeek: focusData.dayOfWeek,
              title: focusData.title,
              description: focusData.description,
            })
            .returning();
        }

        results.push(result[0]);
      }

      return c.json({ success: true, data: results });
    } catch (error) {
      return handleApiError(error, 'Failed to batch update focuses');
    }
  })

  // Delete a focus
  .delete('/:dayOfWeek', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const dayOfWeek = parseInt(c.req.param('dayOfWeek'), 10);

      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return c.json(
          { 
            success: false, 
            error: 'Invalid day of week. Must be between 0 (Sunday) and 6 (Saturday)' 
          },
          400
        );
      }

      // First, check if the focus exists
      const existingFocus = await db
        .select()
        .from(focuses)
        .where(and(
          eq(focuses.userId, userId),
          eq(focuses.dayOfWeek, dayOfWeek)
        ))
        .limit(1);

      if (existingFocus.length === 0) {
        return c.json(
          { 
            success: false, 
            error: 'Focus not found for this day of week' 
          },
          404
        );
      }

      // Delete the focus
      await db
        .delete(focuses)
        .where(eq(focuses.id, existingFocus[0].id));

      return c.json({ success: true });
    } catch (error) {
      return handleApiError(error, 'Failed to delete focus');
    }
  });

export default app;
