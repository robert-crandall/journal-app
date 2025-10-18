import { zodValidatorWithErrorHandler } from '../utils/validation';
import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { dailyQuestions } from '../db/schema';
import { jwtAuth } from '../middleware/auth';
import logger, { handleApiError } from '../utils/logger';
import { getTodaysDailyQuestion, markQuestionAsAnswered, getDailyQuestionById, getRecentDailyQuestions } from '../utils/dailyQuestionsService';
import { createDailyQuestionSchema, updateDailyQuestionSchema, dailyQuestionIdSchema, getTodayQuestionSchema } from '../validation/daily-questions';
import type {
  DailyQuestionResponse,
  GetTodayQuestionResponse,
  CreateDailyQuestionRequest,
  UpdateDailyQuestionRequest,
} from '../../../shared/types/daily-questions';

const app = new Hono();

// Apply auth middleware to all routes
app.use('*', jwtAuth);

/**
 * Get today's daily question (or generate if doesn't exist)
 * GET /daily-questions/today?date=YYYY-MM-DD (date is optional, defaults to today)
 */
app.get('/today', zodValidatorWithErrorHandler('query', getTodayQuestionSchema), async (c) => {
  try {
    const { date } = c.req.valid('query');
    const userId = c.var.userId;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const question = await getTodaysDailyQuestion(userId, targetDate);

    const response: GetTodayQuestionResponse = {
      question: question
        ? {
            id: question.id,
            questionText: question.questionText,
            dateAssigned: question.dateAssigned,
            answered: question.answered,
            contextSource: question.contextSource,
            createdAt: question.createdAt.toISOString(),
            updatedAt: question.updatedAt.toISOString(),
          }
        : null,
    };

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, "Failed to get today's daily question");
  }
});

/**
 * Mark a daily question as answered
 * PATCH /daily-questions/:id/answered
 */
app.patch('/:id/answered', zodValidatorWithErrorHandler('param', dailyQuestionIdSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const userId = c.var.userId;

    const success = await markQuestionAsAnswered(id, userId);

    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Question not found or could not be updated',
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: { answered: true },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to mark question as answered');
  }
});

/**
 * Get a specific daily question by ID
 * GET /daily-questions/:id
 */
app.get('/:id', zodValidatorWithErrorHandler('param', dailyQuestionIdSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const userId = c.var.userId;

    const question = await getDailyQuestionById(id, userId);

    if (!question) {
      return c.json(
        {
          success: false,
          error: 'Question not found',
        },
        404,
      );
    }

    const response: DailyQuestionResponse = {
      id: question.id,
      questionText: question.questionText,
      dateAssigned: question.dateAssigned,
      answered: question.answered,
      contextSource: question.contextSource,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get daily question');
  }
});

/**
 * Get recent daily questions for the user (for debugging/admin purposes)
 * GET /daily-questions?limit=10
 */
app.get('/', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);
    const userId = c.var.userId;

    const questions = await getRecentDailyQuestions(userId, limit);

    const response = questions.map((question) => ({
      id: question.id,
      questionText: question.questionText,
      dateAssigned: question.dateAssigned,
      answered: question.answered,
      contextSource: question.contextSource,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    }));

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get daily questions');
  }
});

/**
 * Create a daily question manually (for testing/admin purposes)
 * POST /daily-questions
 */
app.post('/', zodValidatorWithErrorHandler('json', createDailyQuestionSchema), async (c) => {
  try {
    const { questionText, dateAssigned, contextSource } = c.req.valid('json') as CreateDailyQuestionRequest;
    const userId = c.var.userId;

    // Check if a question already exists for this date
    const existingQuestion = await db
      .select()
      .from(dailyQuestions)
      .where(and(eq(dailyQuestions.userId, userId), eq(dailyQuestions.dateAssigned, dateAssigned)))
      .limit(1);

    if (existingQuestion.length > 0) {
      return c.json(
        {
          success: false,
          error: 'A question already exists for this date',
        },
        400,
      );
    }

    // Create new question
    const newQuestions = await db
      .insert(dailyQuestions)
      .values({
        userId,
        questionText,
        dateAssigned,
        answered: false,
        contextSource,
      })
      .returning();

    const question = newQuestions[0];
    const response: DailyQuestionResponse = {
      id: question.id,
      questionText: question.questionText,
      dateAssigned: question.dateAssigned,
      answered: question.answered,
      contextSource: question.contextSource,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };

    return c.json(
      {
        success: true,
        data: response,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, 'Failed to create daily question');
  }
});

export default app;
