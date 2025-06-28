/**
 * Content Tag Service for Journal System
 * Manages content tags with preference for existing tags while allowing new tag creation
 * Implements Task 5.5: Content tag system with preference for existing tags
 */

import { db } from '../db/connection'
import { journalConversations } from '../db/schema'
import { sql, desc } from 'drizzle-orm'

export interface ContentTagSuggestion {
  tag: string
  frequency: number
  isExisting: boolean
}

export class ContentTagService {
  /**
   * Get existing content tags ordered by frequency of use
   */
  static async getExistingTags(userId: string): Promise<ContentTagSuggestion[]> {
    try {
      // Query to get all content tags from user's journal conversations
      const result = await db.execute(sql`
        SELECT 
          tag,
          COUNT(*) as frequency
        FROM (
          SELECT 
            jsonb_array_elements_text(content_tags) as tag
          FROM journal_conversations 
          WHERE user_id = ${userId} 
            AND content_tags IS NOT NULL 
            AND content_tags != 'null'
        ) tag_list
        GROUP BY tag
        ORDER BY frequency DESC, tag ASC
      `)

      return (result as any[]).map((row: any) => ({
        tag: row.tag as string,
        frequency: parseInt(row.frequency as string),
        isExisting: true
      }))
    } catch (error) {
      console.error('Error fetching existing content tags:', error)
      return []
    }
  }

  /**
   * Get predefined content tags that should be preferred
   */
  static getPredefinedTags(): string[] {
    return [
      // Emotions/Moods
      'happy', 'sad', 'excited', 'grateful', 'worried', 'frustrated', 'proud',
      'anxious', 'calm', 'stressed', 'joyful', 'disappointed', 'hopeful',
      
      // Activities
      'family', 'work', 'adventure', 'exercise', 'creative', 'social', 'learning',
      'cooking', 'reading', 'travel', 'outdoor', 'indoor', 'hobby', 'music',
      'art', 'writing', 'photography',
      
      // Themes
      'challenge', 'growth', 'reflection', 'achievement', 'relationship',
      'health', 'wellness', 'career', 'parenting', 'friendship', 'romance',
      'goal', 'project', 'milestone', 'celebration', 'vacation',
      
      // General
      'morning', 'evening', 'weekend', 'weekday', 'routine', 'spontaneous',
      'planning', 'organizing', 'cleaning', 'shopping', 'cooking', 'eating'
    ]
  }

  /**
   * Process and optimize content tags by preferring existing tags
   */
  static async optimizeContentTags(
    userId: string, 
    suggestedTags: string[]
  ): Promise<string[]> {
    if (!suggestedTags || suggestedTags.length === 0) {
      return ['reflection'] // Default fallback
    }

    // Get existing user tags and predefined tags
    const [existingTags, predefinedTags] = await Promise.all([
      this.getExistingTags(userId),
      Promise.resolve(this.getPredefinedTags())
    ])

    // Create lookup maps for efficient checking
    const existingTagMap = new Map(existingTags.map(t => [t.tag.toLowerCase(), t]))
    const predefinedTagSet = new Set(predefinedTags.map(t => t.toLowerCase()))

    const optimizedTags: string[] = []
    const processedTags = new Set<string>()

    for (const suggestedTag of suggestedTags) {
      const normalizedTag = suggestedTag.toLowerCase().trim()
      
      if (!normalizedTag || processedTags.has(normalizedTag)) {
        continue // Skip empty or duplicate tags
      }

      let finalTag = suggestedTag

      // 1. Check if tag exactly matches existing user tag
      if (existingTagMap.has(normalizedTag)) {
        finalTag = existingTagMap.get(normalizedTag)!.tag
      }
      // 2. Check if tag matches predefined tag
      else if (predefinedTagSet.has(normalizedTag)) {
        finalTag = predefinedTags.find(t => t.toLowerCase() === normalizedTag) || suggestedTag
      }
      // 3. Check for similar existing tags (fuzzy matching)
      else {
        const similarTag = this.findSimilarTag(normalizedTag, existingTags.map(t => t.tag))
        if (similarTag) {
          finalTag = similarTag
        }
      }

      optimizedTags.push(finalTag)
      processedTags.add(normalizedTag)

      // Limit to 6 tags maximum
      if (optimizedTags.length >= 6) {
        break
      }
    }

    // Ensure we have at least one tag
    if (optimizedTags.length === 0) {
      optimizedTags.push('reflection')
    }

    return optimizedTags
  }

  /**
   * Find similar tag using basic fuzzy matching
   */
  private static findSimilarTag(targetTag: string, existingTags: string[]): string | null {
    const target = targetTag.toLowerCase()
    
    // Check for exact substring matches
    for (const existing of existingTags) {
      const existingLower = existing.toLowerCase()
      if (existingLower.includes(target) || target.includes(existingLower)) {
        // Only match if the similarity is significant
        const similarity = this.calculateSimilarity(target, existingLower)
        if (similarity > 0.6) {
          return existing
        }
      }
    }

    // Check for common variations
    const variations = this.getTagVariations(target)
    for (const variation of variations) {
      const match = existingTags.find(tag => tag.toLowerCase() === variation)
      if (match) {
        return match
      }
    }

    return null
  }

  /**
   * Calculate similarity between two strings (simple implementation)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * Get common variations of a tag
   */
  private static getTagVariations(tag: string): string[] {
    const variations: string[] = []
    
    // Common word variations
    const wordMappings: Record<string, string[]> = {
      'work': ['job', 'career', 'professional', 'office'],
      'family': ['kids', 'children', 'parenting', 'relatives'],
      'exercise': ['workout', 'fitness', 'gym', 'sport'],
      'creative': ['art', 'artistic', 'creativity'],
      'happy': ['joy', 'joyful', 'pleased', 'content'],
      'sad': ['upset', 'down', 'blue', 'melancholy'],
      'worried': ['anxious', 'concerned', 'nervous'],
      'excited': ['thrilled', 'enthusiastic', 'eager']
    }
    
    // Add direct variations
    if (wordMappings[tag]) {
      variations.push(...wordMappings[tag])
    }
    
    // Add reverse mappings
    for (const [key, values] of Object.entries(wordMappings)) {
      if (values.includes(tag)) {
        variations.push(key)
        variations.push(...values.filter(v => v !== tag))
      }
    }
    
    return Array.from(new Set(variations)) // Remove duplicates
  }

  /**
   * Get content tag statistics for a user
   */
  static async getTagStatistics(userId: string): Promise<{
    totalTags: number
    uniqueTags: number
    mostUsedTags: ContentTagSuggestion[]
    recentTags: string[]
  }> {
    try {
      const existingTags = await this.getExistingTags(userId)
      
      // Get recent tags from last 30 days
      const recentResult = await db.execute(sql`
        SELECT DISTINCT 
          jsonb_array_elements_text(content_tags) as tag
        FROM journal_conversations 
        WHERE user_id = ${userId} 
          AND content_tags IS NOT NULL 
          AND content_tags != 'null'
          AND created_at > NOW() - INTERVAL '30 days'
        ORDER BY tag
      `)
      
      const recentTags = (recentResult as any[]).map((row: any) => row.tag as string)
      const totalTags = existingTags.reduce((sum, tag) => sum + tag.frequency, 0)
      
      return {
        totalTags,
        uniqueTags: existingTags.length,
        mostUsedTags: existingTags.slice(0, 10), // Top 10 most used
        recentTags
      }
    } catch (error) {
      console.error('Error fetching tag statistics:', error)
      return {
        totalTags: 0,
        uniqueTags: 0,
        mostUsedTags: [],
        recentTags: []
      }
    }
  }
}
