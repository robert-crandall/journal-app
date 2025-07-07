import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { familyMembers, familyTaskFeedback } from '../db/schema/family';
import { jwtAuth } from '../middleware/auth';
import {
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
  createFamilyTaskFeedbackSchema,
  updateFamilyTaskFeedbackSchema,
  familyQuerySchema,
  familyFeedbackQuerySchema,
} from '../validation/family';
import type { CreateFamilyMemberRequest, UpdateFamilyMemberRequest, CreateFamilyTaskFeedbackRequest } from '../types/family';
import logger, { handleApiError } from '../utils/logger';

const app = new Hono();

// GET /family - Get all family members for the authenticated user
app.get('/', jwtAuth, zValidator('query', familyQuerySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { includeFeedback } = c.req.valid('query');

    const userFamilyMembers = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId)).orderBy(familyMembers.name);

    let result = userFamilyMembers;

    // If requested, include recent feedback for each family member
    if (includeFeedback) {
      const familyMemberIds = userFamilyMembers.map((fm) => fm.id);

      if (familyMemberIds.length > 0) {
        const recentFeedback = await db
          .select()
          .from(familyTaskFeedback)
          .where(
            and(
              eq(familyTaskFeedback.userId, userId),
              // Only get most recent feedback per family member
            ),
          )
          .orderBy(desc(familyTaskFeedback.completedAt))
          .limit(familyMemberIds.length * 3); // 3 most recent per member

        // Group feedback by family member
        const feedbackByMember = recentFeedback.reduce(
          (acc, feedback) => {
            if (!acc[feedback.familyMemberId]) {
              acc[feedback.familyMemberId] = [];
            }
            acc[feedback.familyMemberId].push(feedback);
            return acc;
          },
          {} as Record<string, typeof recentFeedback>,
        );

        result = userFamilyMembers.map((member) => ({
          ...member,
          recentFeedback: feedbackByMember[member.id] || [],
        }));
      }
    }

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch family members');
  }
});

// POST /family - Create a new family member
app.post('/', jwtAuth, zValidator('json', createFamilyMemberSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const data = c.req.valid('json') as CreateFamilyMemberRequest;

    const newFamilyMember = await db
      .insert(familyMembers)
      .values({
        userId,
        name: data.name,
        relationship: data.relationship,
        birthday: data.birthday || null,
        likes: data.likes || null,
        dislikes: data.dislikes || null,
        energyLevel: data.energyLevel,
        connectionXp: 0,
        connectionLevel: 1,
        notes: data.notes || null,
      })
      .returning();

    logger.info(`Family member created: ${newFamilyMember[0].name} (${newFamilyMember[0].relationship})`);

    return c.json(
      {
        success: true,
        data: newFamilyMember[0],
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, 'Failed to create family member');
  }
});

// GET /family/:id - Get a specific family member
app.get('/:id', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const familyMemberId = c.req.param('id');

    const familyMember = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
      .limit(1);

    if (familyMember.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Family member not found',
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: familyMember[0],
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch family member');
  }
});

// PUT /family/:id - Update a family member
app.put('/:id', jwtAuth, zValidator('json', updateFamilyMemberSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const familyMemberId = c.req.param('id');
    const data = c.req.valid('json') as UpdateFamilyMemberRequest;

    // Check if family member exists and belongs to user
    const existingMember = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
      .limit(1);

    if (existingMember.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Family member not found',
        },
        404,
      );
    }

    const updatedMember = await db
      .update(familyMembers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
      .returning();

    logger.info(`Family member updated: ${updatedMember[0].name} (${updatedMember[0].relationship})`);

    return c.json({
      success: true,
      data: updatedMember[0],
    });
  } catch (error) {
    return handleApiError(error, 'Failed to update family member');
  }
});

// DELETE /family/:id - Delete a family member
app.delete('/:id', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const familyMemberId = c.req.param('id');

    // Check if family member exists and belongs to user
    const existingMember = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
      .limit(1);

    if (existingMember.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Family member not found',
        },
        404,
      );
    }

    // Delete associated feedback first
    await db.delete(familyTaskFeedback).where(and(eq(familyTaskFeedback.familyMemberId, familyMemberId), eq(familyTaskFeedback.userId, userId)));

    // Delete the family member
    await db.delete(familyMembers).where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)));

    logger.info(`Family member deleted: ${existingMember[0].name} (${existingMember[0].relationship})`);

    return c.json({
      success: true,
      data: { message: 'Family member deleted successfully' },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to delete family member');
  }
});

// POST /family/:id/feedback - Add task feedback for a family member
app.post('/:id/feedback', jwtAuth, zValidator('json', createFamilyTaskFeedbackSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const familyMemberId = c.req.param('id');
    const data = c.req.valid('json') as CreateFamilyTaskFeedbackRequest;

    // Verify family member exists and belongs to user
    const familyMember = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
      .limit(1);

    if (familyMember.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Family member not found',
        },
        404,
      );
    }

    // Calculate XP based on feedback
    const baseXp = 10; // Base XP for completing a task
    const enjoymentBonus = data.enjoyedIt === 'yes' ? 5 : 0;
    const xpGranted = baseXp + enjoymentBonus;

    // Create the feedback record
    const newFeedback = await db
      .insert(familyTaskFeedback)
      .values({
        userId,
        familyMemberId,
        taskDescription: data.taskDescription,
        feedback: data.feedback || null,
        enjoyedIt: data.enjoyedIt || null,
        notes: data.notes || null,
        xpGranted,
      })
      .returning();

    // Calculate new level based on XP
    const newXp = familyMember[0].connectionXp + xpGranted;
    const newLevel = Math.floor(newXp / 100) + 1; // Level up every 100 XP

    // Update the family member's XP, level, and last interaction date
    await db
      .update(familyMembers)
      .set({
        connectionXp: newXp,
        connectionLevel: newLevel,
        lastInteractionDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, familyMemberId));

    logger.info(`Family task feedback added for ${familyMember[0].name}: ${data.taskDescription}`);

    return c.json(
      {
        success: true,
        data: newFeedback[0],
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, 'Failed to add family task feedback');
  }
});

// GET /family/:id/feedback - Get feedback history for a family member
app.get('/:id/feedback', jwtAuth, zValidator('query', familyFeedbackQuerySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const familyMemberId = c.req.param('id');
    const { limit } = c.req.valid('query');

    // Verify family member exists and belongs to user
    const familyMember = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
      .limit(1);

    if (familyMember.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Family member not found',
        },
        404,
      );
    }

    const feedback = await db
      .select()
      .from(familyTaskFeedback)
      .where(and(eq(familyTaskFeedback.familyMemberId, familyMemberId), eq(familyTaskFeedback.userId, userId)))
      .orderBy(desc(familyTaskFeedback.completedAt))
      .limit(limit);

    return c.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch family task feedback');
  }
});

// GET /family/feedback - Get all family task feedback
app.get('/feedback', jwtAuth, zValidator('query', familyFeedbackQuerySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { familyMemberId, limit } = c.req.valid('query');

    const conditions = [eq(familyTaskFeedback.userId, userId)];

    // Filter by family member if specified
    if (familyMemberId) {
      conditions.push(eq(familyTaskFeedback.familyMemberId, familyMemberId));
    }

    const feedback = await db
      .select({
        id: familyTaskFeedback.id,
        familyMemberId: familyTaskFeedback.familyMemberId,
        taskDescription: familyTaskFeedback.taskDescription,
        feedback: familyTaskFeedback.feedback,
        enjoyedIt: familyTaskFeedback.enjoyedIt,
        notes: familyTaskFeedback.notes,
        completedAt: familyTaskFeedback.completedAt,
        createdAt: familyTaskFeedback.createdAt,
        familyMemberName: familyMembers.name,
        familyMemberRelationship: familyMembers.relationship,
      })
      .from(familyTaskFeedback)
      .innerJoin(familyMembers, eq(familyTaskFeedback.familyMemberId, familyMembers.id))
      .where(and(...conditions))
      .orderBy(desc(familyTaskFeedback.completedAt))
      .limit(limit);

    return c.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch family task feedback');
  }
});

export default app;
