import { describe, test, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

// Helper to generate test UUIDs
function generateTestUUID(suffix: number): string {
  return `550e8400-e29b-41d4-a716-44665544${suffix.toString().padStart(4, '0')}`;
}

let userId: string;
let authToken: string;

beforeEach(async () => {
  // Create and authenticate a test user
  const userData = {
    name: 'Test User',
    email: getUniqueEmail('metric-summaries'),
    password: 'password123',
  };

  const registerResponse = await app.request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const registerResult = await registerResponse.json();
  userId = registerResult.user.id;
  authToken = registerResult.token;
});

describe('Metric Summaries API', () => {
  describe('POST /api/metric-summaries/generate', () => {
    test('should generate metrics for a time period', async () => {
      const db = testDb();

      // Create a test journal entry
      await db.insert(schema.journals).values({
        userId,
        date: '2024-01-15',
        status: 'complete',
        title: 'Test Journal',
        dayRating: 4,
        toneTags: ['happy', 'calm'],
      });

      // Create a test character stat
      const [testStat] = await db
        .insert(schema.characterStats)
        .values({
          userId,
          name: 'Test Stat',
          description: 'Test stat for metrics',
        })
        .returning();

      // Create some XP grants with dates in the period
      await db.insert(schema.xpGrants).values([
        {
          userId,
          entityType: 'character_stat',
          entityId: testStat.id,
          xpAmount: 25,
          sourceType: 'journal',
          reason: 'Test XP grant',
          createdAt: new Date('2024-01-15'),
        },
        {
          userId,
          entityType: 'character_stat',
          entityId: testStat.id,
          xpAmount: 15,
          sourceType: 'task',
          reason: 'Test task XP',
          createdAt: new Date('2024-01-20'),
        },
      ]);

      const response = await app.request('/api/metric-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalXp: 40,
        avgDayRating: 4,
        daysLogged: 1,
        tasksCompleted: 0, // No experiment task completions
        toneTagCounts: { happy: 1, calm: 1 },
        mostCommonTone: expect.stringMatching(/happy|calm/),
        xpByStat: { 'Test Stat': 40 },
      });
    });

    test('should handle empty time period', async () => {
      const response = await app.request('/api/metric-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          startDate: '2024-06-01',
          endDate: '2024-06-30',
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        totalXp: 0,
        avgDayRating: null,
        daysLogged: 0,
        tasksCompleted: 0,
        toneTagCounts: {},
        xpByStat: {},
      });
    });

    test('should require authentication', async () => {
      const response = await app.request('/api/metric-summaries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }),
      });

      expect(response.status).toBe(401);
    });

    test('should validate date format', async () => {
      const response = await app.request('/api/metric-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          startDate: 'invalid-date',
          endDate: '2024-01-31',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/metric-summaries/journal-summary/:sourceId', () => {
    test('should generate and save metrics for a journal summary', async () => {
      const db = testDb();

      // Create a journal summary
      const [journalSummary] = await db
        .insert(schema.journalSummaries)
        .values({
          userId,
          period: 'week',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'Test week summary',
        })
        .returning();

      // Create some data for the period
      await db.insert(schema.journals).values([
        {
          userId,
          date: '2024-01-02',
          status: 'complete',
          title: 'Journal 1',
          dayRating: 3,
          toneTags: ['calm'],
        },
        {
          userId,
          date: '2024-01-05',
          status: 'complete',
          title: 'Journal 2',
          dayRating: 5,
          toneTags: ['happy', 'energized'],
        },
      ]);

      const response = await app.request(`/api/metric-summaries/journal-summary/${journalSummary.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        type: 'journal',
        sourceId: journalSummary.id,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        avgDayRating: 4, // (3 + 5) / 2
        daysLogged: 2,
        toneTagCounts: { calm: 1, happy: 1, energized: 1 },
      });

      // Verify it was saved to database
      const savedMetrics = await db
        .select()
        .from(schema.metricSummaries)
        .where(eq(schema.metricSummaries.sourceId, journalSummary.id));
      
      expect(savedMetrics).toHaveLength(1);
      expect(savedMetrics[0].type).toBe('journal');
    });

    test('should prevent duplicate metrics for same journal summary', async () => {
      const db = testDb();

      // Create a journal summary
      const [journalSummary] = await db
        .insert(schema.journalSummaries)
        .values({
          userId,
          period: 'week',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'Test week summary',
        })
        .returning();

      // Create metrics first time
      await app.request(`/api/metric-summaries/journal-summary/${journalSummary.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Try to create again
      const response = await app.request(`/api/metric-summaries/journal-summary/${journalSummary.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exist');
    });

    test('should return 404 for non-existent journal summary', async () => {
      const response = await app.request('/api/metric-summaries/journal-summary/00000000-0000-0000-0000-000000000000', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/metric-summaries/experiment/:sourceId', () => {
    test('should generate and save metrics for an experiment', async () => {
      const db = testDb();

      // Create an experiment
      const [experiment] = await db
        .insert(schema.experiments)
        .values({
          userId,
          title: 'Test Experiment',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
        })
        .returning();

      // Create a task for the experiment
      const [experimentTask] = await db
        .insert(schema.experimentTasks)
        .values({
          experimentId: experiment.id,
          description: 'Daily meditation',
          successMetric: 1,
          xpReward: 10,
        })
        .returning();

      // Create some task completions
      await db.insert(schema.experimentTaskCompletions).values([
        {
          taskId: experimentTask.id,
          userId,
          completedDate: '2024-01-02',
        },
        {
          taskId: experimentTask.id,
          userId,
          completedDate: '2024-01-04',
        },
      ]);

      const response = await app.request(`/api/metric-summaries/experiment/${experiment.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        type: 'experiment',
        sourceId: experiment.id,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        tasksCompleted: 2,
        averageTasksPerDay: expect.any(Number),
      });
    });

    test('should return 404 for non-existent experiment', async () => {
      const response = await app.request('/api/metric-summaries/experiment/00000000-0000-0000-0000-000000000000', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/metric-summaries', () => {
    test('should list metric summaries with default pagination', async () => {
      const db = testDb();

      // Create some metric summaries with valid UUIDs
      const uuid1 = generateTestUUID(1);
      const uuid2 = generateTestUUID(2);

      await db.insert(schema.metricSummaries).values([
        {
          userId,
          type: 'journal',
          sourceId: uuid1,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          totalXp: 100,
          avgDayRating: 4.5,
          daysLogged: 5,
          tasksCompleted: 10,
          averageTasksPerDay: 2.0,
          mostCommonTone: 'happy',
        },
        {
          userId,
          type: 'experiment',
          sourceId: uuid2,
          startDate: '2024-01-08',
          endDate: '2024-01-14',
          totalXp: 50,
          avgDayRating: 3.0,
          daysLogged: 3,
          tasksCompleted: 5,
          averageTasksPerDay: 1.0,
          mostCommonTone: 'calm',
        },
      ]);

      const response = await app.request('/api/metric-summaries', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.summaries).toHaveLength(2);
      expect(result.data.total).toBe("2");
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    });

    test('should filter by type', async () => {
      const db = testDb();

      const uuid1 = generateTestUUID(3);
      const uuid2 = generateTestUUID(4);

      await db.insert(schema.metricSummaries).values([
        {
          userId,
          type: 'journal',
          sourceId: uuid1,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          totalXp: 100,
          daysLogged: 5,
          tasksCompleted: 10,
          averageTasksPerDay: 2.0,
        },
        {
          userId,
          type: 'experiment',
          sourceId: uuid2,
          startDate: '2024-01-08',
          endDate: '2024-01-14',
          totalXp: 50,
          daysLogged: 3,
          tasksCompleted: 5,
          averageTasksPerDay: 1.0,
        },
      ]);

      const response = await app.request('/api/metric-summaries?type=journal', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.summaries).toHaveLength(1);
      expect(result.data.summaries[0].type).toBe('journal');
    });

    test('should filter by minimum average day rating', async () => {
      const db = testDb();

      await db.insert(schema.metricSummaries).values([
        {
          userId,
          type: 'journal',
          sourceId: generateTestUUID(5),
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          totalXp: 100,
          avgDayRating: 4.5,
          daysLogged: 5,
          tasksCompleted: 10,
          averageTasksPerDay: 2.0,
        },
        {
          userId,
          type: 'journal',
          sourceId: generateTestUUID(6),
          startDate: '2024-01-08',
          endDate: '2024-01-14',
          totalXp: 50,
          avgDayRating: 2.0,
          daysLogged: 3,
          tasksCompleted: 5,
          averageTasksPerDay: 1.0,
        },
      ]);

      const response = await app.request('/api/metric-summaries?minAvgDayRating=4', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.summaries).toHaveLength(1);
      expect(result.data.summaries[0].avgDayRating).toBe(4.5);
    });

    test('should sort by totalXp in descending order', async () => {
      const db = testDb();

      await db.insert(schema.metricSummaries).values([
        {
          userId,
          type: 'journal',
          sourceId: generateTestUUID(7),
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          totalXp: 50,
          daysLogged: 5,
          tasksCompleted: 10,
          averageTasksPerDay: 2.0,
        },
        {
          userId,
          type: 'journal',
          sourceId: generateTestUUID(8),
          startDate: '2024-01-08',
          endDate: '2024-01-14',
          totalXp: 100,
          daysLogged: 3,
          tasksCompleted: 5,
          averageTasksPerDay: 1.0,
        },
      ]);

      const response = await app.request('/api/metric-summaries?sortBy=totalXp&sortOrder=desc', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.summaries).toHaveLength(2);
      expect(result.data.summaries[0].totalXp).toBe(100);
      expect(result.data.summaries[1].totalXp).toBe(50);
    });

    test('should only return summaries for authenticated user', async () => {
      const db = testDb();

      // Create another user
      const anotherUser = await db
        .insert(schema.users)
        .values({
          name: 'Another User',
          email: getUniqueEmail('another-metric-summaries'),
          password: 'password',
        })
        .returning();

      // Create summaries for both users
      await db.insert(schema.metricSummaries).values([
        {
          userId,
          type: 'journal',
          sourceId: generateTestUUID(9),
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          totalXp: 100,
          daysLogged: 5,
          tasksCompleted: 10,
          averageTasksPerDay: 2.0,
        },
        {
          userId: anotherUser[0].id,
          type: 'journal',
          sourceId: generateTestUUID(10),
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          totalXp: 200,
          daysLogged: 7,
          tasksCompleted: 20,
          averageTasksPerDay: 3.0,
        },
      ]);

      const response = await app.request('/api/metric-summaries', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.summaries).toHaveLength(1);
      expect(result.data.summaries[0].sourceId).toBe(generateTestUUID(9));
    });
  });

  describe('GET /api/metric-summaries/:id', () => {
    test('should get a specific metric summary', async () => {
      const db = testDb();

      const [metricSummary] = await db
        .insert(schema.metricSummaries)
        .values({
          userId,
          type: 'journal',
          sourceId: generateTestUUID(11),
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          totalXp: 150,
          avgDayRating: 4.2,
          daysLogged: 6,
          tasksCompleted: 12,
          averageTasksPerDay: 2.4,
          toneTagCounts: { happy: 3, calm: 2 },
          mostCommonTone: 'happy',
          xpByStat: { Strength: 75, Wisdom: 75 },
        })
        .returning();

      const response = await app.request(`/api/metric-summaries/${metricSummary.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: metricSummary.id,
        type: 'journal',
        sourceId: generateTestUUID(11),
        totalXp: 150,
        avgDayRating: 4.2,
        daysLogged: 6,
        tasksCompleted: 12,
        toneTagCounts: { happy: 3, calm: 2 },
        mostCommonTone: 'happy',
        xpByStat: { Strength: 75, Wisdom: 75 },
      });
    });

    test('should return 404 for non-existent metric summary', async () => {
      const response = await app.request('/api/metric-summaries/00000000-0000-0000-0000-000000000000', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    test('should not allow access to other users metric summaries', async () => {
      const db = testDb();

      // Create another user
      const anotherUser = await db
        .insert(schema.users)
        .values({
          name: 'Another User',
          email: getUniqueEmail('another-user-metrics'),
          password: 'password',
        })
        .returning();

      // Create a metric summary for the other user
      const [otherUserMetric] = await db
        .insert(schema.metricSummaries)
        .values({
          userId: anotherUser[0].id,
          type: 'journal',
          sourceId: generateTestUUID(12),
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          totalXp: 100,
          daysLogged: 5,
          tasksCompleted: 10,
          averageTasksPerDay: 2.0,
        })
        .returning();

      const response = await app.request(`/api/metric-summaries/${otherUserMetric.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/metric-summaries/:id', () => {
    test('should delete a metric summary', async () => {
      const db = testDb();

      const [metricSummary] = await db
        .insert(schema.metricSummaries)
        .values({
          userId,
          type: 'journal',
          sourceId: generateTestUUID(13),
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          totalXp: 100,
          daysLogged: 5,
          tasksCompleted: 10,
          averageTasksPerDay: 2.0,
        })
        .returning();

      const response = await app.request(`/api/metric-summaries/${metricSummary.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);

      // Verify it was deleted
      const deleted = await db
        .select()
        .from(schema.metricSummaries)
        .where(eq(schema.metricSummaries.id, metricSummary.id));
      
      expect(deleted).toHaveLength(0);
    });

    test('should return 404 for non-existent metric summary', async () => {
      const response = await app.request('/api/metric-summaries/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});
