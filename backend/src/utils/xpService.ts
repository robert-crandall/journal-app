import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { xpGrants, characterStats, familyMembers } from '../db/schema';
import type { XpGrant, NewXpGrant, CreateXpGrantRequest, XpGrantFilter, XpGrantWithEntity, XpEntityType, XpSourceType } from '../../../shared/types/xp';

/**
 * Grant XP to any entity (character stat, family member, goal, etc.)
 */
export async function grantXp(userId: string, request: CreateXpGrantRequest): Promise<XpGrant> {
  try {
    // First create the XP grant record
    const [xpGrant] = await db
      .insert(xpGrants)
      .values({
        userId,
        ...request,
      })
      .returning();

    // Then update the actual entity's XP if applicable
    await updateEntityXp(request.entityType, request.entityId, request.xpAmount);

    return xpGrant;
  } catch (error) {
    console.error('Error granting XP:', error);
    throw error;
  }
}

/**
 * Update the XP for the specific entity type
 */
async function updateEntityXp(entityType: XpEntityType, entityId: string, xpAmount: number): Promise<void> {
  try {
    switch (entityType) {
      case 'character_stat':
        // Update character stat's total XP
        const [currentStat] = await db.select({ totalXp: characterStats.totalXp }).from(characterStats).where(eq(characterStats.id, entityId));

        if (currentStat) {
          await db
            .update(characterStats)
            .set({
              totalXp: currentStat.totalXp + xpAmount,
              updatedAt: new Date(),
            })
            .where(eq(characterStats.id, entityId));
        }
        break;

      case 'family_member':
        // Update family member's connection XP
        const [currentMember] = await db.select({ connectionXp: familyMembers.connectionXp }).from(familyMembers).where(eq(familyMembers.id, entityId));

        if (currentMember) {
          const newXp = currentMember.connectionXp + xpAmount;
          const newLevel = Math.floor(newXp / 100) + 1;

          await db
            .update(familyMembers)
            .set({
              connectionXp: newXp,
              connectionLevel: newLevel,
              updatedAt: new Date(),
            })
            .where(eq(familyMembers.id, entityId));
        }
        break;

      case 'goal':
      case 'project':
      case 'adventure':
        // For future entity types, we can add XP tracking fields to their tables
        // For now, these are tracked in the xp_grants table only
        break;
    }
  } catch (error) {
    console.error(`Error updating entity XP for ${entityType}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Get XP grants with optional filtering
 */
export async function getXpGrants(userId: string, filter: XpGrantFilter = {}): Promise<XpGrant[]> {
  // Build where conditions
  const conditions = [eq(xpGrants.userId, userId)];

  if (filter.entityType) {
    conditions.push(eq(xpGrants.entityType, filter.entityType));
  }

  if (filter.entityId) {
    conditions.push(eq(xpGrants.entityId, filter.entityId));
  }

  if (filter.sourceType) {
    conditions.push(eq(xpGrants.sourceType, filter.sourceType));
  }

  // Build the query with all conditions at once
  const baseQuery = db
    .select()
    .from(xpGrants)
    .where(and(...conditions))
    .orderBy(desc(xpGrants.createdAt));

  // Handle pagination
  if (filter.limit !== undefined && filter.offset !== undefined) {
    return await baseQuery.limit(filter.limit).offset(filter.offset);
  } else if (filter.limit !== undefined) {
    return await baseQuery.limit(filter.limit);
  } else {
    return await baseQuery;
  }
}

/**
 * Get XP grants with entity information
 */
export async function getXpGrantsWithEntityInfo(userId: string, filter: XpGrantFilter = {}): Promise<XpGrantWithEntity[]> {
  const grants = await getXpGrants(userId, filter);

  // Enhance grants with entity information
  const grantsWithEntity: XpGrantWithEntity[] = [];

  for (const grant of grants) {
    let entityName: string | undefined;
    let entityDescription: string | undefined;

    switch (grant.entityType) {
      case 'character_stat':
        const [stat] = await db
          .select({ name: characterStats.name, description: characterStats.description })
          .from(characterStats)
          .where(eq(characterStats.id, grant.entityId));

        if (stat) {
          entityName = stat.name;
          entityDescription = stat.description;
        }
        break;

      case 'family_member':
        const [member] = await db
          .select({ name: familyMembers.name, relationship: familyMembers.relationship })
          .from(familyMembers)
          .where(eq(familyMembers.id, grant.entityId));

        if (member) {
          entityName = member.name;
          entityDescription = member.relationship;
        }
        break;

      // Add cases for other entity types as needed
    }

    grantsWithEntity.push({
      ...grant,
      entityName,
      entityDescription,
    });
  }

  return grantsWithEntity;
}

/**
 * Recalculate and update total XP for all stats for a user
 * This should be called after deleting XP grants to ensure stat totals are accurate
 */
export async function recalculateStatTotals(userId: string): Promise<void> {
  // Get all character stats for the user
  const userStats = await db.select({ id: characterStats.id }).from(characterStats).where(eq(characterStats.userId, userId));

  // For each stat, calculate the total XP from all grants and update the stat
  for (const stat of userStats) {
    const [xpResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${xpGrants.xpAmount}), 0)` })
      .from(xpGrants)
      .where(and(eq(xpGrants.userId, userId), eq(xpGrants.entityType, 'character_stat'), eq(xpGrants.entityId, stat.id)));

    const totalXp = xpResult?.total || 0;

    // Update the stat's total XP
    await db
      .update(characterStats)
      .set({
        totalXp: totalXp,
        updatedAt: new Date(),
      })
      .where(eq(characterStats.id, stat.id));
  }
}

/**
 * Recalculate and update total XP for all family members for a user
 * This should be called after deleting XP grants to ensure family member totals are accurate
 */
export async function recalculateFamilyTotals(userId: string): Promise<void> {
  // Get all family members for the user
  const userFamilyMembers = await db.select({ id: familyMembers.id }).from(familyMembers).where(eq(familyMembers.userId, userId));

  // For each family member, calculate the total XP from all grants and update
  for (const member of userFamilyMembers) {
    const [xpResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${xpGrants.xpAmount}), 0)` })
      .from(xpGrants)
      .where(and(eq(xpGrants.userId, userId), eq(xpGrants.entityType, 'family_member'), eq(xpGrants.entityId, member.id)));

    const totalXp = xpResult?.total || 0;
    const newLevel = Math.floor(totalXp / 100) + 1;

    // Update the family member's connection XP and level
    await db
      .update(familyMembers)
      .set({
        connectionXp: totalXp,
        connectionLevel: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, member.id));
  }
}

/**
 * Delete all XP grants associated with a journal entry and recalculate entity totals
 */
export async function deleteJournalXpGrants(userId: string, journalId: string): Promise<void> {
  // Delete all XP grants associated with this journal
  await db.delete(xpGrants).where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal'), eq(xpGrants.sourceId, journalId)));

  // Recalculate totals for all affected entities
  await Promise.all([recalculateStatTotals(userId), recalculateFamilyTotals(userId)]);
}

/**
 * Get XP summary by entity type for a user
 */
export async function getXpSummaryByEntityType(userId: string): Promise<Record<XpEntityType, number>> {
  const grants = await db
    .select({
      entityType: xpGrants.entityType,
      totalXp: sql<number>`SUM(${xpGrants.xpAmount})`,
    })
    .from(xpGrants)
    .where(eq(xpGrants.userId, userId))
    .groupBy(xpGrants.entityType);

  const summary: Record<string, number> = {};
  for (const grant of grants) {
    summary[grant.entityType] = grant.totalXp || 0;
  }

  return summary as Record<XpEntityType, number>;
}

/**
 * Get XP breakdown by source type for a specific entity
 */
export async function getXpBreakdownBySource(userId: string, entityType: XpEntityType, entityId: string): Promise<Record<XpSourceType, number>> {
  const grants = await db
    .select({
      sourceType: xpGrants.sourceType,
      totalXp: sql<number>`SUM(${xpGrants.xpAmount})`,
    })
    .from(xpGrants)
    .where(and(eq(xpGrants.userId, userId), eq(xpGrants.entityType, entityType), eq(xpGrants.entityId, entityId)))
    .groupBy(xpGrants.sourceType);

  const breakdown: Record<string, number> = {};
  for (const grant of grants) {
    breakdown[grant.sourceType] = grant.totalXp || 0;
  }

  return breakdown as Record<XpSourceType, number>;
}
