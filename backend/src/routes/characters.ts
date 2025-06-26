import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db/connection'
import { characters, characterStats, users } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { 
  calculateLevelFromTotalXp, 
  calculateLevelUpRewards, 
  isReadyToLevelUp,
  type LevelCalculation 
} from '../utils/xp-calculator'

// Validation schemas
const createCharacterSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(255),
  class: z.string().min(1, 'Character class is required').max(100),
  backstory: z.string().optional(),
})

const updateCharacterSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  class: z.string().min(1).max(100).optional(),
  backstory: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Character stats validation schemas
const createStatSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().optional(),
  sampleActivities: z.array(z.string()).optional(),
})

const updateStatSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  sampleActivities: z.array(z.string()).optional(),
})

// Predefined stat categories that cannot be deleted
const PREDEFINED_STATS = [
  'Physical Health',
  'Mental Wellness', 
  'Family Bonding',
  'Professional Growth',
  'Creative Expression',
  'Social Connection'
] as const

// Character class options for frontend
const CHARACTER_CLASSES = [
  'Life Explorer',
  'Daily Adventurer', 
  'Family Guardian',
  'Habit Warrior',
  'Goal Achiever',
  'Wellness Champion',
  'Creative Spirit',
  'Learning Scholar',
  'Social Connector',
  'Balance Seeker'
] as const

const app = new Hono()
  // Get available character classes
  .get('/classes', (c) => {
    return c.json({ 
      classes: CHARACTER_CLASSES,
      count: CHARACTER_CLASSES.length 
    })
  })
  
  // Get all characters for a user
  .get('/', async (c) => {
    // TODO: Get userId from JWT token in middleware
    // For now, using query param for testing
    const userId = c.req.query('userId')
    
    if (!userId) {
      throw new HTTPException(400, { message: 'User ID is required' })
    }

    try {
      const userCharacters = await db
        .select({
          id: characters.id,
          name: characters.name,
          class: characters.class,
          backstory: characters.backstory,
          isActive: characters.isActive,
          createdAt: characters.createdAt,
          updatedAt: characters.updatedAt,
        })
        .from(characters)
        .where(eq(characters.userId, userId))

      return c.json({ characters: userCharacters })
    } catch (error) {
      console.error('Error fetching characters:', error)
      throw new HTTPException(500, { message: 'Failed to fetch characters' })
    }
  })

  // Get a specific character with stats
  .get('/:id', async (c) => {
    const characterId = c.req.param('id')
    const userId = c.req.query('userId') // TODO: Get from JWT token

    if (!userId) {
      throw new HTTPException(400, { message: 'User ID is required' })
    }

    try {
      // Get character with user verification
      const [character] = await db
        .select()
        .from(characters)
        .where(and(
          eq(characters.id, characterId),
          eq(characters.userId, userId)
        ))

      if (!character) {
        throw new HTTPException(404, { message: 'Character not found' })
      }

      // Get character stats
      const stats = await db
        .select()
        .from(characterStats)
        .where(eq(characterStats.characterId, characterId))

      return c.json({ 
        character: {
          ...character,
          stats
        }
      })
    } catch (error) {
      console.error('Error fetching character:', error)
      if (error instanceof HTTPException) throw error
      throw new HTTPException(500, { message: 'Failed to fetch character' })
    }
  })

  // Create a new character
  .post('/', 
    zValidator('json', createCharacterSchema),
    async (c) => {
      const data = c.req.valid('json')
      const userId = c.req.query('userId') // TODO: Get from JWT token

      if (!userId) {
        throw new HTTPException(400, { message: 'User ID is required' })
      }

      try {
        // Verify user exists
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, userId))

        if (!user) {
          throw new HTTPException(404, { message: 'User not found' })
        }

        // Check if user already has an active character
        const [existingCharacter] = await db
          .select({ id: characters.id })
          .from(characters)
          .where(and(
            eq(characters.userId, userId),
            eq(characters.isActive, true)
          ))

        if (existingCharacter) {
          throw new HTTPException(409, { 
            message: 'User already has an active character. Deactivate the current character first.' 
          })
        }

        // Create the character
        const [newCharacter] = await db
          .insert(characters)
          .values({
            userId,
            name: data.name,
            class: data.class,
            backstory: data.backstory,
            isActive: true,
          })
          .returning()

        // Create default character stats
        const defaultStats = [
          {
            characterId: newCharacter.id,
            category: 'Physical Health',
            description: 'Activities that improve physical fitness and wellbeing',
            sampleActivities: ['Take a 30-minute walk', 'Do 15 push-ups', 'Stretch for 10 minutes', 'Drink 8 glasses of water']
          },
          {
            characterId: newCharacter.id,
            category: 'Mental Wellness',
            description: 'Activities that support mental health and mindfulness',
            sampleActivities: ['Meditate for 10 minutes', 'Journal about your day', 'Practice deep breathing', 'Read for 20 minutes']
          },
          {
            characterId: newCharacter.id,
            category: 'Family Bonding',
            description: 'Quality time and activities with family members',
            sampleActivities: ['Play a board game', 'Cook a meal together', 'Take family photos', 'Have a meaningful conversation']
          },
          {
            characterId: newCharacter.id,
            category: 'Professional Growth',
            description: 'Career development and skill building activities',
            sampleActivities: ['Learn a new skill for 30 minutes', 'Organize workspace', 'Network with a colleague', 'Complete a training module']
          },
          {
            characterId: newCharacter.id,
            category: 'Creative Expression',
            description: 'Artistic and creative pursuits',
            sampleActivities: ['Write in a journal', 'Draw or sketch', 'Play a musical instrument', 'Try a new recipe']
          },
          {
            characterId: newCharacter.id,
            category: 'Social Connection',
            description: 'Building and maintaining relationships',
            sampleActivities: ['Call a friend', 'Write a thoughtful message', 'Attend a social event', 'Help a neighbor']
          }
        ]

        await db.insert(characterStats).values(defaultStats)

        // Fetch the complete character with stats
        const stats = await db
          .select()
          .from(characterStats)
          .where(eq(characterStats.characterId, newCharacter.id))

        return c.json({ 
          character: {
            ...newCharacter,
            stats
          }
        }, 201)

      } catch (error) {
        console.error('Error creating character:', error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: 'Failed to create character' })
      }
    }
  )

  // Update a character
  .put('/:id',
    zValidator('json', updateCharacterSchema),
    async (c) => {
      const characterId = c.req.param('id')
      const data = c.req.valid('json')
      const userId = c.req.query('userId') // TODO: Get from JWT token

      if (!userId) {
        throw new HTTPException(400, { message: 'User ID is required' })
      }

      try {
        // Verify character exists and belongs to user
        const [existingCharacter] = await db
          .select()
          .from(characters)
          .where(and(
            eq(characters.id, characterId),
            eq(characters.userId, userId)
          ))

        if (!existingCharacter) {
          throw new HTTPException(404, { message: 'Character not found' })
        }

        // Update the character
        const [updatedCharacter] = await db
          .update(characters)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(characters.id, characterId))
          .returning()

        return c.json({ character: updatedCharacter })

      } catch (error) {
        console.error('Error updating character:', error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: 'Failed to update character' })
      }
    }
  )

  // Delete a character (soft delete by setting isActive to false)
  .delete('/:id', async (c) => {
    const characterId = c.req.param('id')
    const userId = c.req.query('userId') // TODO: Get from JWT token

    if (!userId) {
      throw new HTTPException(400, { message: 'User ID is required' })
    }

    try {
      // Verify character exists and belongs to user
      const [existingCharacter] = await db
        .select()
        .from(characters)
        .where(and(
          eq(characters.id, characterId),
          eq(characters.userId, userId)
        ))

      if (!existingCharacter) {
        throw new HTTPException(404, { message: 'Character not found' })
      }

      // Soft delete by setting isActive to false
      const [deactivatedCharacter] = await db
        .update(characters)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(characters.id, characterId))
        .returning()

      return c.json({ 
        message: 'Character deactivated successfully',
        character: deactivatedCharacter 
      })

    } catch (error) {
      console.error('Error deactivating character:', error)
      if (error instanceof HTTPException) throw error
      throw new HTTPException(500, { message: 'Failed to deactivate character' })
    }
  })

  // Character Stats Management Routes

  // Get all stats for a character
  .get('/:id/stats', async (c) => {
    const characterId = c.req.param('id')
    const userId = c.req.query('userId') // TODO: Get from JWT token

    if (!userId) {
      throw new HTTPException(400, { message: 'User ID is required' })
    }

    try {
      // Verify character exists and belongs to user
      const [character] = await db
        .select()
        .from(characters)
        .where(and(
          eq(characters.id, characterId),
          eq(characters.userId, userId)
        ))

      if (!character) {
        throw new HTTPException(404, { message: 'Character not found' })
      }

      // Get all stats for the character
      const stats = await db
        .select()
        .from(characterStats)
        .where(eq(characterStats.characterId, characterId))

      return c.json({ stats })

    } catch (error) {
      console.error('Error fetching character stats:', error)
      if (error instanceof HTTPException) throw error
      throw new HTTPException(500, { message: 'Failed to fetch character stats' })
    }
  })

  // Get individual stat by ID
  .get('/:id/stats/:statId', async (c) => {
    const characterId = c.req.param('id')
    const statId = c.req.param('statId')
    const userId = c.req.query('userId') // TODO: Get from JWT token

    if (!userId) {
      throw new HTTPException(400, { message: 'User ID is required' })
    }

    try {
      // Verify character exists and belongs to user
      const [character] = await db
        .select()
        .from(characters)
        .where(and(
          eq(characters.id, characterId),
          eq(characters.userId, userId)
        ))

      if (!character) {
        throw new HTTPException(404, { message: 'Character not found' })
      }

      // Get the specific stat
      const [stat] = await db
        .select()
        .from(characterStats)
        .where(and(
          eq(characterStats.id, statId),
          eq(characterStats.characterId, characterId)
        ))

      if (!stat) {
        throw new HTTPException(404, { message: 'Character stat not found' })
      }

      return c.json({ stat })

    } catch (error) {
      console.error('Error fetching character stat:', error)
      if (error instanceof HTTPException) throw error
      throw new HTTPException(500, { message: 'Failed to fetch character stat' })
    }
  })

  // Create new custom stat
  .post('/:id/stats',
    zValidator('json', createStatSchema),
    async (c) => {
      const characterId = c.req.param('id')
      const data = c.req.valid('json')
      const userId = c.req.query('userId') // TODO: Get from JWT token

      if (!userId) {
        throw new HTTPException(400, { message: 'User ID is required' })
      }

      try {
        // Verify character exists and belongs to user
        const [character] = await db
          .select()
          .from(characters)
          .where(and(
            eq(characters.id, characterId),
            eq(characters.userId, userId)
          ))

        if (!character) {
          throw new HTTPException(404, { message: 'Character not found' })
        }

        // Check if stat category already exists for this character
        const [existingStat] = await db
          .select()
          .from(characterStats)
          .where(and(
            eq(characterStats.characterId, characterId),
            eq(characterStats.category, data.category)
          ))

        if (existingStat) {
          throw new HTTPException(409, { 
            message: 'A stat with this category already exists for this character' 
          })
        }

        // Create the new stat
        const [newStat] = await db
          .insert(characterStats)
          .values({
            characterId,
            category: data.category,
            description: data.description,
            sampleActivities: data.sampleActivities || [],
            currentXp: 0,
            currentLevel: 1,
            totalXp: 0,
          })
          .returning()

        return c.json({ stat: newStat }, 201)

      } catch (error) {
        console.error('Error creating character stat:', error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: 'Failed to create character stat' })
      }
    }
  )

  // Update existing stat
  .put('/:id/stats/:statId',
    zValidator('json', updateStatSchema),
    async (c) => {
      const characterId = c.req.param('id')
      const statId = c.req.param('statId')
      const data = c.req.valid('json')
      const userId = c.req.query('userId') // TODO: Get from JWT token

      if (!userId) {
        throw new HTTPException(400, { message: 'User ID is required' })
      }

      try {
        // Verify character exists and belongs to user
        const [character] = await db
          .select()
          .from(characters)
          .where(and(
            eq(characters.id, characterId),
            eq(characters.userId, userId)
          ))

        if (!character) {
          throw new HTTPException(404, { message: 'Character not found' })
        }

        // Check that the stat exists and belongs to this character
        const [existingStat] = await db
          .select()
          .from(characterStats)
          .where(and(
            eq(characterStats.id, statId),
            eq(characterStats.characterId, characterId)
          ))

        if (!existingStat) {
          throw new HTTPException(404, { message: 'Character stat not found' })
        }

        // If updating category, check for conflicts
        if (data.category && data.category !== existingStat.category) {
          const [conflictingStat] = await db
            .select()
            .from(characterStats)
            .where(and(
              eq(characterStats.characterId, characterId),
              eq(characterStats.category, data.category)
            ))

          if (conflictingStat) {
            throw new HTTPException(409, { 
              message: 'A stat with this category already exists for this character' 
            })
          }
        }

        // Update the stat
        const [updatedStat] = await db
          .update(characterStats)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(characterStats.id, statId))
          .returning()

        return c.json({ stat: updatedStat })

      } catch (error) {
        console.error('Error updating character stat:', error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: 'Failed to update character stat' })
      }
    }
  )

  // Delete custom stat (prevent deletion of predefined stats)
  .delete('/:id/stats/:statId', async (c) => {
    const characterId = c.req.param('id')
    const statId = c.req.param('statId')
    const userId = c.req.query('userId') // TODO: Get from JWT token

    if (!userId) {
      throw new HTTPException(400, { message: 'User ID is required' })
    }

    try {
      // Verify character exists and belongs to user
      const [character] = await db
        .select()
        .from(characters)
        .where(and(
          eq(characters.id, characterId),
          eq(characters.userId, userId)
        ))

      if (!character) {
        throw new HTTPException(404, { message: 'Character not found' })
      }

      // Get the stat to check if it's predefined
      const [stat] = await db
        .select()
        .from(characterStats)
        .where(and(
          eq(characterStats.id, statId),
          eq(characterStats.characterId, characterId)
        ))

      if (!stat) {
        throw new HTTPException(404, { message: 'Character stat not found' })
      }

      // Prevent deletion of predefined stats
      if (PREDEFINED_STATS.includes(stat.category as any)) {
        throw new HTTPException(400, { 
          message: 'Cannot delete predefined stat categories. Only custom stats can be deleted.' 
        })
      }

      // Delete the custom stat
      await db
        .delete(characterStats)
        .where(eq(characterStats.id, statId))

      return c.json({ 
        message: 'Custom stat deleted successfully',
        deletedStat: stat 
      })

    } catch (error) {
      console.error('Error deleting character stat:', error)
      if (error instanceof HTTPException) throw error
      throw new HTTPException(500, { message: 'Failed to delete character stat' })
    }
  })

  // Level-up validation schemas
  const levelUpSchema = z.object({
    userId: z.string().uuid('Valid user ID is required'),
    statId: z.string().uuid('Valid stat ID is required'),
  })

  const levelUpAllSchema = z.object({
    userId: z.string().uuid('Valid user ID is required'),
  })

  // Level-up endpoints

  // GET /api/characters/:id/level-up-opportunities - Check which stats can level up
  app.get('/:id/level-up-opportunities', async (c) => {
    try {
      const characterId = c.req.param('id')
      const userId = c.req.query('userId')

      if (!userId) {
        throw new HTTPException(400, { message: 'User ID is required' })
      }

      // Verify character ownership
      const character = await db
        .select()
        .from(characters)
        .where(and(
          eq(characters.id, characterId),
          eq(characters.userId, userId),
          eq(characters.isActive, true)
        ))
        .limit(1)

      if (character.length === 0) {
        throw new HTTPException(404, { message: 'Character not found' })
      }

      // Get all character stats
      const stats = await db
        .select()
        .from(characterStats)
        .where(eq(characterStats.characterId, characterId))

      // Check level-up opportunities for each stat
      const opportunities = stats.map(stat => {
        const canLevelUp = isReadyToLevelUp(stat.totalXp, stat.currentLevel)
        const newLevel = canLevelUp ? calculateLevelFromTotalXp(stat.totalXp) : stat.currentLevel
        
        return {
          id: stat.id,
          category: stat.category,
          currentLevel: stat.currentLevel,
          newLevel,
          totalXp: stat.totalXp,
          canLevelUp,
          levelsGained: newLevel - stat.currentLevel
        }
      }).filter(opp => opp.canLevelUp)

      return c.json({
        characterId,
        opportunities
      })

    } catch (error) {
      console.error('Error fetching level-up opportunities:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to fetch level-up opportunities' })
    }
  })

  // POST /api/characters/:id/level-up - Level up a specific stat
  app.post('/:id/level-up', zValidator('json', levelUpSchema), async (c) => {
    try {
      const characterId = c.req.param('id')
      const { userId, statId } = c.req.valid('json')

      // Verify character ownership
      const character = await db
        .select()
        .from(characters)
        .where(and(
          eq(characters.id, characterId),
          eq(characters.userId, userId),
          eq(characters.isActive, true)
        ))
        .limit(1)

      if (character.length === 0) {
        throw new HTTPException(404, { message: 'Character not found' })
      }

      // Get the specific stat
      const [stat] = await db
        .select()
        .from(characterStats)
        .where(and(
          eq(characterStats.id, statId),
          eq(characterStats.characterId, characterId)
        ))
        .limit(1)

      if (!stat) {
        throw new HTTPException(404, { message: 'Character stat not found' })
      }

      // Check if ready to level up
      if (!isReadyToLevelUp(stat.totalXp, stat.currentLevel)) {
        throw new HTTPException(400, { 
          message: `Stat '${stat.category}' is not ready for level up. Current level: ${stat.currentLevel}, Total XP: ${stat.totalXp}` 
        })
      }

      // Calculate level-up rewards
      const levelUpRewards = calculateLevelUpRewards(stat.totalXp, stat.currentLevel)
      const newLevel = levelUpRewards.newLevel

      // Update the stat in database
      await db
        .update(characterStats)
        .set({ 
          currentLevel: newLevel,
          updatedAt: new Date()
        })
        .where(eq(characterStats.id, statId))

      // Return level-up result
      const levelUpResult = {
        id: stat.id,
        category: stat.category,
        oldLevel: stat.currentLevel,
        newLevel,
        levelsGained: levelUpRewards.levelsGained,
        levelProgression: levelUpRewards.levelProgression,
        totalXp: stat.totalXp
      }

      return c.json({
        success: true,
        levelUpResult
      })

    } catch (error) {
      console.error('Error leveling up character stat:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to level up character stat' })
    }
  })

  // POST /api/characters/:id/level-up-all - Level up all eligible stats
  app.post('/:id/level-up-all', zValidator('json', levelUpAllSchema), async (c) => {
    try {
      const characterId = c.req.param('id')
      const { userId } = c.req.valid('json')

      // Verify character ownership
      const character = await db
        .select()
        .from(characters)
        .where(and(
          eq(characters.id, characterId),
          eq(characters.userId, userId),
          eq(characters.isActive, true)
        ))
        .limit(1)

      if (character.length === 0) {
        throw new HTTPException(404, { message: 'Character not found' })
      }

      // Get all character stats
      const stats = await db
        .select()
        .from(characterStats)
        .where(eq(characterStats.characterId, characterId))

      // Find stats ready for level up
      const eligibleStats = stats.filter(stat => 
        isReadyToLevelUp(stat.totalXp, stat.currentLevel)
      )

      if (eligibleStats.length === 0) {
        return c.json({
          success: true,
          levelUpResults: [],
          message: 'No stats are ready for level up'
        })
      }

      // Level up all eligible stats
      const levelUpResults = []
      
      for (const stat of eligibleStats) {
        const levelUpRewards = calculateLevelUpRewards(stat.totalXp, stat.currentLevel)
        const newLevel = levelUpRewards.newLevel

        // Update the stat in database
        await db
          .update(characterStats)
          .set({ 
            currentLevel: newLevel,
            updatedAt: new Date()
          })
          .where(eq(characterStats.id, stat.id))

        // Add to results
        levelUpResults.push({
          id: stat.id,
          category: stat.category,
          oldLevel: stat.currentLevel,
          newLevel,
          levelsGained: levelUpRewards.levelsGained,
          levelProgression: levelUpRewards.levelProgression,
          totalXp: stat.totalXp
        })
      }

      return c.json({
        success: true,
        levelUpResults,
        message: `Successfully leveled up ${levelUpResults.length} stat(s)`
      })

    } catch (error) {
      console.error('Error leveling up all character stats:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to level up character stats' })
    }
  })

export default app
export type CharacterAppType = typeof app
