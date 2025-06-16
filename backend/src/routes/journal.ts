import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../lib/middleware';
import { JournalService } from '../services/journal.service';
import { createJournalEntrySchema, updateJournalEntrySchema } from '../lib/validation';

const app = new Hono();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Create a new journal entry
app.post('/', zValidator('json', createJournalEntrySchema), async (c) => {
  try {
    const user = c.get('user');
    const input = c.req.valid('json');

    const entry = await JournalService.createJournalEntry(user.userId, input);

    return c.json({
      success: true,
      data: entry,
    }, 201);
  } catch (error) {
    console.error('Create journal entry error:', error);
    return c.json({
      success: false,
      error: 'Failed to create journal entry',
    }, 500);
  }
});

// Get all journal entries for the current user
app.get('/', async (c) => {
  try {
    const user = c.get('user');
    const sortOrder = c.req.query('sortOrder') as 'asc' | 'desc' || 'desc';
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;

    const entries = await JournalService.getUserJournalEntries(user.userId, {
      sortOrder,
      limit,
      offset,
    });

    return c.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    return c.json({
      success: false,
      error: 'Failed to get journal entries',
    }, 500);
  }
});

// Get recent journal entries for dashboard
app.get('/recent', async (c) => {
  try {
    const user = c.get('user');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 5;

    const entries = await JournalService.getRecentJournalEntries(user.userId, limit);

    return c.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error('Get recent journal entries error:', error);
    return c.json({
      success: false,
      error: 'Failed to get recent journal entries',
    }, 500);
  }
});

// Get journal statistics
app.get('/stats', async (c) => {
  try {
    const user = c.get('user');

    const stats = await JournalService.getJournalStats(user.userId);

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get journal stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to get journal statistics',
    }, 500);
  }
});

// Get a specific journal entry by ID
app.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const entryId = c.req.param('id');

    const entry = await JournalService.getJournalEntryById(entryId, user.userId);

    if (!entry) {
      return c.json({
        success: false,
        error: 'Journal entry not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Get journal entry error:', error);
    return c.json({
      success: false,
      error: 'Failed to get journal entry',
    }, 500);
  }
});

// Update a journal entry
app.put('/:id', zValidator('json', updateJournalEntrySchema), async (c) => {
  try {
    const user = c.get('user');
    const entryId = c.req.param('id');
    const input = c.req.valid('json');

    const entry = await JournalService.updateJournalEntry(entryId, user.userId, input);

    if (!entry) {
      return c.json({
        success: false,
        error: 'Journal entry not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Update journal entry error:', error);
    return c.json({
      success: false,
      error: 'Failed to update journal entry',
    }, 500);
  }
});

// Delete a journal entry
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const entryId = c.req.param('id');

    const entry = await JournalService.deleteJournalEntry(entryId, user.userId);

    if (!entry) {
      return c.json({
        success: false,
        error: 'Journal entry not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete journal entry',
    }, 500);
  }
});

export default app;
