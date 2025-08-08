import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { jwtAuth } from '../middleware/auth';
import { QuestService } from '../services/questService';
import {
  createQuestSchema,
  updateQuestSchema,
  linkQuestExperimentSchema,
  linkQuestJournalSchema,
  questIdSchema,
  questDashboardSchema,
} from '../validation/quests';
import logger, { handleApiError } from '../utils/logger';

const questRoutes = new Hono();

// Apply authentication middleware to all routes
questRoutes.use('*', jwtAuth);

// Create a new quest
questRoutes.post('/', zValidator('json', createQuestSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const quest = await QuestService.createQuest(userId, data);

    return c.json(
      {
        success: true,
        data: quest,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, 'Failed to create quest');
  }
});

// Get all quests for the authenticated user
questRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId');

    const quests = await QuestService.getUserQuests(userId);
    logger.debug('Retrieved user quests', { userId, count: quests.length });

    return c.json({
      success: true,
      data: quests,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to retrieve quests');
  }
});

// Get a specific quest
questRoutes.get('/:id', zValidator('param', questIdSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');

    const quest = await QuestService.getQuestById(userId, id);
    if (!quest) {
      return c.json(
        {
          success: false,
          error: 'Quest not found',
        },
        404,
      );
    }

    logger.debug('Retrieved quest', { userId, questId: id });

    return c.json({
      success: true,
      data: quest,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to retrieve quest');
  }
});

// Get quest with experiments and journals
questRoutes.get('/:id/details', zValidator('param', questIdSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');

    const quest = await QuestService.getQuestWithDetails(userId, id);
    if (!quest) {
      return c.json(
        {
          success: false,
          error: 'Quest not found',
        },
        404,
      );
    }

    logger.debug('Retrieved quest details', { userId, questId: id });

    return c.json({
      success: true,
      data: quest,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to retrieve quest details');
  }
});

// Get quest dashboard
questRoutes.get('/:id/dashboard', zValidator('param', questDashboardSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');

    const dashboard = await QuestService.getQuestDashboard(userId, id);
    if (!dashboard) {
      return c.json(
        {
          success: false,
          error: 'Quest not found',
        },
        404,
      );
    }

    logger.debug('Retrieved quest dashboard', { userId, questId: id });

    return c.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to retrieve quest dashboard');
  }
});

// Update a quest
questRoutes.put('/:id', zValidator('param', questIdSchema), zValidator('json', updateQuestSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const quest = await QuestService.updateQuest(userId, id, data);
    if (!quest) {
      return c.json(
        {
          success: false,
          error: 'Quest not found',
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: quest,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to update quest');
  }
});

// Delete a quest
questRoutes.delete('/:id', zValidator('param', questIdSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');

    const success = await QuestService.deleteQuest(userId, id);
    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Quest not found',
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to delete quest');
  }
});

// Link an experiment to a quest
questRoutes.post('/:id/experiments', zValidator('param', questIdSchema), zValidator('json', linkQuestExperimentSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const success = await QuestService.linkExperiment(userId, id, data);
    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Failed to link experiment. Quest or experiment not found.',
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: { questId: id, experimentId: data.experimentId },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to link experiment to quest');
  }
});

// Unlink an experiment from a quest
questRoutes.delete(
  '/:id/experiments/:experimentId',
  zValidator(
    'param',
    z.object({
      id: z.string().uuid(),
      experimentId: z.string().uuid(),
    }),
  ),
  async (c) => {
    try {
      const userId = c.get('userId');
      const { id, experimentId } = c.req.valid('param');

      const success = await QuestService.unlinkExperiment(userId, id, experimentId);
      if (!success) {
        return c.json(
          {
            success: false,
            error: 'Quest or experiment link not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: { questId: id, experimentId },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to unlink experiment from quest');
    }
  },
);

// Link a journal to a quest
questRoutes.post('/:id/journals', zValidator('param', questIdSchema), zValidator('json', linkQuestJournalSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const success = await QuestService.linkJournal(userId, id, data);
    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Failed to link journal. Quest or journal not found.',
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: { questId: id, journalId: data.journalId, linkedType: data.linkedType },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to link journal to quest');
  }
});

// Unlink a journal from a quest
questRoutes.delete(
  '/:id/journals/:journalId',
  zValidator(
    'param',
    z.object({
      id: z.string().uuid(),
      journalId: z.string().uuid(),
    }),
  ),
  async (c) => {
    try {
      const userId = c.get('userId');
      const { id, journalId } = c.req.valid('param');

      const success = await QuestService.unlinkJournal(userId, id, journalId);
      if (!success) {
        return c.json(
          {
            success: false,
            error: 'Quest or journal link not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: { questId: id, journalId },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to unlink journal from quest');
    }
  },
);

// Auto-link journals based on date range
questRoutes.post('/:id/auto-link-journals', zValidator('param', questIdSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');

    const success = await QuestService.autoLinkJournals(userId, id);
    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Quest not found',
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: { questId: id },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to auto-link journals to quest');
  }
});

export default questRoutes;
