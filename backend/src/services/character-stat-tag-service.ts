import { db } from '../db/connection'
import { characters, characterStats } from '../db/schema'
import { eq } from 'drizzle-orm'

interface StatTagMapping {
  statId: string
  category: string
  relevanceScore: number // 0-1 how relevant this stat is to the content
}

/**
 * Character Stat Tag Service
 * 
 * Maps journal content to existing user character stats only.
 * Does NOT create new stats - strictly uses existing stats.
 * Used for awarding XP to relevant character stats.
 */
export class CharacterStatTagService {
  
  /**
   * Get all existing character stats for a user
   */
  static async getUserCharacterStats(userId: string): Promise<Array<{
    id: string
    category: string
    characterId: string
  }>> {
    try {
      // Get user's character
      const [userCharacter] = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1)

      if (!userCharacter) {
        return []
      }

      // Get all stats for the character
      const stats = await db
        .select({
          id: characterStats.id,
          category: characterStats.category,
          characterId: characterStats.characterId
        })
        .from(characterStats)
        .where(eq(characterStats.characterId, userCharacter.id))

      return stats
    } catch (error) {
      console.error('Error fetching user character stats:', error)
      return []
    }
  }

  /**
   * Map suggested stat tags to existing user stats only
   * Filters out any tags that don't match existing stats
   */
  static async mapToExistingStats(
    userId: string,
    suggestedStatTags: string[]
  ): Promise<string[]> {
    try {
      if (!suggestedStatTags || suggestedStatTags.length === 0) {
        return []
      }

      // Get user's existing stats
      const existingStats = await this.getUserCharacterStats(userId)
      
      if (existingStats.length === 0) {
        return []
      }

      // Create a map for quick lookup (case-insensitive)
      const existingStatMap = new Map<string, string>()
      for (const stat of existingStats) {
        existingStatMap.set(stat.category.toLowerCase(), stat.category)
      }

      // Filter suggested tags to only include existing stats
      const validStatTags: string[] = []
      
      for (const suggestedTag of suggestedStatTags) {
        const normalizedTag = suggestedTag.toLowerCase().trim()
        
        if (!normalizedTag) continue
        
        // Check for exact match
        if (existingStatMap.has(normalizedTag)) {
          const exactMatch = existingStatMap.get(normalizedTag)!
          if (!validStatTags.includes(exactMatch)) {
            validStatTags.push(exactMatch)
          }
          continue
        }

        // Check for partial matches (stat contains suggested tag or vice versa)
        const existingEntries = Array.from(existingStatMap.entries())
        for (const [existingNormalized, existingOriginal] of existingEntries) {
          if (existingNormalized.includes(normalizedTag) || normalizedTag.includes(existingNormalized)) {
            if (!validStatTags.includes(existingOriginal)) {
              validStatTags.push(existingOriginal)
            }
            break
          }
        }
      }

      return validStatTags
    } catch (error) {
      console.error('Error mapping stat tags to existing stats:', error)
      return []
    }
  }

  /**
   * Get stat tag mappings with relevance scores for XP awarding
   * Returns only existing stats with relevance scores
   */
  static async getStatTagMappings(
    userId: string,
    suggestedStatTags: string[]
  ): Promise<StatTagMapping[]> {
    try {
      const validStatTags = await this.mapToExistingStats(userId, suggestedStatTags)
      
      if (validStatTags.length === 0) {
        return []
      }

      // Get user's existing stats with IDs
      const existingStats = await this.getUserCharacterStats(userId)
      
      const mappings: StatTagMapping[] = []
      
      for (const validTag of validStatTags) {
        const stat = existingStats.find(s => s.category === validTag)
        if (stat) {
          mappings.push({
            statId: stat.id,
            category: stat.category,
            relevanceScore: 1.0 // For now, all matched stats get full relevance
          })
        }
      }

      return mappings
    } catch (error) {
      console.error('Error getting stat tag mappings:', error)
      return []
    }
  }

  /**
   * Get statistics about stat tag usage for analytics
   */
  static async getStatTagUsageStats(userId: string): Promise<{
    totalStats: number
    recentlyUsedStats: string[]
    unusedStats: string[]
  }> {
    try {
      const existingStats = await this.getUserCharacterStats(userId)
      
      // For now, return basic stats - can be enhanced with actual usage tracking
      return {
        totalStats: existingStats.length,
        recentlyUsedStats: existingStats.slice(0, 5).map(s => s.category), // Mock data
        unusedStats: existingStats.slice(5).map(s => s.category) // Mock data
      }
    } catch (error) {
      console.error('Error getting stat tag usage stats:', error)
      return {
        totalStats: 0,
        recentlyUsedStats: [],
        unusedStats: []
      }
    }
  }

  /**
   * Validate that stat tags only contain existing user stats
   */
  static async validateStatTags(userId: string, statTags: string[]): Promise<boolean> {
    try {
      if (!statTags || statTags.length === 0) {
        return true // Empty is valid
      }

      const existingStats = await this.getUserCharacterStats(userId)
      const existingCategories = existingStats.map(s => s.category)
      
      // All stat tags must exist in user's character stats
      return statTags.every(tag => existingCategories.includes(tag))
    } catch (error) {
      console.error('Error validating stat tags:', error)
      return false
    }
  }
}
