/**
 * Journal History Service
 * Provides enhanced search, filtering, and analytics for journal conversations
 */

import { db } from '../db/connection'
import { journalConversations, journalEntries } from '../db/schema'
import { eq, and, desc, gte, lte, like, sql, inArray, or } from 'drizzle-orm'

export interface JournalSearchFilters {
  userId: string
  search?: string  // Search in title, summary, synopsis
  tags?: string[]  // Filter by content tags
  statTags?: string[]  // Filter by character stat tags
  mood?: string  // Filter by mood
  startDate?: Date  // Date range start
  endDate?: Date  // Date range end
  limit?: number
  offset?: number
}

export interface JournalSearchResult {
  conversations: any[]
  total: number
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface JournalStats {
  totalConversations: number
  tagFrequency: Record<string, number>
  moodDistribution: Record<string, number>
  statTagFrequency: Record<string, number>
  recentActivity: {
    last7Days: number
    last30Days: number
  }
}

export class JournalHistoryService {
  /**
   * Search and filter journal conversations with advanced options
   */
  static async searchConversations(filters: JournalSearchFilters): Promise<JournalSearchResult> {
    const {
      userId,
      search,
      tags,
      statTags,
      mood,
      startDate,
      endDate,
      limit = 20,
      offset = 0
    } = filters

    // Build dynamic WHERE conditions
    const whereConditions = [eq(journalConversations.userId, userId)]

    // If searching for text, we need to search both metadata and entry content
    let conversationIds: string[] = []
    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.toLowerCase()}%`
      
      // Search in conversation metadata
      const metadataMatches = await db
        .select({ id: journalConversations.id })
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          or(
            sql`LOWER(${journalConversations.title}) LIKE ${searchTerm}`,
            sql`LOWER(${journalConversations.summary}) LIKE ${searchTerm}`,
            sql`LOWER(${journalConversations.synopsis}) LIKE ${searchTerm}`
          )!
        ))

      // Search in journal entry content
      const contentMatches = await db
        .select({ id: journalConversations.id })
        .from(journalEntries)
        .innerJoin(journalConversations, eq(journalEntries.conversationId, journalConversations.id))
        .where(and(
          eq(journalConversations.userId, userId),
          sql`LOWER(${journalEntries.content}) LIKE ${searchTerm}`
        ))

      // Combine both sets of conversation IDs
      const allMatches = [...metadataMatches, ...contentMatches]
      conversationIds = Array.from(new Set(allMatches.map(match => match.id)))
      
      if (conversationIds.length > 0) {
        whereConditions.push(inArray(journalConversations.id, conversationIds))
      } else {
        // No matches found, return empty result
        return {
          conversations: [],
          total: 0,
          pagination: {
            limit,
            offset,
            hasMore: false
          }
        }
      }
    }

    // Filter by content tags
    if (tags && tags.length > 0) {
      // Check if any of the provided tags exist in the contentTags JSON array
      const tagConditions = tags.map(tag => 
        sql`${journalConversations.contentTags} ? ${tag}`
      )
      whereConditions.push(or(...tagConditions)!)
    }

    // Filter by stat tags
    if (statTags && statTags.length > 0) {
      // Check if any of the provided stat tags exist in the statTags JSON array
      const statTagConditions = statTags.map(tag => 
        sql`${journalConversations.statTags} ? ${tag}`
      )
      whereConditions.push(or(...statTagConditions)!)
    }

    // Filter by mood
    if (mood) {
      whereConditions.push(eq(journalConversations.mood, mood))
    }

    // Date range filtering
    if (startDate) {
      whereConditions.push(gte(journalConversations.createdAt, startDate))
    }
    if (endDate) {
      whereConditions.push(lte(journalConversations.createdAt, endDate))
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(journalConversations)
      .where(and(...whereConditions))

    // Get conversations with all metadata
    const conversations = await db
      .select({
        id: journalConversations.id,
        userId: journalConversations.userId,
        title: journalConversations.title,
        summary: journalConversations.summary,
        synopsis: journalConversations.synopsis,
        contentTags: journalConversations.contentTags,
        statTags: journalConversations.statTags,
        mood: journalConversations.mood,
        isActive: journalConversations.isActive,
        startedAt: journalConversations.startedAt,
        endedAt: journalConversations.endedAt,
        createdAt: journalConversations.createdAt,
        updatedAt: journalConversations.updatedAt
      })
      .from(journalConversations)
      .where(and(...whereConditions))
      .orderBy(desc(journalConversations.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      conversations,
      total: Number(count),
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < Number(count)
      }
    }
  }

  /**
   * Get journal statistics and analytics
   */
  static async getJournalStats(userId: string): Promise<JournalStats> {
    // Get all conversations for the user
    const conversations = await db
      .select({
        contentTags: journalConversations.contentTags,
        statTags: journalConversations.statTags,
        mood: journalConversations.mood,
        createdAt: journalConversations.createdAt
      })
      .from(journalConversations)
      .where(eq(journalConversations.userId, userId))

    const totalConversations = conversations.length

    // Calculate tag frequencies
    const tagFrequency: Record<string, number> = {}
    const statTagFrequency: Record<string, number> = {}
    const moodDistribution: Record<string, number> = {}

    for (const conv of conversations) {
      // Count content tags
      if (conv.contentTags && Array.isArray(conv.contentTags)) {
        for (const tag of conv.contentTags) {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
        }
      }

      // Count stat tags
      if (conv.statTags && Array.isArray(conv.statTags)) {
        for (const statTag of conv.statTags) {
          statTagFrequency[statTag] = (statTagFrequency[statTag] || 0) + 1
        }
      }

      // Count moods
      if (conv.mood) {
        moodDistribution[conv.mood] = (moodDistribution[conv.mood] || 0) + 1
      }
    }

    // Calculate recent activity
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentActivity = {
      last7Days: conversations.filter(c => c.createdAt >= last7Days).length,
      last30Days: conversations.filter(c => c.createdAt >= last30Days).length
    }

    return {
      totalConversations,
      tagFrequency,
      moodDistribution,
      statTagFrequency,
      recentActivity
    }
  }

  /**
   * Search within journal entry content (full-text search)
   */
  static async searchJournalContent(
    userId: string,
    query: string,
    searchIn: 'content' | 'metadata' | 'all' = 'all',
    limit: number = 20,
    offset: number = 0
  ) {
    const searchTerm = `%${query.toLowerCase()}%`
    
    if (searchIn === 'content' || searchIn === 'all') {
      // Search within journal entries
      const entryResults = await db
        .select({
          entryId: journalEntries.id,
          entryContent: journalEntries.content,
          entryRole: journalEntries.role,
          conversationId: journalEntries.conversationId,
          conversationTitle: journalConversations.title,
          conversationSummary: journalConversations.summary,
          conversationSynopsis: journalConversations.synopsis,
          conversationTags: journalConversations.contentTags,
          conversationStatTags: journalConversations.statTags,
          conversationMood: journalConversations.mood,
          conversationCreatedAt: journalConversations.createdAt
        })
        .from(journalEntries)
        .innerJoin(journalConversations, eq(journalEntries.conversationId, journalConversations.id))
        .where(and(
          eq(journalConversations.userId, userId),
          sql`LOWER(${journalEntries.content}) LIKE ${searchTerm}`
        ))
        .orderBy(desc(journalConversations.createdAt))
        .limit(limit)
        .offset(offset)

      return {
        results: entryResults.map(entry => ({
          type: 'content',
          matches: [entry.entryContent],
          conversation: {
            id: entry.conversationId,
            title: entry.conversationTitle,
            summary: entry.conversationSummary,
            synopsis: entry.conversationSynopsis,
            contentTags: entry.conversationTags,
            statTags: entry.conversationStatTags,
            mood: entry.conversationMood,
            createdAt: entry.conversationCreatedAt
          }
        })),
        total: entryResults.length
      }
    }

    if (searchIn === 'metadata' || searchIn === 'all') {
      // Search within conversation metadata
      const metadataResults = await db
        .select()
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          or(
            sql`LOWER(${journalConversations.title}) LIKE ${searchTerm}`,
            sql`LOWER(${journalConversations.summary}) LIKE ${searchTerm}`,
            sql`LOWER(${journalConversations.synopsis}) LIKE ${searchTerm}`
          )!
        ))
        .orderBy(desc(journalConversations.createdAt))
        .limit(limit)
        .offset(offset)

      return {
        results: metadataResults.map(conv => ({
          type: 'metadata',
          matches: [conv.title, conv.summary, conv.synopsis].filter(Boolean),
          conversation: conv
        })),
        total: metadataResults.length
      }
    }

    return { results: [], total: 0 }
  }

  /**
   * Get popular tags for autocomplete/suggestions
   */
  static async getPopularTags(userId: string, type: 'content' | 'stat' = 'content', limit: number = 20) {
    const column = type === 'content' ? journalConversations.contentTags : journalConversations.statTags
    
    const result = await db.execute(sql`
      SELECT 
        tag,
        COUNT(*) as frequency
      FROM (
        SELECT 
          jsonb_array_elements_text(${column}) as tag
        FROM journal_conversations 
        WHERE user_id = ${userId} 
          AND ${column} IS NOT NULL 
          AND ${column} != 'null'
      ) tag_list
      GROUP BY tag
      ORDER BY frequency DESC, tag ASC
      LIMIT ${limit}
    `)

    return (result as any[]).map((row: any) => ({
      tag: row.tag as string,
      frequency: parseInt(row.frequency as string)
    }))
  }
}
