import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, AuthContext } from '../../lib/auth'
import { JournalService } from '../../lib/journal'
import { journalSubmitSchema } from '../../lib/validation'

const submit = new Hono<AuthContext>()

submit.use('*', authMiddleware)

// Submit and finalize journal entry
submit.post('/', zValidator('json', journalSubmitSchema), async (c) => {
  try {
    const user = c.get('user')
    const { session_id } = c.req.valid('json')

    // Verify session belongs to user
    const session = await JournalService.getSession(session_id)
    if (!session || session.userId !== user.id) {
      return c.json({ error: 'Session not found or access denied' }, 404)
    }

    // Check if session is already submitted
    if (session.submittedAt) {
      return c.json({ error: 'Journal already submitted' }, 400)
    }

    // Submit the journal (compile, extract metadata, save)
    const finalizedSession = await JournalService.submitJournal(session_id)

    return c.json({
      message: 'Journal submitted successfully',
      journal: {
        id: finalizedSession.id,
        title: finalizedSession.title,
        summary: finalizedSession.summary,
        full_summary: finalizedSession.fullSummary,
        finalized_text: finalizedSession.finalizedText,
        submitted_at: finalizedSession.submittedAt,
      },
    })
  } catch (error) {
    console.error('Journal submit error:', error)
    return c.json({ error: 'Failed to submit journal' }, 500)
  }
})

export default submit
