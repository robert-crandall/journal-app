import { describe, it, expect, beforeEach } from 'vitest';
import app from '../index';
import { testDb, cleanDatabase, schema } from './setup';
import { eq } from 'drizzle-orm';

describe('Stats API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let characterId: string;
  let statId: string;

  beforeEach(async () => {
    await cleanDatabase();
    
    // Create a test user and get auth token for protected routes
    const userData = {
      name: 'Stats Test User',
      email: 'stats-test@example.com',
      password: 'password123'
    };

    const registerRes = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(registerRes.status).toBe(201);
    const registerData = await registerRes.json();
    authToken = registerData.token;
    userId = registerData.user.id;

    // Create a character for the test user
    const characterData = {
      name: 'Gandalf',
      characterClass: 'Wizard',
      backstory: 'A wise wizard with a long history',
      goals: 'To help others defeat evil'
    };

    const createCharRes = await app.request('/api/characters', {
      method: 'POST',
      body: JSON.stringify(characterData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(createCharRes.status).toBe(201);
    const characterResponse = await createCharRes.json();
    characterId = characterResponse.data.id;
  });

  describe('GET /api/stats/groups', () => {
    it('should return stat groups', async () => {
      const res = await app.request('/api/stats/groups', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0); // Should have default groups from seed
      
      // Check for required properties
      const group = data.data[0];
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('description');
      expect(group).toHaveProperty('isDefault');
    });
  });

  describe('GET /api/stats/templates', () => {
    it('should return stat templates', async () => {
      const res = await app.request('/api/stats/templates', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0); // Should have default templates from seed
      
      // Check for required properties
      const template = data.data[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('suggestedForClasses');
    });
  });

  describe('GET /api/stats/templates/by-class/:characterClass', () => {
    it('should return templates for character class', async () => {
      const res = await app.request('/api/stats/templates/by-class/wizard', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // All returned templates should include "Wizard" in suggestedForClasses
      data.data.forEach((template: any) => {
        const classes = template.suggestedForClasses?.split(',').map((c: string) => c.trim().toLowerCase());
        expect(classes?.includes('wizard')).toBe(true);
      });
    });
  });

  describe('POST /api/stats', () => {
    it('should create a new stat', async () => {
      const newStat = {
        name: 'Testing',
        description: 'Ability to write good tests',
        isCustom: true,
      };
      
      const res = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        name: newStat.name,
        description: newStat.description,
        isCustom: newStat.isCustom,
        currentXp: 0,
        level: 1,
      });
      
      // Save stat ID for later tests
      statId = data.data.id;

      // Verify in database
      const db = testDb();
      const dbStat = await db
        .select()
        .from(schema.stats)
        .where(eq(schema.stats.id, statId))
        .limit(1);

      expect(dbStat).toHaveLength(1);
      expect(dbStat[0].name).toBe(newStat.name);
      expect(dbStat[0].description).toBe(newStat.description);
      expect(dbStat[0].characterId).toBe(characterId);
    });
  });

  describe('GET /api/stats', () => {
    it('should return all stats for the character', async () => {
      // First create a stat
      const newStat = {
        name: 'Testing',
        description: 'Ability to write good tests',
        isCustom: true,
      };
      
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      statId = createData.data.id;

      // Now get all stats
      const res = await app.request('/api/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Should find our created stat
      const foundStat = data.data.find((s: any) => s.id === statId);
      expect(foundStat).toBeDefined();
      expect(foundStat.name).toBe('Testing');
    });
  });

  describe('PUT /api/stats/:statId', () => {
    it('should update a stat', async () => {
      // First create a stat
      const newStat = {
        name: 'Original Name',
        description: 'Original description',
        isCustom: true,
      };
      
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      statId = createData.data.id;

      // Now update the stat
      const updateData = {
        description: 'Updated description for testing stat',
        currentXp: 50,
      };
      
      const res = await app.request(`/api/stats/${statId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: statId,
        description: updateData.description,
        currentXp: updateData.currentXp,
      });

      // Verify in database
      const db = testDb();
      const dbStat = await db
        .select()
        .from(schema.stats)
        .where(eq(schema.stats.id, statId))
        .limit(1);

      expect(dbStat[0].description).toBe(updateData.description);
      expect(dbStat[0].currentXp).toBe(updateData.currentXp);
      expect(dbStat[0].name).toBe(newStat.name); // Name should remain unchanged
    });
  });

  describe('POST /api/stats/grant-xp', () => {
    it('should add XP to a stat', async () => {
      // First create a stat with initial XP
      const newStat = {
        name: 'XP Test Stat',
        description: 'Testing XP functionality',
        isCustom: true,
        currentXp: 50,
      };
      
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      statId = createData.data.id;

      // Now grant XP
      const grantXpData = {
        statId: statId,
        xp: 60,
        reason: 'Completed task',
      };
      
      const res = await app.request('/api/stats/grant-xp', {
        method: 'POST',
        body: JSON.stringify(grantXpData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      
      // Should have the previous 50 XP + 60 new XP = 110
      expect(data.data.currentXp).toBe(110);
      
      // Should indicate level up is available
      expect(data.data.canLevelUp).toBe(true);
      expect(data.data.xpForNextLevel).toBe(100); // Level 1 requires 100 XP to advance
      expect(data.data.xpAdded).toBe(60);

      // Verify in database
      const db = testDb();
      const dbStat = await db
        .select()
        .from(schema.stats)
        .where(eq(schema.stats.id, statId))
        .limit(1);

      expect(dbStat[0].currentXp).toBe(110);
    });
  });

  describe('POST /api/stats/level-up', () => {
    it('should level up a stat', async () => {
      // First create a stat with enough XP to level up
      const newStat = {
        name: 'Level Up Test Stat',
        description: 'Testing level up functionality',
        isCustom: true,
        currentXp: 110, // More than needed for level 1->2
      };
      
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      statId = createData.data.id;

      // Now level up
      const levelUpData = {
        statId: statId,
      };
      
      const res = await app.request('/api/stats/level-up', {
        method: 'POST',
        body: JSON.stringify(levelUpData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      
      // Level should increase by 1, XP remains unchanged
      expect(data.data.level).toBe(2);
      expect(data.data.currentXp).toBe(110);
      expect(data.data.xpForNextLevel).toBe(200); // Level 2 requires 200 more XP

      // Verify in database
      const db = testDb();
      const dbStat = await db
        .select()
        .from(schema.stats)
        .where(eq(schema.stats.id, statId))
        .limit(1);

      expect(dbStat[0].level).toBe(2);
      expect(dbStat[0].currentXp).toBe(110);
    });
  });

  describe('POST /api/stats/:statId/activities', () => {
    it('should create a sample activity', async () => {
      // First create a stat
      const newStat = {
        name: 'Activity Test Stat',
        description: 'Testing activities functionality',
        isCustom: true,
      };
      
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      statId = createData.data.id;

      // Now create an activity
      const activityData = {
        description: 'Write unit tests',
        xpValue: 25,
      };
      
      const res = await app.request(`/api/stats/${statId}/activities`, {
        method: 'POST',
        body: JSON.stringify(activityData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        description: activityData.description,
        xpValue: activityData.xpValue,
        statId: statId,
      });
    });
  });

  describe('GET /api/stats/:statId/activities', () => {
    it('should get sample activities for a stat', async () => {
      // First create a stat
      const newStat = {
        name: 'Activities List Test Stat',
        description: 'Testing activities list functionality',
        isCustom: true,
      };
      
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      statId = createData.data.id;

      // Create an activity
      const activityData = {
        description: 'Write unit tests',
        xpValue: 25,
      };
      
      const createActivityRes = await app.request(`/api/stats/${statId}/activities`, {
        method: 'POST',
        body: JSON.stringify(activityData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createActivityRes.status).toBe(201);

      // Now get all activities
      const res = await app.request(`/api/stats/${statId}/activities`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].description).toBe('Write unit tests');
    });
  });

  describe('POST /api/stats/:statId/level-titles', () => {
    it('should create a level title', async () => {
      // First create a stat
      const newStat = {
        name: 'Level Titles Test Stat',
        description: 'Testing level titles functionality',
        isCustom: true,
      };
      
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      statId = createData.data.id;

      // Now create a level title
      const titleData = {
        level: 1,
        title: 'Novice Tester',
      };
      
      const res = await app.request(`/api/stats/${statId}/level-titles`, {
        method: 'POST',
        body: JSON.stringify(titleData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        level: titleData.level,
        title: titleData.title,
        statId: statId,
      });
    });
  });

  describe('GET /api/stats/:statId/level-titles', () => {
    it('should get level titles for a stat', async () => {
      // First create a stat
      const newStat = {
        name: 'Level Titles List Test Stat',
        description: 'Testing level titles list functionality',
        isCustom: true,
      };
      
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      statId = createData.data.id;

      // Create a level title
      const titleData = {
        level: 1,
        title: 'Novice Tester',
      };
      
      const createTitleRes = await app.request(`/api/stats/${statId}/level-titles`, {
        method: 'POST',
        body: JSON.stringify(titleData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createTitleRes.status).toBe(201);

      // Now get all level titles
      const res = await app.request(`/api/stats/${statId}/level-titles`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].title).toBe('Novice Tester');
      expect(data.data[0].level).toBe(1);
    });
  });

  describe('POST /api/stats/assign-templates', () => {
    it('should assign stats from templates', async () => {
      // First get some templates
      const templatesRes = await app.request('/api/stats/templates/by-class/wizard', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const templatesData = await templatesRes.json();
      const templateIds = templatesData.data.slice(0, 3).map((t: any) => t.id);
      
      // Now assign these templates
      const res = await app.request('/api/stats/assign-templates', {
        method: 'POST',
        body: JSON.stringify({
          templateIds,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(templateIds.length);
      
      // Each assigned stat should have the right properties
      data.data.forEach((stat: any) => {
        expect(stat).toHaveProperty('id');
        expect(stat).toHaveProperty('characterId');
        expect(stat).toHaveProperty('name');
        expect(stat).toHaveProperty('isCustom', false);
        expect(stat).toHaveProperty('currentXp', 0);
        expect(stat).toHaveProperty('level', 1);
      });

      // Verify in database
      const db = testDb();
      const dbStats = await db
        .select()
        .from(schema.stats)
        .where(eq(schema.stats.characterId, characterId));

      expect(dbStats.length).toBe(templateIds.length);
    });
  });

  describe('DELETE /api/stats/:statId', () => {
    it('should delete a stat', async () => {
      // First create a stat
      const newStat = {
        name: 'Delete Test Stat',
        description: 'Testing delete functionality',
        isCustom: true,
      };
      
      const createRes = await app.request('/api/stats', {
        method: 'POST',
        body: JSON.stringify(newStat),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      statId = createData.data.id;

      // Now delete the stat
      const res = await app.request(`/api/stats/${statId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(statId);
      
      // Verify stat is deleted
      const checkRes = await app.request('/api/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const checkData = await checkRes.json();
      const deletedStat = checkData.data.find((s: any) => s.id === statId);
      expect(deletedStat).toBeUndefined();

      // Verify in database
      const db = testDb();
      const dbStats = await db
        .select()
        .from(schema.stats)
        .where(eq(schema.stats.id, statId));

      expect(dbStats).toHaveLength(0);
    });
  });
});
