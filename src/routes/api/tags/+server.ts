import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contentTag } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET handler to retrieve all content tags for the current user
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	
	try {
		const tags = await db.query.contentTag.findMany({
			where: (tags, { eq }) => eq(tags.userId, userId),
			orderBy: (tags, { asc }) => [asc(tags.name)]
		});
		
		return json({ tags });
	} catch (err) {
		console.error('Failed to fetch tags:', err);
		throw error(500, { message: 'Failed to fetch tags' });
	}
};

/**
 * POST handler to create a new content tag
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	
	try {
		const data = await request.json();
		const { name } = data;
		
		if (!name || typeof name !== 'string' || name.trim() === '') {
			throw error(400, { message: 'Tag name is required' });
		}
		
		// Check if tag already exists for this user
		const existingTag = await db.query.contentTag.findFirst({
			where: (tags, { eq, and }) => 
				and(
					eq(tags.name, name.trim()),
					eq(tags.userId, userId)
				)
		});
		
		if (existingTag) {
			return json({ tag: existingTag, created: false });
		}
		
		// Create new tag
		const newTag = await db
			.insert(contentTag)
			.values({
				userId,
				name: name.trim()
			})
			.returning();
		
		return json({ tag: newTag[0], created: true });
	} catch (err: any) {
		console.error('Failed to create tag:', err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to create tag' });
		}
		throw error(500, { message: 'Failed to create tag' });
	}
};
