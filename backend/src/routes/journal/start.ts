import { Hono } from 'hono'
import { authMiddleware, AuthContext } from '../../lib/auth'
import { JournalService } from '../../lib/journal'

const start = new Hono<AuthContext>()

start.use('*', authMiddleware)

// Start a new journal session
start.post('/', async (c) => {
  try {
    const user = c.get('user')
    
    const session = await JournalService.createSession(user.id)
    
    return c.json({
      message: 'Journal session started',
      session_id: session.id,
      started_at: session.startedAt,
    })
  } catch (error) {
    console.error('Start journal error:', error)
    return c.json({ error: 'Failed to start journal session' }, 500)
  }
})

export default start
