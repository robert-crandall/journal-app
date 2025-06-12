import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { experimentTask, experiment, taskCompletion, characterStat } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET({ params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const taskId = params.taskId;
    if (!taskId) {
      return json({ error: 'Task ID is required' }, { status: 400 });
    }

    // First verify the task and experiment belong to the user
    const [task] = await db
      .select({
        task: experimentTask,
        exp: experiment
      })
      .from(experimentTask)
      .innerJoin(experiment, eq(experimentTask.experimentId, experiment.id))
      .where(and(
        eq(experimentTask.id, taskId),
        eq(experiment.userId, locals.user.id)
      ))
      .limit(1);

    if (!task) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    // Get completions for this task
    const completions = await db
      .select()
      .from(taskCompletion)
      .where(and(
        eq(taskCompletion.taskId, taskId),
        eq(taskCompletion.userId, locals.user.id)
      ))
      .orderBy(desc(taskCompletion.completedAt));

    return json({ task: task.task, completions });
  } catch (error) {
    console.error('Error fetching task:', error);
    return json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT({ params, request, locals }: RequestEvent) {
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
        eq(experiment.userId, locals.user.id)
      ))
      .limit(1);

    if (!taskWithExp) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, targetCompletions, xpRewards } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (targetCompletions !== undefined) updates.targetCompletions = targetCompletions;
    if (xpRewards !== undefined) updates.xpRewards = xpRewards;

    const [updatedTask] = await db
      .update(experimentTask)
      .set(updates)
      .where(eq(experimentTask.id, taskId))
      .returning();

    return json({ task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE({ params, locals }: RequestEvent) {
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
        eq(experiment.userId, locals.user.id)
      ))
      .limit(1);

    if (!taskWithExp) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    const [deletedTask] = await db
      .delete(experimentTask)
      .where(eq(experimentTask.id, taskId))
      .returning();

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
