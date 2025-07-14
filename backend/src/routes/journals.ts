import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, sql } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { journals } from '../db/schema/journals';
import { characterStats, characters, xpGrants, simpleTodos, familyMembers } from '../db/schema';
import { createJournalSchema, updateJournalSchema, addChatMessageSchema, journalDateSchema, finishJournalSchema } from '../validation/journals';
import { handleApiError } from '../utils/logger';
import { generateFollowUpResponse, generateJournalMetadata, type ChatMessage } from '../utils/gpt/conversationalJournal';
import { getUserContext } from '../utils/userContextService';
import type { CreateJournalRequest, UpdateJournalRequest, AddChatMessageRequest, JournalResponse, TodayJournalResponse } from '../types/journals';

/**
 * Helper function to serialize journal to response format
 */
const serializeJournal = (journal: typeof journals.$inferSelect): JournalResponse => {
  return {
    id: journal.id,
    userId: journal.userId,
    date: journal.date || '',
    status: journal.status as 'draft' | 'in_review' | 'complete',
    initialMessage: journal.initialMessage,
    chatSession: journal.chatSession ? (journal.chatSession as ChatMessage[]) : null,
    summary: journal.summary,
    title: journal.title,
    synopsis: journal.synopsis,
    createdAt: journal.createdAt.toISOString(),
    updatedAt: journal.updatedAt.toISOString(),
  };
};

/**
 * Helper function to get action text based on journal status
 */
const getActionText = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'Continue Writing';
    case 'in_review':
      return 'Resume Reflection';
    case 'complete':
      return 'View Entry';
    default:
      return 'Write Journal';
  }
};

// Chain methods for RPC compatibility
const app = new Hono()
  // Get today's journal status for homepage
  .get('/today', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      const todayJournal = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, today)))
        .limit(1);

      if (todayJournal.length === 0) {
        return c.json({
          success: true,
          data: {
            exists: false,
            actionText: 'Write Journal',
          } as TodayJournalResponse,
        });
      }

      const journal = todayJournal[0];
      return c.json({
        success: true,
        data: {
          exists: true,
          journal: serializeJournal(journal),
          status: journal.status as 'draft' | 'in_review' | 'complete',
          actionText: getActionText(journal.status),
        } as TodayJournalResponse,
      });
    } catch (error) {
      handleApiError(error, "Failed to fetch today's journal");
      return; // This should never be reached, but added for completeness
    }
  })

  // Get journal by date
  .get('/:date', jwtAuth, zValidator('param', journalDateSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { date } = c.req.valid('param');

      const journal = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      if (journal.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: serializeJournal(journal[0]),
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch journal');
      return; // This should never be reached, but added for completeness
    }
  })

  // Create or update journal entry
  .post('/', jwtAuth, zValidator('json', createJournalSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as CreateJournalRequest;

      // Check if journal already exists for this date
      const existingJournal = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, data.date)))
        .limit(1);

      if (existingJournal.length > 0) {
        return c.json(
          {
            success: false,
            error: 'Journal entry for this date already exists',
          },
          409,
        );
      }

      const newJournal = await db
        .insert(journals)
        .values({
          userId,
          date: data.date,
          status: 'draft',
          initialMessage: data.initialMessage || null,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: serializeJournal(newJournal[0]),
        },
        201,
      );
    } catch (error) {
      handleApiError(error, 'Failed to create journal');
      return; // This should never be reached, but added for completeness
    }
  })

  // Update journal entry
  .put('/:date', jwtAuth, zValidator('param', journalDateSchema), zValidator('json', updateJournalSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { date } = c.req.valid('param');
      const data = c.req.valid('json') as UpdateJournalRequest;

      // Check if journal exists and belongs to the user
      const existingJournal = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      if (existingJournal.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Only update provided fields
      if (data.initialMessage !== undefined) {
        updateData.initialMessage = data.initialMessage;
      }
      if (data.status !== undefined) {
        updateData.status = data.status;
      }
      if (data.chatSession !== undefined) {
        updateData.chatSession = data.chatSession;
      }
      if (data.summary !== undefined) {
        updateData.summary = data.summary;
      }
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (data.synopsis !== undefined) {
        updateData.synopsis = data.synopsis;
      }
      // Note: toneTags, contentTags, and statTags are deprecated - now using xpGrants table

      const updatedJournal = await db
        .update(journals)
        .set(updateData)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .returning();

      return c.json({
        success: true,
        data: serializeJournal(updatedJournal[0]),
      });
    } catch (error) {
      handleApiError(error, 'Failed to update journal');
      return; // This should never be reached, but added for completeness
    }
  })

  // Start reflection (transition from draft to in_review)
  .post('/:date/start-reflection', jwtAuth, zValidator('param', journalDateSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { date } = c.req.valid('param');

      // Get the journal entry
      const journal = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      if (journal.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      const currentJournal = journal[0];

      // Only allow transition from draft to in_review
      if (currentJournal.status !== 'draft') {
        return c.json(
          {
            success: false,
            error: 'Can only start reflection from draft status',
          },
          400,
        );
      }

      // Get user context for personalized AI response
      const userContext = await getUserContext(userId, {
        includeCharacter: true,
        includeActiveGoals: true,
        includeFamilyMembers: true,
        includeCharacterStats: true,
      });

      // Initialize chat session with the initial message
      const initialChatSession: ChatMessage[] = [
        {
          role: 'user',
          content: currentJournal.initialMessage || '',
          timestamp: new Date().toISOString(),
        },
      ];

      // Generate a personalized AI response based on the user's context and journal entry
      const { response: aiResponse } = await generateFollowUpResponse(initialChatSession, userContext);

      // Add the AI response to the chat session
      initialChatSession.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      });

      const updatedJournal = await db
        .update(journals)
        .set({
          status: 'in_review',
          chatSession: initialChatSession,
          updatedAt: new Date(),
        })
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .returning();

      return c.json({
        success: true,
        data: serializeJournal(updatedJournal[0]),
      });
    } catch (error) {
      handleApiError(error, 'Failed to start reflection');
      return; // This should never be reached, but added for completeness
    }
  })

  // Add message to chat session
  .post('/:date/chat', jwtAuth, zValidator('param', journalDateSchema), zValidator('json', addChatMessageSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { date } = c.req.valid('param');
      const data = c.req.valid('json') as AddChatMessageRequest;

      // Get the journal entry
      const journal = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      if (journal.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      const currentJournal = journal[0];

      // Only allow chat when in_review status
      if (currentJournal.status !== 'in_review') {
        return c.json(
          {
            success: false,
            error: 'Can only chat when journal is in review status',
          },
          400,
        );
      }

      const existingChatSession = (currentJournal.chatSession as ChatMessage[]) || [];

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      // Create updated conversation for context
      const conversationWithNewMessage = [...existingChatSession, userMessage];

      // Get user context for personalized AI response
      const userContext = await getUserContext(userId, {
        includeCharacter: true,
        includeActiveGoals: true,
        includeFamilyMembers: true,
        includeCharacterStats: true,
      });

      // Generate AI response using the conversational journal utility
      const { response: aiResponse } = await generateFollowUpResponse(conversationWithNewMessage, userContext);

      // Add AI response
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      const updatedChatSession = [...conversationWithNewMessage, aiMessage];

      const updatedJournal = await db
        .update(journals)
        .set({
          chatSession: updatedChatSession,
          updatedAt: new Date(),
        })
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .returning();

      return c.json({
        success: true,
        data: serializeJournal(updatedJournal[0]),
      });
    } catch (error) {
      handleApiError(error, 'Failed to add chat message');
      return; // This should never be reached, but added for completeness
    }
  })

  // Finish journal (transition from in_review to complete)
  .post('/:date/finish', jwtAuth, zValidator('param', journalDateSchema), zValidator('json', finishJournalSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { date } = c.req.valid('param');

      // Get the journal entry
      const journal = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      if (journal.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      const currentJournal = journal[0];

      // Only allow transition from in_review to complete
      if (currentJournal.status !== 'in_review') {
        return c.json(
          {
            success: false,
            error: 'Can only finish journal from in_review status',
          },
          400,
        );
      }

      // Get the chat session for analysis
      const chatSession = (currentJournal.chatSession as ChatMessage[]) || [];

      // Generate journal metadata using the new function
      const metadata = await generateJournalMetadata(chatSession, userId);

      // Update journal with basic metadata (no more JSON tags)
      const updatedJournal = await db
        .update(journals)
        .set({
          status: 'complete',
          summary: metadata.summary,
          title: metadata.title,
          synopsis: metadata.synopsis,
          updatedAt: new Date(),
        })
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .returning();

      const journalId = updatedJournal[0].id;

      // Create XP grants for content tags (0 XP)
      if (metadata.suggestedTags && metadata.suggestedTags.length > 0) {
        const contentTagsGrants = metadata.suggestedTags.map((tagId) => ({
          userId,
          entityType: 'content_tag' as const,
          entityId: tagId,
          xpAmount: 0, // Content tags get 0 XP
          sourceType: 'journal' as const,
          sourceId: journalId,
          reason: 'Content tag from journal analysis',
        }));

        await db.insert(xpGrants).values(contentTagsGrants);
      }

      // Create XP grants for character stats
      if (metadata.suggestedStatTags && typeof metadata.suggestedStatTags === 'object') {
        const statGrantsToInsert = [];

        for (const [statId, data] of Object.entries(metadata.suggestedStatTags)) {
          if (typeof data === 'object' && data !== null && data.xp > 0) {
            statGrantsToInsert.push({
              userId,
              entityType: 'character_stat' as const,
              entityId: statId,
              xpAmount: data.xp,
              sourceType: 'journal' as const,
              sourceId: journalId,
              reason: data.reason || 'XP from journal reflection',
            });

            // Update the character stat's total XP
            await db
              .update(characterStats)
              .set({
                totalXp: sql`total_xp + ${data.xp}`,
                updatedAt: new Date(),
              })
              .where(and(eq(characterStats.id, statId), eq(characterStats.userId, userId)));
          }
        }

        if (statGrantsToInsert.length > 0) {
          await db.insert(xpGrants).values(statGrantsToInsert);
        }
      }

      // Create XP grants for family members
      if (metadata.suggestedFamilyTags && typeof metadata.suggestedFamilyTags === 'object') {
        const familyGrantsToInsert = [];

        for (const [familyMemberId, data] of Object.entries(metadata.suggestedFamilyTags)) {
          if (typeof data === 'object' && data !== null && data.xp > 0) {
            familyGrantsToInsert.push({
              userId,
              entityType: 'family_member' as const,
              entityId: familyMemberId,
              xpAmount: data.xp,
              sourceType: 'journal' as const,
              sourceId: journalId,
              reason: data.reason || 'Connection XP from journal interaction',
            });

            // Update the family member's connection XP
            await db
              .update(familyMembers)
              .set({
                connectionXp: sql`connection_xp + ${data.xp}`,
                lastInteractionDate: new Date(),
                updatedAt: new Date(),
              })
              .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)));
          }
        }

        if (familyGrantsToInsert.length > 0) {
          await db.insert(xpGrants).values(familyGrantsToInsert);
        }
      }

      // Create simple todos that expire in 24 hours
      if (metadata.suggestedTodos && metadata.suggestedTodos.length > 0) {
        const expirationTime = new Date();
        expirationTime.setHours(expirationTime.getHours() + 24);

        const todosToInsert = metadata.suggestedTodos.map((todoDescription) => ({
          userId,
          description: todoDescription,
          isCompleted: false,
          expirationTime,
        }));

        await db.insert(simpleTodos).values(todosToInsert);
      }

      return c.json({
        success: true,
        data: serializeJournal(updatedJournal[0]),
      });
    } catch (error) {
      handleApiError(error, 'Failed to finish journal');
      return; // This should never be reached, but added for completeness
    }
  })

  // Delete journal entry
  .delete('/:date', jwtAuth, zValidator('param', journalDateSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { date } = c.req.valid('param');

      // Get journal before deletion for response
      const journalToDelete = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      if (journalToDelete.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      // Delete the journal
      await db.delete(journals).where(and(eq(journals.userId, userId), eq(journals.date, date)));

      return c.json({
        success: true,
        data: serializeJournal(journalToDelete[0]),
      });
    } catch (error) {
      handleApiError(error, 'Failed to delete journal');
      return; // This should never be reached, but added for completeness
    }
  });

export default app;
