import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { xpGrants, characterStats, familyMembers, tags } from '../db/schema';
import { handleApiError } from '../utils/logger';

// Chain methods for RPC compatibility
const app = new Hono()
  // Get XP grants for a specific journal entry
  .get('/journal/:journalId', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const journalId = c.req.param('journalId');

      const grants = await db
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal'), eq(xpGrants.sourceId, journalId)))
        .orderBy(desc(xpGrants.createdAt));

      // Enhance grants with entity names for display
      const enhancedGrants = await Promise.all(
        grants.map(async (grant) => {
          let entityName = '';
          let entityDescription = '';

          switch (grant.entityType) {
            case 'character_stat':
              const stat = await db
                .select({ name: characterStats.name, description: characterStats.description })
                .from(characterStats)
                .where(eq(characterStats.id, grant.entityId))
                .limit(1);
              if (stat.length > 0) {
                entityName = stat[0].name;
                entityDescription = stat[0].description;
              }
              break;
            case 'family_member':
              const family = await db
                .select({ name: familyMembers.name, relationship: familyMembers.relationship })
                .from(familyMembers)
                .where(eq(familyMembers.id, grant.entityId))
                .limit(1);
              if (family.length > 0) {
                entityName = family[0].name;
                entityDescription = family[0].relationship;
              }
              break;
            case 'content_tag':
              const tag = await db.select({ name: tags.name }).from(tags).where(eq(tags.id, grant.entityId)).limit(1);
              if (tag.length > 0) {
                entityName = tag[0].name;
                entityDescription = 'Content tag';
              }
              break;
          }

          return {
            ...grant,
            entityName,
            entityDescription,
          };
        }),
      );

      return c.json({
        success: true,
        data: enhancedGrants,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch journal XP grants');
      return; // This should never be reached, but added for completeness
    }
  })

  // Get recent XP grants for the user
  .get('/recent', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const limit = parseInt(c.req.query('limit') || '10');

      const grants = await db.select().from(xpGrants).where(eq(xpGrants.userId, userId)).orderBy(desc(xpGrants.createdAt)).limit(limit);

      // Enhance grants with entity names for display
      const enhancedGrants = await Promise.all(
        grants.map(async (grant) => {
          let entityName = '';
          let entityDescription = '';

          switch (grant.entityType) {
            case 'character_stat':
              const stat = await db
                .select({ name: characterStats.name, description: characterStats.description })
                .from(characterStats)
                .where(eq(characterStats.id, grant.entityId))
                .limit(1);
              if (stat.length > 0) {
                entityName = stat[0].name;
                entityDescription = stat[0].description;
              }
              break;
            case 'family_member':
              const family = await db
                .select({ name: familyMembers.name, relationship: familyMembers.relationship })
                .from(familyMembers)
                .where(eq(familyMembers.id, grant.entityId))
                .limit(1);
              if (family.length > 0) {
                entityName = family[0].name;
                entityDescription = family[0].relationship;
              }
              break;
            case 'content_tag':
              const tag = await db.select({ name: tags.name }).from(tags).where(eq(tags.id, grant.entityId)).limit(1);
              if (tag.length > 0) {
                entityName = tag[0].name;
                entityDescription = 'Content tag';
              }
              break;
          }

          return {
            ...grant,
            entityName,
            entityDescription,
          };
        }),
      );

      return c.json({
        success: true,
        data: enhancedGrants,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch recent XP grants');
      return; // This should never be reached, but added for completeness
    }
  })

  // Get XP grants by entity type
  .get('/by-type/:entityType', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const entityType = c.req.param('entityType');
      const limit = parseInt(c.req.query('limit') || '10');

      const grants = await db
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.entityType, entityType)))
        .orderBy(desc(xpGrants.createdAt))
        .limit(limit);

      // Enhance grants with entity names for display
      const enhancedGrants = await Promise.all(
        grants.map(async (grant) => {
          let entityName = '';
          let entityDescription = '';

          switch (grant.entityType) {
            case 'character_stat':
              const stat = await db
                .select({ name: characterStats.name, description: characterStats.description })
                .from(characterStats)
                .where(eq(characterStats.id, grant.entityId))
                .limit(1);
              if (stat.length > 0) {
                entityName = stat[0].name;
                entityDescription = stat[0].description;
              }
              break;
            case 'family_member':
              const family = await db
                .select({ name: familyMembers.name, relationship: familyMembers.relationship })
                .from(familyMembers)
                .where(eq(familyMembers.id, grant.entityId))
                .limit(1);
              if (family.length > 0) {
                entityName = family[0].name;
                entityDescription = family[0].relationship;
              }
              break;
            case 'content_tag':
              const tag = await db.select({ name: tags.name }).from(tags).where(eq(tags.id, grant.entityId)).limit(1);
              if (tag.length > 0) {
                entityName = tag[0].name;
                entityDescription = 'Content tag';
              }
              break;
          }

          return {
            ...grant,
            entityName,
            entityDescription,
          };
        }),
      );

      return c.json({
        success: true,
        data: enhancedGrants,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch XP grants by type');
      return; // This should never be reached, but added for completeness
    }
  });

export default app;
