import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db/connection'
import { characters, characterStats, users } from '../db/schema'
import { eq, and } from 'drizzle-orm'

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

export default app
export type CharacterAppType = typeof app
