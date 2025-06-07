import { Hono } from 'hono';
import { db } from '../db';
import { attributes, type User } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const app = new Hono<{ Variables: Variables }>();

// Get user preferences
app.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const userPreferences = await db
      .select()
      .from(attributes)
      .where(eq(attributes.userId, user.id));

    // Convert to key-value object
    const preferences = userPreferences.reduce((acc, attr) => {
      acc[attr.key] = attr.value;
      return acc;
    }, {} as Record<string, string>);

    return c.json({ success: true, preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return c.json({ error: 'Failed to fetch preferences' }, 500);
  }
});

// Set a single preference
app.put('/:key', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  const key = c.req.param('key');
  const { value } = await c.req.json();

  if (!value) {
    return c.json({ error: 'Value is required' }, 400);
  }

  try {
    // Check if preference already exists
    const existing = await db
      .select()
      .from(attributes)
      .where(and(eq(attributes.userId, user.id), eq(attributes.key, key)))
      .limit(1);

    if (existing.length > 0) {
      // Update existing preference
      await db
        .update(attributes)
        .set({ 
          value, 
          updatedAt: new Date() 
        })
        .where(and(eq(attributes.userId, user.id), eq(attributes.key, key)));
    } else {
      // Create new preference
      await db.insert(attributes).values({
        userId: user.id,
        key,
        value,
      });
    }

    return c.json({ success: true, message: 'Preference updated' });
  } catch (error) {
    console.error('Error updating preference:', error);
    return c.json({ error: 'Failed to update preference' }, 500);
  }
});

// Set multiple preferences
app.put('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  const { preferences } = await c.req.json();

  if (!preferences || typeof preferences !== 'object') {
    return c.json({ error: 'Preferences object is required' }, 400);
  }

  try {
    // Process each preference
    for (const [key, value] of Object.entries(preferences)) {
      if (typeof value !== 'string') continue;

      // Check if preference already exists
      const existing = await db
        .select()
        .from(attributes)
        .where(and(eq(attributes.userId, user.id), eq(attributes.key, key)))
        .limit(1);

      if (existing.length > 0) {
        // Update existing preference
        await db
          .update(attributes)
          .set({ 
            value, 
            updatedAt: new Date() 
          })
          .where(and(eq(attributes.userId, user.id), eq(attributes.key, key)));
      } else {
        // Create new preference
        await db.insert(attributes).values({
          userId: user.id,
          key,
          value,
        });
      }
    }

    return c.json({ success: true, message: 'Preferences updated' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

// Delete a preference
app.delete('/:key', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  const key = c.req.param('key');

  try {
    await db
      .delete(attributes)
      .where(and(eq(attributes.userId, user.id), eq(attributes.key, key)));

    return c.json({ success: true, message: 'Preference deleted' });
  } catch (error) {
    console.error('Error deleting preference:', error);
    return c.json({ error: 'Failed to delete preference' }, 500);
  }
});

export default app;
