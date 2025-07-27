import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { jwtAuth, getUserId } from '../middleware/auth';
import { UserAttributesService } from '../services/user-attributes';
import { 
  createUserAttributeSchema, 
  updateUserAttributeSchema, 
  bulkCreateUserAttributesSchema,
  getUserAttributesQuerySchema 
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

  // Get user's attributes summary for GPT
  .get('/summary', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const summary = await UserAttributesService.getAttributesSummaryForGPT(userId);

      return c.json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch user attributes summary');
      return;
    }
  })

  // Get a specific attribute by ID
  .get('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const attributeId = c.req.param('id');

      const attributes = await UserAttributesService.getUserAttributes(userId);
      const attribute = attributes.find(attr => attr.id === attributeId);

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
  })

  // Remove duplicate attributes (utility endpoint)
  .post('/deduplicate', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const result = await UserAttributesService.deduplicateUserAttributes(userId);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleApiError(error, 'Failed to deduplicate user attributes');
      return;
    }
  });

export default app;
