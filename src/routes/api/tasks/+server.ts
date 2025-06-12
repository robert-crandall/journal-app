import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { experiment, experimentTask, taskCompletion } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET handler to retrieve all experiment tasks
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	
	try {
		// Get all tasks that belong to experiments created by the current user
		// We'll need to join with experiments to filter by userId
		const tasks = await db.query.experimentTask.findMany({
			with: {
				experiment: true,
				completions: true
			},
			where: (tasks, { eq }) => eq(tasks.experiment.userId, userId)
		});
		
		return json({ tasks });
	} catch (err) {
		console.error('Failed to fetch tasks:', err);
		throw error(500, { message: 'Failed to fetch tasks' });
	}
};

/**
 * POST handler to create a new experiment task
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	
	try {
		const data = await request.json();
		const { experimentId, title, description, targetCompletions, xpRewards } = data;
		
		// Verify experiment belongs to current user
		const experimentRecord = await db.query.experiment.findFirst({
			where: (exp, { eq, and }) => 
				and(
					eq(exp.id, experimentId),
					eq(exp.userId, userId)
				)
		});
		
		if (!experimentRecord) {
			throw error(404, { message: 'Experiment not found' });
		}
		
		const newTask = await db
			.insert(experimentTask)
			.values({
				experimentId,
				title,
				description,
				targetCompletions: targetCompletions || 1,
				xpRewards: xpRewards || {}
			})
			.returning();
		
		return json({ task: newTask[0] });
	} catch (err: any) {
		console.error('Failed to create task:', err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to create task' });
		}
		throw error(500, { message: 'Failed to create task' });
	}
};
