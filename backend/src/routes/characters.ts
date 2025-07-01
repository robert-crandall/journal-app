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
  calculateXpProgress,
  calculateXpToNextLevel,
  calculateTotalXpForLevel,
  type LevelCalculation 
} from '../utils/xp-calculator'
import { generateLevelTitle } from '../services/ai-level-titles'

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

      // Generate humorous level title using AI
      let levelTitle: string | undefined
      try {
        levelTitle = await generateLevelTitle({
          statCategory: stat.category,
          newLevel,
          characterClass: character[0].class,
          characterBackstory: character[0].backstory || undefined
        })
      } catch (error) {
        console.warn('Failed to generate level title:', error)
        // Continue without title - it's optional
      }

      // Update the stat in database
      await db
        .update(characterStats)
        .set({ 
          currentLevel: newLevel,
          levelTitle,
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
        totalXp: stat.totalXp,
        levelTitle
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

        // Generate humorous level title using AI
        let levelTitle: string | undefined
        try {
          levelTitle = await generateLevelTitle({
            statCategory: stat.category,
            newLevel,
            characterClass: character[0].class,
            characterBackstory: character[0].backstory || undefined
          })
        } catch (error) {
          console.warn('Failed to generate level title for', stat.category, ':', error)
          // Continue without title - it's optional
        }

        // Update the stat in database
        await db
          .update(characterStats)
          .set({ 
            currentLevel: newLevel,
            levelTitle,
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
          totalXp: stat.totalXp,
          levelTitle
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

  // Stat Progression Endpoints

  // Validation schemas for stat progression
  const awardXpSchema = z.object({
    userId: z.string().uuid('Valid user ID is required'),
    xpAmount: z.number().int().min(1, 'XP amount must be positive'),
    reason: z.string().min(1, 'Reason is required').max(500),
  })

  const updateStatProgressionSchema = z.object({
    userId: z.string().uuid('Valid user ID is required'),
    currentXp: z.number().int().min(0).optional(),
    totalXp: z.number().int().min(0).optional(),
    currentLevel: z.number().int().min(1).optional(),
    description: z.string().optional(),
    sampleActivities: z.array(z.string()).optional(),
  })

  // POST /api/characters/:characterId/stats/:statId/award-xp - Award XP to a specific stat
  app.post('/:characterId/stats/:statId/award-xp', 
    zValidator('json', awardXpSchema),
    async (c) => {
      try {
        const characterId = c.req.param('characterId')
        const statId = c.req.param('statId')
        const { userId, xpAmount, reason } = c.req.valid('json')

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

        // Calculate new XP values
        const newCurrentXp = stat.currentXp + xpAmount
        const newTotalXp = stat.totalXp + xpAmount
        const oldLevel = stat.currentLevel
        const newLevel = calculateLevelFromTotalXp(newTotalXp)
        const leveledUp = newLevel > oldLevel
        const levelsGained = newLevel - oldLevel

        // Generate level title if leveled up
        let levelTitle = stat.levelTitle
        if (leveledUp) {
          try {
            levelTitle = await generateLevelTitle({
              statCategory: stat.category,
              newLevel,
              characterClass: character[0].class,
              characterBackstory: character[0].backstory || undefined
            })
          } catch (error) {
            console.warn('Failed to generate level title:', error)
            // Continue without new title
          }
        }

        // Update the stat in database
        const [updatedStat] = await db
          .update(characterStats)
          .set({
            currentXp: newCurrentXp,
            totalXp: newTotalXp,
            currentLevel: newLevel,
            ...(leveledUp && levelTitle ? { levelTitle } : {}),
            updatedAt: new Date()
          })
          .where(eq(characterStats.id, statId))
          .returning()

        // Return progression result
        return c.json({
          success: true,
          data: {
            stat: updatedStat,
            xpAwarded: xpAmount,
            reason,
            leveledUp,
            ...(leveledUp ? { 
              newLevel, 
              levelsGained,
              oldLevel 
            } : {})
          }
        })

      } catch (error) {
        console.error('Error awarding XP to character stat:', error)
        if (error instanceof HTTPException) {
          throw error
        }
        throw new HTTPException(500, { message: 'Failed to award XP to character stat' })
      }
    }
  )

  // GET /api/characters/:characterId/stats/:statId/progression - Get stat progression details
  app.get('/:characterId/stats/:statId/progression', async (c) => {
    try {
      const characterId = c.req.param('characterId')
      const statId = c.req.param('statId')
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
        throw new HTTPException(403, { message: 'Character not found or access denied' })
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

      // Calculate progression details
      const canLevelUp = isReadyToLevelUp(stat.totalXp, stat.currentLevel)
      const xpProgress = calculateXpProgress(stat.totalXp, stat.currentLevel)
      const xpToNextLevel = calculateXpToNextLevel(stat.totalXp, stat.currentLevel)

      return c.json({
        success: true,
        data: {
          stat,
          progression: {
            canLevelUp,
            xpToNextLevel,
            progressPercent: xpProgress.progressPercent,
            currentLevelXp: xpProgress.currentLevelXp,
            xpInCurrentLevel: xpProgress.xpInCurrentLevel
          }
        }
      })

    } catch (error) {
      console.error('Error fetching stat progression:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to fetch stat progression' })
    }
  })

  // PUT /api/characters/:characterId/stats/:statId/progression - Update stat progression directly
  app.put('/:characterId/stats/:statId/progression',
    zValidator('json', updateStatProgressionSchema),
    async (c) => {
      try {
        const characterId = c.req.param('characterId')
        const statId = c.req.param('statId')
        const data = c.req.valid('json')
        const { userId, ...updateData } = data

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

        // Validate XP and level consistency if both are provided
        if (updateData.totalXp !== undefined && updateData.currentLevel !== undefined) {
          const requiredXpForLevel = calculateTotalXpForLevel(updateData.currentLevel)
          if (updateData.totalXp < requiredXpForLevel) {
            throw new HTTPException(400, { 
              message: `Level ${updateData.currentLevel} requires at least ${requiredXpForLevel} total XP, but only ${updateData.totalXp} was provided` 
            })
          }
        }

        // Update the stat
        const [updatedStat] = await db
          .update(characterStats)
          .set({
            ...updateData,
            updatedAt: new Date()
          })
          .where(eq(characterStats.id, statId))
          .returning()

        return c.json({
          success: true,
          data: updatedStat
        })

      } catch (error) {
        console.error('Error updating character stat:', error)
        if (error instanceof HTTPException) {
          throw error
        }
        throw new HTTPException(500, { message: 'Failed to update character stat' })
      }
    }
  )

  // Sample Stats and Activities Guidance Endpoint
  
  // GET /api/characters/stat-guidance - Get comprehensive stat guidance with sample activities
  app.get('/stat-guidance', async (c) => {
    try {
      const statGuidance = [
        {
          category: 'Physical Health',
          description: 'Activities that improve physical fitness, energy, and overall health',
          icon: 'activity',
          color: 'red',
          sampleActivities: [
            // Daily habits
            'Take a 30-minute walk',
            'Do 15 push-ups',
            'Stretch for 10 minutes',
            'Drink 8 glasses of water',
            'Take the stairs instead of elevator',
            'Do desk exercises during work breaks',
            
            // Weekly activities  
            'Go for a bike ride',
            'Attend a fitness class',
            'Go swimming',
            'Try a new hiking trail',
            'Play a sport with friends',
            'Do a home workout video',
            
            // Health maintenance
            'Prepare a healthy meal',
            'Get 7-8 hours of sleep',
            'Take vitamins/supplements',
            'Schedule a health checkup',
            'Practice good posture',
            'Limit screen time before bed'
          ],
          tips: [
            'Start small - even 5 minutes of activity counts',
            'Focus on consistency over intensity',
            'Find activities you actually enjoy',
            'Track your energy levels throughout the day',
            'Celebrate small wins and progress'
          ],
          xpRange: '10-50 XP per activity'
        },
        {
          category: 'Mental Wellness',
          description: 'Activities that support mental health, mindfulness, and emotional wellbeing',
          icon: 'brain',
          color: 'blue',
          sampleActivities: [
            // Mindfulness & meditation
            'Meditate for 10 minutes',
            'Practice deep breathing exercises',
            'Do a body scan meditation',
            'Practice gratitude journaling',
            'Use a mindfulness app',
            
            // Learning & growth
            'Read for 20 minutes',
            'Listen to an educational podcast',
            'Learn something new online',
            'Practice a hobby skill',
            'Complete a puzzle or brain teaser',
            
            // Emotional wellness
            'Journal about your day',
            'Practice positive self-talk',
            'Call a therapist or counselor',
            'Write down three good things from today',
            'Practice saying no to overcommitment',
            'Take a mental health day when needed'
          ],
          tips: [
            'Mental wellness is just as important as physical health',
            'Be patient with yourself during tough days',
            'Find what works for you - not everyone meditates',
            'Professional help is a sign of strength',
            'Small daily practices compound over time'
          ],
          xpRange: '15-40 XP per activity'
        },
        {
          category: 'Family Bonding',
          description: 'Quality time and meaningful activities with family members',
          icon: 'users',
          color: 'green',
          sampleActivities: [
            // Quality time
            'Play a board game together',
            'Cook a meal as a family',
            'Have a meaningful conversation',
            'Take family photos',
            'Go on a family walk',
            'Have a movie night with snacks',
            
            // Activities by age group
            'Read bedtime stories to kids',
            'Help with homework',
            'Play catch or sports together',
            'Do arts and crafts project',
            'Build something together',
            'Plan a family outing',
            
            // Connection & traditions
            'Start a new family tradition',
            'Share stories about family history',
            'Write letters to extended family',
            'Plan a surprise for a family member',
            'Have everyone share their day at dinner',
            'Create a family time capsule'
          ],
          tips: [
            'Quality matters more than quantity',
            'Put away devices during family time',
            'Let kids help plan activities',
            'Create new traditions that fit your family',
            'Remember that showing up consistently matters most'
          ],
          xpRange: '20-60 XP per activity'
        },
        {
          category: 'Professional Growth',
          description: 'Career development, skill building, and professional networking',
          icon: 'briefcase',
          color: 'purple',
          sampleActivities: [
            // Skill development
            'Learn a new skill for 30 minutes',
            'Complete an online course module',
            'Practice a technical skill',
            'Read industry-related articles',
            'Watch educational videos',
            'Take notes on best practices',
            
            // Networking & relationships
            'Network with a colleague',
            'Attend a professional meetup',
            'Update LinkedIn profile',
            'Reach out to a mentor',
            'Help a coworker with their project',
            'Join a professional organization',
            
            // Organization & productivity
            'Organize workspace',
            'Update resume/portfolio',
            'Set weekly goals',
            'Complete a training module',
            'Research career opportunities',
            'Practice presentation skills'
          ],
          tips: [
            'Invest in yourself daily, even if just 15 minutes',
            'Focus on skills that align with your goals',
            'Build genuine relationships, not just connections',
            'Document your achievements for reviews',
            'Stay curious and embrace continuous learning'
          ],
          xpRange: '25-75 XP per activity'
        },
        {
          category: 'Creative Expression',
          description: 'Artistic pursuits, creativity, and self-expression activities',
          icon: 'palette',
          color: 'orange',
          sampleActivities: [
            // Visual arts
            'Draw or sketch for 20 minutes',
            'Try watercolor painting',
            'Take artistic photos',
            'Create digital art',
            'Doodle in a sketchbook',
            'Visit an art museum or gallery',
            
            // Writing & storytelling
            'Write in a creative journal',
            'Start a short story',
            'Write poetry',
            'Blog about something you love',
            'Write letters to future self',
            'Create character stories',
            
            // Music & performance
            'Play a musical instrument',
            'Sing favorite songs',
            'Learn a new song',
            'Create a playlist',
            'Dance to favorite music',
            
            // Crafts & making
            'Try a new recipe experimentally',
            'Do a DIY project',
            'Learn origami',
            'Try knitting or crocheting',
            'Build something with your hands',
            'Repurpose old items creatively'
          ],
          tips: [
            'There\'s no such thing as "not creative"',
            'Focus on the process, not the outcome',
            'Try different mediums to find what resonates',
            'Share your creations with supportive people',
            'Creativity is practice, not just talent'
          ],
          xpRange: '20-50 XP per activity'
        },
        {
          category: 'Social Connection',
          description: 'Building and maintaining relationships with friends and community',
          icon: 'heart',
          color: 'pink',
          sampleActivities: [
            // One-on-one connections
            'Call a friend you haven\'t talked to recently',
            'Write a thoughtful text or email',
            'Meet a friend for coffee',
            'Listen actively to someone\'s problems',
            'Send a thank you note',
            'Check in on someone going through tough times',
            
            // Group activities
            'Attend a social event',
            'Join a club or group activity',
            'Organize a gathering with friends',
            'Participate in community events',
            'Join a recreational sports team',
            'Attend religious or spiritual services',
            
            // Community service
            'Help a neighbor with something',
            'Volunteer for a cause you care about',
            'Participate in community cleanup',
            'Donate items to charity',
            'Help someone learn a skill',
            'Be kind to a stranger'
          ],
          tips: [
            'Quality relationships are built through consistent small gestures',
            'Be genuinely interested in others\' lives',
            'Practice active listening without judgment',
            'Show up for people during difficult times',
            'Remember that vulnerability strengthens connections'
          ],
          xpRange: '15-45 XP per activity'
        }
      ]

      return c.json({
        success: true,
        data: {
          statGuidance,
          generalTips: [
            'Start with activities that feel manageable and build up',
            'Consistency matters more than perfection',
            'Choose activities that align with your current life circumstances',
            'It\'s okay to modify activities to fit your needs',
            'Celebrate progress, no matter how small',
            'Some days will be harder than others - that\'s normal',
            'Focus on one stat at a time if feeling overwhelmed'
          ],
          customizationNote: 'These are suggestions - feel free to create custom activities that work better for your lifestyle and goals.'
        }
      })

    } catch (error) {
      console.error('Error fetching stat guidance:', error)
      throw new HTTPException(500, { message: 'Failed to fetch stat guidance' })
    }
  })

  // Get character dashboard with comprehensive stats and progression - Task 2.9
  .get('/:id/dashboard', async (c) => {
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

      // Get all character stats with progression details
      const stats = await db
        .select()
        .from(characterStats)
        .where(eq(characterStats.characterId, characterId))

      // Calculate progression details for each stat
      const statsWithProgression = stats.map(stat => {
        const xpProgress = calculateXpProgress(stat.totalXp, stat.currentLevel)
        const xpToNextLevel = calculateXpToNextLevel(stat.totalXp, stat.currentLevel)
        const nextLevelTotalXp = calculateTotalXpForLevel(stat.currentLevel + 1)

        return {
          ...stat,
          progression: {
            xpProgress,
            xpToNextLevel,
            nextLevelTotalXp,
            progressPercent: xpProgress.progressPercent
          }
        }
      })

      // Calculate overall character progression
      const totalXpAcrossAllStats = stats.reduce((sum, stat) => sum + stat.totalXp, 0)
      const averageLevel = stats.length > 0 
        ? stats.reduce((sum, stat) => sum + stat.currentLevel, 0) / stats.length 
        : 1
      
      // Find highest and lowest performing stats
      const sortedStatsByLevel = stats.sort((a, b) => b.currentLevel - a.currentLevel)
      const highestStat = sortedStatsByLevel[0] || null
      const lowestStat = sortedStatsByLevel[sortedStatsByLevel.length - 1] || null

      // Calculate recent activity (stats updated in last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentlyUpdatedStats = stats.filter(stat => 
        new Date(stat.updatedAt) > sevenDaysAgo
      )

      return c.json({
        character: {
          ...character,
          stats: statsWithProgression
        },
        overview: {
          totalStats: stats.length,
          totalXpAcrossAllStats,
          averageLevel: Math.round(averageLevel * 100) / 100,
          highestLevelStat: highestStat ? {
            category: highestStat.category,
            level: highestStat.currentLevel,
            levelTitle: highestStat.levelTitle
          } : null,
          lowestLevelStat: lowestStat ? {
            category: lowestStat.category,
            level: lowestStat.currentLevel,
            levelTitle: lowestStat.levelTitle
          } : null,
          recentActivity: {
            statsUpdatedLastWeek: recentlyUpdatedStats.length,
            recentlyUpdatedStats: recentlyUpdatedStats.map(stat => ({
              category: stat.category,
              level: stat.currentLevel,
              lastUpdated: stat.updatedAt
            }))
          }
        },
        recommendations: {
          focusAreas: lowestStat ? [
            {
              category: lowestStat.category,
              currentLevel: lowestStat.currentLevel,
              suggestion: `Focus on ${lowestStat.category.toLowerCase()} activities to balance your character development`,
              xpToNextLevel: calculateXpToNextLevel(lowestStat.totalXp, lowestStat.currentLevel)
            }
          ] : [],
          nextMilestones: statsWithProgression
            .filter(stat => stat.progression.xpToNextLevel <= 100) // Close to leveling up
            .map(stat => ({
              category: stat.category,
              currentLevel: stat.currentLevel,
              xpToNextLevel: stat.progression.xpToNextLevel,
              message: `You're close to leveling up in ${stat.category}!`
            }))
            .slice(0, 3) // Top 3 closest to leveling
        }
      })
    } catch (error) {
      console.error('Error fetching character dashboard:', error)
      if (error instanceof HTTPException) throw error
      throw new HTTPException(500, { message: 'Failed to fetch character dashboard' })
    }
  })

export default app
export type CharacterAppType = typeof app
