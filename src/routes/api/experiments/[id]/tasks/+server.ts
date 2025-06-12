import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { experimentTask, experiment, taskCompletion } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET({ url, params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const experimentId = params.id;
    if (!experimentId) {
      return json({ error: 'Experiment ID is required' }, { status: 400 });
    }

    // First verify the user has access to this experiment
    const [exp] = await db
      .select()
      .from(experiment)
      .where(and(
        eq(experiment.id, experimentId),
        eq(experiment.userId, locals.user.id)
      ))
      .limit(1);

    if (!exp) {
      return json({ error: 'Experiment not found' }, { status: 404 });
    }

    const tasks = await db
      .select()
      .from(experimentTask)
      .where(eq(experimentTask.experimentId, experimentId))
      .orderBy(desc(experimentTask.createdAt));

    // Get completion counts for each task
    const tasksWithCompletions = await Promise.all(tasks.map(async (task) => {
      const completions = await db
        .select()
        .from(taskCompletion)
        .where(and(
          eq(taskCompletion.taskId, task.id),
          eq(taskCompletion.userId, locals.user!.id)
        ));

      return {
        ...task,
        completionCount: completions.length
      };
    }));

    return json({ tasks: tasksWithCompletions });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST({ request, params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const experimentId = params.id;
    if (!experimentId) {
      return json({ error: 'Experiment ID is required' }, { status: 400 });
    }

    // First verify the user has access to this experiment
    const [exp] = await db
      .select()
      .from(experiment)
      .where(and(
        eq(experiment.id, experimentId),
        eq(experiment.userId, locals.user.id)
      ))
      .limit(1);

    if (!exp) {
      return json({ error: 'Experiment not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, targetCompletions, xpRewards } = body;

    if (!title) {
      return json({ error: 'Title is required' }, { status: 400 });
    }

    const [newTask] = await db
      .insert(experimentTask)
      .values({
        experimentId,
        title,
        description,
        targetCompletions: targetCompletions || 1,
        xpRewards: xpRewards || {}
      })
      .returning();

    return json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return json({ error: 'Failed to create task' }, { status: 500 });
  }
}
