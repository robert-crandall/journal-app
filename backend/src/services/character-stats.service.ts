import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { characterStats, journalCharacterStats } from '../db/schema'
import { CreateCharacterStatInput, UpdateCharacterStatInput, CharacterStat } from '../types'

export class CharacterStatsService {
  static async create(userId: string, input: CreateCharacterStatInput): Promise<CharacterStat | null> {
    try {
      const [newStat] = await db.insert(characterStats).values({
        userId,
        name: input.name,
        description: input.description,
        currentXp: 0,
      }).returning()

      return newStat
    } catch (error) {
      console.error('Create character stat error:', error)
      return null
    }
  }

  static async getByUserId(userId: string): Promise<CharacterStat[]> {
    try {
      return await db.query.characterStats.findMany({
        where: eq(characterStats.userId, userId),
        orderBy: (stats, { asc }) => [asc(stats.name)]
      })
    } catch (error) {
      console.error('Get character stats error:', error)
      return []
    }
  }

  static async getById(id: string, userId: string): Promise<CharacterStat | null> {
    try {
      const result = await db.query.characterStats.findFirst({
        where: and(
          eq(characterStats.id, id),
          eq(characterStats.userId, userId)
        )
      })
      return result || null
    } catch (error) {
      console.error('Get character stat error:', error)
      return null
    }
  }

  static async update(id: string, userId: string, input: UpdateCharacterStatInput): Promise<CharacterStat | null> {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }

      if (input.name !== undefined) {
        updateData.name = input.name
      }

      if (input.description !== undefined) {
        updateData.description = input.description
      }

      const [updatedStat] = await db.update(characterStats)
        .set(updateData)
        .where(and(
          eq(characterStats.id, id),
          eq(characterStats.userId, userId)
        ))
        .returning()

      return updatedStat || null
    } catch (error) {
      console.error('Update character stat error:', error)
      return null
    }
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db.delete(characterStats)
        .where(and(
          eq(characterStats.id, id),
          eq(characterStats.userId, userId)
        ))
        .returning()

      return result.length > 0
    } catch (error) {
      console.error('Delete character stat error:', error)
      return false
    }
  }

  static async addXp(statId: string, xp: number): Promise<boolean> {
    try {
      const stat = await db.query.characterStats.findFirst({
        where: eq(characterStats.id, statId)
      })

      if (!stat) {
        return false
      }

      await db.update(characterStats)
        .set({
          currentXp: stat.currentXp + xp,
          updatedAt: new Date()
        })
        .where(eq(characterStats.id, statId))

      return true
    } catch (error) {
      console.error('Add XP error:', error)
      return false
    }
  }

  static async addXpFromJournal(journalEntryId: string, statId: string, xp: number): Promise<boolean> {
    try {
      // First add the XP to the stat
      const success = await this.addXp(statId, xp)
      
      if (!success) {
        return false
      }

      // Then record the journal-stat relationship
      await db.insert(journalCharacterStats).values({
        journalEntryId,
        characterStatId: statId,
        xpGained: xp,
      })

      return true
    } catch (error) {
      console.error('Add XP from journal error:', error)
      return false
    }
  }
}
