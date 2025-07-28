import { describe, test, expect, beforeEach } from 'vitest';
import appExport from '../../index';
import { testDb, getUniqueEmail, schema } from '../setup';
import { eq, and } from 'drizzle-orm';
import type { CreateWeeklyAnalysisRequest, GenerateWeeklyAnalysisRequest } from '../../../../shared/types/weekly-analyses';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Weekly Analyses API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let testUser: { name: string; email: string; password: string };
  let testGoalId: string;
  let testStatId: string;

  beforeEach(async () => {
    // Create a test user with unique email and get auth token for protected routes
    testUser = {
      name: 'Test User',
      email: getUniqueEmail('weekly-analyses'),
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

    const db = testDb();

    // Create a test goal
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

    // Create a test character stat
    const [testStat] = await db
      .insert(schema.characterStats)
      .values({
        userId,
        name: 'Learning',
        description: 'The ability to learn new skills',
        currentLevel: 1,
        totalXp: 0,
        exampleActivities: [{ description: 'Study Spanish', suggestedXp: 10 }],
      })
      .returning();
    testStatId = testStat.id;

    // Create test journal entries
    await db.insert(schema.journals).values([
      {
        userId,
        date: '2024-01-15',
        initialMessage: 'Practiced Spanish conversation for 30 minutes today. Feeling more confident with basic phrases.',
        summary: 'Good progress on Spanish learning.',
        toneTags: ['happy', 'energized'],
        status: 'complete',
      },
      {
        userId,
        date: '2024-01-16',
        initialMessage: 'Had a great workout and studied more Spanish vocabulary.',
        summary: 'Productive day with learning and exercise.',
        toneTags: ['energized'],
        status: 'complete',
      },
    ]);

    // Create some XP grants for metrics
    await db.insert(schema.xpGrants).values([
      {
        userId,
        entityType: 'character_stat',
        entityId: testStatId,
        xpAmount: 15,
        sourceType: 'journal',
        reason: 'Spanish practice',
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        userId,
        entityType: 'character_stat',
        entityId: testStatId,
        xpAmount: 10,
        sourceType: 'journal',
        reason: 'Vocabulary study',
        createdAt: new Date('2024-01-16T10:00:00Z'),
      },
    ]);

    // Create some completed tasks
    await db.insert(schema.simpleTodos).values([
      {
        userId,
        description: 'Spanish practice',
        isCompleted: true,
        completedAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        userId,
        description: 'Review vocabulary',
        isCompleted: true,
        completedAt: new Date('2024-01-16T10:00:00Z'),
      },
    ]);
  });

  describe('POST /api/weekly-analyses', () => {
    test('creates a new weekly analysis', async () => {
      const analysisData: CreateWeeklyAnalysisRequest = {
        periodStartDate: '2024-01-13',
        periodEndDate: '2024-01-19',
        journalSummary: 'This week focused heavily on Spanish learning with consistent practice.',
        journalTags: ['learning', 'spanish', 'progress'],
        totalXpGained: 25,
        tasksCompleted: 2,
        xpByStats: [
          {
            statId: testStatId,
            statName: 'Learning',
            xpGained: 25,
          },
        ],
        toneFrequency: [
          { tone: 'happy', count: 1 },
          { tone: 'energized', count: 2 },
        ],
        contentTagFrequency: [
          { tag: 'spanish', count: 2 },
          { tag: 'learning', count: 2 },
        ],
        alignmentScore: 85,
        alignedGoals: [
          {
            goalId: testGoalId,
            goalTitle: 'Learn Spanish',
            evidence: ['Practiced Spanish for 30 minutes', 'Studied vocabulary daily'],
          },
        ],
        neglectedGoals: [],
        suggestedNextSteps: ['Continue daily practice', 'Focus on speaking skills'],
        goalAlignmentSummary: 'Excellent alignment with Spanish learning goal through consistent practice.',
        combinedReflection: 'Your dedication to Spanish learning this week shows in both your daily actions and progress toward your goals.',
      };

      const res = await app.request('/api/weekly-analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(analysisData),
      });

      expect(res.status).toBe(201);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        userId,
        periodStartDate: analysisData.periodStartDate,
        periodEndDate: analysisData.periodEndDate,
        journalSummary: analysisData.journalSummary,
        totalXpGained: analysisData.totalXpGained,
        tasksCompleted: analysisData.tasksCompleted,
        alignmentScore: analysisData.alignmentScore,
      });
      expect(result.data.id).toBeTruthy();
    });

    test('prevents duplicate weekly analyses for the same period', async () => {
      const analysisData: CreateWeeklyAnalysisRequest = {
        periodStartDate: '2024-01-13',
        periodEndDate: '2024-01-19',
        journalSummary: 'Test summary',
        goalAlignmentSummary: 'Test goal summary',
      };

      // Create first analysis
      const res1 = await app.request('/api/weekly-analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(analysisData),
      });

      expect(res1.status).toBe(201);

      // Try to create duplicate
      const res2 = await app.request('/api/weekly-analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(analysisData),
      });

      expect(res2.status).toBe(409);
      const result = await res2.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    test('requires authentication', async () => {
      const analysisData: CreateWeeklyAnalysisRequest = {
        periodStartDate: '2024-01-13',
        periodEndDate: '2024-01-19',
        journalSummary: 'Test summary',
        goalAlignmentSummary: 'Test goal summary',
      };

      const res = await app.request('/api/weekly-analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/weekly-analyses/generate', () => {
    test('generates weekly analysis using GPT', async () => {
      const generateData: GenerateWeeklyAnalysisRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      };

      const res = await app.request('/api/weekly-analyses/generate', {
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
      expect(result.data.journalSummary).toBeTruthy();
      expect(result.data.goalAlignmentSummary).toBeTruthy();
      expect(result.data.totalXpGained).toBe(25);
      expect(result.data.tasksCompleted).toBe(2);
    });

    test('prevents duplicate generated analyses', async () => {
      const generateData: GenerateWeeklyAnalysisRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      };

      // Generate first analysis
      const res1 = await app.request('/api/weekly-analyses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(generateData),
      });

      expect(res1.status).toBe(201);

      // Try to generate duplicate
      const res2 = await app.request('/api/weekly-analyses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(generateData),
      });

      expect(res2.status).toBe(409);
      const result = await res2.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    test('requires completed journal entries', async () => {
      const generateData: GenerateWeeklyAnalysisRequest = {
        startDate: '2024-02-01',
        endDate: '2024-02-07',
      };

      const res = await app.request('/api/weekly-analyses/generate', {
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
      expect(result.error).toContain('No completed journal entries');
    });

    test('requires active goals', async () => {
      // Deactivate the test goal
      const db = testDb();
      await db
        .update(schema.goals)
        .set({ isActive: false })
        .where(eq(schema.goals.id, testGoalId));

      const generateData: GenerateWeeklyAnalysisRequest = {
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      };

      const res = await app.request('/api/weekly-analyses/generate', {
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
      expect(result.error).toContain('No active goals');
    });
  });

  describe('GET /api/weekly-analyses', () => {
    beforeEach(async () => {
      // Create test analyses
      const db = testDb();
      await db.insert(schema.weeklyAnalyses).values([
        {
          userId,
          periodStartDate: '2024-01-13',
          periodEndDate: '2024-01-19',
          journalSummary: 'First week summary',
          goalAlignmentSummary: 'First week goal summary',
          totalXpGained: 25,
          tasksCompleted: 2,
        },
        {
          userId,
          periodStartDate: '2024-01-06',
          periodEndDate: '2024-01-12',
          journalSummary: 'Second week summary',
          goalAlignmentSummary: 'Second week goal summary',
          totalXpGained: 15,
          tasksCompleted: 1,
        },
      ]);
    });

    test('lists weekly analyses for authenticated user', async () => {
      const res = await app.request('/api/weekly-analyses', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data.analyses).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(result.data.hasMore).toBe(false);

      // Should be ordered by date descending (newest first)
      expect(result.data.analyses[0].periodStartDate).toBe('2024-01-13');
      expect(result.data.analyses[1].periodStartDate).toBe('2024-01-06');
    });

    test('supports pagination', async () => {
      const res = await app.request('/api/weekly-analyses?limit=1&offset=0', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data.analyses).toHaveLength(1);
      expect(result.data.total).toBe(2);
      expect(result.data.hasMore).toBe(true);
    });

    test('filters by year', async () => {
      const res = await app.request('/api/weekly-analyses?year=2024', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data.analyses).toHaveLength(2);
    });

    test('requires authentication', async () => {
      const res = await app.request('/api/weekly-analyses');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/weekly-analyses/:id', () => {
    let analysisId: string;

    beforeEach(async () => {
      const db = testDb();
      const [analysis] = await db
        .insert(schema.weeklyAnalyses)
        .values({
          userId,
          periodStartDate: '2024-01-13',
          periodEndDate: '2024-01-19',
          journalSummary: 'Test summary',
          goalAlignmentSummary: 'Test goal summary',
          totalXpGained: 25,
          tasksCompleted: 2,
        })
        .returning();
      analysisId = analysis.id;
    });

    test('retrieves specific weekly analysis', async () => {
      const res = await app.request(`/api/weekly-analyses/${analysisId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(analysisId);
      expect(result.data.journalSummary).toBe('Test summary');
    });

    test('returns 404 for non-existent analysis', async () => {
      const res = await app.request('/api/weekly-analyses/550e8400-e29b-41d4-a716-446655440000', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const result = await res.json();
      expect(result.success).toBe(false);
    });

    test('requires authentication', async () => {
      const res = await app.request(`/api/weekly-analyses/${analysisId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/weekly-analyses/:id', () => {
    let analysisId: string;

    beforeEach(async () => {
      const db = testDb();
      const [analysis] = await db
        .insert(schema.weeklyAnalyses)
        .values({
          userId,
          periodStartDate: '2024-01-13',
          periodEndDate: '2024-01-19',
          journalSummary: 'Original summary',
          goalAlignmentSummary: 'Original goal summary',
          totalXpGained: 25,
          tasksCompleted: 2,
        })
        .returning();
      analysisId = analysis.id;
    });

    test('updates weekly analysis', async () => {
      const updateData = {
        journalSummary: 'Updated summary',
        totalXpGained: 30,
      };

      const res = await app.request(`/api/weekly-analyses/${analysisId}`, {
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
      expect(result.data.journalSummary).toBe('Updated summary');
      expect(result.data.totalXpGained).toBe(30);
      expect(result.data.goalAlignmentSummary).toBe('Original goal summary'); // Unchanged
    });

    test('returns 404 for non-existent analysis', async () => {
      const res = await app.request('/api/weekly-analyses/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ journalSummary: 'Updated' }),
      });

      expect(res.status).toBe(404);
    });

    test('requires authentication', async () => {
      const res = await app.request(`/api/weekly-analyses/${analysisId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ journalSummary: 'Updated' }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/weekly-analyses/:id', () => {
    let analysisId: string;

    beforeEach(async () => {
      const db = testDb();
      const [analysis] = await db
        .insert(schema.weeklyAnalyses)
        .values({
          userId,
          periodStartDate: '2024-01-13',
          periodEndDate: '2024-01-19',
          journalSummary: 'Test summary',
          goalAlignmentSummary: 'Test goal summary',
          totalXpGained: 25,
          tasksCompleted: 2,
        })
        .returning();
      analysisId = analysis.id;
    });

    test('deletes weekly analysis', async () => {
      const res = await app.request(`/api/weekly-analyses/${analysisId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result.success).toBe(true);

      // Verify deletion
      const db = testDb();
      const deletedAnalysis = await db
        .select()
        .from(schema.weeklyAnalyses)
        .where(eq(schema.weeklyAnalyses.id, analysisId));

      expect(deletedAnalysis).toHaveLength(0);
    });

    test('returns 404 for non-existent analysis', async () => {
      const res = await app.request('/api/weekly-analyses/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    test('requires authentication', async () => {
      const res = await app.request(`/api/weekly-analyses/${analysisId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });
});
