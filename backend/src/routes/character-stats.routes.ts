import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { CreateCharacterStatSchema, UpdateCharacterStatSchema } from '../types'
import { CharacterStatsService } from '../services/character-stats.service'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { isValidUUID } from '../utils/helpers'

const characterStats = new Hono()

// All routes require authentication
characterStats.use('*', authMiddleware)

// Create character stat
characterStats.post('/', zValidator('json', CreateCharacterStatSchema), async (c) => {
  const user = getUserFromContext(c)
  const input = c.req.valid('json')
  
  const newStat = await CharacterStatsService.create(user.userId, input)
  
  if (!newStat) {
    throw new HTTPException(400, { message: 'Failed to create character stat' })
  }
  
  return c.json({
    success: true,
    data: newStat
  })
})

// Get all character stats for user
characterStats.get('/', async (c) => {
  const user = getUserFromContext(c)
  
  const stats = await CharacterStatsService.getByUserId(user.userId)
  
  return c.json({
    success: true,
    data: stats
  })
})

// Get character stat by ID
characterStats.get('/:id', async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid character stat ID' })
  }
  
  const stat = await CharacterStatsService.getById(id, user.userId)
  
  if (!stat) {
    throw new HTTPException(404, { message: 'Character stat not found' })
  }
  
  return c.json({
    success: true,
    data: stat
  })
})

// Update character stat
characterStats.put('/:id', zValidator('json', UpdateCharacterStatSchema), async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  const input = c.req.valid('json')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid character stat ID' })
  }
  
  const updatedStat = await CharacterStatsService.update(id, user.userId, input)
  
  if (!updatedStat) {
    throw new HTTPException(404, { message: 'Character stat not found or update failed' })
  }
  
  return c.json({
    success: true,
    data: updatedStat
  })
})

// Delete character stat
characterStats.delete('/:id', async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid character stat ID' })
  }
  
  const success = await CharacterStatsService.delete(id, user.userId)
  
  if (!success) {
    throw new HTTPException(404, { message: 'Character stat not found or delete failed' })
  }
  
  return c.json({
    success: true,
    message: 'Character stat deleted successfully'
  })
})

export default characterStats
