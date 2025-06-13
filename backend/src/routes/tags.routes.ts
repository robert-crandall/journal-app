import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { CreateContentTagSchema } from '../types'
import { TagsService } from '../services/tags.service'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { isValidUUID } from '../utils/helpers'

const tags = new Hono()

// All routes require authentication
tags.use('*', authMiddleware)

// Create content tag
tags.post('/content', zValidator('json', CreateContentTagSchema), async (c) => {
  const user = getUserFromContext(c)
  const input = c.req.valid('json')
  
  const newTag = await TagsService.createContentTag(user.userId, input)
  
  if (!newTag) {
    throw new HTTPException(400, { message: 'Failed to create content tag' })
  }
  
  return c.json({
    success: true,
    data: newTag
  })
})

// Get all content tags for user
tags.get('/content', async (c) => {
  const user = getUserFromContext(c)
  
  const contentTags = await TagsService.getContentTagsByUserId(user.userId)
  
  return c.json({
    success: true,
    data: contentTags
  })
})

// Delete content tag
tags.delete('/content/:id', async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid content tag ID' })
  }
  
  const success = await TagsService.deleteContentTag(id, user.userId)
  
  if (!success) {
    throw new HTTPException(404, { message: 'Content tag not found or delete failed' })
  }
  
  return c.json({
    success: true,
    message: 'Content tag deleted successfully'
  })
})

// Get all tone tags (predefined)
tags.get('/tone', async (c) => {
  const toneTags = await TagsService.getAllToneTags()
  
  return c.json({
    success: true,
    data: toneTags
  })
})

export default tags
