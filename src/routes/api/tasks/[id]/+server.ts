import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { experimentTask, taskCompletion, experiment } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET handler to retrieve a specific task
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Task ID is required' });
	}
	
	try {
		// Fetch task with experiment info and verify user has access
		const task = await db.query.experimentTask.findFirst({
			where: (tasks, { eq }) => eq(tasks.id, id),
			with: {
				experiment: true,
				completions: true
			}
		});
		
		if (!task) {
			throw error(404, { message: 'Task not found' });
		}
		
		// Verify the user owns the experiment
		if (task.experiment.userId !== userId) {
			throw error(403, { message: 'Forbidden' });
		}
		
		return json({ task });
	} catch (err: any) {
		console.error(`Failed to fetch task ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to fetch task' });
		}
		throw error(500, { message: 'Failed to fetch task' });
	}
};

/**
 * PUT handler to update a task
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Task ID is required' });
	}
	
	try {
		// First verify user has access to this task's experiment
		const task = await db.query.experimentTask.findFirst({
			where: (tasks, { eq }) => eq(tasks.id, id),
			with: {
				experiment: true
			}
		});
		
		if (!task) {
			throw error(404, { message: 'Task not found' });
		}
		
		// Verify the user owns the experiment
		if (task.experiment.userId !== userId) {
			throw error(403, { message: 'Forbidden' });
		}
		
		const data = await request.json();
		const { title, description, targetCompletions, xpRewards } = data;
		
		const updatedTask = await db
			.update(experimentTask)
			.set({
				title,
				description,
				targetCompletions: targetCompletions || 1,
				xpRewards: xpRewards || {}
			})
			.where(eq(experimentTask.id, id))
			.returning();
		
		return json({ task: updatedTask[0] });
	} catch (err: any) {
		console.error(`Failed to update task ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to update task' });
		}
		throw error(500, { message: 'Failed to update task' });
	}
};

/**
 * DELETE handler to remove a task
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Task ID is required' });
	}
	
	try {
		// First verify user has access to this task's experiment
		const task = await db.query.experimentTask.findFirst({
			where: (tasks, { eq }) => eq(tasks.id, id),
			with: {
				experiment: true
			}
		});
		
		if (!task) {
			throw error(404, { message: 'Task not found' });
		}
		
		// Verify the user owns the experiment
		if (task.experiment.userId !== userId) {
			throw error(403, { message: 'Forbidden' });
		}
		
		// Delete the task
		await db.delete(experimentTask).where(eq(experimentTask.id, id));
		
		return json({ success: true });
	} catch (err: any) {
		console.error(`Failed to delete task ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to delete task' });
		}
		throw error(500, { message: 'Failed to delete task' });
	}
};
