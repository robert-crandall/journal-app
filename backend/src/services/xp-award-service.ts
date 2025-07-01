import { db } from '../db/connection'
import { characterStats } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { CharacterStatTagService } from './character-stat-tag-service'

interface XpAward {
  statId: string
  category: string
  xpAmount: number
  reason: string
  isPositive: boolean
}

interface XpAwardResult {
  success: boolean
  awards: XpAward[]
  errors: string[]
}

/**
 * XP Award Service
 * 
 * Handles awarding XP to character stats based on journal entries.
 * Supports both positive and negative XP awards.
 * Calculates level progression and updates stat records.
 */
export class XpAwardService {
  
  /**
   * Calculate XP based on level (standard D&D-style progression)
   */
  static calculateXpForLevel(level: number): number {
    if (level <= 1) return 0
    return Math.floor(1000 * Math.pow(level - 1, 1.5))
  }

  /**
   * Calculate level from total XP
   */
  static calculateLevelFromXp(totalXp: number): number {
    if (totalXp <= 0) return 1
    
    let level = 1
    while (this.calculateXpForLevel(level + 1) <= totalXp) {
      level++
    }
    return Math.min(level, 20) // Cap at level 20
  }

  /**
   * Generate XP awards based on journal content and stat tags
   */
  static async generateXpAwards(
    userId: string,
    statTags: string[],
    journalContent: string,
    contentTags: string[]
  ): Promise<XpAward[]> {
    try {
      if (!statTags || statTags.length === 0) {
        return []
      }

      // Get stat tag mappings
      const statMappings = await CharacterStatTagService.getStatTagMappings(userId, statTags)
      
      if (statMappings.length === 0) {
        return []
      }

      const awards: XpAward[] = []
      
      // Calculate base XP amount based on content length and quality
      const baseXp = this.calculateBaseXp(journalContent, contentTags)
      
      for (const mapping of statMappings) {
        // Calculate XP amount based on relevance and content analysis
        let xpAmount = Math.floor(baseXp * mapping.relevanceScore)
        
        // Determine if XP should be positive or negative based on content sentiment
        const isPositive = this.determineXpSentiment(journalContent, mapping.category)
        
        if (!isPositive) {
          xpAmount = -Math.floor(xpAmount * 0.5) // Negative XP is half the positive amount
        }

        const reason = this.generateXpReason(mapping.category, isPositive, journalContent)

        awards.push({
          statId: mapping.statId,
          category: mapping.category,
          xpAmount,
          reason,
          isPositive
        })
      }

      return awards
    } catch (error) {
      console.error('Error generating XP awards:', error)
      return []
    }
  }

  /**
   * Calculate base XP amount from journal content
   */
  private static calculateBaseXp(content: string, contentTags: string[]): number {
    const wordCount = content.split(/\s+/).length
    
    // Base XP calculation
    let baseXp = Math.min(Math.max(wordCount / 10, 5), 50) // 5-50 XP range
    
    // Bonus for meaningful content tags
    const meaningfulTags = ['reflection', 'growth', 'achievement', 'challenge', 'learning']
    const hasMeaningfulTags = contentTags.some(tag => 
      meaningfulTags.some(meaningful => tag.toLowerCase().includes(meaningful.toLowerCase()))
    )
    
    if (hasMeaningfulTags) {
      baseXp *= 1.5 // 50% bonus for meaningful content
    }
    
    return Math.floor(baseXp)
  }

  /**
   * Determine if XP should be positive or negative based on content sentiment
   */
  private static determineXpSentiment(content: string, statCategory: string): boolean {
    const contentLower = content.toLowerCase()
    
    // Negative indicators
    const negativePatterns = [
      'failed', 'failure', 'gave up', 'quit', 'disappointed', 'frustrated',
      'couldn\'t', 'didn\'t try', 'avoided', 'procrastinated', 'lazy',
      'angry', 'upset', 'sad', 'depressed', 'terrible', 'awful', 'horrible'
    ]
    
    // Positive indicators
    const positivePatterns = [
      'succeeded', 'achieved', 'accomplished', 'completed', 'finished',
      'tried', 'attempted', 'practiced', 'learned', 'improved', 'better',
      'happy', 'proud', 'excited', 'great', 'amazing', 'wonderful', 'excellent'
    ]
    
    const negativeScore = negativePatterns.reduce((score, pattern) => {
      return score + (contentLower.includes(pattern) ? 1 : 0)
    }, 0)
    
    const positiveScore = positivePatterns.reduce((score, pattern) => {
      return score + (contentLower.includes(pattern) ? 1 : 0)
    }, 0)
    
    // Default to positive if neutral or tied
    return positiveScore >= negativeScore
  }

  /**
   * Generate a reason for the XP award
   */
  private static generateXpReason(category: string, isPositive: boolean, content: string): string {
    const action = isPositive ? 'practicing' : 'struggling with'
    const contentPreview = content.substring(0, 50) + (content.length > 50 ? '...' : '')
    
    return `Journal entry shows ${action} ${category.toLowerCase()}: "${contentPreview}"`
  }

  /**
   * Award XP to character stats and update their levels
   */
  static async awardXp(userId: string, awards: XpAward[]): Promise<XpAwardResult> {
    const result: XpAwardResult = {
      success: true,
      awards: [],
      errors: []
    }

    if (!awards || awards.length === 0) {
      return result
    }

    try {
      for (const award of awards) {
        try {
          // Get current stat data
          const [currentStat] = await db
            .select()
            .from(characterStats)
            .where(eq(characterStats.id, award.statId))
            .limit(1)

          if (!currentStat) {
            result.errors.push(`Stat not found: ${award.category}`)
            continue
          }

          // Calculate new values
          const newTotalXp = Math.max(0, currentStat.totalXp + award.xpAmount)
          const newLevel = this.calculateLevelFromXp(newTotalXp)
          const newCurrentXp = newTotalXp - this.calculateXpForLevel(newLevel)

          // Update the stat
          await db
            .update(characterStats)
            .set({
              currentXp: newCurrentXp,
              currentLevel: newLevel,
              totalXp: newTotalXp,
              updatedAt: new Date()
            })
            .where(eq(characterStats.id, award.statId))

          result.awards.push({
            ...award,
            // Include updated information in the result
          })

        } catch (error) {
          console.error(`Error awarding XP to stat ${award.category}:`, error)
          result.errors.push(`Failed to award XP to ${award.category}`)
        }
      }

      if (result.errors.length > 0) {
        result.success = false
      }

    } catch (error) {
      console.error('Error in XP award process:', error)
      result.success = false
      result.errors.push('Failed to process XP awards')
    }

    return result
  }

  /**
   * Process journal entry for XP awards (combines generation and awarding)
   */
  static async processJournalForXp(
    userId: string,
    statTags: string[],
    journalContent: string,
    contentTags: string[]
  ): Promise<XpAwardResult> {
    try {
      // Generate XP awards
      const awards = await this.generateXpAwards(userId, statTags, journalContent, contentTags)
      
      if (awards.length === 0) {
        return {
          success: true,
          awards: [],
          errors: []
        }
      }

      // Award the XP
      return await this.awardXp(userId, awards)
      
    } catch (error) {
      console.error('Error processing journal for XP:', error)
      return {
        success: false,
        awards: [],
        errors: ['Failed to process journal for XP awards']
      }
    }
  }
}
