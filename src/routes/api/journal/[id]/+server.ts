import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { journalEntry, journalContentTag, journalToneTag, journalCharacterTag, contentTag, toneTag, characterStat } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { OpenAIService } from '$lib/server/openai.js';
import type { RequestHandler } from '@sveltejs/kit';
import type { ConversationMessage } from '$lib/types.js';

const openaiService = new OpenAIService();

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;
	if (!id) {
		return json({ error: 'Invalid journal entry ID' }, { status: 400 });
	}

	try {
		// Get journal entry
		const [entry] = await db
			.select()
			.from(journalEntry)
			.where(and(
				eq(journalEntry.id, id),
				eq(journalEntry.userId, locals.user.id)
			));

		if (!entry) {
			return json({ error: 'Journal entry not found' }, { status: 404 });
		}

		// Get tags for the entry
		const contentTags = await db
			.select({
				id: contentTag.id,
				name: contentTag.name
			})
			.from(journalContentTag)
			.innerJoin(contentTag, eq(journalContentTag.tagId, contentTag.id))
			.where(eq(journalContentTag.journalId, entry.id));

		const toneTags = await db
			.select({
				id: toneTag.id,
				name: toneTag.name
			})
			.from(journalToneTag)
			.innerJoin(toneTag, eq(journalToneTag.tagId, toneTag.id))
			.where(eq(journalToneTag.journalId, entry.id));

		const characterTags = await db
			.select({
				id: characterStat.id,
				name: characterStat.name,
				xpGained: journalCharacterTag.xpGained
			})
			.from(journalCharacterTag)
			.innerJoin(characterStat, eq(journalCharacterTag.statId, characterStat.id))
			.where(eq(journalCharacterTag.journalId, entry.id));

		const entryWithTags = {
			...entry,
			contentTags,
			toneTags,
			characterTags,
			experiments: [] // TODO: Add experiments relationship
		};

		return json({ entry: entryWithTags });
	} catch (error) {
		console.error('Error fetching journal entry:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;
	if (!id) {
		return json({ error: 'Invalid journal entry ID' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const { message, action } = body;

		// Get existing entry
		const [entry] = await db
			.select()
			.from(journalEntry)
			.where(and(
				eq(journalEntry.id, id),
				eq(journalEntry.userId, locals.user.id)
			));

		if (!entry) {
			return json({ error: 'Journal entry not found' }, { status: 404 });
		}

		if (action === 'add_message') {
			// Add user message to conversation
			const conversationData = entry.conversationData as ConversationMessage[];
			const updatedConversation = [...conversationData, {
				role: 'user' as const,
				content: message,
				timestamp: new Date()
			}];

			await db
				.update(journalEntry)
				.set({ 
					conversationData: updatedConversation,
					updatedAt: new Date()
				})
				.where(and(
					eq(journalEntry.id, id),
					eq(journalEntry.userId, locals.user.id)
				));

			// Generate follow-up questions using GPT
			const followUpQuestions = await openaiService.generateFollowUpQuestions(updatedConversation);

			return json({ 
				success: true, 
				followUpQuestions,
				conversationData: updatedConversation
			});

		} else if (action === 'add_assistant_message') {
			// Add assistant message to conversation
			const conversationData = entry.conversationData as ConversationMessage[];
			const updatedConversation = [...conversationData, {
				role: 'assistant' as const,
				content: message,
				timestamp: new Date()
			}];

			await db
				.update(journalEntry)
				.set({ 
					conversationData: updatedConversation,
					updatedAt: new Date()
				})
				.where(and(
					eq(journalEntry.id, id),
					eq(journalEntry.userId, locals.user.id)
				));

			return json({ 
				success: true,
				conversationData: updatedConversation
			});

		} else if (action === 'process_entry') {
			// Process the completed journal entry with GPT
			const conversationData = entry.conversationData as ConversationMessage[];
			
			if (conversationData.length === 0) {
				return json({ error: 'No conversation to process' }, { status: 400 });
			}

			// Get existing tags and stats for context
			const existingContentTags = await db
				.select({ name: contentTag.name })
				.from(contentTag)
				.where(eq(contentTag.userId, locals.user.id));

			const existingCharacterStats = await db
				.select({ name: characterStat.name })
				.from(characterStat)
				.where(eq(characterStat.userId, locals.user.id));

			const result = await openaiService.processJournalEntry(
				conversationData,
				existingContentTags.map(t => t.name),
				existingCharacterStats.map(s => s.name)
			);

			// Update the journal entry with processed data
			await db
				.update(journalEntry)
				.set({
					title: result.title,
					synopsis: result.synopsis,
					summary: result.summary,
					isProcessed: true,
					updatedAt: new Date()
				})
				.where(and(
					eq(journalEntry.id, id),
					eq(journalEntry.userId, locals.user.id)
				));

			// TODO: Process and link tags, add XP to character stats

			return json({ 
				success: true,
				processedEntry: {
					...entry,
					title: result.title,
					synopsis: result.synopsis,
					summary: result.summary,
					isProcessed: true
				}
			});
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Error updating journal entry:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;
	if (!id) {
		return json({ error: 'Invalid journal entry ID' }, { status: 400 });
	}

	try {
		// Delete the journal entry (cascading deletes will handle relationships)
		await db
			.delete(journalEntry)
			.where(and(
				eq(journalEntry.id, id),
				eq(journalEntry.userId, locals.user.id)
			));

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting journal entry:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
