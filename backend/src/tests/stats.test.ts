import { describe, test, expect, beforeEach } from 'vitest';
import app from '../index';
import { testDb, cleanDatabase, schema } from './setup';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';

// Test setup data
const testUser = {
  name: 'Stats Test User',
  email: 'stats.test@example.com',
  password: 'password123',
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

describe('Stats API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create test user
    const db = testDb();
    const [user] = await db.insert(schema.users).values(testUser).returning();
    userId = user.id;

    // Generate JWT token
    authToken = await sign(
      {
        id: userId,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      },
      JWT_SECRET,
    );
  });

  describe('GET /api/stats/predefined', () => {
    test('should return predefined stats', async () => {
      const res = await app.request('/api/stats/predefined');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      // Check that each predefined stat has required fields
      data.data.forEach((stat: any) => {
        expect(stat).toHaveProperty('name');
        expect(stat).toHaveProperty('description');
        expect(stat).toHaveProperty('exampleActivities');
        expect(Array.isArray(stat.exampleActivities)).toBe(true);
      });
    });
  });

  describe('POST /api/stats', () => {
    test('should create a custom stat', async () => {
      const statData = {
        name: 'Programming',
        description: 'Skills in software development and coding',
        exampleActivities: [
          { description: 'Complete a coding challenge', suggestedXp: 25 },
          { description: 'Learn a new programming language', suggestedXp: 50 },
        ],
      };

      const res = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(statData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(statData.name);
      expect(data.data.description).toBe(statData.description);
      expect(data.data.currentLevel).toBe(1);
      expect(data.data.totalXp).toBe(0);
      expect(data.data.userId).toBe(userId);
    });

    test('should reject duplicate stat names', async () => {
      const statData = {
        name: 'Strength',
        description: 'Physical power',
        exampleActivities: [{ description: 'Workout', suggestedXp: 20 }],
      };

      // Create first stat
      await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(statData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Try to create duplicate
      const res = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(statData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    test('should require authentication', async () => {
      const statData = {
        name: 'Test Stat',
        description: 'Test description',
        exampleActivities: [{ description: 'Test activity', suggestedXp: 10 }],
      };

      const res = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(statData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/stats/predefined', () => {
    test('should create multiple predefined stats', async () => {
      const res = await app.request('/api/stats/predefined', {
        method: 'POST',
        body: JSON.stringify({ statNames: ['Strength', 'Wisdom'] }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('Strength');
      expect(data.data[1].name).toBe('Wisdom');
    });

    test('should reject duplicate predefined stats', async () => {
      // Create Strength stat first
      await app.request('/api/stats/predefined', {
        method: 'POST',
        body: JSON.stringify({ statNames: ['Strength'] }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Try to create it again
      const res = await app.request('/api/stats/predefined', {
        method: 'POST',
        body: JSON.stringify({ statNames: ['Strength'] }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exist');
    });
  });

  describe('GET /api/stats', () => {
    test('should return user stats with progress info', async () => {
      // Create a stat first
      await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Endurance',
          description: 'Physical stamina',
          exampleActivities: [{ description: 'Run 5K', suggestedXp: 30 }],
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const res = await app.request('/api/stats', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);

      const stat = data.data[0];
      expect(stat.name).toBe('Endurance');
      expect(stat).toHaveProperty('xpToNextLevel');
      expect(stat).toHaveProperty('canLevelUp');
      expect(stat.canLevelUp).toBe(false); // No XP yet
    });

    test('should return empty array for user with no stats', async () => {
      const res = await app.request('/api/stats', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });
  });

  describe('GET /api/stats/:id', () => {
    test('should return specific stat with progress info', async () => {
      // Create a stat first
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Intelligence',
          description: 'Mental acuity',
          exampleActivities: [{ description: 'Solve puzzle', suggestedXp: 25 }],
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const createData = await createRes.json();
      const statId = createData.data.id;

      const res = await app.request(`/api/stats/${statId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(statId);
      expect(data.data.name).toBe('Intelligence');
      expect(data.data).toHaveProperty('xpToNextLevel');
      expect(data.data).toHaveProperty('canLevelUp');
    });

    test('should return 404 for non-existent stat', async () => {
      const res = await app.request('/api/stats/550e8400-e29b-41d4-a716-446655440000', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/stats/:id', () => {
    test('should update stat', async () => {
      // Create a stat first
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Charisma',
          description: 'Social skills',
          exampleActivities: [{ description: 'Give speech', suggestedXp: 30 }],
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const createData = await createRes.json();
      const statId = createData.data.id;

      const updateData = {
        name: 'Leadership',
        description: 'Ability to lead and inspire others',
      };

      const res = await app.request(`/api/stats/${statId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Leadership');
      expect(data.data.description).toBe(updateData.description);
    });
  });

  describe('DELETE /api/stats/:id', () => {
    test('should delete stat', async () => {
      // Create a stat first
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Dexterity',
          description: 'Hand-eye coordination',
          exampleActivities: [{ description: 'Play instrument', suggestedXp: 20 }],
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const createData = await createRes.json();
      const statId = createData.data.id;

      const res = await app.request(`/api/stats/${statId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify stat is deleted
      const getRes = await app.request(`/api/stats/${statId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      expect(getRes.status).toBe(404);
    });
  });

  describe('POST /api/stats/:id/xp', () => {
    test('should grant XP to stat', async () => {
      // Create a stat first
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Agility',
          description: 'Speed and reflexes',
          exampleActivities: [{ description: 'Sprint training', suggestedXp: 25 }],
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const createData = await createRes.json();
      const statId = createData.data.id;

      const xpData = {
        statId: statId,
        xpAmount: 50,
        sourceType: 'task' as const,
        reason: 'Completed morning workout',
      };

      const res = await app.request(`/api/stats/${statId}/xp`, {
        method: 'POST',
        body: JSON.stringify(xpData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.xpGrant.xpAmount).toBe(50);
      expect(data.data.stat.totalXp).toBe(50);
      expect(data.data.levelInfo.canLevelUp).toBe(false); // Need 300 total XP for level 2
    });

    test('should enable level up when enough XP is earned', async () => {
      // Create a stat first
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Constitution',
          description: 'Health and endurance',
          exampleActivities: [{ description: 'Long hike', suggestedXp: 40 }],
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const createData = await createRes.json();
      const statId = createData.data.id;

      // Grant enough XP to level up (need 300 total for level 2: 100 for level 1 + 200 for level 2)
      const res = await app.request(`/api/stats/${statId}/xp`, {
        method: 'POST',
        body: JSON.stringify({
          statId: statId,
          xpAmount: 300,
          sourceType: 'task' as const,
          reason: 'Epic adventure completed',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.stat.totalXp).toBe(300);
      expect(data.data.levelInfo.canLevelUp).toBe(true); // Now has enough XP for level 2
    });
  });

  describe('POST /api/stats/:id/level-up', () => {
    test('should level up stat when enough XP is available', async () => {
      // Create a stat first
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Luck',
          description: 'Fortune favors the bold',
          exampleActivities: [{ description: 'Take calculated risk', suggestedXp: 35 }],
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const createData = await createRes.json();
      const statId = createData.data.id;

      // Grant enough XP for level 2 (need 300 total: 100 for level 1 + 200 for level 2)
      await app.request(`/api/stats/${statId}/xp`, {
        method: 'POST',
        body: JSON.stringify({
          statId: statId,
          xpAmount: 300,
          sourceType: 'quest' as const,
          reason: 'Major quest completed',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Now level up
      const res = await app.request(`/api/stats/${statId}/level-up`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.stat.currentLevel).toBe(2);
      expect(data.data.leveledUp).toBe(true);
    });

    test('should reject level up without enough XP', async () => {
      // Create a stat first
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Perception',
          description: 'Awareness and observation',
          exampleActivities: [{ description: 'Meditation session', suggestedXp: 15 }],
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const createData = await createRes.json();
      const statId = createData.data.id;

      // Try to level up without enough XP
      const res = await app.request(`/api/stats/${statId}/level-up`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Not enough XP');
    });
  });

  describe('GET /api/stats/:id/xp-history', () => {
    test('should return XP grant history for a stat', async () => {
      // Create a stat first
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Crafting',
          description: 'Creating useful items',
          exampleActivities: [{ description: 'Build something', suggestedXp: 30 }],
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const createData = await createRes.json();
      const statId = createData.data.id;

      // Grant some XP
      await app.request(`/api/stats/${statId}/xp`, {
        method: 'POST',
        body: JSON.stringify({
          statId: statId,
          xpAmount: 25,
          sourceType: 'adhoc' as const,
          reason: 'Built a birdhouse',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const res = await app.request(`/api/stats/${statId}/xp-history`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].xpAmount).toBe(25);
      expect(data.data[0].sourceType).toBe('adhoc');
      expect(data.data[0].reason).toBe('Built a birdhouse');
    });
  });
});
