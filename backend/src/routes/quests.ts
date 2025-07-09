import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../db/index';
import { quests } from '../db/schema';
import { jwtAuth } from '../middleware/auth';
import { 
  createQuestSchema,
  updateQuestSchema,
  completeQuestSchema,
  questsQuerySchema,
} from '../validation/quests';
import { 
  type Quest,
  type QuestWithRelations
} from '../types/quests';
import { handleApiError } from '../utils/logger';

const app = new Hono();

// Get all quests for user
app.get('/', jwtAuth, zValidator('query', questsQuerySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const query = c.req.valid('query');

    // Build where conditions
    const whereConditions = [eq(quests.userId, userId)];

    if (query.type) {
      whereConditions.push(eq(quests.type, query.type));
    }
    if (query.isCompleted !== undefined) {
      whereConditions.push(eq(quests.isCompleted, query.isCompleted));
    }
    if (query.isActive !== undefined) {
      whereConditions.push(eq(quests.isActive, query.isActive));
    }
    if (query.goalId) {
      whereConditions.push(eq(quests.goalId, query.goalId));
    }

    // Build the query with all conditions
    const userQuests = await db
      .select()
      .from(quests)
      .where(and(...whereConditions))
      .orderBy(desc(quests.isActive), asc(quests.startDate))
      .limit(query.limit || 100)
      .offset(query.offset || 0);

    return c.json({ success: true, data: userQuests });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch quests');
  }
});

// Get quest by ID
app.get('/:id', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const questId = c.req.param('id');

    const [quest] = await db
      .select()
      .from(quests)
      .where(and(eq(quests.id, questId), eq(quests.userId, userId)))
      .limit(1);

    if (!quest) {
      return c.json({ success: false, error: 'Quest not found' }, 404);
    }

    return c.json({ success: true, data: quest });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch quest');
  }
});

// Create new quest
app.post('/', jwtAuth, zValidator('json', createQuestSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const questData = c.req.valid('json');

    // Convert date strings to Date objects
    const processedData = {
      ...questData,
      userId,
      startDate: questData.startDate ? new Date(questData.startDate) : null,
      endDate: questData.endDate ? new Date(questData.endDate) : null,
    };

    const [newQuest] = await db
      .insert(quests)
      .values(processedData)
      .returning();

    return c.json({ success: true, data: newQuest }, 201);
  } catch (error) {
    return handleApiError(error, 'Failed to create quest');
  }
});

// Update quest
app.put('/:id', jwtAuth, zValidator('json', updateQuestSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const questId = c.req.param('id');
    const updateData = c.req.valid('json');

    // Check if quest exists and belongs to user
    const [existingQuest] = await db
      .select()
      .from(quests)
      .where(and(eq(quests.id, questId), eq(quests.userId, userId)))
      .limit(1);

    if (!existingQuest) {
      return c.json({ success: false, error: 'Quest not found' }, 404);
    }

    // Process date strings to Date objects
    const processedUpdateData = {
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
      endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      updatedAt: new Date(),
    };

    const [updatedQuest] = await db
      .update(quests)
      .set(processedUpdateData)
      .where(eq(quests.id, questId))
      .returning();

    return c.json({ success: true, data: updatedQuest });
  } catch (error) {
    return handleApiError(error, 'Failed to update quest');
  }
});

// Complete quest with conclusion
app.post('/:id/complete', jwtAuth, zValidator('json', completeQuestSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const questId = c.req.param('id');
    const { conclusion } = c.req.valid('json');

    // Check if quest exists and belongs to user
    const [quest] = await db
      .select()
      .from(quests)
      .where(and(eq(quests.id, questId), eq(quests.userId, userId)))
      .limit(1);

    if (!quest) {
      return c.json({ success: false, error: 'Quest not found' }, 404);
    }

    if (quest.isCompleted) {
      return c.json({ success: false, error: 'Quest already completed' }, 400);
    }

    // Mark quest as completed
    const [updatedQuest] = await db
      .update(quests)
      .set({
        isCompleted: true,
        isActive: false,
        completedAt: new Date(),
        conclusion,
        updatedAt: new Date(),
      })
      .where(eq(quests.id, questId))
      .returning();

    return c.json({ 
      success: true, 
      data: updatedQuest,
      message: `Quest completed: ${quest.title}`
    });
  } catch (error) {
    return handleApiError(error, 'Failed to complete quest');
  }
});

export default app;
