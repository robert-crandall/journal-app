import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { CreateJournalEntrySchema, ContinueConversationSchema, UpdateJournalEntrySchema } from '../types'
import { JournalService } from '../services/journal.service'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { isValidUUID } from '../utils/helpers'

const journal = new Hono()

// All routes require authentication
journal.use('*', authMiddleware)

// Create journal entry
journal.post('/', zValidator('json', CreateJournalEntrySchema), async (c) => {
  const user = getUserFromContext(c)
  const input = c.req.valid('json')
  
  const newEntry = await JournalService.create(user.userId, input)
  
  if (!newEntry) {
    throw new HTTPException(400, { message: 'Failed to create journal entry' })
  }
  
  return c.json({
    success: true,
    data: newEntry
  })
})

// Get all journal entries for user
journal.get('/', async (c) => {
  const user = getUserFromContext(c)
  
  const entries = await JournalService.getByUserId(user.userId)
  
  return c.json({
    success: true,
    data: entries
  })
})

// Get journal entry by ID with full details
journal.get('/:id', async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid journal entry ID' })
  }
  
  const entry = await JournalService.getById(id, user.userId)
  
  if (!entry) {
    throw new HTTPException(404, { message: 'Journal entry not found' })
  }
  
  return c.json({
    success: true,
    data: entry
  })
})

// Continue conversation for a journal entry
journal.post('/:id/continue', zValidator('json', ContinueConversationSchema), async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  const input = c.req.valid('json')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid journal entry ID' })
  }
  
  const result = await JournalService.continueConversation(id, user.userId, input)
  
  if (!result) {
    throw new HTTPException(400, { message: 'Failed to continue conversation or conversation is already complete' })
  }
  
  return c.json({
    success: true,
    data: result
  })
})

// Update journal entry
journal.put('/:id', zValidator('json', UpdateJournalEntrySchema), async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  const input = c.req.valid('json')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid journal entry ID' })
  }
  
  const updatedEntry = await JournalService.update(id, user.userId, input)
  
  if (!updatedEntry) {
    throw new HTTPException(404, { message: 'Journal entry not found or update failed' })
  }
  
  return c.json({
    success: true,
    data: updatedEntry
  })
})

// Delete journal entry
journal.delete('/:id', async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid journal entry ID' })
  }
  
  const success = await JournalService.delete(id, user.userId)
  
  if (!success) {
    throw new HTTPException(404, { message: 'Journal entry not found or delete failed' })
  }
  
  return c.json({
    success: true,
    message: 'Journal entry deleted successfully'
  })
})

export default journal
