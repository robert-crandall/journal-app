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
  xpGrants,
  familyMembers,
} from '../db/schema';
import { createTodosWithExpiration } from '../utils/todoHelper';
import { analyzeJournalEntry } from '../utils/gpt/journal';
import {
  startJournalSessionSchema,
  sendJournalMessageSchema,
  saveJournalEntrySchema,
  getJournalEntrySchema,
  startLongFormJournalSchema,
  saveLongFormJournalSchema,
  startReflectionSchema,
  saveSimpleLongFormJournalSchema,
  updateLongFormJournalSchema,
} from '../validation/journal';
import { handleApiError } from '../utils/logger';
import { grantXp } from '../utils/xpService';
import type {
  StartJournalSessionResponse,
  SendJournalMessageResponse,
  SaveJournalEntryResponse,
  GetJournalEntriesResponse,
  ChatMessage,
  JournalEntryWithDetails,
  StartLongFormJournalResponse,
  SaveLongFormJournalResponse,
  StartReflectionResponse,
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

// Helper function to get user family members
async function getUserFamilyMembers(userId: string) {
  return await db
    .select({
      id: familyMembers.id,
      name: familyMembers.name,
      relationship: familyMembers.relationship,
      connectionXp: familyMembers.connectionXp,
    })
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId));
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
          content: '', // Empty since this is chat-based
          startedAsChat: true,
          reflected: false,
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
          const [statName, statData] = matchingStatEntry;
          // Handle both new format (with reason) and old format (direct number)
          const xpAmount = typeof statData === 'object' && statData.xp !== undefined ? statData.xp : statData;
          const xpReason = typeof statData === 'object' && statData.reason ? statData.reason : `Journal entry: ${metadata.title}`;
          const numericXP = typeof xpAmount === 'number' ? xpAmount : parseInt(String(xpAmount), 10);

          // Add stat tag relation
          await db.insert(journalEntryStatTags).values({
            entryId,
            statId: stat.id,
          });

          // Grant XP to the stat using the service
          await grantXp(userId, {
            entityType: 'character_stat',
            entityId: stat.id,
            xpAmount: numericXP,
            sourceType: 'journal',
            sourceId: entryId,
            reason: xpReason,
          });

          // Update stat total XP
          await db
            .update(characterStats)
            .set({
              totalXp: stat.totalXp + numericXP,
              updatedAt: new Date(),
            })
            .where(eq(characterStats.id, stat.id));

          statTagIds.push(stat.id);
          processedStatTags.push(statName);
        }
      }

      // Add family tags and grant XP if any family members exist
      const userFamilyMembers = await getUserFamilyMembers(userId);
      const familyTagIds: string[] = [];
      const processedFamilyTags: string[] = [];

      for (const familyMember of userFamilyMembers) {
        // Check for case-insensitive match
        const familyNameLower = familyMember.name.toLowerCase();
        const matchingFamilyEntry = Object.entries(metadata.suggestedFamilyTags).find(([familyName]) => familyName.toLowerCase() === familyNameLower);

        if (matchingFamilyEntry) {
          const [familyName, familyData] = matchingFamilyEntry;
          // Handle both new format (with reason) and old format (direct number)
          const xpAmount = typeof familyData === 'object' && familyData.xp !== undefined ? familyData.xp : familyData;
          const xpReason = typeof familyData === 'object' && familyData.reason ? familyData.reason : `Journal entry: ${metadata.title}`;
          const numericXP = typeof xpAmount === 'number' ? xpAmount : parseInt(String(xpAmount), 10);

          // Grant XP to the family member using the service
          await grantXp(userId, {
            entityType: 'family_member',
            entityId: familyMember.id,
            xpAmount: numericXP,
            sourceType: 'journal',
            sourceId: entryId,
            reason: xpReason,
          });

          familyTagIds.push(familyMember.id);
          processedFamilyTags.push(familyName);
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

      // Create todos with 24-hour expiration if any are suggested
      if (metadata.suggestedTodos && metadata.suggestedTodos.length > 0) {
        await createTodosWithExpiration(userId, metadata.suggestedTodos, 24, 'journal');
      }

      const response: SaveJournalEntryResponse = {
        success: true,
        data: {
          entryId,
          title: metadata.title,
          synopsis: metadata.synopsis,
          summary: metadata.summary,
          tags: metadata.suggestedTags,
          statTags: processedStatTags,
          familyTags: processedFamilyTags,
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

// Long-form journal endpoints
app.post('/longform/start', jwtAuth, zValidator('json', startLongFormJournalSchema), async (c) => {
  try {
    const userId = getUserId(c);

    // Create a new empty journal entry in long-form mode
    const newEntry = await db
      .insert(journalEntries)
      .values({
        userId,
        title: 'Untitled Journal Entry', // Default title until processed
        synopsis: '', // Empty until processed
        summary: '', // Empty until processed
        content: '', // Empty content to be filled by user
        reflected: false, // Not yet reflected upon
        startedAsChat: false, // Started in long-form mode
      })
      .returning();

    const response: StartLongFormJournalResponse = {
      success: true,
      data: {
        entryId: newEntry[0].id,
      },
    };

    return c.json(response, 201);
  } catch (error) {
    handleApiError(error, 'Failed to start long-form journal entry');
    return c.json(
      {
        success: false,
        error: 'Failed to start long-form journal entry',
      },
      500,
    );
  }
});

app.post('/longform/save', jwtAuth, zValidator('json', saveLongFormJournalSchema), async (c) => {
  try {
    const userId = getUserId(c);
    const { content } = c.req.valid('json');

    // Create a new journal entry with the long-form content without analysis
    const newEntry = await db
      .insert(journalEntries)
      .values({
        userId,
        title: 'Untitled Journal Entry',
        synopsis: 'Journal entry waiting for reflection',
        summary: '',
        content,
        reflected: false, // Not yet reflected upon
        startedAsChat: false, // Started in long-form mode
      })
      .returning();

    const entryId = newEntry[0].id;

    // Return simple response - no metadata analysis
    const response: SaveLongFormJournalResponse = {
      success: true,
      data: {
        entryId,
        title: 'Untitled Journal Entry',
        synopsis: 'Journal entry waiting for reflection',
        summary: '',
      },
    };

    return c.json(response, 201);
  } catch (error) {
    handleApiError(error, 'Failed to save long-form journal entry');
    return c.json(
      {
        success: false,
        error: 'Failed to save long-form journal entry',
      },
      500,
    );
  }
});

// Add the new endpoint after app.post('/longform/save', ...)
app.post('/longform/save-simple', jwtAuth, zValidator('json', saveSimpleLongFormJournalSchema), async (c) => {
  try {
    const userId = getUserId(c);
    const { content, entryId } = c.req.valid('json');

    if (entryId) {
      // Update existing entry
      const existingEntry = await db
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
        .limit(1);

      if (existingEntry.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal entry not found',
          },
          404,
        );
      }

      await db
        .update(journalEntries)
        .set({
          content,
          updatedAt: new Date(),
        })
        .where(eq(journalEntries.id, entryId));

      return c.json({
        success: true,
        data: {
          entryId,
          title: existingEntry[0].title,
        },
      });
    } else {
      // Create a new journal entry with just the content, no metadata analysis
      const newEntry = await db
        .insert(journalEntries)
        .values({
          userId,
          title: 'Untitled Journal Entry', // Simple default title
          synopsis: 'Journal entry in progress', // Simple default synopsis
          summary: '', // No summary yet
          content,
          reflected: false, // Not yet reflected upon
          startedAsChat: false, // Started in long-form mode
        })
        .returning();

      return c.json({
        success: true,
        data: {
          entryId: newEntry[0].id,
          title: 'Untitled Journal Entry',
        },
      });
    }
  } catch (error) {
    handleApiError(error, 'Failed to save long-form journal entry');
    return c.json(
      {
        success: false,
        error: 'Failed to save long-form journal entry',
      },
      500,
    );
  }
});

app.post('/reflection/start', jwtAuth, zValidator('json', startReflectionSchema), async (c) => {
  try {
    const userId = getUserId(c);
    const { entryId } = c.req.valid('json');

    // Get the long-form entry
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

    // Check if it's a long-form entry that hasn't been reflected on yet
    if (entry[0].startedAsChat || entry[0].reflected) {
      return c.json(
        {
          success: false,
          error: 'Invalid journal entry for reflection',
        },
        400,
      );
    }

    // Ensure we have content to reflect on
    if (!entry[0].content) {
      return c.json(
        {
          success: false,
          error: 'No content to reflect on',
        },
        400,
      );
    }

    // Create a session for this reflection
    const userContext = await getUserContext(userId);
    const newSession = await db
      .insert(journalSessions)
      .values({
        userId,
        messages: [],
        isActive: true,
      })
      .returning();

    // Simply use the standard welcome message generation
    const welcomeMessage = await generateWelcomeMessage(userContext);

    // Set up the initial messages in the session with the content as the first user message
    const initialMessages: ChatMessage[] = [
      {
        role: 'assistant' as const,
        content: welcomeMessage,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'user' as const,
        content: entry[0].content,
        timestamp: new Date().toISOString(),
      },
    ];

    // Update the session with the initial messages
    await db
      .update(journalSessions)
      .set({
        messages: initialMessages,
        updatedAt: new Date(),
      })
      .where(eq(journalSessions.id, newSession[0].id));

    // Update the entry to mark it as reflected
    await db
      .update(journalEntries)
      .set({
        reflected: true,
      })
      .where(eq(journalEntries.id, entryId));

    // Now generate a response to the user's content
    const { response: aiResponse } = await generateFollowUpResponse(initialMessages, userContext);

    // Add the AI's response to the messages
    const updatedMessages: ChatMessage[] = [
      ...initialMessages,
      {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
    ];

    // Update the session with the response
    await db
      .update(journalSessions)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      })
      .where(eq(journalSessions.id, newSession[0].id));

    const response: StartReflectionResponse = {
      success: true,
      data: {
        sessionId: newSession[0].id,
        message: aiResponse,
      },
    };

    return c.json(response, 201);
  } catch (error) {
    handleApiError(error, 'Failed to start reflection');
    return c.json(
      {
        success: false,
        error: 'Failed to start reflection',
      },
      500,
    );
  }
});

// Add a new endpoint to get session data by ID
app.get('/session/:id', jwtAuth, async (c) => {
  try {
    const userId = getUserId(c);
    const sessionId = c.req.param('id');

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

    return c.json({
      success: true,
      data: {
        sessionId: session[0].id,
        messages: session[0].messages,
        isActive: session[0].isActive,
      },
    });
  } catch (error) {
    handleApiError(error, 'Failed to fetch session data');
    return;
  }
});

// Add this new endpoint after the existing longform endpoints
app.post('/longform/update', jwtAuth, zValidator('json', updateLongFormJournalSchema), async (c) => {
  try {
    const userId = getUserId(c);
    const { entryId, content } = c.req.valid('json');

    // Get the journal entry and verify ownership
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

    // Ensure it's a long-form entry that can be edited
    if (entry[0].startedAsChat) {
      return c.json(
        {
          success: false,
          error: 'Cannot edit chat-based journal entry',
        },
        400,
      );
    }

    // If already reflected upon, we can't edit anymore
    if (entry[0].reflected) {
      return c.json(
        {
          success: false,
          error: 'Cannot edit entry after starting reflection',
        },
        400,
      );
    }

    // Update the content
    await db
      .update(journalEntries)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(journalEntries.id, entryId));

    return c.json({
      success: true,
      data: {
        entryId,
        title: entry[0].title,
        content,
      },
    });
  } catch (error) {
    handleApiError(error, 'Failed to update journal entry');
    return c.json(
      {
        success: false,
        error: 'Failed to update journal entry',
      },
      500,
    );
  }
});

export default app;
