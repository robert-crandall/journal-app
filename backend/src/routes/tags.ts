import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { tags } from '../db/schema/tags';
import { createTagSchema, updateTagSchema, batchCreateTagsSchema } from '../validation/tags';
import { handleApiError } from '../utils/logger';
import { getUserTagsWithCounts, createOrGetTag, deleteUnusedTags } from '../utils/tags';
import type { Tag, CreateTag, UpdateTag, TagWithCount } from '../types/tags';

const app = new Hono()
  // Get all user's tags with usage counts
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const userTags = await getUserTagsWithCounts(userId);

      return c.json({
        success: true,
        data: userTags,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch tags');
      return;
    }
  })

  // Get a specific tag by ID
  .get('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const tagId = c.req.param('id');

      const tag = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tagId))
        .limit(1);

      if (tag.length === 0 || tag[0].userId !== userId) {
        return c.json(
          {
            success: false,
            error: 'Tag not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: {
          ...tag[0],
          createdAt: tag[0].createdAt.toISOString(),
          updatedAt: tag[0].updatedAt.toISOString(),
        },
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch tag');
      return;
    }
  })

  // Create a new tag
  .post('/', jwtAuth, zValidator('json', createTagSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as CreateTag;

      const tag = await createOrGetTag(userId, data.name);

      return c.json(
        {
          success: true,
          data: {
            ...tag,
            createdAt: tag.createdAt.toISOString(),
            updatedAt: tag.updatedAt.toISOString(),
          },
        },
        201,
      );
    } catch (error) {
      handleApiError(error, 'Failed to create tag');
      return;
    }
  })

  // Batch create tags
  .post('/batch', jwtAuth, zValidator('json', batchCreateTagsSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { tags: tagNames } = c.req.valid('json');

      const createdTags: Tag[] = [];
      for (const tagName of tagNames) {
        const tag = await createOrGetTag(userId, tagName);
        createdTags.push(tag);
      }

      const serializedTags = createdTags.map(tag => ({
        ...tag,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
      }));

      return c.json(
        {
          success: true,
          data: serializedTags,
        },
        201,
      );
    } catch (error) {
      handleApiError(error, 'Failed to create tags');
      return;
    }
  })

  // Update a tag
  .put('/:id', jwtAuth, zValidator('json', updateTagSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const tagId = c.req.param('id');
      const data = c.req.valid('json') as UpdateTag;

      // Check if tag exists and belongs to user
      const existingTag = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tagId))
        .limit(1);

      if (existingTag.length === 0 || existingTag[0].userId !== userId) {
        return c.json(
          {
            success: false,
            error: 'Tag not found',
          },
          404,
        );
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) {
        updateData.name = data.name.trim().toLowerCase();
      }

      const updatedTag = await db
        .update(tags)
        .set(updateData)
        .where(eq(tags.id, tagId))
        .returning();

      return c.json({
        success: true,
        data: {
          ...updatedTag[0],
          createdAt: updatedTag[0].createdAt.toISOString(),
          updatedAt: updatedTag[0].updatedAt.toISOString(),
        },
      });
    } catch (error) {
      handleApiError(error, 'Failed to update tag');
      return;
    }
  })

  // Delete a tag
  .delete('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const tagId = c.req.param('id');

      const deletedTag = await db
        .delete(tags)
        .where(eq(tags.id, tagId))
        .returning();

      if (deletedTag.length === 0 || deletedTag[0].userId !== userId) {
        return c.json(
          {
            success: false,
            error: 'Tag not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: {
          ...deletedTag[0],
          createdAt: deletedTag[0].createdAt.toISOString(),
          updatedAt: deletedTag[0].updatedAt.toISOString(),
        },
      });
    } catch (error) {
      handleApiError(error, 'Failed to delete tag');
      return;
    }
  })

  // Clean up unused tags
  .delete('/cleanup', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const deletedCount = await deleteUnusedTags(userId);

      return c.json({
        success: true,
        data: {
          deletedCount,
          message: `${deletedCount} unused tags deleted`,
        },
      });
    } catch (error) {
      handleApiError(error, 'Failed to cleanup tags');
      return;
    }
  });

export default app;
