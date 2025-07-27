import { db } from '../db';
import { userAttributes } from '../db/schema';
import { eq, and, desc, inArray, type SQL } from 'drizzle-orm';
import type { CreateUserAttribute, UpdateUserAttribute, BulkCreateUserAttributes, GetUserAttributesQuery } from '../validation/user-attributes';

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
