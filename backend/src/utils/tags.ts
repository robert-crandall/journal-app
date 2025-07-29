import { db } from '../db';
import { tags, goalTags, goals } from '../db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { Tag, CreateTag, TagWithCount, GoalWithTags } from '../../../shared/types';
import { deduplicateTags } from './gpt/tagDeduplication';

/**
 * Tag utility functions for normalized tag operations
 */

/**
 * Create a tag for a user if it doesn't already exist
 */
export async function createOrGetTag(userId: string, tagName: string, source: 'user' | 'discovered' | 'system' = 'discovered'): Promise<Tag> {
  const trimmedName = tagName.trim().toLowerCase();

  // Try to find existing tag
  const existingTag = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.name, trimmedName)))
    .limit(1);

  if (existingTag.length > 0) {
    // Increment usage count
    const updatedTag = await db
      .update(tags)
      .set({
        timesUsed: existingTag[0].timesUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(tags.id, existingTag[0].id))
      .returning();

    return updatedTag[0] as Tag;
  }

  // Create new tag
  const newTag = await db
    .insert(tags)
    .values({
      name: trimmedName,
      userId,
      source,
      timesUsed: 1,
      status: 'active',
    })
    .returning();

  return newTag[0] as Tag;
}

/**
 * Get all tags for a user with usage counts
 */
export async function getUserTagsWithCounts(userId: string): Promise<TagWithCount[]> {
  const userTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      userId: tags.userId,
      source: tags.source,
      timesUsed: tags.timesUsed,
      status: tags.status,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
      usageCount: sql<number>`CAST(count(${goalTags.tagId}) AS INTEGER)`.as('usageCount'),
    })
    .from(tags)
    .leftJoin(goalTags, eq(tags.id, goalTags.tagId))
    .where(and(eq(tags.userId, userId), eq(tags.status, 'active')))
    .groupBy(tags.id, tags.name, tags.userId, tags.source, tags.timesUsed, tags.status, tags.createdAt, tags.updatedAt)
    .orderBy(desc(sql<number>`CAST(count(${goalTags.tagId}) AS INTEGER)`), tags.name);

  return userTags as TagWithCount[];
}

/**
 * Get tags for a specific goal
 */
export async function getGoalTags(goalId: string): Promise<Tag[]> {
  const goalTagsData = await db
    .select({
      id: tags.id,
      name: tags.name,
      userId: tags.userId,
      source: tags.source,
      timesUsed: tags.timesUsed,
      status: tags.status,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
    })
    .from(goalTags)
    .innerJoin(tags, eq(goalTags.tagId, tags.id))
    .where(eq(goalTags.goalId, goalId))
    .orderBy(tags.name);

  return goalTagsData as Tag[];
}

/**
 * Set tags for a goal (replaces all existing tags)
 */
export async function setGoalTags(goalId: string, userId: string, tagNames: string[]): Promise<Tag[]> {
  // Remove existing goal-tag relationships
  await db.delete(goalTags).where(eq(goalTags.goalId, goalId));

  if (tagNames.length === 0) {
    return [];
  }

  // Create or get tags and create relationships
  const goalTagsToCreate: Array<{ goalId: string; tagId: string }> = [];
  const resultTags: Tag[] = [];

  for (const tagName of tagNames) {
    if (!tagName || !tagName.trim()) continue;

    const tag = await createOrGetTag(userId, tagName);
    goalTagsToCreate.push({ goalId, tagId: tag.id });
    resultTags.push(tag);
  }

  // Create goal-tag relationships
  if (goalTagsToCreate.length > 0) {
    await db.insert(goalTags).values(goalTagsToCreate);
  }

  return resultTags;
}

/**
 * Add tags to a goal (doesn't remove existing tags)
 */
export async function addGoalTags(goalId: string, userId: string, tagNames: string[]): Promise<Tag[]> {
  const goalTagsToCreate: Array<{ goalId: string; tagId: string }> = [];
  const resultTags: Tag[] = [];

  for (const tagName of tagNames) {
    if (!tagName || !tagName.trim()) continue;

    const tag = await createOrGetTag(userId, tagName);

    // Check if relationship already exists
    const existingRelation = await db
      .select()
      .from(goalTags)
      .where(and(eq(goalTags.goalId, goalId), eq(goalTags.tagId, tag.id)))
      .limit(1);

    if (existingRelation.length === 0) {
      goalTagsToCreate.push({ goalId, tagId: tag.id });
    }

    resultTags.push(tag);
  }

  // Create new goal-tag relationships
  if (goalTagsToCreate.length > 0) {
    await db.insert(goalTags).values(goalTagsToCreate);
  }

  return resultTags;
}

/**
 * Remove tags from a goal
 */
export async function removeGoalTags(goalId: string, tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return;

  await db.delete(goalTags).where(and(eq(goalTags.goalId, goalId), inArray(goalTags.tagId, tagIds)));
}

/**
 * Delete unused tags for a user (tags not linked to any goals)
 */
export async function deleteUnusedTags(userId: string): Promise<number> {
  const unusedTags = await db
    .select({ id: tags.id })
    .from(tags)
    .leftJoin(goalTags, eq(tags.id, goalTags.tagId))
    .where(and(eq(tags.userId, userId), sql`${goalTags.tagId} IS NULL`));

  if (unusedTags.length === 0) {
    return 0;
  }

  const tagIds = unusedTags.map((tag) => tag.id);
  await db.delete(tags).where(inArray(tags.id, tagIds));

  return unusedTags.length;
}

/**
 * Helper function to serialize goal with tags for API responses
 */
export function serializeGoalWithTags(goal: any, goalTagsData: Tag[]): GoalWithTags {
  return {
    ...goal,
    tags: goalTagsData,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

/**
 * Create tags with GPT deduplication against existing tags
 */
export async function createDeduplicatedTags(userId: string, newTagNames: string[]): Promise<Tag[]> {
  if (newTagNames.length === 0) {
    return [];
  }

  // Get existing tags for the user
  const existingTags = await db
    .select({ name: tags.name })
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.status, 'active')));

  const existingTagNames = existingTags.map((tag) => tag.name);

  // Use GPT to deduplicate the new tags
  const deduplicatedTagNames = await deduplicateTags(existingTagNames, newTagNames, userId);

  // Create the deduplicated tags
  const createdTags: Tag[] = [];
  const uniqueTagNames = [...new Set(deduplicatedTagNames)]; // Remove duplicates within the array

  for (const tagName of uniqueTagNames) {
    const tag = await createOrGetTag(userId, tagName, 'discovered');
    createdTags.push(tag);
  }

  return createdTags;
}
