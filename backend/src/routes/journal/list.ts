import { Hono } from 'hono'
import { authMiddleware, AuthContext } from '../../lib/auth'
import { JournalService } from '../../lib/journal'

const list = new Hono<AuthContext>()

list.use('*', authMiddleware)

// Get list of user's journal entries
list.get('/', async (c) => {
  try {
    const user = c.get('user')

    const journals = await JournalService.getUserJournals(user.id)

    return c.json({
      message: 'Journals retrieved successfully',
      journals: journals.map(journal => ({
        id: journal.id,
        title: journal.title || 'Untitled Entry',
        summary: journal.summary || '',
        created_at: journal.createdAt,
      })),
      total: journals.length,
    })
  } catch (error) {
    console.error('Journal list error:', error)
    return c.json({ error: 'Failed to retrieve journals' }, 500)
  }
})

export default list
