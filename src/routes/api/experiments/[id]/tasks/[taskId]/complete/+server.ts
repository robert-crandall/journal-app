import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { experimentTask, experiment, taskCompletion, characterStat } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateLevel, calculateLevelProgress, calculateXpToNextLevel } from '$lib/utils/xp';

export async function POST({ params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const taskId = params.taskId;
    if (!taskId) {
      return json({ error: 'Task ID is required' }, { status: 400 });
    }

    // First verify the task and experiment belong to the user
    const [taskWithExp] = await db
      .select({
        task: experimentTask,
        exp: experiment
      })
      .from(experimentTask)
      .innerJoin(experiment, eq(experimentTask.experimentId, experiment.id))
      .where(and(
        eq(experimentTask.id, taskId),
        eq(experiment.userId, locals.user.id),
        eq(experiment.isActive, true) // Only allow completing tasks for active experiments
      ))
      .limit(1);

    if (!taskWithExp) {
      return json({ error: 'Task not found or experiment is not active' }, { status: 404 });
    }

    // Create task completion
    const [newCompletion] = await db
      .insert(taskCompletion)
      .values({
        taskId,
        userId: locals.user.id,
        completedAt: new Date()
      })
      .returning();

    // Award XP to character stats if defined
    const xpRewards = taskWithExp.task.xpRewards || {};
    const updatePromises = Object.entries(xpRewards).map(async ([statId, xpAmount]) => {
      // Verify this stat belongs to the user
      const [stat] = await db
        .select()
        .from(characterStat)
        .where(and(
          eq(characterStat.id, statId),
          eq(characterStat.userId, locals.user!.id)
        ))
        .limit(1);

      if (!stat) return null;

      // Update XP
      const currentXp = stat.currentXp || 0;
      const newXp = currentXp + xpAmount;
      
      const [updatedStat] = await db
        .update(characterStat)
        .set({ 
          currentXp: newXp,
          updatedAt: new Date() 
        })
        .where(eq(characterStat.id, statId))
        .returning();
      
      const level = calculateLevel(updatedStat.currentXp);
      const progress = calculateLevelProgress(updatedStat.currentXp);
      const xpToNextLevel = calculateXpToNextLevel(updatedStat.currentXp);
      
      return {
        stat: updatedStat,
        levelInfo: {
          level,
          progress,
          xpToNextLevel
        },
        xpGained: xpAmount
      };
    });

    const statUpdates = await Promise.all(updatePromises);

    return json({
      completion: newCompletion,
      statUpdates: statUpdates.filter(Boolean)
    }, { status: 201 });
  } catch (error) {
    console.error('Error completing task:', error);
    return json({ error: 'Failed to complete task' }, { status: 500 });
  }
}

export async function DELETE({ params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const taskId = params.taskId;
    const completionId = params.completionId;
    
    if (!taskId || !completionId) {
      return json({ error: 'Task ID and Completion ID are required' }, { status: 400 });
    }

    // Verify the completion belongs to the user
    const [completion] = await db
      .select({
        completion: taskCompletion,
        task: experimentTask,
        exp: experiment
      })
      .from(taskCompletion)
      .innerJoin(experimentTask, eq(taskCompletion.taskId, experimentTask.id))
      .innerJoin(experiment, eq(experimentTask.experimentId, experiment.id))
      .where(and(
        eq(taskCompletion.id, completionId),
        eq(taskCompletion.userId, locals.user.id)
      ))
      .limit(1);

    if (!completion) {
      return json({ error: 'Completion not found' }, { status: 404 });
    }

    // Delete the completion
    await db
      .delete(taskCompletion)
      .where(eq(taskCompletion.id, completionId));

    // Handle XP reduction if needed
    // This is optional and could be complex to track which stats had XP awarded
    // For simplicity, we're not reducing XP here, but in a real app you might want to

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting task completion:', error);
    return json({ error: 'Failed to delete task completion' }, { status: 500 });
  }
}
