import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { dailyIntents } from '../db/schema';
import { jwtAuth } from '../middleware/auth';
import logger, { handleApiError } from '../utils/logger';

const app = new Hono();

// Apply auth middleware to all routes
app.use('*', jwtAuth);

// Schema for creating/updating daily intent
const dailyIntentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  importanceStatement: z.string().min(1, 'Importance statement is required').max(1000, 'Importance statement is too long'),
});

/**
 * Create or update a daily intent
 * POST /daily-intents
 */
app.post('/', zValidator('json', dailyIntentSchema), async (c) => {
  try {
    const { date, importanceStatement } = c.req.valid('json');
    const userId = c.var.userId;

    logger.info(`Creating/updating daily intent for user ${userId} on ${date}`);

    // Check if an intent already exists for this date
    const existingIntent = await db
      .select()
      .from(dailyIntents)
      .where(and(eq(dailyIntents.userId, userId), eq(dailyIntents.date, date)))
      .limit(1);

    if (existingIntent.length > 0) {
      // Update existing intent
      await db
        .update(dailyIntents)
        .set({
          importanceStatement,
          updatedAt: new Date(),
        })
        .where(and(eq(dailyIntents.userId, userId), eq(dailyIntents.date, date)));

      logger.info(`Updated daily intent for user ${userId} on ${date}`);
    } else {
      // Create new intent
      await db.insert(dailyIntents).values({
        userId,
        date,
        importanceStatement,
      });

      logger.info(`Created daily intent for user ${userId} on ${date}`);
    }

    // Return the updated/created intent
    const intent = await db
      .select()
      .from(dailyIntents)
      .where(and(eq(dailyIntents.userId, userId), eq(dailyIntents.date, date)))
      .limit(1);

    return c.json(
      {
        success: true,
        data: intent[0],
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, 'Failed to create/update daily intent');
  }
});

/**
 * Get daily intent for a specific date
 * GET /daily-intents/:date
 */
app.get('/:date', async (c) => {
  try {
    const date = c.req.param('date');
    const userId = c.var.userId;

    // Validate date format - first check if it looks like a date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json(
        {
          success: false,
          error: 'Date must be in YYYY-MM-DD format',
        },
        400,
      );
    }

    logger.info(`Getting daily intent for user ${userId} on ${date}`);

    const intent = await db
      .select()
      .from(dailyIntents)
      .where(and(eq(dailyIntents.userId, userId), eq(dailyIntents.date, date)))
      .limit(1);

    return c.json({
      success: true,
      data: intent[0] || null,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get daily intent');
  }
});

/**
 * Get recent daily intents for the user
 * GET /daily-intents?limit=10
 */
app.get('/', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);
    const userId = c.var.userId;

    logger.info(`Getting recent daily intents for user ${userId}, limit: ${limit}`);

    const intents = await db
      .select()
      .from(dailyIntents)
      .where(eq(dailyIntents.userId, userId))
      .orderBy(dailyIntents.date)
      .limit(limit);

    return c.json({
      success: true,
      data: intents,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get daily intents');
  }
});

export default app;
