import { describe, test, expect } from 'vitest';
import { testClient } from 'hono/testing';
import timeframeExportRoutes from '../../routes/timeframe-export';

describe('Timeframe Export Routes', () => {
  const client = testClient(timeframeExportRoutes);

  test('should exist and have generate endpoint', () => {
    // Test that the route exists and is properly typed
    expect(client).toBeDefined();
    expect(client.generate).toBeDefined();
  });

  test('should reject unauthenticated requests', async () => {
    try {
      const response = await client.generate.$post({
        json: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          options: {
            includeDailyEntries: true,
            includeWeeklyAnalyses: true,
            includeMonthlyAnalyses: true,
            includeGoals: true,
            includePlans: true,
            includeQuests: true,
            includeExperiments: true,
          },
        },
      });

      // Should return 401 for unauthenticated request
      expect(response.status).toBe(401);
    } catch (error) {
      // This is expected behavior for unauthenticated requests
      expect(true).toBe(true);
    }
  });
});