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

// GPT service (mock for now - will be replaced with real OpenAI integration)
class GPTService {
  async generateWelcomeMessage(userContext: { name: string; characterClass?: string; backstory?: string; goals?: string }): Promise<string> {
    // Mock welcome message
    return `Hi ${userContext.name}! I'm here to help you reflect on whatever's on your mind today. What would you like to share?`;
  }

  async generateFollowUpResponse(
    conversation: ChatMessage[],
    userContext: {
      name: string;
      characterClass?: string;
      backstory?: string;
      goals?: string;
    },
  ): Promise<{ response: string; shouldOfferSave: boolean }> {
    const userMessages = conversation.filter((msg) => msg.role === 'user');
    const shouldOfferSave = userMessages.length >= 3;

    if (shouldOfferSave) {
      return {
        response: `Thank you for sharing with me. I can sense this conversation has covered some important ground. Would you like to save this journal entry?`,
        shouldOfferSave: true,
      };
    }

    // Mock thoughtful follow-up based on the last user message
    const lastUserMessage = conversation[conversation.length - 1]?.content || '';
    const responses = [
      `That sounds really meaningful. Can you tell me more about what that experience was like for you?`,
      `I can hear that this is important to you. What feelings came up when that happened?`,
      `Interesting perspective. How do you think that connects to what you're working toward right now?`,
      `That's a lot to process. What part of this feels most significant to you?`,
    ];

    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      shouldOfferSave: false,
    };
  }

  async generateJournalMetadata(
    conversation: ChatMessage[],
    userContext: {
      name: string;
      characterClass?: string;
      backstory?: string;
      goals?: string;
    },
  ): Promise<{
    title: string;
    synopsis: string;
    summary: string;
    suggestedTags: string[];
    suggestedStatTags: string[];
  }> {
    // Mock metadata generation
    return {
      title: 'Reflective Journal Session',
      synopsis: 'A thoughtful conversation about current experiences and feelings.',
      summary: `In this journal session, ${userContext.name} shared their thoughts and feelings in a meaningful conversation. The discussion touched on personal experiences and provided space for reflection.`,
      suggestedTags: ['reflection', 'thoughts', 'personal'],
      suggestedStatTags: [], // Will be populated based on available stats
    };
  }
}

const gptService = new GPTService();

// Helper function to get user context for GPT
async function getUserContext(userId: string) {
  try {
    const user = await db
      .select({
        name: characters.name,
        characterClass: characters.characterClass,
        backstory: characters.backstory,
        goals: characters.goals,
      })
      .from(characters)
      .where(eq(characters.userId, userId))
      .limit(1);

    if (user.length === 0) {
      return { name: 'User' };
    }

    return {
      name: user[0].name,
      characterClass: user[0].characterClass || undefined,
      backstory: user[0].backstory || undefined,
      goals: user[0].goals || undefined,
    };
  } catch (error) {
    return { name: 'User' };
  }
}

// Helper function to get user's available stats
async function getUserStats(userId: string) {
  return await db
    .select({
      id: characterStats.id,
      name: characterStats.name,
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
      const welcomeMessage = await gptService.generateWelcomeMessage(userContext);

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
      const { response: gptResponse, shouldOfferSave } = await gptService.generateFollowUpResponse(updatedMessages, userContext);

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
      const metadata = await gptService.generateJournalMetadata(messages, userContext);

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

      // Add stat tags if any available stats exist
      const userStats = await getUserStats(userId);
      const statTagIds: string[] = [];
      for (const stat of userStats) {
        if (metadata.suggestedStatTags.includes(stat.name)) {
          await db.insert(journalEntryStatTags).values({
            entryId,
            statId: stat.id,
          });
          statTagIds.push(stat.id);
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
          statTags: metadata.suggestedStatTags,
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
