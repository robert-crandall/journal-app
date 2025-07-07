import { db } from '../db';
import { goals, tags, goalTags } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Migration script to move tag data from goals.tags JSON column to normalized tag tables
 * This should be run before applying migration 0009 which drops the goals.tags column
 */
export async function migrateGoalTags() {
  console.log('Starting goal tags migration...');
  
  try {
    // Get all goals with tags
    const allGoals = await db.select({
      id: goals.id,
      userId: goals.userId,
      tags: goals.tags
    }).from(goals);

    console.log(`Found ${allGoals.length} goals to process`);

    for (const goal of allGoals) {
      if (!goal.tags) continue;

      let tagArray: string[];
      try {
        tagArray = JSON.parse(goal.tags);
      } catch (error) {
        console.warn(`Failed to parse tags for goal ${goal.id}: ${goal.tags}`);
        continue;
      }

      if (!Array.isArray(tagArray) || tagArray.length === 0) continue;

      console.log(`Processing goal ${goal.id} with tags: ${tagArray.join(', ')}`);

      for (const tagName of tagArray) {
        if (!tagName || typeof tagName !== 'string') continue;

        const trimmedTag = tagName.trim().toLowerCase();
        if (!trimmedTag) continue;

        // Check if tag already exists for this user
        let existingTag = await db.select()
          .from(tags)
          .where(and(eq(tags.userId, goal.userId), eq(tags.name, trimmedTag)))
          .limit(1);

        let tagId: string;

        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          // Create new tag
          const newTag = await db.insert(tags)
            .values({
              name: trimmedTag,
              userId: goal.userId,
            })
            .returning({ id: tags.id });
          
          tagId = newTag[0].id;
          console.log(`Created new tag: ${trimmedTag}`);
        }

        // Check if goal-tag relationship already exists
        const existingRelation = await db.select()
          .from(goalTags)
          .where(and(eq(goalTags.goalId, goal.id), eq(goalTags.tagId, tagId)))
          .limit(1);

        if (existingRelation.length === 0) {
          // Create goal-tag relationship
          await db.insert(goalTags)
            .values({
              goalId: goal.id,
              tagId: tagId,
            });
          
          console.log(`Linked goal ${goal.id} to tag ${trimmedTag}`);
        }
      }
    }

    console.log('Goal tags migration completed successfully');
  } catch (error) {
    console.error('Error during goal tags migration:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.main) {
  migrateGoalTags()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}
