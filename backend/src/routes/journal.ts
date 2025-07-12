import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import {
  journalEntries,
  journalSessions,
  journalConversationMessages,
  journalEntryTags,
  journalEntryStatTags,
  tags,
  characterStats,
  characters,
  characterStatXpGrants,
} from '../db/schema';
import { startJournalSessionSchema, sendJournalMessageSchema, saveJournalEntrySchema, getJournalEntrySchema } from '../validation/journal';
import { handleApiError } from '../utils/logger';
import type {
  StartJournalSessionResponse,
  SendJournalMessageResponse,
  SaveJournalEntryResponse,
  GetJournalEntriesResponse,
  ChatMessage,
  JournalEntryWithDetails,
} from '../types/journal';
import { generateWelcomeMessage, generateFollowUpResponse, generateJournalMetadata } from '../utils/gpt/conversationalJournal';
import { getUserContext, type ComprehensiveUserContext } from '../utils/userContextService';

// Helper function to get user's available stats
async function getUserStats(userId: string) {
  return await db
    .select({
      id: characterStats.id,
      name: characterStats.name,
      totalXp: characterStats.totalXp,
    })
    .from(characterStats)
    .where(eq(characterStats.userId, userId));
}

// Helper function to get or create tags
async function getOrCreateTags(userId: string, tagNames: string[]) {
  const tagIds: string[] = [];

  for (const tagName of tagNames) {
    // Try to find existing tag
    let existingTag = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, tagName)))
      .limit(1);

    if (existingTag.length === 0) {
      // Create new tag
      const newTag = await db
        .insert(tags)
        .values({
          userId,
          name: tagName,
        })
        .returning();
      tagIds.push(newTag[0].id);
    } else {
      tagIds.push(existingTag[0].id);
    }
  }

  return tagIds;
}

const app = new Hono()
  // Start a new journal session
  .post('/start', jwtAuth, zValidator('json', startJournalSessionSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const userContext = await getUserContext(userId);

      // Create new session with basic data first
      const newSession = await db
        .insert(journalSessions)
        .values({
          userId,
          messages: [],
          isActive: true,
        })
        .returning();

      // Generate welcome message
      const welcomeMessage = await generateWelcomeMessage(userContext);

      // Add welcome message to session
      const initialMessages = [
        {
          role: 'assistant' as const,
          content: welcomeMessage,
          timestamp: new Date().toISOString(),
        },
      ];

      await db
        .update(journalSessions)
        .set({
          messages: initialMessages,
          updatedAt: new Date(),
        })
        .where(eq(journalSessions.id, newSession[0].id));

      const response: StartJournalSessionResponse = {
        success: true,
        data: {
          sessionId: newSession[0].id,
          message: welcomeMessage,
        },
      };

      return c.json(response, 201);
    } catch (error) {
      handleApiError(error, 'Failed to start journal session');
      return;
    }
  })

  // Send a message in the journal session
  .post('/message', jwtAuth, zValidator('json', sendJournalMessageSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { sessionId, message } = c.req.valid('json');

      // Get session and verify ownership
      const session = await db
        .select()
        .from(journalSessions)
        .where(and(eq(journalSessions.id, sessionId), eq(journalSessions.userId, userId)))
        .limit(1);

      if (session.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Session not found',
          },
          404,
        );
      }

      if (!session[0].isActive) {
        return c.json(
          {
            success: false,
            error: 'Session is no longer active',
          },
          400,
        );
      }

      const currentMessages = session[0].messages as ChatMessage[];
      const userContext = await getUserContext(userId);

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...currentMessages, userMessage];

      // Generate GPT response
      const { response: gptResponse, shouldOfferSave } = await generateFollowUpResponse(updatedMessages, userContext);

      // Add GPT response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: gptResponse,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];

      // Update session
      await db
        .update(journalSessions)
        .set({
          messages: finalMessages,
          updatedAt: new Date(),
        })
        .where(eq(journalSessions.id, sessionId));

      const response: SendJournalMessageResponse = {
        success: true,
        data: {
          response: gptResponse,
          shouldOfferSave,
          conversationLength: finalMessages.filter((msg) => msg.role === 'user').length,
        },
      };

      return c.json(response);
    } catch (error) {
      handleApiError(error, 'Failed to send message');
      return;
    }
  })

  // Save journal entry
  .post('/save', jwtAuth, zValidator('json', saveJournalEntrySchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { sessionId } = c.req.valid('json');

      // Get session and verify ownership
      const session = await db
        .select()
        .from(journalSessions)
        .where(and(eq(journalSessions.id, sessionId), eq(journalSessions.userId, userId)))
        .limit(1);

      if (session.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Session not found',
          },
          404,
        );
      }

      const messages = session[0].messages as ChatMessage[];
      const userContext = await getUserContext(userId);

      // Generate metadata using GPT
      const metadata = await generateJournalMetadata(messages, userContext, userId);

      // Create journal entry
      const newEntry = await db
        .insert(journalEntries)
        .values({
          userId,
          title: metadata.title,
          synopsis: metadata.synopsis,
          summary: metadata.summary,
        })
        .returning();

      const entryId = newEntry[0].id;

      // Save conversation messages
      for (let i = 0; i < messages.length; i++) {
        await db.insert(journalConversationMessages).values({
          entryId,
          role: messages[i].role,
          content: messages[i].content,
          messageOrder: i + 1,
        });
      }

      // Create tags
      const tagIds = await getOrCreateTags(userId, metadata.suggestedTags);
      for (const tagId of tagIds) {
        await db.insert(journalEntryTags).values({
          entryId,
          tagId,
        });
      }

      // Add stat tags and grant XP if any available stats exist
      const userStats = await getUserStats(userId);
      const statTagIds: string[] = [];
      const processedStatTags: string[] = [];

      for (const stat of userStats) {
        // Check for case-insensitive match
        const statNameLower = stat.name.toLowerCase();
        const matchingStatEntry = Object.entries(metadata.suggestedStatTags).find(([statName]) => statName.toLowerCase() === statNameLower);

        if (matchingStatEntry) {
          const [statName, xpAmount] = matchingStatEntry;

          // Add stat tag relation
          await db.insert(journalEntryStatTags).values({
            entryId,
            statId: stat.id,
          });

          // Grant XP to the stat
          await db.insert(characterStatXpGrants).values({
            userId,
            statId: stat.id,
            xpAmount,
            sourceType: 'journal',
            sourceId: entryId,
            reason: `Journal entry: ${metadata.title}`,
          });

          // Update stat total XP
          await db
            .update(characterStats)
            .set({
              totalXp: stat.totalXp + xpAmount,
              updatedAt: new Date(),
            })
            .where(eq(characterStats.id, stat.id));

          statTagIds.push(stat.id);
          processedStatTags.push(statName);
        }
      }

      // Mark session as inactive
      await db
        .update(journalSessions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(journalSessions.id, sessionId));

      const response: SaveJournalEntryResponse = {
        success: true,
        data: {
          entryId,
          title: metadata.title,
          synopsis: metadata.synopsis,
          summary: metadata.summary,
          tags: metadata.suggestedTags,
          statTags: processedStatTags,
        },
      };

      return c.json(response, 201);
    } catch (error) {
      handleApiError(error, 'Failed to save journal entry');
      return;
    }
  })

  // Get all journal entries for user
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      // Get entries with their messages and tags
      const entries = await db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt));

      const entriesWithDetails: JournalEntryWithDetails[] = [];

      for (const entry of entries) {
        // Get messages
        const messages = await db
          .select()
          .from(journalConversationMessages)
          .where(eq(journalConversationMessages.entryId, entry.id))
          .orderBy(journalConversationMessages.messageOrder);

        // Get tags
        const entryTags = await db
          .select({
            id: tags.id,
            name: tags.name,
          })
          .from(journalEntryTags)
          .innerJoin(tags, eq(journalEntryTags.tagId, tags.id))
          .where(eq(journalEntryTags.entryId, entry.id));

        // Get stat tags
        const statTags = await db
          .select({
            id: characterStats.id,
            name: characterStats.name,
          })
          .from(journalEntryStatTags)
          .innerJoin(characterStats, eq(journalEntryStatTags.statId, characterStats.id))
          .where(eq(journalEntryStatTags.entryId, entry.id));

        entriesWithDetails.push({
          ...entry,
          messages,
          tags: entryTags,
          statTags,
        });
      }

      const response: GetJournalEntriesResponse = {
        success: true,
        data: entriesWithDetails,
      };

      return c.json(response);
    } catch (error) {
      handleApiError(error, 'Failed to fetch journal entries');
      return;
    }
  })

  // Get a specific journal entry
  .get('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const entryId = c.req.param('id');

      // Get entry and verify ownership
      const entry = await db
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
        .limit(1);

      if (entry.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal entry not found',
          },
          404,
        );
      }

      // Get messages
      const messages = await db
        .select()
        .from(journalConversationMessages)
        .where(eq(journalConversationMessages.entryId, entryId))
        .orderBy(journalConversationMessages.messageOrder);

      // Get tags
      const entryTags = await db
        .select({
          id: tags.id,
          name: tags.name,
        })
        .from(journalEntryTags)
        .innerJoin(tags, eq(journalEntryTags.tagId, tags.id))
        .where(eq(journalEntryTags.entryId, entryId));

      // Get stat tags
      const statTags = await db
        .select({
          id: characterStats.id,
          name: characterStats.name,
        })
        .from(journalEntryStatTags)
        .innerJoin(characterStats, eq(journalEntryStatTags.statId, characterStats.id))
        .where(eq(journalEntryStatTags.entryId, entryId));

      const entryWithDetails: JournalEntryWithDetails = {
        ...entry[0],
        messages,
        tags: entryTags,
        statTags,
      };

      return c.json({
        success: true,
        data: entryWithDetails,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch journal entry');
      return;
    }
  });

export default app;
