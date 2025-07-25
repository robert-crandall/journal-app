import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { dailyIntents, simpleTodos, characters, goals, familyMembers, focuses, plans, quests, experiments, characterStats } from '../db/schema';
import { jwtAuth } from '../middleware/auth';
import logger, { handleApiError } from '../utils/logger';
import { generateDailyTasks, type TaskGenerationRequest, type TaskGenerationResponse } from '../utils/gpt/taskGen';
import { WeatherService } from '../services/weatherService';

const app = new Hono();

// Apply auth middleware to all routes
app.use('*', jwtAuth);

// Schema for task generation request
const taskGenerationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  includeIntent: z.boolean().optional().default(true),
});

/**
 * Generate daily tasks using GPT
 * POST /generate-tasks
 */
app.post('/', zValidator('json', taskGenerationSchema), async (c) => {
  try {
    const { date, includeIntent } = c.req.valid('json');
    const userId = c.var.userId;

    // Get user character information
    const character = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);

    // Get user goals
    const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));

    // Get family members
    const family = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId));

    // Get today's focus (based on day of week)
    const [year, month, day] = date.split('-').map(Number);
    const today = new Date(year, month - 1, day); // month is 0-based
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const focus = await db
      .select()
      .from(focuses)
      .where(and(eq(focuses.userId, userId), eq(focuses.dayOfWeek, dayOfWeek)))
      .limit(1);

    // Get active plans that align with today's focus
    const activePlans = await db
      .select({
        id: plans.id,
        title: plans.title,
        type: plans.type,
        description: plans.description,
      })
      .from(plans)
      .where(focus.length > 0 ? and(eq(plans.userId, userId), eq(plans.focusId, focus[0].id)) : eq(plans.userId, userId))
      .limit(10);

    // Get active quests
    const activeQuests = await db
      .select()
      .from(quests)
      .where(and(eq(quests.userId, userId), eq(quests.status, 'active')));

    // Get daily intent if requested
    let dailyIntent: string | undefined;
    if (includeIntent) {
      const intent = await db
        .select()
        .from(dailyIntents)
        .where(and(eq(dailyIntents.userId, userId), eq(dailyIntents.date, date)))
        .limit(1);

      if (intent.length > 0) {
        dailyIntent = intent[0].importanceStatement;
      }
    }

    // Get weather for today
    let weather;
    try {
      weather = await WeatherService.getWeather(date);
    } catch (error) {
      logger.warn('Failed to get weather data', { error });
      weather = undefined;
    }

    // Prepare task generation request
    const taskGenRequest: TaskGenerationRequest = {
      userId,
      characterClass: character[0]?.characterClass || undefined,
      backstory: character[0]?.backstory || undefined,
      dailyIntent: dailyIntent,
      currentFocus: focus[0]?.title + (focus[0]?.description ? `: ${focus[0].description}` : ''),
      activeQuests: activeQuests.map((quest) => ({
        id: quest.id,
        title: quest.title,
        description: quest.summary || '',
      })),
      activeProjects: activePlans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        description: plan.description || '',
        type: plan.type as 'project' | 'adventure',
      })),
      familyMembers: family.map((member) => ({
        id: member.id,
        name: member.name,
        relationship: member.relationship,
        likes: member.likes ? member.likes.split(',').map((item) => item.trim()) : [],
        dislikes: member.dislikes ? member.dislikes.split(',').map((item) => item.trim()) : [],
        lastActivityDate: member.lastInteractionDate?.toISOString(),
        lastActivityFeedback: undefined, // Not implemented yet
      })),
      weather: weather
        ? {
            temperature: weather.highTempF,
            condition: weather.shortForecast,
            forecast: weather.detailedForecast,
          }
        : undefined,
    };

    // Generate tasks using GPT
    const generatedTasks = await generateDailyTasks(taskGenRequest);

    // Calculate expiration time (midnight of the next day)
    const expirationTime = new Date(date);
    expirationTime.setDate(expirationTime.getDate() + 1);
    expirationTime.setHours(0, 0, 0, 0);

    // Save generated tasks to simple_todos
    const personalTodoData = {
      userId,
      description: `${generatedTasks.personalTask.title}: ${generatedTasks.personalTask.description}`,
      source: 'gpt:dm' as const,
      expirationTime,
    };

    const familyTodoData = {
      userId,
      description: `${generatedTasks.familyTask.title}: ${generatedTasks.familyTask.description}`,
      source: 'gpt:dm' as const,
      expirationTime,
    };

    // Insert both tasks
    const [personalTodo] = await db.insert(simpleTodos).values(personalTodoData).returning();
    const [familyTodo] = await db.insert(simpleTodos).values(familyTodoData).returning();

    logger.info(`Generated and saved daily tasks for user ${userId} on ${date}`);

    return c.json({
      success: true,
      data: {
        personalTask: {
          ...generatedTasks.personalTask,
          todoId: personalTodo.id,
        },
        familyTask: {
          ...generatedTasks.familyTask,
          todoId: familyTodo.id,
        },
        metadata: {
          date,
          includedIntent: !!dailyIntent,
          intentStatement: dailyIntent,
          characterClass: character[0]?.characterClass,
          currentFocus: focus[0]?.title,
          questsCount: activeQuests.length,
          plansCount: activePlans.length,
          familyCount: family.length,
          hasWeather: !!weather,
        },
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to generate daily tasks');
  }
});

/**
 * Get generated tasks for a specific date
 * GET /generate-tasks/:date
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

    // Get tasks generated for this date
    // Note: Tasks for date X have expirationTime of midnight of X+1
    const targetExpirationTime = new Date(date);
    targetExpirationTime.setDate(targetExpirationTime.getDate() + 1);
    targetExpirationTime.setHours(0, 0, 0, 0);

    const tasks = await db
      .select()
      .from(simpleTodos)
      .where(and(eq(simpleTodos.userId, userId), eq(simpleTodos.source, 'gpt:dm'), eq(simpleTodos.expirationTime, targetExpirationTime)))
      .orderBy(desc(simpleTodos.createdAt));

    // Get daily intent for this date
    const intent = await db
      .select()
      .from(dailyIntents)
      .where(and(eq(dailyIntents.userId, userId), eq(dailyIntents.date, date)))
      .limit(1);

    return c.json({
      success: true,
      data: {
        date,
        tasks: tasks,
        intent: intent[0] || null,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get generated tasks');
  }
});

export default app;
