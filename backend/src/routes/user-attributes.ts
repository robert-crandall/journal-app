import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { userAttributes } from '../db/schema/user-attributes';
import { createUserAttributeSchema, updateUserAttributeSchema, getUserAttributesSchema } from '../validation/user-attributes';
import { handleApiError } from '../utils/logger';
import type { CreateUserAttributeRequest, UpdateUserAttributeRequest, UserAttributeResponse, GroupedUserAttributes } from '../types/user-attributes';

// Chain methods for RPC compatibility
const app = new Hono()
  // Get user's attributes (optionally filtered by category or source)
  .get('/', jwtAuth, zValidator('query', getUserAttributesSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { category, source } = c.req.valid('query');

      // Build query conditions
      const conditions = [eq(userAttributes.userId, userId)];
      if (category) {
        conditions.push(eq(userAttributes.category, category));
      }
      if (source) {
        conditions.push(eq(userAttributes.source, source));
      }

      const userAttributesList = await db
        .select()
        .from(userAttributes)
        .where(and(...conditions))
        .orderBy(userAttributes.category, userAttributes.value);

      return c.json({
        success: true,
        data: userAttributesList,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch user attributes');
      return;
    }
  })

  // Get user's attributes grouped by category
  .get('/grouped', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const userAttributesList = await db
        .select()
        .from(userAttributes)
        .where(eq(userAttributes.userId, userId))
        .orderBy(userAttributes.category, userAttributes.value);

      // Group by category
      const grouped: GroupedUserAttributes = {};
      for (const attribute of userAttributesList) {
        if (!grouped[attribute.category]) {
          grouped[attribute.category] = [];
        }
        grouped[attribute.category].push(attribute);
      }

      return c.json({
        success: true,
        data: grouped,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch grouped user attributes');
      return;
    }
  })

  // Get a specific attribute by ID
  .get('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const attributeId = c.req.param('id');

      const [attribute] = await db
        .select()
        .from(userAttributes)
        .where(and(eq(userAttributes.id, attributeId), eq(userAttributes.userId, userId)));

      if (!attribute) {
        return c.json({ success: false, error: 'Attribute not found' }, 404);
      }

      return c.json({
        success: true,
        data: attribute,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch user attribute');
      return;
    }
  })

  // Create a new user attribute
  .post('/', jwtAuth, zValidator('json', createUserAttributeSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const attributeData = c.req.valid('json') as CreateUserAttributeRequest;

      const [newAttribute] = await db
        .insert(userAttributes)
        .values({
          ...attributeData,
          userId,
        })
        .returning();

      return c.json({
        success: true,
        data: newAttribute,
      }, 201);
    } catch (error) {
      handleApiError(error, 'Failed to create user attribute');
      return;
    }
  })

  // Update a user attribute
  .put('/:id', jwtAuth, zValidator('json', updateUserAttributeSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const attributeId = c.req.param('id');
      const updateData = c.req.valid('json') as UpdateUserAttributeRequest;

      // Check if attribute exists and belongs to user
      const [existingAttribute] = await db
        .select()
        .from(userAttributes)
        .where(and(eq(userAttributes.id, attributeId), eq(userAttributes.userId, userId)));

      if (!existingAttribute) {
        return c.json({ success: false, error: 'Attribute not found' }, 404);
      }

      const [updatedAttribute] = await db
        .update(userAttributes)
        .set({
          ...updateData,
          lastUpdated: new Date(),
        })
        .where(eq(userAttributes.id, attributeId))
        .returning();

      return c.json({
        success: true,
        data: updatedAttribute,
      });
    } catch (error) {
      handleApiError(error, 'Failed to update user attribute');
      return;
    }
  })

  // Delete a user attribute
  .delete('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const attributeId = c.req.param('id');

      // Check if attribute exists and belongs to user
      const [existingAttribute] = await db
        .select()
        .from(userAttributes)
        .where(and(eq(userAttributes.id, attributeId), eq(userAttributes.userId, userId)));

      if (!existingAttribute) {
        return c.json({ success: false, error: 'Attribute not found' }, 404);
      }

      await db.delete(userAttributes).where(eq(userAttributes.id, attributeId));

      return c.json({
        success: true,
        message: 'Attribute deleted successfully',
      });
    } catch (error) {
      handleApiError(error, 'Failed to delete user attribute');
      return;
    }
  });

export default app;
