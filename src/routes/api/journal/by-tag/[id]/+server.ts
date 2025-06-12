import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { journalEntry, journalContentTag, journalToneTag, journalCharacterTag, contentTag, toneTag, characterStat } from '$lib/server/db/schema.js';
import { eq, and, desc, inArray } from 'drizzle-orm';

/**
 * GET handler to retrieve journal entries filtered by a specific tag
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	if (!locals.user) {
		throw error(401, { message: 'Unauthorized' });
	}
	
	const userId = locals.user.id;
	const { id } = params;
	
	if (!id) {
		throw error(400, { message: 'Tag ID is required' });
	}
	
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');
	const offset = (page - 1) * limit;
	
	try {
		// First verify the tag exists and belongs to the user
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
		
		// Get journal IDs that have this tag
		const journalTagRelations = await db.query.journalContentTag.findMany({
			where: (jct, { eq }) => eq(jct.tagId, id)
		});
		
		const journalIds = journalTagRelations.map(jct => jct.journalId);
		
		if (journalIds.length === 0) {
			// No journal entries with this tag
			return json({ 
				entries: [],
				tag
			});
		}
		
		// Get the journal entries
		const entries = await db
			.select({
				id: journalEntry.id,
				title: journalEntry.title,
				synopsis: journalEntry.synopsis,
				summary: journalEntry.summary,
				conversationData: journalEntry.conversationData,
				isProcessed: journalEntry.isProcessed,
				createdAt: journalEntry.createdAt,
				updatedAt: journalEntry.updatedAt
			})
			.from(journalEntry)
			.where(
				and(
					eq(journalEntry.userId, userId),
					// Use 'inArray' to find entries with matching IDs
					journalIds.length > 0 ? 
						inArray(journalEntry.id, journalIds) : 
						undefined
				)
			)
			.orderBy(desc(journalEntry.createdAt))
			.limit(limit)
			.offset(offset);

		// Get tags for each entry
		const entriesWithTags = [];
		for (const entry of entries) {
			// Get content tags
			const contentTags = await db
				.select({
					id: contentTag.id,
					name: contentTag.name
				})
				.from(journalContentTag)
				.innerJoin(contentTag, eq(journalContentTag.tagId, contentTag.id))
				.where(eq(journalContentTag.journalId, entry.id));

			// Get tone tags
			const toneTags = await db
				.select({
					id: toneTag.id,
					name: toneTag.name
				})
				.from(journalToneTag)
				.innerJoin(toneTag, eq(journalToneTag.tagId, toneTag.id))
				.where(eq(journalToneTag.journalId, entry.id));

			// Get character tags
			const characterTags = await db
				.select({
					id: characterStat.id,
					name: characterStat.name,
					xpGained: journalCharacterTag.xpGained
				})
				.from(journalCharacterTag)
				.innerJoin(characterStat, eq(journalCharacterTag.statId, characterStat.id))
				.where(eq(journalCharacterTag.journalId, entry.id));

			entriesWithTags.push({
				...entry,
				contentTags,
				toneTags,
				characterTags,
				experiments: [] // TODO: Add experiments relationship
			});
		}

		return json({ 
			entries: entriesWithTags,
			tag
		});
	} catch (err: any) {
		console.error(`Failed to fetch journal entries for tag ${id}:`, err);
		if (err.status) {
			throw error(err.status, { message: err.body?.message || 'Failed to fetch journal entries' });
		}
		throw error(500, { message: 'Failed to fetch journal entries' });
	}
};
