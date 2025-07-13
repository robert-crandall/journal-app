import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { journals } from '../db/schema/journals';
import { characterStats, characters } from '../db/schema';
import {
  createJournalSchema,
  updateJournalSchema,
  addChatMessageSchema,
  journalDateSchema,
  finishJournalSchema,
} from '../validation/journals';
import { handleApiError } from '../utils/logger';
import { analyzeJournalEntry } from '../utils/gpt/journal';
import type {
  CreateJournalRequest,
  UpdateJournalRequest,
  AddChatMessageRequest,
  JournalResponse,
  TodayJournalResponse,
  ChatMessage,
} from '../types/journals';

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
    toneTags: journal.toneTags ? JSON.parse(journal.toneTags) : null,
    contentTags: journal.contentTags ? JSON.parse(journal.contentTags) : null,
    statTags: journal.statTags ? JSON.parse(journal.statTags) : null,
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
      handleApiError(error, 'Failed to fetch today\'s journal');
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
      if (data.toneTags !== undefined) {
        updateData.toneTags = JSON.stringify(data.toneTags);
      }
      if (data.contentTags !== undefined) {
        updateData.contentTags = JSON.stringify(data.contentTags);
      }
      if (data.statTags !== undefined) {
        updateData.statTags = JSON.stringify(data.statTags);
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

      // Initialize chat session with the initial message
      const initialChatSession: ChatMessage[] = [
        {
          role: 'user',
          content: currentJournal.initialMessage || '',
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant',
          content: 'Thank you for sharing your thoughts. I\'d love to explore this further with you. What aspect of your reflection would you like to dive deeper into?',
          timestamp: new Date().toISOString(),
        },
      ];

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

      // Generate AI response (simple for now - could be enhanced with GPT)
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: 'That\'s an interesting point. Can you tell me more about how that made you feel?',
        timestamp: new Date().toISOString(),
      };

      const updatedChatSession = [...existingChatSession, userMessage, aiMessage];

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

      // Get user's character for context
      const userCharacter = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);

      // Get user's stats for context
      const userStats = await db
        .select()
        .from(characterStats)
        .where(eq(characterStats.userId, userId));

      // Prepare content for GPT analysis
      const chatSession = (currentJournal.chatSession as ChatMessage[]) || [];
      const fullJournalContent = [
        `Initial Message: ${currentJournal.initialMessage || ''}`,
        '',
        'Chat Session:',
        ...chatSession.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`),
      ].join('\n');

      // Analyze journal with GPT
      const analysis = await analyzeJournalEntry({
        journalContent: fullJournalContent,
        userBackstory: userCharacter.length > 0 ? userCharacter[0].backstory || undefined : undefined,
        characterClass: userCharacter.length > 0 ? userCharacter[0].characterClass || undefined : undefined,
        availableStats: userStats.map((stat) => ({
          id: stat.id,
          name: stat.name,
          description: stat.description || '',
        })),
      });

      // Update journal with analysis results
      const updatedJournal = await db
        .update(journals)
        .set({
          status: 'complete',
          summary: analysis.summary,
          title: analysis.title,
          synopsis: analysis.synopsis,
          toneTags: JSON.stringify(analysis.toneTags),
          contentTags: JSON.stringify(analysis.contentTags),
          statTags: JSON.stringify(analysis.statTags),
          updatedAt: new Date(),
        })
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .returning();

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
