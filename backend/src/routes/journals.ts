import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { journals, tags, tagAssociations, attributes, potions, preferences, createJournalSchema, startJournalSchema, followupResponseSchema, submitJournalSchema, completeJournalDaySchema, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';
import { generateFollowupQuestion, processJournalSubmission, type ConversationMessage } from '../utils/gptJournalProcessor';
import { getTodayInTimezone } from '../utils/timezone';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const journalsRouter = new Hono<{ Variables: Variables }>();

// Get all journals for user
journalsRouter.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  const userJournals = await db.query.journals.findMany({
    where: eq(journals.userId, user.id),
    orderBy: [desc(journals.date)],
  });
  
  return c.json({ journals: userJournals });
});

// Create journal entry
journalsRouter.post('/', jwtMiddleware, userMiddleware, zValidator('json', createJournalSchema), async (c) => {
  const user = c.get('user') as User;
  const { content, date } = c.req.valid('json');
  
  // Get user's timezone preference for default date
  const userPreferences = await db.query.preferences.findFirst({
    where: eq(preferences.userId, user.id),
  });
  
  const [journal] = await db.insert(journals).values({
    userId: user.id,
    content,
    date: date || getTodayInTimezone(userPreferences?.timezone),
  }).returning();
  
  return c.json({ journal });
});

// Get specific journal
journalsRouter.get('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  
  const journal = await db.query.journals.findFirst({
    where: and(eq(journals.id, journalId), eq(journals.userId, user.id)),
  });
  
  if (!journal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  return c.json({ journal });
});

// Update journal
journalsRouter.put('/:id', jwtMiddleware, userMiddleware, zValidator('json', createJournalSchema), async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  const { content, date } = c.req.valid('json');
  
  const [updatedJournal] = await db.update(journals)
    .set({
      content,
      date: date ? date : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(journals.id, journalId), eq(journals.userId, user.id)))
    .returning();
  
  if (!updatedJournal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  return c.json({ journal: updatedJournal });
});

// Delete journal
journalsRouter.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  
  const [deletedJournal] = await db.delete(journals)
    .where(and(eq(journals.id, journalId), eq(journals.userId, user.id)))
    .returning();
  
  if (!deletedJournal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  return c.json({ message: 'Journal deleted successfully' });
});

// NEW GPT-POWERED JOURNALING ENDPOINTS

// Start a new journal conversation
journalsRouter.post('/start', jwtMiddleware, userMiddleware, zValidator('json', startJournalSchema), async (c) => {
  const user = c.get('user') as User;
  const { content, date } = c.req.valid('json');
  
  // Get user's timezone preference for default date
  const userPreferences = await db.query.preferences.findFirst({
    where: eq(preferences.userId, user.id),
  });
  
  // Create initial conversation history with user's first message
  const initialMessage: ConversationMessage = {
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };
  
  const [journal] = await db.insert(journals).values({
    userId: user.id,
    content,
    date: date || getTodayInTimezone(userPreferences?.timezone),
    status: 'in_progress',
    conversationHistory: [initialMessage],
    followupCount: 0,
    maxFollowups: 3,
  }).returning();
  
  return c.json({ journal });
});

// Get GPT follow-up question
journalsRouter.get('/:id/followup', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  
  // Get the journal with current conversation
  const journal = await db.query.journals.findFirst({
    where: and(eq(journals.id, journalId), eq(journals.userId, user.id)),
  });
  
  if (!journal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  if (journal.status !== 'in_progress') {
    return c.json({ error: 'Journal conversation is not active' }, 400);
  }
  
  if (journal.followupCount >= journal.maxFollowups) {
    return c.json({ error: 'Maximum follow-ups reached' }, 400);
  }
  
  // Get user context for GPT
  const userAttributes = await db.query.attributes.findMany({
    where: and(eq(attributes.entityType, 'user'), eq(attributes.entityId, user.id)),
  });
  
  const existingTags = await db.query.tags.findMany({
    where: eq(tags.userId, user.id),
  });
  
  // Generate follow-up question using GPT
  const gptResponse = await generateFollowupQuestion({
    user,
    journal,
    userAttributes,
    existingTags,
  });
  
  // Add GPT's follow-up question to conversation history
  const gptMessage: ConversationMessage = {
    role: 'assistant',
    content: gptResponse.question,
    timestamp: new Date().toISOString(),
  };
  
  const updatedHistory = [...(journal.conversationHistory || []), gptMessage];
  
  // Update journal with GPT's question
  const [updatedJournal] = await db.update(journals)
    .set({
      conversationHistory: updatedHistory,
      updatedAt: new Date(),
    })
    .where(eq(journals.id, journalId))
    .returning();
  
  return c.json({ 
    question: gptResponse.question,
    shouldContinue: gptResponse.shouldContinue,
    journal: updatedJournal 
  });
});

// Add user's response to follow-up question
journalsRouter.post('/:id/followup', jwtMiddleware, userMiddleware, zValidator('json', followupResponseSchema), async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  const { response } = c.req.valid('json');
  
  // Get the journal
  const journal = await db.query.journals.findFirst({
    where: and(eq(journals.id, journalId), eq(journals.userId, user.id)),
  });
  
  if (!journal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  if (journal.status !== 'in_progress') {
    return c.json({ error: 'Journal conversation is not active' }, 400);
  }
  
  // Add user's response to conversation history
  const userMessage: ConversationMessage = {
    role: 'user',
    content: response,
    timestamp: new Date().toISOString(),
  };
  
  const updatedHistory = [...(journal.conversationHistory || []), userMessage];
  const newFollowupCount = journal.followupCount + 1;
  
  // Update journal with user's response
  const [updatedJournal] = await db.update(journals)
    .set({
      conversationHistory: updatedHistory,
      followupCount: newFollowupCount,
      updatedAt: new Date(),
    })
    .where(eq(journals.id, journalId))
    .returning();
  
  return c.json({ journal: updatedJournal });
});

// Submit journal for GPT processing
journalsRouter.post('/:id/submit', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  
  // Get the journal
  const journal = await db.query.journals.findFirst({
    where: and(eq(journals.id, journalId), eq(journals.userId, user.id)),
  });
  
  if (!journal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  if (journal.status === 'completed') {
    return c.json({ error: 'Journal already submitted' }, 400);
  }
  
  // Get user context for GPT processing
  const userAttributes = await db.query.attributes.findMany({
    where: and(eq(attributes.entityType, 'user'), eq(attributes.entityId, user.id)),
  });
  
  const existingTags = await db.query.tags.findMany({
    where: eq(tags.userId, user.id),
  });
  
  // Process journal with GPT
  const gptSummary = await processJournalSubmission({
    user,
    journal,
    userAttributes,
    existingTags,
  });
  
  // Get active potions to link this journal entry
  const activePotionIds = await getActivePotions(user.id);
  const potionId = activePotionIds.length > 0 ? activePotionIds[0] : null; // Link to first active potion if any
  
  // Update journal with GPT summary, sentiment data, and mark as completed
  const [updatedJournal] = await db.update(journals)
    .set({
      status: 'completed',
      title: gptSummary.title,
      gptSummary: gptSummary.summary,
      condensed: gptSummary.condensed,
      sentimentScore: gptSummary.sentimentScore,
      moodTags: gptSummary.moodTags,
      potionId: potionId,
      updatedAt: new Date(),
    })
    .where(eq(journals.id, journalId))
    .returning();
  
  // Process extracted tags
  const processedTags = await processExtractedTags(user.id, gptSummary.extractedTags, journalId);
  
  // Process suggested attributes
  const processedAttributes = await processSuggestedAttributes(user.id, gptSummary.suggestedAttributes);
  
  return c.json({
    journal: updatedJournal,
    title: gptSummary.title,
    summary: gptSummary.summary,
    condensed: gptSummary.condensed,
    extractedTags: processedTags,
    suggestedAttributes: processedAttributes,
  });
});

// Helper function to get active potions for a user
async function getActivePotions(userId: string): Promise<string[]> {
  // Get user's timezone preference
  const userPreferences = await db.query.preferences.findFirst({
    where: eq(preferences.userId, userId),
  });
  
  const today = getTodayInTimezone(userPreferences?.timezone);
  
  const activePotions = await db.query.potions.findMany({
    where: and(
      eq(potions.userId, userId),
      eq(potions.isActive, true),
      lte(potions.startDate, today),
      gte(potions.endDate, today)
    ),
  });
  
  return activePotions.map(potion => potion.id);
}

// Helper function to process extracted tags with fuzzy matching
async function processExtractedTags(userId: string, tagNames: string[], journalId: string) {
  const processedTags = [];
  
  for (const tagName of tagNames) {
    const normalizedTagName = tagName.toLowerCase().trim();
    
    // Check if tag already exists exactly
    let existingTag = await db.query.tags.findFirst({
      where: and(eq(tags.userId, userId), eq(tags.name, normalizedTagName)),
    });
    
    // If no exact match, try fuzzy matching
    if (!existingTag) {
      const userTags = await db.query.tags.findMany({
        where: eq(tags.userId, userId),
      });
      
      // Find the best fuzzy match
      existingTag = findBestTagMatch(normalizedTagName, userTags);
    }
    
    // Create tag if no suitable match found
    if (!existingTag) {
      const [newTag] = await db.insert(tags).values({
        userId,
        name: normalizedTagName,
      }).returning();
      existingTag = newTag;
    }
    
    // Create tag association with journal
    await db.insert(tagAssociations).values({
      tagId: existingTag.id,
      entityType: 'journal',
      entityId: journalId,
    });
    
    processedTags.push(existingTag);
  }
  
  return processedTags;
}

/**
 * Find the best fuzzy match for a tag name among existing tags
 * Uses simple string similarity matching
 */
function findBestTagMatch(targetTag: string, existingTags: Array<{ id: string; name: string; userId: string; createdAt: Date; updatedAt: Date }>): typeof existingTags[0] | undefined {
  let bestMatch = undefined;
  let bestScore = 0;
  const minSimilarityThreshold = 0.6; // 60% similarity required for better matching
  
  for (const tag of existingTags) {
    const similarity = calculateStringSimilarity(targetTag, tag.name);
    if (similarity > bestScore && similarity >= minSimilarityThreshold) {
      bestScore = similarity;
      bestMatch = tag;
    }
  }
  
  return bestMatch;
}

/**
 * Calculate string similarity using a combination of approaches
 * Returns a value between 0 and 1 (1 being identical)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Check if one string contains the other as a word (substring match)
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length >= s2.length ? s1 : s2;
    // More generous scoring for substring matches, minimum 0.7 for any substring match
    return Math.max((shorter.length / longer.length) * 0.9, 0.7);
  }
  
  // Word-based matching - split by spaces and check for word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  // If both are single words, use character-based similarity
  if (words1.length === 1 && words2.length === 1) {
    return calculateCharacterSimilarity(s1, s2);
  }
  
  // Calculate word overlap
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const wordIntersection = new Set([...set1].filter(x => set2.has(x)));
  const wordUnion = new Set([...set1, ...set2]);
  
  const wordSimilarity = wordIntersection.size / wordUnion.size;
  
  // If we have word matches, return higher score
  if (wordSimilarity > 0) {
    return Math.min(wordSimilarity * 1.2, 0.95); // Boost word matches but cap at 0.95
  }
  
  // Fall back to character similarity
  return calculateCharacterSimilarity(s1, s2);
}

/**
 * Calculate character-based similarity using Jaccard similarity
 */
function calculateCharacterSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Helper function to process suggested attributes
async function processSuggestedAttributes(userId: string, suggestedAttributes: Array<{ key: string; value: string }>) {
  const processedAttributes = [];
  
  for (const attr of suggestedAttributes) {
    // Check if this exact attribute already exists
    const existingAttribute = await db.query.attributes.findFirst({
      where: and(
        eq(attributes.entityType, 'user'),
        eq(attributes.entityId, userId), 
        eq(attributes.key, attr.key),
        eq(attributes.value, attr.value)
      ),
    });
    
    // Only create if it doesn't already exist
    if (!existingAttribute) {
      const [newAttribute] = await db.insert(attributes).values({
        entityType: 'user',
        entityId: userId,
        key: attr.key,
        value: attr.value,
      }).returning();
      processedAttributes.push(newAttribute);
    }
  }
  
  return processedAttributes;
}

// Complete journal day with memory and rating
journalsRouter.post('/:id/complete-day', jwtMiddleware, userMiddleware, zValidator('json', completeJournalDaySchema), async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  const { dayMemory, dayRating } = c.req.valid('json');
  
  // Get the journal and verify ownership
  const journal = await db.query.journals.findFirst({
    where: and(eq(journals.id, journalId), eq(journals.userId, user.id)),
  });
  
  if (!journal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  if (journal.status !== 'completed') {
    return c.json({ error: 'Journal must be completed before adding day completion data' }, 400);
  }
  
  // Update journal with day completion data
  const [updatedJournal] = await db.update(journals)
    .set({
      dayMemory,
      dayRating,
      updatedAt: new Date(),
    })
    .where(eq(journals.id, journalId))
    .returning();
  
  return c.json({
    journal: updatedJournal,
    message: 'Day completion data saved successfully'
  });
});

export default journalsRouter;
