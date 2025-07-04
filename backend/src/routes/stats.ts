import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db';
import { characterStats, characterStatXpGrants, characterStatLevelTitles } from '../db/schema/stats';
import { jwtAuth } from '../middleware/auth';
import { 
  createCharacterStatSchema, 
  updateCharacterStatSchema, 
  grantXpSchema, 
  levelUpSchema,
  createPredefinedStatsSchema,
  statsQuerySchema,
  xpHistoryQuerySchema
} from '../validation/stats';
import { 
  PREDEFINED_STATS, 
  type CharacterStatWithProgress,
  type CharacterStatXpGrant,
  type LevelCalculation 
} from '../types/stats';
import { calculateLevelInfo, canLevelUp as canLevelUpUtil } from '../utils/stats';
import logger, { handleApiError } from '../utils/logger';

const app = new Hono()
  // Get all stats for the authenticated user
  .get('/', jwtAuth, zValidator('query', statsQuerySchema), async (c) => {
    try {
      const userId = c.get('userId');
      const { includeXpHistory, includeLevelTitles } = c.req.valid('query');

      const stats = await db.select().from(characterStats).where(eq(characterStats.userId, userId));

      // Enhance stats with progress information
      const enhancedStats: CharacterStatWithProgress[] = await Promise.all(
        stats.map(async (stat) => {
          const levelInfo = calculateLevelInfo(stat.currentLevel, stat.totalXp);
          
          let currentLevelTitle: string | undefined;
          let nextLevelTitle: string | undefined;
          
          if (includeLevelTitles) {
            const titles = await db.select()
              .from(characterStatLevelTitles)
              .where(and(
                eq(characterStatLevelTitles.statId, stat.id),
                eq(characterStatLevelTitles.level, stat.currentLevel)
              ));
            currentLevelTitle = titles[0]?.title;

            if (levelInfo.canLevelUp) {
              const nextTitles = await db.select()
                .from(characterStatLevelTitles)
                .where(and(
                  eq(characterStatLevelTitles.statId, stat.id),
                  eq(characterStatLevelTitles.level, stat.currentLevel + 1)
                ));
              nextLevelTitle = nextTitles[0]?.title;
            }
          }

          return {
            ...stat,
            xpToNextLevel: levelInfo.xpToNextLevel,
            canLevelUp: levelInfo.canLevelUp,
            currentLevelTitle,
            nextLevelTitle,
          };
        })
      );

      return c.json({ success: true, data: enhancedStats });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch character stats');
    }
  })

  // Get predefined stats that can be added
  .get('/predefined', async (c) => {
    try {
      return c.json({ success: true, data: PREDEFINED_STATS });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch predefined stats');
    }
  })

  // Create a new custom stat
  .post('/', jwtAuth, zValidator('json', createCharacterStatSchema), async (c) => {
    try {
      const userId = c.get('userId');
      const statData = c.req.valid('json');

      console.log('Creating stat with data:', statData, 'for user:', userId);

      // Check if stat name already exists for this user
      const existingStat = await db.select()
        .from(characterStats)
        .where(and(
          eq(characterStats.userId, userId),
          eq(characterStats.name, statData.name)
        ));

      if (existingStat.length > 0) {
        return c.json({ success: false, error: 'A stat with this name already exists' }, 400);
      }

      const [newStat] = await db.insert(characterStats).values({
        userId,
        ...statData,
      }).returning();

      return c.json({ success: true, data: newStat }, 201);
    } catch (error) {
      console.error('Error creating stat:', error);
      return handleApiError(error, 'Failed to create character stat');
    }
  })

  // Create multiple predefined stats
  .post('/predefined', jwtAuth, zValidator('json', createPredefinedStatsSchema), async (c) => {
    try {
      const userId = c.get('userId');
      const { statNames } = c.req.valid('json');

      // Find the predefined stats
      const predefinedToCreate = PREDEFINED_STATS.filter(stat => 
        statNames.includes(stat.name)
      );

      if (predefinedToCreate.length === 0) {
        return c.json({ success: false, error: 'No valid predefined stats found' }, 400);
      }

      // Check for existing stats
      const existingStats = await db.select()
        .from(characterStats)
        .where(eq(characterStats.userId, userId));
      
      const existingStatNames = existingStats.map(stat => stat.name);
      const statsToCreate = predefinedToCreate.filter(stat => 
        !existingStatNames.includes(stat.name)
      );

      if (statsToCreate.length === 0) {
        return c.json({ success: false, error: 'All selected stats already exist' }, 400);
      }

      const newStats = await db.insert(characterStats).values(
        statsToCreate.map(stat => ({
          userId,
          name: stat.name,
          description: stat.description,
          exampleActivities: stat.exampleActivities,
        }))
      ).returning();

      return c.json({ success: true, data: newStats }, 201);
    } catch (error) {
      return handleApiError(error, 'Failed to create predefined stats');
    }
  })

  // Get a specific stat
  .get('/:id', jwtAuth, async (c) => {
    try {
      const userId = c.get('userId');
      const statId = c.req.param('id');

      const [stat] = await db.select()
        .from(characterStats)
        .where(and(
          eq(characterStats.id, statId),
          eq(characterStats.userId, userId)
        ));

      if (!stat) {
        return c.json({ success: false, error: 'Stat not found' }, 404);
      }

      const levelInfo = calculateLevelInfo(stat.currentLevel, stat.totalXp);
      
      const enhancedStat: CharacterStatWithProgress = {
        ...stat,
        xpToNextLevel: levelInfo.xpToNextLevel,
        canLevelUp: levelInfo.canLevelUp,
      };

      return c.json({ success: true, data: enhancedStat });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch character stat');
    }
  })

  // Update a stat
  .put('/:id', jwtAuth, zValidator('json', updateCharacterStatSchema), async (c) => {
    try {
      const userId = c.get('userId');
      const statId = c.req.param('id');
      const updateData = c.req.valid('json');

      // Verify ownership
      const [existingStat] = await db.select()
        .from(characterStats)
        .where(and(
          eq(characterStats.id, statId),
          eq(characterStats.userId, userId)
        ));

      if (!existingStat) {
        return c.json({ success: false, error: 'Stat not found' }, 404);
      }

      // Check for name conflicts if name is being updated
      if (updateData.name && updateData.name !== existingStat.name) {
        const conflictingStat = await db.select()
          .from(characterStats)
          .where(and(
            eq(characterStats.userId, userId),
            eq(characterStats.name, updateData.name)
          ));

        if (conflictingStat.length > 0) {
          return c.json({ success: false, error: 'A stat with this name already exists' }, 400);
        }
      }

      const [updatedStat] = await db.update(characterStats)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(characterStats.id, statId))
        .returning();

      return c.json({ success: true, data: updatedStat });
    } catch (error) {
      return handleApiError(error, 'Failed to update character stat');
    }
  })

  // Delete a stat
  .delete('/:id', jwtAuth, async (c) => {
    try {
      const userId = c.get('userId');
      const statId = c.req.param('id');

      // Verify ownership
      const [existingStat] = await db.select()
        .from(characterStats)
        .where(and(
          eq(characterStats.id, statId),
          eq(characterStats.userId, userId)
        ));

      if (!existingStat) {
        return c.json({ success: false, error: 'Stat not found' }, 404);
      }

      await db.delete(characterStats)
        .where(eq(characterStats.id, statId));

      return c.json({ success: true, message: 'Stat deleted successfully' });
    } catch (error) {
      return handleApiError(error, 'Failed to delete character stat');
    }
  })

  // Grant XP to a stat
  .post('/:id/xp', jwtAuth, zValidator('json', grantXpSchema), async (c) => {
    try {
      const userId = c.get('userId');
      const statId = c.req.param('id');
      const { xpAmount, sourceType, sourceId, reason } = c.req.valid('json');

      // Verify stat ownership
      const [stat] = await db.select()
        .from(characterStats)
        .where(and(
          eq(characterStats.id, statId),
          eq(characterStats.userId, userId)
        ));

      if (!stat) {
        return c.json({ success: false, error: 'Stat not found' }, 404);
      }

      // Create XP grant record
      const [xpGrant] = await db.insert(characterStatXpGrants).values({
        userId,
        statId,
        xpAmount,
        sourceType,
        sourceId,
        reason,
      }).returning();

      // Update stat total XP
      const newTotalXp = stat.totalXp + xpAmount;
      const [updatedStat] = await db.update(characterStats)
        .set({
          totalXp: newTotalXp,
          updatedAt: new Date(),
        })
        .where(eq(characterStats.id, statId))
        .returning();

      const levelInfo = calculateLevelInfo(updatedStat.currentLevel, updatedStat.totalXp);

      return c.json({ 
        success: true, 
        data: {
          xpGrant,
          stat: updatedStat,
          levelInfo,
        }
      });
    } catch (error) {
      return handleApiError(error, 'Failed to grant XP');
    }
  })

  // Level up a stat
  .post('/:id/level-up', jwtAuth, async (c) => {
    try {
      const userId = c.get('userId');
      const statId = c.req.param('id');

      // Verify stat ownership
      const [stat] = await db.select()
        .from(characterStats)
        .where(and(
          eq(characterStats.id, statId),
          eq(characterStats.userId, userId)
        ));

      if (!stat) {
        return c.json({ success: false, error: 'Stat not found' }, 404);
      }

      // Check if level up is allowed
      if (!canLevelUpUtil(stat.currentLevel, stat.totalXp)) {
        return c.json({ success: false, error: 'Not enough XP to level up' }, 400);
      }

      // Update stat level
      const [updatedStat] = await db.update(characterStats)
        .set({
          currentLevel: stat.currentLevel + 1,
          updatedAt: new Date(),
        })
        .where(eq(characterStats.id, statId))
        .returning();

      const levelInfo = calculateLevelInfo(updatedStat.currentLevel, updatedStat.totalXp);

      return c.json({ 
        success: true, 
        data: {
          stat: updatedStat,
          levelInfo,
          leveledUp: true,
        }
      });
    } catch (error) {
      return handleApiError(error, 'Failed to level up stat');
    }
  })

  // Get XP history for a stat
  .get('/:id/xp-history', jwtAuth, zValidator('query', xpHistoryQuerySchema), async (c) => {
    try {
      const userId = c.get('userId');
      const statId = c.req.param('id');
      const { limit, offset } = c.req.valid('query');

      // Verify stat ownership
      const [stat] = await db.select()
        .from(characterStats)
        .where(and(
          eq(characterStats.id, statId),
          eq(characterStats.userId, userId)
        ));

      if (!stat) {
        return c.json({ success: false, error: 'Stat not found' }, 404);
      }

      const xpHistory = await db.select()
        .from(characterStatXpGrants)
        .where(eq(characterStatXpGrants.statId, statId))
        .orderBy(desc(characterStatXpGrants.createdAt))
        .limit(limit)
        .offset(offset);

      return c.json({ success: true, data: xpHistory });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch XP history');
    }
  });

export default app;
