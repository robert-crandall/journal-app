import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { characters } from '../db/schema/characters';
import { stats, statGroups, statLevelTitles, sampleActivities, statTemplates } from '../db/schema/stats';
import {
  createStatSchema,
  updateStatSchema,
  createStatGroupSchema,
  grantXpSchema,
  levelUpSchema,
  createSampleActivitySchema,
  updateSampleActivitySchema,
  createStatLevelTitleSchema,
  updateStatLevelTitleSchema,
  assignTemplateStatsSchema
} from '../validation/stats';
import { HTTPException } from 'hono/http-exception';
import { handleApiError } from '../utils/logger';
import { calculateRequiredXp } from '../types/stats';

// Chain methods for RPC compatibility
const app = new Hono()
  // Get all stats for the user's character
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      
      // Get the character ID first
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      // Get all stats with their groups
      const characterStats = await db.select({
        stat: stats,
        group: statGroups,
      })
      .from(stats)
      .leftJoin(statGroups, eq(stats.groupId, statGroups.id))
      .where(eq(stats.characterId, characterId));
      
      // Format the response
      const formattedStats = characterStats.map(item => ({
        ...item.stat,
        group: item.group || undefined,
      }));
      
      return c.json({ 
        success: true, 
        data: formattedStats 
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch character stats');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Create a new stat for user's character
  .post('/', jwtAuth, zValidator('json', createStatSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json');
      
      // Get the character ID first
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      // Check if stat with same name already exists for this character
      const existingStat = await db
        .select()
        .from(stats)
        .where(
          and(
            eq(stats.characterId, characterId),
            eq(stats.name, data.name)
          )
        )
        .limit(1);
      
      if (existingStat.length > 0) {
        return c.json({ 
          success: false, 
          error: 'Stat with this name already exists' 
        }, 400);
      }
      
      // Create the new stat
      const newStat = await db
        .insert(stats)
        .values({
          characterId,
          groupId: data.groupId,
          name: data.name,
          description: data.description,
          isCustom: data.isCustom ?? true,
          currentXp: data.currentXp ?? 0,
          level: data.level ?? 1,
        })
        .returning();
      
      return c.json({ 
        success: true, 
        data: newStat[0] 
      }, 201);
    } catch (error) {
      handleApiError(error, 'Failed to create stat');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Update a stat
  .put('/:statId', jwtAuth, zValidator('json', updateStatSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const statId = c.req.param('statId');
      const data = c.req.valid('json');
      
      // Get the character ID first
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      // Check if stat belongs to the user's character
      const existingStat = await db
        .select()
        .from(stats)
        .where(
          and(
            eq(stats.id, statId),
            eq(stats.characterId, characterId)
          )
        )
        .limit(1);
      
      if (existingStat.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Stat not found' 
        }, 404);
      }
      
      // Update the stat
      const updatedStat = await db
        .update(stats)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(stats.id, statId))
        .returning();
      
      return c.json({ 
        success: true, 
        data: updatedStat[0] 
      });
    } catch (error) {
      handleApiError(error, 'Failed to update stat');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Delete a stat
  .delete('/:statId', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const statId = c.req.param('statId');
      
      // Get the character ID first
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      // Check if stat belongs to the user's character
      const existingStat = await db
        .select()
        .from(stats)
        .where(
          and(
            eq(stats.id, statId),
            eq(stats.characterId, characterId)
          )
        )
        .limit(1);
      
      if (existingStat.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Stat not found' 
        }, 404);
      }
      
      // Delete the stat
      const deletedStat = await db
        .delete(stats)
        .where(eq(stats.id, statId))
        .returning();
      
      return c.json({ 
        success: true, 
        data: deletedStat[0] 
      });
    } catch (error) {
      handleApiError(error, 'Failed to delete stat');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Grant XP to a stat
  .post('/grant-xp', jwtAuth, zValidator('json', grantXpSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { statId, xp, reason } = c.req.valid('json');
      
      // Get the character ID first
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      // Check if stat belongs to the user's character
      const existingStat = await db
        .select()
        .from(stats)
        .where(
          and(
            eq(stats.id, statId),
            eq(stats.characterId, characterId)
          )
        )
        .limit(1);
      
      if (existingStat.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Stat not found' 
        }, 404);
      }
      
      // Update XP
      const currentStat = existingStat[0];
      const newXp = currentStat.currentXp + xp;
      
      const updatedStat = await db
        .update(stats)
        .set({
          currentXp: newXp,
          updatedAt: new Date(),
        })
        .where(eq(stats.id, statId))
        .returning();
      
      // Calculate if user can level up (but don't auto-level up)
      const nextLevelXp = calculateRequiredXp(currentStat.level);
      const canLevelUp = newXp >= nextLevelXp;
      
      return c.json({ 
        success: true, 
        data: {
          ...updatedStat[0],
          canLevelUp,
          xpForNextLevel: nextLevelXp,
          xpAdded: xp
        }
      });
    } catch (error) {
      handleApiError(error, 'Failed to grant XP');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Manually level up a stat
  .post('/level-up', jwtAuth, zValidator('json', levelUpSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { statId } = c.req.valid('json');
      
      // Get the character ID first
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      // Check if stat belongs to the user's character
      const existingStat = await db
        .select()
        .from(stats)
        .where(
          and(
            eq(stats.id, statId),
            eq(stats.characterId, characterId)
          )
        )
        .limit(1);
      
      if (existingStat.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Stat not found' 
        }, 404);
      }
      
      // Check if user has enough XP to level up
      const currentStat = existingStat[0];
      const requiredXp = calculateRequiredXp(currentStat.level);
      
      if (currentStat.currentXp < requiredXp) {
        return c.json({ 
          success: false, 
          error: 'Not enough XP to level up' 
        }, 400);
      }
      
      // Level up the stat (increment level, don't reset XP)
      const newLevel = currentStat.level + 1;
      
      const updatedStat = await db
        .update(stats)
        .set({
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(stats.id, statId))
        .returning();
      
      // Get the title for this level if it exists
      const levelTitle = await db
        .select()
        .from(statLevelTitles)
        .where(
          and(
            eq(statLevelTitles.statId, statId),
            eq(statLevelTitles.level, newLevel)
          )
        )
        .limit(1);
      
      return c.json({ 
        success: true, 
        data: {
          ...updatedStat[0],
          title: levelTitle.length > 0 ? levelTitle[0].title : undefined,
          xpForNextLevel: calculateRequiredXp(newLevel)
        }
      });
    } catch (error) {
      handleApiError(error, 'Failed to level up stat');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Get all available stat groups
  .get('/groups', jwtAuth, async (c) => {
    try {
      // Get all stat groups
      const groups = await db
        .select()
        .from(statGroups);
      
      return c.json({ 
        success: true, 
        data: groups 
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch stat groups');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Create a new stat group (admin only for now)
  .post('/groups', jwtAuth, zValidator('json', createStatGroupSchema), async (c) => {
    try {
      const data = c.req.valid('json');
      
      // Create the new group
      const newGroup = await db
        .insert(statGroups)
        .values({
          name: data.name,
          description: data.description,
          isDefault: data.isDefault ?? false,
        })
        .returning();
      
      return c.json({ 
        success: true, 
        data: newGroup[0] 
      }, 201);
    } catch (error) {
      handleApiError(error, 'Failed to create stat group');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Get all stat templates
  .get('/templates', jwtAuth, async (c) => {
    try {
      // Get all stat templates with their groups
      const templates = await db.select({
        template: statTemplates,
        group: statGroups,
      })
      .from(statTemplates)
      .leftJoin(statGroups, eq(statTemplates.groupId, statGroups.id));
      
      // Format the response
      const formattedTemplates = templates.map(item => ({
        ...item.template,
        group: item.group || undefined,
      }));
      
      return c.json({ 
        success: true, 
        data: formattedTemplates 
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch stat templates');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Get templates by character class
  .get('/templates/by-class/:characterClass', jwtAuth, async (c) => {
    try {
      const characterClass = c.req.param('characterClass');
      
      // Get all templates
      const allTemplates = await db.select({
        template: statTemplates,
        group: statGroups,
      })
      .from(statTemplates)
      .leftJoin(statGroups, eq(statTemplates.groupId, statGroups.id));
      
      // Filter templates by character class
      const matchingTemplates = allTemplates.filter(item => {
        if (!item.template.suggestedForClasses) return false;
        
        const classes = item.template.suggestedForClasses.split(',').map(c => c.trim().toLowerCase());
        return classes.includes(characterClass.toLowerCase());
      });
      
      // Format the response
      const formattedTemplates = matchingTemplates.map(item => ({
        ...item.template,
        group: item.group || undefined,
      }));
      
      return c.json({ 
        success: true, 
        data: formattedTemplates 
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch templates by class');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Assign stats from templates to character
  .post('/assign-templates', jwtAuth, zValidator('json', assignTemplateStatsSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { templateIds } = c.req.valid('json');
      
      // Get the character first
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      // Get all templates specified
      const selectedTemplates = await db
        .select()
        .from(statTemplates)
        .where(inArray(statTemplates.id, templateIds));
      
      if (selectedTemplates.length === 0) {
        return c.json({ 
          success: false, 
          error: 'No valid templates found' 
        }, 400);
      }
      
      // Create stats for each template
      const statsToInsert = selectedTemplates.map(template => ({
        characterId,
        groupId: template.groupId,
        name: template.name,
        description: template.description,
        isCustom: false,
        currentXp: 0,
        level: 1,
      }));
      
      const createdStats = await db
        .insert(stats)
        .values(statsToInsert)
        .returning();
      
      return c.json({ 
        success: true, 
        data: createdStats
      });
    } catch (error) {
      handleApiError(error, 'Failed to assign stats from templates');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Manage sample activities for a stat
  .post('/:statId/activities', jwtAuth, zValidator('json', createSampleActivitySchema), async (c) => {
    try {
      const userId = getUserId(c);
      const statId = c.req.param('statId');
      const data = c.req.valid('json');
      
      // Verify ownership of the stat
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      const existingStat = await db
        .select()
        .from(stats)
        .where(
          and(
            eq(stats.id, statId),
            eq(stats.characterId, characterId)
          )
        )
        .limit(1);
      
      if (existingStat.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Stat not found or does not belong to your character' 
        }, 404);
      }
      
      // Create the sample activity
      const newActivity = await db
        .insert(sampleActivities)
        .values({
          statId,
          description: data.description,
          xpValue: data.xpValue ?? 10,
        })
        .returning();
      
      return c.json({ 
        success: true, 
        data: newActivity[0] 
      }, 201);
    } catch (error) {
      handleApiError(error, 'Failed to create sample activity');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Get sample activities for a stat
  .get('/:statId/activities', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const statId = c.req.param('statId');
      
      // Verify ownership of the stat
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      const existingStat = await db
        .select()
        .from(stats)
        .where(
          and(
            eq(stats.id, statId),
            eq(stats.characterId, characterId)
          )
        )
        .limit(1);
      
      if (existingStat.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Stat not found or does not belong to your character' 
        }, 404);
      }
      
      // Get all sample activities for this stat
      const activities = await db
        .select()
        .from(sampleActivities)
        .where(eq(sampleActivities.statId, statId));
      
      return c.json({ 
        success: true, 
        data: activities 
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch sample activities');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Manage level titles for a stat
  .post('/:statId/level-titles', jwtAuth, zValidator('json', createStatLevelTitleSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const statId = c.req.param('statId');
      const data = c.req.valid('json');
      
      // Verify ownership of the stat
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      const existingStat = await db
        .select()
        .from(stats)
        .where(
          and(
            eq(stats.id, statId),
            eq(stats.characterId, characterId)
          )
        )
        .limit(1);
      
      if (existingStat.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Stat not found or does not belong to your character' 
        }, 404);
      }
      
      // Check if a title for this level already exists
      const existingTitle = await db
        .select()
        .from(statLevelTitles)
        .where(
          and(
            eq(statLevelTitles.statId, statId),
            eq(statLevelTitles.level, data.level)
          )
        )
        .limit(1);
      
      if (existingTitle.length > 0) {
        // Update existing title
        const updatedTitle = await db
          .update(statLevelTitles)
          .set({
            title: data.title,
            updatedAt: new Date(),
          })
          .where(eq(statLevelTitles.id, existingTitle[0].id))
          .returning();
        
        return c.json({ 
          success: true, 
          data: updatedTitle[0] 
        });
      }
      
      // Create new title
      const newTitle = await db
        .insert(statLevelTitles)
        .values({
          statId,
          level: data.level,
          title: data.title,
        })
        .returning();
      
      return c.json({ 
        success: true, 
        data: newTitle[0] 
      }, 201);
    } catch (error) {
      handleApiError(error, 'Failed to manage level title');
      return; // This should never be reached, but added for completeness
    }
  })
  
  // Get level titles for a stat
  .get('/:statId/level-titles', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const statId = c.req.param('statId');
      
      // Verify ownership of the stat
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);
      
      if (character.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Character not found' 
        }, 404);
      }
      
      const characterId = character[0].id;
      
      const existingStat = await db
        .select()
        .from(stats)
        .where(
          and(
            eq(stats.id, statId),
            eq(stats.characterId, characterId)
          )
        )
        .limit(1);
      
      if (existingStat.length === 0) {
        return c.json({ 
          success: false, 
          error: 'Stat not found or does not belong to your character' 
        }, 404);
      }
      
      // Get all level titles for this stat
      const titles = await db
        .select()
        .from(statLevelTitles)
        .where(eq(statLevelTitles.statId, statId));
      
      return c.json({ 
        success: true, 
        data: titles 
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch level titles');
      return; // This should never be reached, but added for completeness
    }
  });

export default app;
