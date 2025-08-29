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
  xpHistoryQuerySchema,
} from '../validation/family';
import type { CreateFamilyMemberRequest, UpdateFamilyMemberRequest, CreateFamilyTaskFeedbackRequest } from '../../../shared/types/family';
import type { XpGrantFilter, XpSourceType } from '../../../shared/types/xp';
import logger, { handleApiError } from '../utils/logger';
import { grantXp, getXpGrantsWithEntityInfo } from '../utils/xpService';
import { z } from 'zod';
import { createAvatarSchema } from '../utils/avatar';

const app = new Hono();

// GET /family - Get all family members for the authenticated user
app.get('/', jwtAuth, zValidator('query', familyQuerySchema as any), async (c) => {
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
app.post('/', jwtAuth, zValidator('json', createFamilyMemberSchema as any), async (c) => {
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
        connectionXp: 0,
        connectionLevel: 1,
        notes: data.notes || null,
        avatar: data.avatar || null,
      })
      .returning();

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
app.put('/:id', jwtAuth, zValidator('json', updateFamilyMemberSchema as any), async (c) => {
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

    return c.json({
      success: true,
      data: { message: 'Family member deleted successfully' },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to delete family member');
  }
});

// PATCH /family/:id/avatar - Update/remove family member avatar
app.patch('/:id/avatar', jwtAuth, zValidator('json', z.object(createAvatarSchema()) as any), async (c) => {
  try {
    const userId = c.get('userId');
    const familyMemberId = c.req.param('id');
    const data = c.req.valid('json');

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
        avatar: data.avatar || null,
        updatedAt: new Date(),
      })
      .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
      .returning();

    return c.json({
      success: true,
      data: updatedMember[0],
    });
  } catch (error) {
    return handleApiError(error, 'Failed to update family member avatar');
  }
});

// POST /family/:id/feedback - Add task feedback for a family member
app.post('/:id/feedback', jwtAuth, zValidator('json', createFamilyTaskFeedbackSchema as any), async (c) => {
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

    // Grant XP to the family member using the service
    await grantXp(userId, {
      entityType: 'family_member',
      entityId: familyMemberId,
      xpAmount: xpGranted,
      sourceType: 'interaction',
      sourceId: newFeedback[0].id,
      reason: `Family task: ${data.taskDescription}`,
    });

    // Update last interaction date
    await db
      .update(familyMembers)
      .set({
        lastInteractionDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, familyMemberId));

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
app.get('/:id/feedback', jwtAuth, zValidator('query', familyFeedbackQuerySchema as any), async (c) => {
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
app.get('/feedback', jwtAuth, zValidator('query', familyFeedbackQuerySchema as any), async (c) => {
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

// GET /family/:id/xp-history - Get XP history for a specific family member
app.get('/:id/xp-history', jwtAuth, zValidator('query', xpHistoryQuerySchema as any), async (c) => {
  try {
    const userId = c.get('userId');
    const familyMemberId = c.req.param('id');
    const { limit, offset, sourceType } = c.req.valid('query');

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

    // Get XP history for this family member with filter options
    const filter: XpGrantFilter = {
      entityType: 'family_member',
      entityId: familyMemberId,
      limit,
      offset,
    };

    // Add source type filter if provided
    if (sourceType) {
      filter.sourceType = sourceType as XpSourceType;
    }

    const xpHistory = await getXpGrantsWithEntityInfo(userId, filter);

    return c.json({
      success: true,
      data: xpHistory,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch family member XP history');
  }
});

export default app;
