import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { taskCompletion, experimentTask, characterStat } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * POST handler to mark a task as complete and award XP
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Task ID is required' });
	}
	
	try {
		// First, verify task exists and user has access
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
		
		// Create task completion record
		const newCompletion = await db
			.insert(taskCompletion)
			.values({
				taskId: id,
				userId: userId,
				completedAt: new Date()
			})
			.returning();
		
		// Award XP if task has XP rewards
		const xpRewards = task.xpRewards;
		let updatedStats = [];
		
		if (xpRewards && Object.keys(xpRewards).length > 0) {
			for (const [statId, xpAmount] of Object.entries(xpRewards)) {
				// Update the character stat with XP
				const updated = await db
					.update(characterStat)
					.set({
						currentXp: sql`${characterStat.currentXp} + ${xpAmount}`,
						updatedAt: new Date()
					})
					.where(
						and(
							eq(characterStat.id, statId),
							eq(characterStat.userId, userId)
						)
					)
					.returning();
				
				if (updated.length > 0) {
					updatedStats.push({
						statId,
						name: updated[0].name,
						xpGained: xpAmount
					});
				}
			}
		}
		
		return json({ 
			completion: newCompletion[0], 
			updatedStats 
		});
	} catch (err: any) {
		console.error(`Failed to complete task ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to complete task' });
		}
		throw error(500, { message: 'Failed to complete task' });
	}
};
