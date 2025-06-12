import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { toneTag } from '$lib/server/db/schema';

/**
 * GET handler to retrieve all tone tags
 * Tone tags are system-defined and not user-specific
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	try {
		const tags = await db.query.toneTag.findMany({
			orderBy: (tags, { asc }) => [asc(tags.name)]
		});
		
		return json({ tags });
	} catch (err) {
		console.error('Failed to fetch tone tags:', err);
		throw error(500, { message: 'Failed to fetch tone tags' });
	}
};
