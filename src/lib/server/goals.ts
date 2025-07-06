import { db } from './db';
import { goals } from './db/schema';
import { eq, and } from 'drizzle-orm';
import type { Goal } from './db/schema';

export interface GoalInput {
  title: string;
  description?: string;
  tags?: string[];
}

/**
 * Get all goals for a user
 */
export async function getUserGoals(userId: string): Promise<Goal[]> {
  return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(goals.createdAt);
}

/**
 * Get active goals for a user (not archived)
 */
export async function getActiveGoals(userId: string): Promise<Goal[]> {
  return await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.archived, 0)))
    .orderBy(goals.createdAt);
}

/**
 * Create a new goal
 */
export async function createGoal(userId: string, goalData: GoalInput): Promise<Goal> {
  const [newGoal] = await db
    .insert(goals)
    .values({
      userId,
      title: goalData.title.trim(),
      description: goalData.description?.trim() || null,
      tags: goalData.tags || [],
      active: 1,
      archived: 0,
    })
    .returning();

  return newGoal;
}

/**
 * Update a goal
 */
export async function updateGoal(goalId: string, userId: string, goalData: Partial<GoalInput>): Promise<Goal | null> {
  const [updatedGoal] = await db
    .update(goals)
    .set({
      ...(goalData.title && { title: goalData.title.trim() }),
      ...(goalData.description !== undefined && { description: goalData.description?.trim() || null }),
      ...(goalData.tags && { tags: goalData.tags }),
      updatedAt: new Date(),
    })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();

  return updatedGoal || null;
}

/**
 * Toggle goal active status
 */
export async function toggleGoalActive(goalId: string, userId: string): Promise<Goal | null> {
  // First get the current goal to toggle its active state
  const [currentGoal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);

  if (!currentGoal) {
    return null;
  }

  const [updatedGoal] = await db
    .update(goals)
    .set({
      active: currentGoal.active === 1 ? 0 : 1,
      updatedAt: new Date(),
    })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();

  return updatedGoal || null;
}

/**
 * Archive a goal
 */
export async function archiveGoal(goalId: string, userId: string): Promise<Goal | null> {
  const [archivedGoal] = await db
    .update(goals)
    .set({
      archived: 1,
      active: 0,
      updatedAt: new Date(),
    })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();

  return archivedGoal || null;
}

/**
 * Unarchive a goal
 */
export async function unarchiveGoal(goalId: string, userId: string): Promise<Goal | null> {
  const [unarchivedGoal] = await db
    .update(goals)
    .set({
      archived: 0,
      active: 1,
      updatedAt: new Date(),
    })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();

  return unarchivedGoal || null;
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();

  return result.length > 0;
}

/**
 * Get a single goal by ID
 */
export async function getGoalById(goalId: string, userId: string): Promise<Goal | null> {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);

  return goal || null;
}
