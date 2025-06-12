import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { journalEntry, journalContentTag, journalToneTag, journalCharacterTag, contentTag, toneTag, characterStat } from '$lib/server/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');
	const offset = (page - 1) * limit;

	try {
		// Get journal entries with related data
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
			.where(eq(journalEntry.userId, locals.user.id))
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

		return json({ entries: entriesWithTags });
	} catch (error) {
		console.error('Error fetching journal entries:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { initialContent } = await request.json();

		// Create new journal entry
		const [newEntry] = await db
			.insert(journalEntry)
			.values({
				userId: locals.user.id,
				conversationData: initialContent ? [
					{
						role: 'user' as const,
						content: initialContent,
						timestamp: new Date()
					}
				] : [],
				isProcessed: false
			})
			.returning();

		return json({ entry: newEntry }, { status: 201 });
	} catch (error) {
		console.error('Error creating journal entry:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
