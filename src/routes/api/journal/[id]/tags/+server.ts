import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { journalEntry, journalContentTag, contentTag } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * POST handler to add tags to a journal entry
 */
export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Journal entry ID is required' });
	}
	
	try {
		// First verify user owns this entry
		const entry = await db.query.journalEntry.findFirst({
			where: (entries, { eq, and }) => 
				and(
					eq(entries.id, id),
					eq(entries.userId, userId)
				)
		});
		
		if (!entry) {
			throw error(404, { message: 'Journal entry not found' });
		}
		
		const { tagIds } = await request.json();
		
		if (!Array.isArray(tagIds)) {
			throw error(400, { message: 'tagIds must be an array' });
		}
		
		// First, remove all existing tags for this entry
		await db
			.delete(journalContentTag)
			.where(eq(journalContentTag.journalId, id));
		
		// Then, add the new tags
		if (tagIds.length > 0) {
			// Verify all tags belong to the user
			const validTags = await db.query.contentTag.findMany({
				where: (tags, { eq, and, inArray }) => 
					and(
						eq(tags.userId, userId),
						inArray(tags.id, tagIds)
					)
			});
			
			const validTagIds = validTags.map(tag => tag.id);
			
			// Insert all valid tag associations
			for (const tagId of validTagIds) {
				await db
					.insert(journalContentTag)
					.values({
						journalId: id,
						tagId
					})
					.onConflictDoNothing();
			}
		}
		
		return json({ success: true });
	} catch (err: any) {
		console.error(`Failed to update tags for journal entry ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to update tags' });
		}
		throw error(500, { message: 'Failed to update tags' });
	}
};

/**
 * GET handler to get tags for a journal entry
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Journal entry ID is required' });
	}
	
	try {
		// First verify user owns this entry
		const entry = await db.query.journalEntry.findFirst({
			where: (entries, { eq, and }) => 
				and(
					eq(entries.id, id),
					eq(entries.userId, userId)
				)
		});
		
		if (!entry) {
			throw error(404, { message: 'Journal entry not found' });
		}
		
		// Get tags for this entry
		const tags = await db
			.select({
				id: contentTag.id,
				name: contentTag.name,
				createdAt: contentTag.createdAt
			})
			.from(journalContentTag)
			.innerJoin(contentTag, eq(journalContentTag.tagId, contentTag.id))
			.where(eq(journalContentTag.journalId, id));
		
		return json({ tags });
	} catch (err: any) {
		console.error(`Failed to get tags for journal entry ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to get tags' });
		}
		throw error(500, { message: 'Failed to get tags' });
	}
};
