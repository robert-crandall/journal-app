import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { userAttributes } from '../db/schema/user-attributes';
import type {
  UserAttribute,
  CreateUserAttributeRequest,
  UpdateUserAttributeRequest,
  UserAttributeResponse,
  GroupedUserAttributes,
  InferredAttribute,
  AttributeCategory,
  AttributeSource,
} from '../types/user-attributes';

export class UserAttributesService {
  /**
   * Get all attributes for a user, optionally filtered by category or source
   */
  async getUserAttributes(userId: string, filters?: { category?: AttributeCategory; source?: AttributeSource }): Promise<UserAttributeResponse[]> {
    const conditions = [eq(userAttributes.userId, userId)];

    if (filters?.category) {
      conditions.push(eq(userAttributes.category, filters.category));
    }

    if (filters?.source) {
      conditions.push(eq(userAttributes.source, filters.source));
    }

    const attributes = await db
      .select()
      .from(userAttributes)
      .where(and(...conditions))
      .orderBy(desc(userAttributes.lastUpdated));

    return attributes.map(this.mapToResponse);
  }

  /**
   * Get attributes grouped by category for UI display
   */
  async getGroupedUserAttributes(userId: string): Promise<GroupedUserAttributes> {
    const attributes = await this.getUserAttributes(userId);

    const grouped: GroupedUserAttributes = {
      priorities: [],
      values: [],
      motivators: [],
      challenges: [],
    };

    for (const attr of attributes) {
      grouped[attr.category].push(attr);
    }

    return grouped;
  }

  /**
   * Create a new user attribute
   */
  async createUserAttribute(userId: string, data: CreateUserAttributeRequest): Promise<UserAttributeResponse> {
    const [attribute] = await db
      .insert(userAttributes)
      .values({
        userId,
        category: data.category,
        value: data.value,
        source: data.source || 'user_set',
      })
      .returning();

    return this.mapToResponse(attribute);
  }

  /**
   * Update an existing user attribute
   */
  async updateUserAttribute(userId: string, attributeId: string, data: UpdateUserAttributeRequest): Promise<UserAttributeResponse | null> {
    const [attribute] = await db
      .update(userAttributes)
      .set({
        ...data,
        lastUpdated: new Date(),
      })
      .where(and(eq(userAttributes.id, attributeId), eq(userAttributes.userId, userId)))
      .returning();

    return attribute ? this.mapToResponse(attribute) : null;
  }

  /**
   * Delete a user attribute
   */
  async deleteUserAttribute(userId: string, attributeId: string): Promise<boolean> {
    const result = await db
      .delete(userAttributes)
      .where(and(eq(userAttributes.id, attributeId), eq(userAttributes.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Batch create or update attributes from GPT inference
   * This handles the case where GPT infers new attributes during summary generation
   */
  async batchUpsertInferredAttributes(
    userId: string,
    inferredAttributes: InferredAttribute[],
    source: AttributeSource = 'gpt_summary',
  ): Promise<UserAttributeResponse[]> {
    const results: UserAttributeResponse[] = [];

    for (const inferred of inferredAttributes) {
      // Check if this exact attribute already exists
      const existing = await db
        .select()
        .from(userAttributes)
        .where(and(eq(userAttributes.userId, userId), eq(userAttributes.category, inferred.category), eq(userAttributes.value, inferred.value)))
        .limit(1);

      if (existing.length > 0) {
        // Update the source and timestamp if it's different
        const existingAttr = existing[0];
        if (existingAttr.source !== source) {
          const [updated] = await db
            .update(userAttributes)
            .set({
              source: source,
              lastUpdated: new Date(),
            })
            .where(eq(userAttributes.id, existingAttr.id))
            .returning();

          results.push(this.mapToResponse(updated));
        } else {
          results.push(this.mapToResponse(existingAttr));
        }
      } else {
        // Create new attribute
        const [created] = await db
          .insert(userAttributes)
          .values({
            userId,
            category: inferred.category,
            value: inferred.value,
            source: source,
          })
          .returning();

        results.push(this.mapToResponse(created));
      }
    }

    return results;
  }

  /**
   * Get attributes that can be used for GPT context (summary for prompts)
   */
  async getAttributesForGptContext(userId: string): Promise<string> {
    const grouped = await this.getGroupedUserAttributes(userId);

    const sections: string[] = [];

    for (const [category, attrs] of Object.entries(grouped)) {
      if (attrs.length > 0) {
        const values = attrs.map((attr) => attr.value).join(', ');
        sections.push(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${values}`);
      }
    }

    return sections.length > 0 ? `User Attributes:\n${sections.join('\n')}` : '';
  }

  /**
   * Map database model to API response
   */
  private mapToResponse(attribute: UserAttribute): UserAttributeResponse {
    return {
      ...attribute,
      source: attribute.source as AttributeSource,
      lastUpdated: attribute.lastUpdated.toISOString(),
      createdAt: attribute.createdAt.toISOString(),
    };
  }
}
