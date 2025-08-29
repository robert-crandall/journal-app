import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, sql, desc, like, gte, lte, ilike, count } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { journals } from '../db/schema/journals';
import { characterStats, characters, xpGrants, simpleTodos, familyMembers, tags } from '../db/schema';
import {
  createJournalSchema,
  updateJournalSchema,
  addChatMessageSchema,
  journalDateSchema,
  finishJournalSchema,
  listJournalsSchema,
} from '../validation/journals';
import { handleApiError } from '../utils/logger';
import { generateFollowUpResponse, generateJournalMetadata, generateJournalSummary, type ChatMessage } from '../utils/gpt/conversationalJournal';
import { getUserContext } from '../utils/userContextService';
import { UserAttributesService } from '../services/user-attributes';
import { deleteJournalXpGrants } from '../utils/xpService';
import type {
  CreateJournalRequest,
  UpdateJournalRequest,
  AddChatMessageRequest,
  JournalResponse,
  TodayJournalResponse,
  ListJournalsRequest,
  ListJournalsResponse,
  JournalListItem,
  ToneTag,
} from '../../../shared/types/journals';

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
    toneTags: journal.toneTags ? (journal.toneTags as ToneTag[]) : null,
    dayRating: journal.dayRating,
    createdAt: journal.createdAt.toISOString(),
    updatedAt: journal.updatedAt.toISOString(),
  };
};

/**
 * Helper function to serialize journal for list view
 */
const serializeJournalListItem = (journal: typeof journals.$inferSelect): JournalListItem => {
  const initialMessage = journal.initialMessage || '';
  const characterCount = initialMessage.length;
  const wordCount = initialMessage.trim() ? initialMessage.trim().split(/\s+/).length : 0;

  return {
    id: journal.id,
    date: journal.date || '',
    status: journal.status as 'draft' | 'in_review' | 'complete',
    title: journal.title,
    synopsis: journal.synopsis,
    initialMessage: journal.initialMessage,
    toneTags: journal.toneTags ? (journal.toneTags as ToneTag[]) : null,
    dayRating: journal.dayRating,
    createdAt: journal.createdAt.toISOString(),
    updatedAt: journal.updatedAt.toISOString(),
    characterCount,
    wordCount,
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

  // List all journals with filtering and pagination
  .get('/', jwtAuth, zValidator('query', listJournalsSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const filters = c.req.valid('query') as ListJournalsRequest;

      // Build where conditions
      const conditions = [eq(journals.userId, userId)];

      if (filters.status) {
        conditions.push(eq(journals.status, filters.status));
      }

      if (filters.dateFrom) {
        conditions.push(gte(journals.date, filters.dateFrom));
      }

      if (filters.dateTo) {
        conditions.push(lte(journals.date, filters.dateTo));
      }

      if (filters.search) {
        // Search in title, synopsis, and initial message
        const searchTerm = `%${filters.search}%`;
        conditions.push(
          sql`(
            ${journals.title} ILIKE ${searchTerm} OR 
            ${journals.synopsis} ILIKE ${searchTerm} OR 
            ${journals.initialMessage} ILIKE ${searchTerm}
          )`,
        );
      }

      if (filters.toneTag) {
        // Filter by tone tag - check if the specified tone tag exists in the toneTags array
        conditions.push(sql`${journals.toneTags} ? ${filters.toneTag}`);
      }

      // If filtering by a single tag, use tagId
      let journalsQuery;
      if (filters.tagId) {
        // Get journals that have XP grants for the specified content tag
        journalsQuery = db
          .selectDistinct({
            id: journals.id,
            userId: journals.userId,
            date: journals.date,
            status: journals.status,
            initialMessage: journals.initialMessage,
            chatSession: journals.chatSession,
            summary: journals.summary,
            title: journals.title,
            synopsis: journals.synopsis,
            toneTags: journals.toneTags,
            dayRating: journals.dayRating,
            createdAt: journals.createdAt,
            updatedAt: journals.updatedAt,
          })
          .from(journals)
          .innerJoin(xpGrants, and(eq(xpGrants.sourceId, journals.id), eq(xpGrants.sourceType, 'journal'), eq(xpGrants.entityType, 'content_tag')))
          .where(and(...conditions, eq(xpGrants.entityId, filters.tagId)))
          .orderBy(desc(journals.date));
      } else {
        journalsQuery = db
          .select()
          .from(journals)
          .where(and(...conditions))
          .orderBy(desc(journals.date));
      }

      // Get total count for pagination
      let countQuery;
      if (filters.tagId) {
        // When filtering by tagId, we need to count distinct journals that have XP grants for the specified content tag
        countQuery = db
          .selectDistinct({ count: count() })
          .from(journals)
          .innerJoin(xpGrants, and(eq(xpGrants.sourceId, journals.id), eq(xpGrants.sourceType, 'journal'), eq(xpGrants.entityType, 'content_tag')))
          .where(and(...conditions, eq(xpGrants.entityId, filters.tagId)));
      } else {
        countQuery = db
          .select({ count: count() })
          .from(journals)
          .where(and(...conditions));
      }
      const [totalResult] = await countQuery;
      const total = totalResult.count;

      // Get paginated results
      const journalsList = await journalsQuery.limit(filters.limit || 20).offset(filters.offset || 0);

      // Get available content tags for the user for filter options
      const availableTagsQuery = await db
        .selectDistinct({
          id: tags.id,
          name: tags.name,
        })
        .from(tags)
        .innerJoin(xpGrants, and(eq(xpGrants.entityId, tags.id), eq(xpGrants.entityType, 'content_tag'), eq(xpGrants.sourceType, 'journal')))
        .where(eq(tags.userId, userId))
        .orderBy(tags.name);

      // Enhance journal items with XP earned
      const enhancedJournals = await Promise.all(
        journalsList.map(async (journal) => {
          const listItem = serializeJournalListItem(journal);

          // Get XP earned for this journal (excluding content tags which have 0 XP)
          const [xpResult] = await db
            .select({ total: sql<number>`sum(${xpGrants.xpAmount})` })
            .from(xpGrants)
            .where(and(eq(xpGrants.sourceId, journal.id), eq(xpGrants.sourceType, 'journal'), sql`${xpGrants.entityType} != 'content_tag'`));

          listItem.xpEarned = xpResult?.total || 0;

          // Get content tags for this journal
          const contentTagsResult = await db
            .select({
              id: tags.id,
              name: tags.name,
            })
            .from(tags)
            .innerJoin(xpGrants, and(eq(xpGrants.entityId, tags.id), eq(xpGrants.sourceId, journal.id), eq(xpGrants.entityType, 'content_tag')))
            .where(eq(tags.userId, userId));

          listItem.contentTags = contentTagsResult;

          return listItem;
        }),
      );

      const hasMore = (filters.offset || 0) + (filters.limit || 20) < total;

      const response: ListJournalsResponse = {
        journals: enhancedJournals,
        total,
        hasMore,
        availableTags: availableTagsQuery,
      };

      return c.json({
        success: true,
        data: response,
      });
    } catch (error) {
      handleApiError(error, 'Failed to list journals');
      return; // This should never be reached, but added for completeness
    }
  })

  // Get journal by date
  .get('/:date', jwtAuth, zValidator('param', journalDateSchema as any), async (c) => {
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
  .post('/', jwtAuth, zValidator('json', createJournalSchema as any), async (c) => {
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
          dayRating: data.dayRating || null,
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
  .put('/:date', jwtAuth, zValidator('param', journalDateSchema as any), zValidator('json', updateJournalSchema as any), async (c) => {
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

      const currentJournal = existingJournal[0];
      const journalId = currentJournal.id;

      // If this journal was previously complete and we're changing the initialMessage,
      // we need to clean up XP grants and reset to draft mode
      const isChangingContent = data.initialMessage !== undefined && data.initialMessage !== currentJournal.initialMessage;
      const wasComplete = currentJournal.status === 'complete';

      if (wasComplete && isChangingContent) {
        // Clean up existing XP grants since content is changing
        await deleteJournalXpGrants(userId, journalId);
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Reset status to draft if we cleaned up XP due to content changes
      if (wasComplete && isChangingContent) {
        updateData.status = 'draft';
        // Clear AI-generated content since we'll regenerate it
        updateData.summary = null;
        updateData.title = null;
        updateData.synopsis = null;
        updateData.toneTags = null;
      }

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
      if (data.toneTags !== undefined) {
        updateData.toneTags = data.toneTags;
      }
      if (data.dayRating !== undefined) {
        updateData.dayRating = data.dayRating;
      }
      // Note: toneTags are now supported as GPT-extracted emotional tags

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

  // Edit journal entry (handles XP cleanup and re-finalization)
  .post('/:date/edit', jwtAuth, zValidator('param', journalDateSchema as any), zValidator('json', updateJournalSchema as any), async (c) => {
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

      const currentJournal = existingJournal[0];
      const journalId = currentJournal.id;

      // If this is a completed journal being edited, we need to clean up existing XP grants first
      if (currentJournal.status === 'complete') {
        await deleteJournalXpGrants(userId, journalId);
      }

      // Update the journal with the new data and reset to draft status
      const updateData: any = {
        updatedAt: new Date(),
        status: 'draft', // Reset to draft when editing
        // Clear AI-generated content since we'll regenerate it
        summary: null,
        title: null,
        synopsis: null,
        toneTags: null,
      };

      // Update provided fields
      if (data.initialMessage !== undefined) {
        updateData.initialMessage = data.initialMessage;
      }
      if (data.chatSession !== undefined) {
        updateData.chatSession = data.chatSession;
      }
      if (data.dayRating !== undefined) {
        updateData.dayRating = data.dayRating;
      }

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
      handleApiError(error, 'Failed to edit journal');
      return; // This should never be reached, but added for completeness
    }
  })

  // Start reflection (transition from draft to in_review)
  .post('/:date/start-reflection', jwtAuth, zValidator('param', journalDateSchema as any), async (c) => {
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
        includeUserAttributes: true,
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
      const { response: aiResponse } = await generateFollowUpResponse(initialChatSession, userContext, userId);

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
  .post('/:date/chat', jwtAuth, zValidator('param', journalDateSchema as any), zValidator('json', addChatMessageSchema as any), async (c) => {
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
        includeUserAttributes: true,
      });

      // Generate AI response using the conversational journal utility
      const { response: aiResponse } = await generateFollowUpResponse(conversationWithNewMessage, userContext, userId);

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

  // Finish journal (transition from draft or in_review to complete)
  .post('/:date/finish', jwtAuth, zValidator('param', journalDateSchema as any), zValidator('json', finishJournalSchema as any), async (c) => {
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

      // Allow transition from draft or in_review to complete
      if (currentJournal.status !== 'in_review' && currentJournal.status !== 'draft') {
        return c.json(
          {
            success: false,
            error: 'Can only finish journal from draft or in_review status',
          },
          400,
        );
      }

      // Get user context for summary generation
      const userContext = await getUserContext(userId, {
        includeCharacter: true,
        includeActiveGoals: true,
        includeFamilyMembers: true,
        includeCharacterStats: true,
        includeExistingTags: true,
      });

      let metadata;
      let summary;
      let chatSession: ChatMessage[];

      // If status is draft, we need to handle differently than in_review
      if (currentJournal.status === 'draft') {
        // For draft, create a simple chat session with just the initial message
        chatSession = [
          {
            role: 'user',
            content: currentJournal.initialMessage || '',
            timestamp: new Date().toISOString(),
          },
        ];

        // Only generate metadata, use the initial message as summary
        metadata = await generateJournalMetadata(chatSession, userId);
        summary = currentJournal.initialMessage || '';
      } else {
        // For in_review, process normally with chat session
        chatSession = (currentJournal.chatSession as ChatMessage[]) || [];

        // Generate journal metadata and summary in parallel
        [metadata, summary] = await Promise.all([generateJournalMetadata(chatSession, userId), generateJournalSummary(chatSession, userContext, userId)]);
      }

      // Check if a day rating was provided in the request
      const currentJournalData = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      const currentDayRating = currentJournalData[0].dayRating;

      // Update journal with metadata and summary
      // Validate and normalize tone tags
      const VALID_TONE_TAGS = ['happy', 'calm', 'energized', 'overwhelmed', 'sad', 'angry', 'anxious'];
      const validatedToneTags: string[] = [];
      if (metadata.toneTags && Array.isArray(metadata.toneTags)) {
        for (const tag of metadata.toneTags) {
          if (typeof tag === 'string' && VALID_TONE_TAGS.includes(tag.toLowerCase())) {
            validatedToneTags.push(tag.toLowerCase());
          }
        }
      }

      const updatedJournal = await db
        .update(journals)
        .set({
          status: 'complete',
          summary: summary,
          title: metadata.title,
          synopsis: metadata.synopsis,
          toneTags: validatedToneTags,
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
        try {
          const statGrantsToInsert = [];

          for (const [statId, data] of Object.entries(metadata.suggestedStatTags)) {
            if (typeof data === 'object' && data !== null && 'xp' in data && typeof data.xp === 'number' && data.xp > 0) {
              statGrantsToInsert.push({
                userId,
                entityType: 'character_stat' as const,
                entityId: statId,
                xpAmount: data.xp,
                sourceType: 'journal' as const,
                sourceId: journalId,
                reason: data.reason || 'XP from journal stat analysis',
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
        } catch (error) {
          console.error('Error processing stat tags:', error);
          // Continue execution - don't fail the entire operation due to stat tag issues
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

      // Create user attributes from GPT suggestions
      if (metadata.suggestedAttributes && metadata.suggestedAttributes.length > 0) {
        const attributesToInsert = metadata.suggestedAttributes.map((attributeValue) => ({
          value: attributeValue,
          source: 'journal_analysis' as const,
        }));

        await UserAttributesService.bulkCreateUserAttributes(userId, {
          attributes: attributesToInsert,
        });
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
  .delete('/:date', jwtAuth, zValidator('param', journalDateSchema as any), async (c) => {
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

      const journalId = journalToDelete[0].id;

      // Delete all XP grants associated with this journal and recalculate entity totals
      await deleteJournalXpGrants(userId, journalId);

      // Delete the journal (this will cascade delete any associated records due to foreign key constraints)
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
