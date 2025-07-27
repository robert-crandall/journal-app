import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { jwtAuth, getUserId } from '../middleware/auth';
import { UserAttributesService } from '../services/user-attributes';
import {
  createUserAttributeSchema,
  updateUserAttributeSchema,
  bulkCreateUserAttributesSchema,
  getUserAttributesQuerySchema,
} from '../validation/user-attributes';
import { handleApiError } from '../utils/logger';

const app = new Hono()
  // Get user's attributes
  .get('/', jwtAuth, zValidator('query', getUserAttributesQuerySchema), async (c) => {
    try {
      const userId = getUserId(c);
      const query = c.req.valid('query');

      const attributes = await UserAttributesService.getUserAttributes(userId, query);

      return c.json({
        success: true,
        data: attributes,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch user attributes');
      return;
    }
  })

  // Get user's attributes summary (returns formatted string or null)
  .get('/summary', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const attributes = await UserAttributesService.getUserAttributes(userId);
      let summary: string | null = null;
      if (attributes.length > 0) {
        summary = attributes.map((attr) => `- ${attr.value} (source: ${attr.source})`).join('\n');
      }
      return c.json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch user attributes summary');
      return;
    }
  })
  // Get user's attributes grouped (returns {} if none, or { all: [...] })
  .get('/grouped', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const attributes = await UserAttributesService.getUserAttributes(userId);
      if (attributes.length === 0) {
        return c.json({ success: true, data: {} });
      }
      // No category, so just return all attributes under 'all'
      return c.json({ success: true, data: { all: attributes } });
    } catch (error) {
      handleApiError(error, 'Failed to fetch grouped user attributes');
      return;
    }
  })
  // Deduplicate user attributes (by value, keep newest)
  .post('/deduplicate', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const attributes = await UserAttributesService.getUserAttributes(userId);
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
        await UserAttributesService.deleteUserAttribute(userId, attr.id);
        removedCount++;
      }
      return c.json({ success: true, data: { removedCount } });
    } catch (error) {
      handleApiError(error, 'Failed to deduplicate user attributes');
      return;
    }
  })

  // Get a specific attribute by ID
  .get('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const attributeId = c.req.param('id');

      const attributes = await UserAttributesService.getUserAttributes(userId);
      const attribute = attributes.find((attr) => attr.id === attributeId);

      if (!attribute) {
        return c.json(
          {
            success: false,
            error: 'Attribute not found',
          },
          404,
        );
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
      const data = c.req.valid('json');

      const newAttribute = await UserAttributesService.createUserAttribute(userId, data);

      return c.json(
        {
          success: true,
          data: newAttribute,
        },
        201,
      );
    } catch (error) {
      handleApiError(error, 'Failed to create user attribute');
      return;
    }
  })

  // Bulk create user attributes (used for GPT inference)
  .post('/bulk', jwtAuth, zValidator('json', bulkCreateUserAttributesSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json');

      const newAttributes = await UserAttributesService.bulkCreateUserAttributes(userId, data);

      return c.json(
        {
          success: true,
          data: newAttributes,
        },
        201,
      );
    } catch (error) {
      handleApiError(error, 'Failed to bulk create user attributes');
      return;
    }
  })

  // Update a specific user attribute
  .put('/:id', jwtAuth, zValidator('json', updateUserAttributeSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const attributeId = c.req.param('id');
      const data = c.req.valid('json');

      const updatedAttribute = await UserAttributesService.updateUserAttribute(userId, attributeId, data);

      return c.json({
        success: true,
        data: updatedAttribute,
      });
    } catch (error) {
      handleApiError(error, 'Failed to update user attribute');
      return;
    }
  })

  // Delete a specific user attribute
  .delete('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const attributeId = c.req.param('id');

      const deletedAttribute = await UserAttributesService.deleteUserAttribute(userId, attributeId);

      return c.json({
        success: true,
        data: deletedAttribute,
      });
    } catch (error) {
      handleApiError(error, 'Failed to delete user attribute');
      return;
    }
  });

export default app;
