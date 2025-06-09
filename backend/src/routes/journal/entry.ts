import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, AuthContext } from '../../lib/auth'
import { JournalService } from '../../lib/journal'
import { journalUpdateSchema } from '../../lib/validation'

const entry = new Hono<AuthContext>()

entry.use('*', authMiddleware)

// Get specific journal entry with details
entry.get('/:id', async (c) => {
  try {
    const user = c.get('user')
    const journalId = c.req.param('id')

    const journal = await JournalService.getJournalWithDetails(journalId, user.id)
    if (!journal) {
      return c.json({ error: 'Journal not found' }, 404)
    }

    return c.json({
      message: 'Journal retrieved successfully',
      journal: {
        id: journal.id,
        title: journal.title,
        summary: journal.summary,
        full_summary: journal.fullSummary,
        finalized_text: journal.finalizedText,
        started_at: journal.startedAt,
        submitted_at: journal.submittedAt,
        messages: journal.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.createdAt,
        })),
        tags: journal.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
        })),
      },
    })
  } catch (error) {
    console.error('Journal get error:', error)
    return c.json({ error: 'Failed to retrieve journal' }, 500)
  }
})

// Update specific journal entry
entry.patch('/:id', zValidator('json', journalUpdateSchema), async (c) => {
  try {
    const user = c.get('user')
    const journalId = c.req.param('id')
    const updates = c.req.valid('json')

    const updatedJournal = await JournalService.updateJournal(journalId, user.id, updates)
    if (!updatedJournal) {
      return c.json({ error: 'Journal not found or update failed' }, 404)
    }

    return c.json({
      message: 'Journal updated successfully',
      journal: {
        id: updatedJournal.id,
        title: updatedJournal.title,
        summary: updatedJournal.summary,
        full_summary: updatedJournal.fullSummary,
        finalized_text: updatedJournal.finalizedText,
        submitted_at: updatedJournal.submittedAt,
      },
    })
  } catch (error) {
    console.error('Journal update error:', error)
    return c.json({ error: 'Failed to update journal' }, 500)
  }
})

export default entry
