import { Context } from 'hono';
import { db } from '../db';
import { quests, questMilestones } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { QuestInput, QuestMilestoneInput, ApiResponse, Quest, QuestMilestone } from '../types/api';

// Get all quests for the current user
export async function getQuests(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    
    const results = await db
      .select()
      .from(quests)
      .where(eq(quests.userId, currentUser.id))
      .orderBy(desc(quests.updatedAt));
    
    const response: ApiResponse<{ quests: Quest[] }> = {
      success: true,
      data: {
        quests: results.map((quest: any) => ({
          ...quest,
          createdAt: quest.createdAt.toISOString(),
          updatedAt: quest.updatedAt.toISOString(),
          completedAt: quest.completedAt ? quest.completedAt.toISOString() : null,
        })),
      },
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Get quests error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve quests' });
  }
}

// Get a specific quest by ID
export async function getQuestById(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const questId = c.req.param('id');
    
    // Get quest
    const questResult = await db
      .select()
      .from(quests)
      .where(
        and(
          eq(quests.id, questId),
          eq(quests.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (questResult.length === 0) {
      throw new HTTPException(404, { message: 'Quest not found' });
    }
    
    // Get milestones
    const milestonesResult = await db
      .select()
      .from(questMilestones)
      .where(eq(questMilestones.questId, questId))
      .orderBy(desc(questMilestones.createdAt));
    
    const quest = questResult[0];
    
    const response: ApiResponse<{ 
      quest: Quest; 
      milestones: QuestMilestone[];
    }> = {
      success: true,
      data: {
        quest: {
          ...quest,
          createdAt: quest.createdAt.toISOString(),
          updatedAt: quest.updatedAt.toISOString(),
          completedAt: quest.completedAt ? quest.completedAt.toISOString() : null,
        },
        milestones: milestonesResult.map((milestone: any) => ({
          ...milestone,
          createdAt: milestone.createdAt.toISOString(),
          updatedAt: milestone.updatedAt.toISOString(),
          completedAt: milestone.completedAt ? milestone.completedAt.toISOString() : null,
        })),
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get quest by ID error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve quest' });
  }
}

// Create a new quest
export async function createQuest(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as QuestInput;
    
    const result = await db.insert(quests).values({
      userId: currentUser.id,
      title: body.title,
      description: body.description || null,
      isActive: body.isActive ?? true,
    }).returning();
    
    const quest = result[0];
    
    const response: ApiResponse<{ quest: Quest }> = {
      success: true,
      data: {
        quest: {
          ...quest,
          createdAt: quest.createdAt.toISOString(),
          updatedAt: quest.updatedAt.toISOString(),
          completedAt: quest.completedAt ? quest.completedAt.toISOString() : null,
        },
      },
    };
    
    return c.json(response, 201);
  } catch (error) {
    console.error('Create quest error:', error);
    throw new HTTPException(500, { message: 'Failed to create quest' });
  }
}

// Update a quest
export async function updateQuest(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const questId = c.req.param('id');
    const body = await c.req.json() as QuestInput;
    
    // Check if quest exists and belongs to user
    const existingQuest = await db
      .select()
      .from(quests)
      .where(
        and(
          eq(quests.id, questId),
          eq(quests.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (existingQuest.length === 0) {
      throw new HTTPException(404, { message: 'Quest not found' });
    }
    
    // Update quest
    const result = await db
      .update(quests)
      .set({
        title: body.title,
        description: body.description || null,
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(quests.id, questId))
      .returning();
    
    const quest = result[0];
    
    const response: ApiResponse<{ quest: Quest }> = {
      success: true,
      data: {
        quest: {
          ...quest,
          createdAt: quest.createdAt.toISOString(),
          updatedAt: quest.updatedAt.toISOString(),
          completedAt: quest.completedAt ? quest.completedAt.toISOString() : null,
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update quest error:', error);
    throw new HTTPException(500, { message: 'Failed to update quest' });
  }
}

// Complete a quest
export async function completeQuest(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const questId = c.req.param('id');
    
    // Check if quest exists and belongs to user
    const existingQuest = await db
      .select()
      .from(quests)
      .where(
        and(
          eq(quests.id, questId),
          eq(quests.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (existingQuest.length === 0) {
      throw new HTTPException(404, { message: 'Quest not found' });
    }
    
    // Update quest
    const now = new Date();
    const result = await db
      .update(quests)
      .set({
        isActive: false,
        updatedAt: now,
        completedAt: now,
      })
      .where(eq(quests.id, questId))
      .returning();
    
    const quest = result[0];
    
    const response: ApiResponse<{ quest: Quest }> = {
      success: true,
      data: {
        quest: {
          ...quest,
          createdAt: quest.createdAt.toISOString(),
          updatedAt: quest.updatedAt.toISOString(),
          completedAt: quest.completedAt ? quest.completedAt.toISOString() : null,
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Complete quest error:', error);
    throw new HTTPException(500, { message: 'Failed to complete quest' });
  }
}

// Delete a quest
export async function deleteQuest(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const questId = c.req.param('id');
    
    // Check if quest exists and belongs to user
    const existingQuest = await db
      .select()
      .from(quests)
      .where(
        and(
          eq(quests.id, questId),
          eq(quests.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (existingQuest.length === 0) {
      throw new HTTPException(404, { message: 'Quest not found' });
    }
    
    // Delete quest (cascades to milestones)
    await db
      .delete(quests)
      .where(eq(quests.id, questId));
    
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete quest error:', error);
    throw new HTTPException(500, { message: 'Failed to delete quest' });
  }
}

// Create a quest milestone
export async function createQuestMilestone(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as QuestMilestoneInput;
    
    // Check if quest exists and belongs to user
    const questResult = await db
      .select()
      .from(quests)
      .where(
        and(
          eq(quests.id, body.questId),
          eq(quests.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (questResult.length === 0) {
      throw new HTTPException(404, { message: 'Quest not found' });
    }
    
    const result = await db.insert(questMilestones).values({
      questId: body.questId,
      title: body.title,
      description: body.description || null,
      isCompleted: body.isCompleted || false,
    }).returning();
    
    const milestone = result[0];
    
    const response: ApiResponse<{ milestone: QuestMilestone }> = {
      success: true,
      data: {
        milestone: {
          ...milestone,
          createdAt: milestone.createdAt.toISOString(),
          updatedAt: milestone.updatedAt.toISOString(),
          completedAt: milestone.completedAt ? milestone.completedAt.toISOString() : null,
        },
      },
    };
    
    return c.json(response, 201);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Create milestone error:', error);
    throw new HTTPException(500, { message: 'Failed to create milestone' });
  }
}

// Complete a milestone
export async function completeMilestone(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const milestoneId = c.req.param('id');
    
    // Get the milestone
    const milestoneResult = await db
      .select({
        milestone: questMilestones,
        quest: quests,
      })
      .from(questMilestones)
      .innerJoin(quests, eq(questMilestones.questId, quests.id))
      .where(
        and(
          eq(questMilestones.id, milestoneId),
          eq(quests.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (milestoneResult.length === 0) {
      throw new HTTPException(404, { message: 'Milestone not found' });
    }
    
    // Update milestone
    const now = new Date();
    const result = await db
      .update(questMilestones)
      .set({
        isCompleted: true,
        updatedAt: now,
        completedAt: now,
      })
      .where(eq(questMilestones.id, milestoneId))
      .returning();
    
    const milestone = result[0];
    
    const response: ApiResponse<{ milestone: QuestMilestone }> = {
      success: true,
      data: {
        milestone: {
          ...milestone,
          createdAt: milestone.createdAt.toISOString(),
          updatedAt: milestone.updatedAt.toISOString(),
          completedAt: milestone.completedAt ? milestone.completedAt.toISOString() : null,
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Complete milestone error:', error);
    throw new HTTPException(500, { message: 'Failed to complete milestone' });
  }
}
