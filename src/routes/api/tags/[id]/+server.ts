import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contentTag, journalContentTag } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET handler to retrieve a specific tag with usage stats
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Tag ID is required' });
	}
	
	try {
		// Get the tag
		const tag = await db.query.contentTag.findFirst({
			where: (tags, { eq, and }) => 
				and(
					eq(tags.id, id),
					eq(tags.userId, userId)
				)
		});
		
		if (!tag) {
			throw error(404, { message: 'Tag not found' });
		}
		
		// Count journal entries using this tag
		const journalEntries = await db.query.journalContentTag.findMany({
			where: (jct, { eq }) => eq(jct.tagId, id),
			with: {
				journalEntry: true
			}
		});
		
		// Return tag with usage data
		return json({
			tag,
			usageCount: journalEntries.length,
			journalEntries: journalEntries.map(je => ({
				id: je.journalEntry.id,
				title: je.journalEntry.title,
				createdAt: je.journalEntry.createdAt
			}))
		});
	} catch (err: any) {
		console.error(`Failed to fetch tag ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to fetch tag' });
		}
		throw error(500, { message: 'Failed to fetch tag' });
	}
};

/**
 * PUT handler to update a tag
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Tag ID is required' });
	}
	
	try {
		const data = await request.json();
		const { name } = data;
		
		if (!name || typeof name !== 'string' || name.trim() === '') {
			throw error(400, { message: 'Tag name is required' });
		}
		
		// First verify user owns this tag
		const existingTag = await db.query.contentTag.findFirst({
			where: (tags, { eq, and }) => 
				and(
					eq(tags.id, id),
					eq(tags.userId, userId)
				)
		});
		
		if (!existingTag) {
			throw error(404, { message: 'Tag not found' });
		}
		
		// Check if the new name conflicts with another tag
		if (name.trim() !== existingTag.name) {
			const nameConflict = await db.query.contentTag.findFirst({
				where: (tags, { eq, and }) => 
					and(
						eq(tags.name, name.trim()),
						eq(tags.userId, userId),
						eq(tags.id, id, true) // not equal to current ID
					)
			});
			
			if (nameConflict) {
				throw error(409, { message: 'A tag with this name already exists' });
			}
		}
		
		// Update the tag
		const updatedTag = await db
			.update(contentTag)
			.set({ name: name.trim() })
			.where(
				and(
					eq(contentTag.id, id),
					eq(contentTag.userId, userId)
				)
			)
			.returning();
		
		return json({ tag: updatedTag[0] });
	} catch (err: any) {
		console.error(`Failed to update tag ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to update tag' });
		}
		throw error(500, { message: 'Failed to update tag' });
	}
};

/**
 * DELETE handler to remove a tag
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Tag ID is required' });
	}
	
	try {
		// First verify user owns this tag
		const existingTag = await db.query.contentTag.findFirst({
			where: (tags, { eq, and }) => 
				and(
					eq(tags.id, id),
					eq(tags.userId, userId)
				)
		});
		
		if (!existingTag) {
			throw error(404, { message: 'Tag not found' });
		}
		
		// Delete all tag references from journal entries
		await db
			.delete(journalContentTag)
			.where(eq(journalContentTag.tagId, id));
		
		// Delete the tag itself
		await db
			.delete(contentTag)
			.where(
				and(
					eq(contentTag.id, id),
					eq(contentTag.userId, userId)
				)
			);
		
		return json({ success: true });
	} catch (err: any) {
		console.error(`Failed to delete tag ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to delete tag' });
		}
		throw error(500, { message: 'Failed to delete tag' });
	}
};
