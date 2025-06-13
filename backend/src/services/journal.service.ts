import { eq, and, desc, between } from 'drizzle-orm'
import { db } from '../db'
import { 
  journalEntries, 
  contentTags, 
  toneTags,
  journalContentTags,
  journalToneTags,
  journalCharacterStats,
  journalExperiments,
  characterStats
} from '../db/schema'
import { 
  CreateJournalEntryInput, 
  ContinueConversationInput, 
  UpdateJournalEntryInput,
  JournalEntry, 
  JournalEntryWithTags 
} from '../types'
import { parseDate, calculateXpForEntry } from '../utils/helpers'
import { generateFollowUpQuestion, extractInsights, ConversationMessage } from '../utils/openai'
import { CharacterStatsService } from './character-stats.service'

export class JournalService {
  static async create(userId: string, input: CreateJournalEntryInput): Promise<JournalEntry | null> {
    try {
      const initialMessage: ConversationMessage = {
        role: 'user',
        content: input.initialMessage,
        timestamp: new Date().toISOString()
      }

      const [newEntry] = await db.insert(journalEntries).values({
        userId,
        entryDate: parseDate(input.entryDate),
        conversationData: {
          messages: [initialMessage],
          isComplete: false
        }
      }).returning()

      // Link to experiments if provided
      if (input.experimentIds && input.experimentIds.length > 0) {
        for (const experimentId of input.experimentIds) {
          await db.insert(journalExperiments).values({
            journalEntryId: newEntry.id,
            experimentId
          })
        }
      }

      return newEntry
    } catch (error) {
      console.error('Create journal entry error:', error)
      return null
    }
  }

  static async continueConversation(
    entryId: string, 
    userId: string, 
    input: ContinueConversationInput
  ): Promise<{ entry: JournalEntry; followUpQuestion: string | null } | null> {
    try {
      // Get current entry
      const entry = await db.query.journalEntries.findFirst({
        where: and(
          eq(journalEntries.id, entryId),
          eq(journalEntries.userId, userId)
        )
      })

      if (!entry || entry.conversationData.isComplete) {
        return null
      }

      // Add user message
      const userMessage: ConversationMessage = {
        role: 'user',
        content: input.message,
        timestamp: new Date().toISOString()
      }

      const updatedMessages = [...entry.conversationData.messages, userMessage]

      // Generate follow-up question
      const followUpResponse = await generateFollowUpQuestion(updatedMessages)
      
      let assistantMessage: ConversationMessage | null = null
      let isComplete = false

      if (followUpResponse === 'CONVERSATION_COMPLETE') {
        isComplete = true
      } else {
        assistantMessage = {
          role: 'assistant',
          content: followUpResponse,
          timestamp: new Date().toISOString()
        }
        updatedMessages.push(assistantMessage)
      }

      // Update the entry
      const [updatedEntry] = await db.update(journalEntries)
        .set({
          conversationData: {
            messages: updatedMessages,
            isComplete
          },
          updatedAt: new Date()
        })
        .where(eq(journalEntries.id, entryId))
        .returning()

      // If conversation is complete, extract insights
      if (isComplete) {
        await this.extractAndSaveInsights(entryId, userId, updatedMessages)
      }

      return {
        entry: updatedEntry,
        followUpQuestion: assistantMessage?.content || null
      }
    } catch (error) {
      console.error('Continue conversation error:', error)
      return null
    }
  }

  private static async extractAndSaveInsights(
    entryId: string, 
    userId: string, 
    messages: ConversationMessage[]
  ): Promise<void> {
    try {
      // Get existing tags and character stats
      const [existingContentTags, existingCharacterStats] = await Promise.all([
        db.query.contentTags.findMany({
          where: eq(contentTags.userId, userId)
        }),
        db.query.characterStats.findMany({
          where: eq(characterStats.userId, userId)
        })
      ])

      // Extract insights using OpenAI
      const insights = await extractInsights(
        messages,
        existingContentTags.map(tag => tag.name),
        existingCharacterStats
      )

      // Update the journal entry with extracted insights
      await db.update(journalEntries)
        .set({
          title: insights.title,
          summary: insights.summary,
          synopsis: insights.synopsis,
          updatedAt: new Date()
        })
        .where(eq(journalEntries.id, entryId))

      // Process content tags
      await this.processContentTags(entryId, userId, insights.contentTags)

      // Process tone tags
      await this.processToneTags(entryId, insights.toneTags)

      // Process character tags and award XP
      await this.processCharacterTags(entryId, insights.characterTags)

    } catch (error) {
      console.error('Extract insights error:', error)
    }
  }

  private static async processContentTags(entryId: string, userId: string, tagNames: string[]): Promise<void> {
    for (const tagName of tagNames) {
      // Find or create content tag
      let tag = await db.query.contentTags.findFirst({
        where: and(
          eq(contentTags.name, tagName),
          eq(contentTags.userId, userId)
        )
      })

      if (!tag) {
        [tag] = await db.insert(contentTags).values({
          userId,
          name: tagName
        }).returning()
      }

      // Link to journal entry
      await db.insert(journalContentTags).values({
        journalEntryId: entryId,
        contentTagId: tag.id
      }).onConflictDoNothing()
    }
  }

  private static async processToneTags(entryId: string, tagNames: string[]): Promise<void> {
    for (const tagName of tagNames) {
      // Find tone tag (should exist from seed data)
      const tag = await db.query.toneTags.findFirst({
        where: eq(toneTags.name, tagName)
      })

      if (tag) {
        // Link to journal entry
        await db.insert(journalToneTags).values({
          journalEntryId: entryId,
          toneTagId: tag.id
        }).onConflictDoNothing()
      }
    }
  }

  private static async processCharacterTags(entryId: string, tagNames: string[]): Promise<void> {
    const xpPerStat = calculateXpForEntry()

    for (const tagName of tagNames) {
      // Find character stat by name
      const stat = await db.query.characterStats.findFirst({
        where: eq(characterStats.name, tagName)
      })

      if (stat) {
        // Award XP and link to journal
        await CharacterStatsService.addXpFromJournal(entryId, stat.id, xpPerStat)
      }
    }
  }

  static async getByUserId(userId: string): Promise<JournalEntry[]> {
    try {
      return await db.query.journalEntries.findMany({
        where: eq(journalEntries.userId, userId),
        orderBy: [desc(journalEntries.entryDate)]
      })
    } catch (error) {
      console.error('Get journal entries error:', error)
      return []
    }
  }

  static async getById(id: string, userId: string): Promise<JournalEntryWithTags | null> {
    try {
      const entry = await db.query.journalEntries.findFirst({
        where: and(
          eq(journalEntries.id, id),
          eq(journalEntries.userId, userId)
        ),
        with: {
          journalContentTags: {
            with: {
              contentTag: true
            }
          },
          journalToneTags: {
            with: {
              toneTag: true
            }
          },
          journalCharacterStats: {
            with: {
              characterStat: true
            }
          },
          journalExperiments: {
            with: {
              experiment: true
            }
          }
        }
      })

      if (!entry) {
        return null
      }

      // Transform to the expected format
      return {
        ...entry,
        contentTags: entry.journalContentTags.map(jct => jct.contentTag),
        toneTags: entry.journalToneTags.map(jtt => jtt.toneTag),
        characterStats: entry.journalCharacterStats.map(jcs => ({
          ...jcs.characterStat,
          xpGained: jcs.xpGained
        })),
        experiments: entry.journalExperiments.map(je => je.experiment)
      } as JournalEntryWithTags
    } catch (error) {
      console.error('Get journal entry error:', error)
      return null
    }
  }

  static async update(id: string, userId: string, input: UpdateJournalEntryInput): Promise<JournalEntry | null> {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }

      if (input.title !== undefined) {
        updateData.title = input.title
      }

      if (input.summary !== undefined) {
        updateData.summary = input.summary
      }

      if (input.synopsis !== undefined) {
        updateData.synopsis = input.synopsis
      }

      if (input.entryDate !== undefined) {
        updateData.entryDate = parseDate(input.entryDate)
      }

      const [updatedEntry] = await db.update(journalEntries)
        .set(updateData)
        .where(and(
          eq(journalEntries.id, id),
          eq(journalEntries.userId, userId)
        ))
        .returning()

      return updatedEntry || null
    } catch (error) {
      console.error('Update journal entry error:', error)
      return null
    }
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db.delete(journalEntries)
        .where(and(
          eq(journalEntries.id, id),
          eq(journalEntries.userId, userId)
        ))
        .returning()

      return result.length > 0
    } catch (error) {
      console.error('Delete journal entry error:', error)
      return false
    }
  }

  static async getEntriesInDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<JournalEntry[]> {
    try {
      const start = parseDate(startDate)
      const end = parseDate(endDate)

      return await db.query.journalEntries.findMany({
        where: and(
          eq(journalEntries.userId, userId),
          between(journalEntries.entryDate, start, end)
        ),
        orderBy: desc(journalEntries.entryDate)
      })
    } catch (error) {
      console.error('Get entries in date range error:', error)
      return []
    }
  }

  static async getEntriesByExperiment(
    userId: string, 
    experimentId: string
  ): Promise<JournalEntry[]> {
    try {
      // Get journal entries that are associated with the experiment
      const entries = await db
        .select()
        .from(journalEntries)
        .innerJoin(journalExperiments, eq(journalEntries.id, journalExperiments.journalEntryId))
        .where(and(
          eq(journalEntries.userId, userId),
          eq(journalExperiments.experimentId, experimentId)
        ))
        .orderBy(desc(journalEntries.entryDate))

      return entries.map(entry => entry.journal_entries)
    } catch (error) {
      console.error('Get entries by experiment error:', error)
      return []
    }
  }
}
