import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { jwtAuth, getUserId } from '../middleware/auth';
import { TimeframeExportService } from '../services/timeframeExportService';
import { timeframeExportRequestSchema } from '../validation/timeframe-export';
import { handleApiError } from '../utils/logger';
import type { TimeframeExportRequest, TimeframeExportResponse } from '../../../shared/types/timeframe-export';

const app = new Hono();

// Generate timeframe export
app.post('/generate', jwtAuth, zValidator('json', timeframeExportRequestSchema), async (c) => {
  try {
    const userId = getUserId(c);
    const { startDate, endDate, options } = c.req.valid('json') as TimeframeExportRequest;

    const exportData = await TimeframeExportService.generateExport(userId, startDate, endDate, options);

    return c.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to generate timeframe export');
  }
});

export default app;
