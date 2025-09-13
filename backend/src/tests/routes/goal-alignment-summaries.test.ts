import { describe, test, expect, beforeEach } from 'vitest';
import appExport from '../../index';
import { testDb, getUniqueEmail, schema } from '../setup';
import { eq } from 'drizzle-orm';
import type { CreateGoalAlignmentSummaryRequest, GenerateGoalAlignmentSummaryRequest } from '../../../../shared/types/goal-alignment-summaries';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Goal Alignment Summaries API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let testUser: { name: string; email: string; password: string };
  let testGoalId: string;

  beforeEach(async () => {
    // Create a test user with unique email and get auth token for protected routes
    testUser = {
      name: 'Test User',
      email: getUniqueEmail('goal-alignment-summaries'),
      password: 'testpassword123',
    };

    const registerRes = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(testUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(registerRes.status).toBe(201);
    const registerData = await registerRes.json();
    authToken = registerData.token;
    userId = registerData.user.id;

    // Create a test goal
    const db = testDb();
    const [testGoal] = await db
      .insert(schema.goals)
      .values({
        userId,
        title: 'Learn Spanish',
        description: 'Improve my Spanish speaking skills',
        isActive: true,
        isArchived: false,
      })
      .returning();
    testGoalId = testGoal.id;

    // Create a test journal
    await db.insert(schema.journals).values({
      userId,
      date: '2024-01-15',
      initialMessage: 'Practiced Spanish conversation for 30 minutes today. Feeling more confident with basic phrases.',
      summary: 'Good progress on Spanish learning.',
      status: 'complete',
    });
  });

  describe('POST /api/goal-alignment-summaries', () => {
    test('creates a new goal alignment summary', async () => {
      const summaryData: CreateGoalAlignmentSummaryRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        alignmentScore: 85,
        alignedGoals: [
          {
            goalId: testGoalId,
            goalTitle: 'Learn Spanish',
            evidence: ['Practiced Spanish for 30 minutes', 'Used new phrases in conversation'],
            points: 2,
          },
        ],
        neglectedGoals: [],
        suggestedNextSteps: ['Continue daily practice', 'Focus on grammar'],
        summary: 'Great week for Spanish learning with consistent practice.',
        totalPointsEarned: 2,
        totalPossiblePoints: 2,
      };

      const res = await app.request('/api/goal-alignment-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(summaryData),
      });

      expect(res.status).toBe(201);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        userId,
        periodStartDate: summaryData.startDate,
        periodEndDate: summaryData.endDate,
        alignmentScore: summaryData.alignmentScore,
        alignedGoals: summaryData.alignedGoals,
        neglectedGoals: summaryData.neglectedGoals,
        suggestedNextSteps: summaryData.suggestedNextSteps,
        summary: summaryData.summary,
      });
    });

    test('prevents duplicate summaries for same period', async () => {
      const summaryData: CreateGoalAlignmentSummaryRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'First summary',
      };

      // Create first summary
      await app.request('/api/goal-alignment-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(summaryData),
      });

      // Try to create duplicate
      const res = await app.request('/api/goal-alignment-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ...summaryData, summary: 'Second summary' }),
      });

      expect(res.status).toBe(409);
      const result = await res.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    test('validates required fields', async () => {
      const res = await app.request('/api/goal-alignment-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          startDate: '2024-01-15',
          // Missing endDate and summary
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/goal-alignment-summaries', () => {
    test('returns user goal alignment summaries with pagination', async () => {
      const db = testDb();

      // Create test summaries
      const summariesData = [
        {
          userId,
          periodStartDate: '2024-01-15',
          periodEndDate: '2024-01-21',
          summary: 'Week 1 summary',
          alignmentScore: null,
          alignedGoals: [],
          neglectedGoals: [],
          suggestedNextSteps: [],
          totalPointsEarned: 0,
          totalPossiblePoints: 2,
        },
        {
          userId,
          periodStartDate: '2024-01-08',
          periodEndDate: '2024-01-14',
          summary: 'Week 2 summary',
          alignmentScore: null,
          alignedGoals: [],
          neglectedGoals: [],
          suggestedNextSteps: [],
          totalPointsEarned: 0,
          totalPossiblePoints: 2,
        },
      ];

      await db.insert(schema.goalAlignmentSummaries).values(summariesData);

      const res = await app.request('/api/goal-alignment-summaries?limit=1', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data.summaries).toHaveLength(1);
      expect(result.data.total).toBe(2);
      expect(result.data.hasMore).toBe(true);
      // Should be ordered by periodStartDate desc (most recent first)
      expect(result.data.summaries[0].periodStartDate).toBe('2024-01-15');
    });

    test('filters by year', async () => {
      const db = testDb();

      // Create summaries for different years
      const summariesData = [
        {
          userId,
          periodStartDate: '2024-01-15',
          periodEndDate: '2024-01-21',
          summary: '2024 summary',
          alignmentScore: null,
          alignedGoals: [],
          neglectedGoals: [],
          suggestedNextSteps: [],
          totalPointsEarned: 0,
          totalPossiblePoints: 2,
        },
        {
          userId,
          periodStartDate: '2023-01-15',
          periodEndDate: '2023-01-21',
          summary: '2023 summary',
          alignmentScore: null,
          alignedGoals: [],
          neglectedGoals: [],
          suggestedNextSteps: [],
          totalPointsEarned: 0,
          totalPossiblePoints: 2,
        },
      ];

      await db.insert(schema.goalAlignmentSummaries).values(summariesData);

      const res = await app.request('/api/goal-alignment-summaries?year=2024', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.data.summaries).toHaveLength(1);
      expect(result.data.summaries[0].periodStartDate).toBe('2024-01-15');
    });
  });

  describe('GET /api/goal-alignment-summaries/:id', () => {
    test('returns specific goal alignment summary', async () => {
      const summaryData: CreateGoalAlignmentSummaryRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Test summary',
      };

      const createRes = await app.request('/api/goal-alignment-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(summaryData),
      });

      const created = await createRes.json();
      const summaryId = created.data.id;

      const res = await app.request(`/api/goal-alignment-summaries/${summaryId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(summaryId);
      expect(result.data.summary).toBe(summaryData.summary);
    });

    test('returns 404 for non-existent summary', async () => {
      const res = await app.request('/api/goal-alignment-summaries/550e8400-e29b-41d4-a716-446655440000', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/goal-alignment-summaries/:id', () => {
    test('updates goal alignment summary', async () => {
      const summaryData: CreateGoalAlignmentSummaryRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Original summary',
        alignmentScore: 70,
      };

      const createRes = await app.request('/api/goal-alignment-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(summaryData),
      });

      const created = await createRes.json();
      const summaryId = created.data.id;

      const updateData = {
        summary: 'Updated summary',
        alignmentScore: 85,
      };

      const res = await app.request(`/api/goal-alignment-summaries/${summaryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data.summary).toBe(updateData.summary);
      expect(result.data.alignmentScore).toBe(updateData.alignmentScore);
    });
  });

  describe('DELETE /api/goal-alignment-summaries/:id', () => {
    test('deletes goal alignment summary', async () => {
      const summaryData: CreateGoalAlignmentSummaryRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'To be deleted',
      };

      const createRes = await app.request('/api/goal-alignment-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(summaryData),
      });

      const created = await createRes.json();
      const summaryId = created.data.id;

      const res = await app.request(`/api/goal-alignment-summaries/${summaryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.success).toBe(true);

      // Verify it's deleted
      const getRes = await app.request(`/api/goal-alignment-summaries/${summaryId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(getRes.status).toBe(404);
    });
  });

  describe('POST /api/goal-alignment-summaries/generate', () => {
    test('generates goal alignment summary using GPT', async () => {
      const generateData: GenerateGoalAlignmentSummaryRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      };

      const res = await app.request('/api/goal-alignment-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(generateData),
      });

      expect(res.status).toBe(201);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        userId,
        periodStartDate: generateData.startDate,
        periodEndDate: generateData.endDate,
      });
      expect(result.data.summary).toBeTruthy();
    });

    test('prevents duplicate generated summaries', async () => {
      const generateData: GenerateGoalAlignmentSummaryRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      };

      // Generate first summary
      await app.request('/api/goal-alignment-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(generateData),
      });

      // Try to generate duplicate
      const res = await app.request('/api/goal-alignment-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(generateData),
      });

      expect(res.status).toBe(409);
      const result = await res.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    test('requires completed journals in period', async () => {
      const db = testDb();
      // Delete the test journal to have no journals in period
      await db.delete(schema.journals).where(eq(schema.journals.userId, userId));

      const generateData: GenerateGoalAlignmentSummaryRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      };

      const res = await app.request('/api/goal-alignment-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(generateData),
      });

      expect(res.status).toBe(400);
      const result = await res.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No completed journal entries found');
    });

    test('requires active goals', async () => {
      const db = testDb();
      // Make the goal inactive
      await db.update(schema.goals).set({ isActive: false }).where(eq(schema.goals.id, testGoalId));

      const generateData: GenerateGoalAlignmentSummaryRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      };

      const res = await app.request('/api/goal-alignment-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(generateData),
      });

      expect(res.status).toBe(400);
      const result = await res.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No active goals found');
    });
  });

  describe('Authentication', () => {
    test('requires authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/goal-alignment-summaries' },
        { method: 'POST', path: '/api/goal-alignment-summaries' },
        { method: 'POST', path: '/api/goal-alignment-summaries/generate' },
      ];

      for (const { method, path } of endpoints) {
        const res = await app.request(path, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method === 'POST' ? JSON.stringify({}) : undefined,
        });

        expect(res.status).toBe(401);
      }
    });
  });
});
