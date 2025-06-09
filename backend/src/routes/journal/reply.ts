import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, AuthContext } from '../../lib/auth'
import { JournalService } from '../../lib/journal'
import { journalReplySchema } from '../../lib/validation'

const reply = new Hono<AuthContext>()

reply.use('*', authMiddleware)

// Add message to journal conversation
reply.post('/', zValidator('json', journalReplySchema), async (c) => {
  try {
    const user = c.get('user')
    const { session_id, message } = c.req.valid('json')

    // Verify session belongs to user
    const session = await JournalService.getSession(session_id)
    if (!session || session.userId !== user.id) {
      return c.json({ error: 'Session not found or access denied' }, 404)
    }

    // Check if session is already submitted
    if (session.submittedAt) {
      return c.json({ error: 'Cannot add messages to submitted journal' }, 400)
    }

    // Add user message
    await JournalService.addMessage(session_id, 'user', message)

    // Generate GPT response
    const gptResponse = await JournalService.generateGPTResponse(session_id)
    
    // Add GPT message
    await JournalService.addMessage(session_id, 'gpt', gptResponse)

    // Get latest messages to return
    const messages = await JournalService.getSessionMessages(session_id)
    
    return c.json({
      message: 'Reply added successfully',
      session_id,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: msg.createdAt,
      })),
      latest_gpt_response: gptResponse,
    })
  } catch (error) {
    console.error('Journal reply error:', error)
    return c.json({ error: 'Failed to process journal reply' }, 500)
  }
})

export default reply
