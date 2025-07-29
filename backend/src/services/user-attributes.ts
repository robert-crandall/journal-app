import { db } from '../db';
import { userAttributes } from '../db/schema';
import { eq, and, desc, inArray, type SQL } from 'drizzle-orm';
import type { CreateUserAttribute, UpdateUserAttribute, BulkCreateUserAttributes, GetUserAttributesQuery } from '../validation/user-attributes';
import { generateDeduplicatedAttributes, separateAttributesBySource, type AttributeDeduplicationRequest } from '../utils/gpt/attributeDeduplication';

export class UserAttributesService {
  /**
   * Get all attributes for a user
   */
  static async getUserAttributes(userId: string, query: GetUserAttributesQuery = {}) {
    let whereClause: SQL<unknown> = eq(userAttributes.userId, userId);

    if (query.source) {
      whereClause = and(whereClause, eq(userAttributes.source, query.source))!;
    }

    return await db.select().from(userAttributes).where(whereClause).orderBy(desc(userAttributes.lastUpdated));
  }

  /**
   * Get attributes by source type
   */
  static async getUserAttributesBySource(userId: string, source: string) {
    return await db
      .select()
      .from(userAttributes)
      .where(and(eq(userAttributes.userId, userId), eq(userAttributes.source, source)))
      .orderBy(desc(userAttributes.lastUpdated));
  }

  /**
   * Create a single user attribute
   */
  static async createUserAttribute(userId: string, data: CreateUserAttribute) {
    const [newAttribute] = await db
      .insert(userAttributes)
      .values({
        userId,
        value: data.value,
        source: data.source,
        lastUpdated: new Date(),
      })
      .returning();

    return newAttribute;
  }

  /**
   * Create multiple user attributes in bulk (used for GPT inference)
   */
  static async bulkCreateUserAttributes(userId: string, data: BulkCreateUserAttributes) {
    if (data.attributes.length === 0) {
      return [];
    }

    const values = data.attributes.map((attr) => ({
      userId,
      value: attr.value,
      source: attr.source,
      lastUpdated: new Date(),
    }));

    // Insert all attributes, ignore conflicts (do not update existing)
    return await db.insert(userAttributes).values(values).onConflictDoNothing().returning();
  }

  /**
   * Replace discovered attributes with deduplicated ones
   */
  static async replaceDiscoveredAttributes(userId: string, newAttributes: string[]) {
    return await db.transaction(async (tx) => {
      // Delete all existing journal_analysis attributes
      const deletedAttributes = await tx
        .delete(userAttributes)
        .where(and(eq(userAttributes.userId, userId), eq(userAttributes.source, 'journal_analysis')))
        .returning();

      // Insert new deduplicated attributes
      let insertedAttributes: typeof userAttributes.$inferSelect[] = [];
      if (newAttributes.length > 0) {
        const values = newAttributes.map((value) => ({
          userId,
          value,
          source: 'journal_analysis' as const,
          lastUpdated: new Date(),
        }));

        insertedAttributes = await tx.insert(userAttributes).values(values).returning();
      }

      return {
        deletedCount: deletedAttributes.length,
        insertedAttributes,
      };
    });
  }

  /**
   * Perform GPT-powered intelligent deduplication
   */
  static async gptDeduplicateAttributes(userId: string) {
    // Get all user attributes
    const allAttributes = await this.getUserAttributes(userId);
    
    // Separate by source
    const { userDefined, discovered } = separateAttributesBySource(allAttributes);

    // If no discovered attributes, nothing to deduplicate
    if (discovered.length === 0) {
      return {
        originalCount: discovered.length,
        deduplicatedCount: 0,
        removedCount: 0,
        userDefinedPreserved: userDefined.length,
      };
    }

    // Extract values for GPT processing
    const userDefinedValues = userDefined.map(attr => attr.value);
    const discoveredValues = discovered.map(attr => attr.value);

    try {
      // Call GPT to get deduplicated attributes
      const gptResult = await generateDeduplicatedAttributes({
        userAttributes: userDefinedValues,
        discoveredAttributes: discoveredValues,
      });

      // Replace the discovered attributes with deduplicated ones
      const replacementResult = await this.replaceDiscoveredAttributes(userId, gptResult.deduplicatedAttributes);

      return {
        originalCount: discovered.length,
        deduplicatedCount: gptResult.deduplicatedAttributes.length,
        removedCount: replacementResult.deletedCount - gptResult.deduplicatedAttributes.length,
        userDefinedPreserved: userDefined.length,
        deduplicatedAttributes: gptResult.deduplicatedAttributes,
      };
    } catch (error) {
      // If GPT fails, fall back to simple deduplication
      console.warn('GPT deduplication failed, falling back to simple deduplication:', error);
      return await this.simpleDeduplicateAttributes(userId);
    }
  }

  /**
   * Simple deduplication fallback (keeps latest by lastUpdated)
   */
  static async simpleDeduplicateAttributes(userId: string) {
    const attributes = await this.getUserAttributes(userId);
    
    // Group by value, keep the one with latest lastUpdated
    const seen = new Map();
    for (const attr of attributes) {
      const existing = seen.get(attr.value);
      if (!existing || new Date(attr.lastUpdated) > new Date(existing.lastUpdated)) {
        seen.set(attr.value, attr);
      }
    }
    
    const toKeepIds = new Set(Array.from(seen.values()).map((a) => a.id));
    const toDelete = attributes.filter((a) => !toKeepIds.has(a.id));
    
    let removedCount = 0;
    for (const attr of toDelete) {
      await this.deleteUserAttribute(userId, attr.id);
      removedCount++;
    }
    
    return {
      originalCount: attributes.length,
      deduplicatedCount: attributes.length - removedCount,
      removedCount,
      userDefinedPreserved: attributes.filter(a => a.source === 'user_set').length,
    };
  }

  /**
   * Update a user attribute
   */
  static async updateUserAttribute(userId: string, attributeId: string, data: UpdateUserAttribute) {
    const [updatedAttribute] = await db
      .update(userAttributes)
      .set({
        ...data,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(userAttributes.id, attributeId), eq(userAttributes.userId, userId)))
      .returning();

    if (!updatedAttribute) {
      throw new Error('Attribute not found or you do not have permission to update it');
    }

    return updatedAttribute;
  }

  /**
   * Delete a user attribute
   */
  static async deleteUserAttribute(userId: string, attributeId: string) {
    const [deletedAttribute] = await db
      .delete(userAttributes)
      .where(and(eq(userAttributes.id, attributeId), eq(userAttributes.userId, userId)))
      .returning();

    if (!deletedAttribute) {
      throw new Error('Attribute not found or you do not have permission to delete it');
    }

    return deletedAttribute;
  }
}

// Helper function for excluded() in onConflictDoUpdate
function excluded<T extends Record<string, any>>(column: T): T {
  return column;
}
