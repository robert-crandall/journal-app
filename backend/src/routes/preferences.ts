import { Hono } from 'hono';
import { db } from '../db';
import { preferences, type User, type Preference } from '../db/schema';
import { eq } from 'drizzle-orm';
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
      .from(preferences)
      .where(eq(preferences.userId, user.id))
      .limit(1);

    if (userPreferences.length === 0) {
      // Return default preferences if none exist
      return c.json({ 
        success: true, 
        preferences: {
          theme: 'light',
          locationDescription: null,
          zipCode: null,
          rpgFlavorEnabled: false,
          timezone: null
        }
      });
    }

    // Convert preferences record to a simple object (excluding metadata)
    const { userId, createdAt, updatedAt, ...prefs } = userPreferences[0];
    
    return c.json({ success: true, preferences: prefs });
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

  // Validate that the key is a valid preference field
  const validKeys = ['theme', 'locationDescription', 'zipCode', 'rpgFlavorEnabled', 'timezone'];
  if (!validKeys.includes(key)) {
    return c.json({ error: `Invalid preference key: ${key}` }, 400);
  }

  try {
    // Check if preferences record exists for this user
    const existing = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      // Update existing preferences
      const updateData: Partial<Preference> = {
        updatedAt: new Date()
      };
      
      // Dynamically set the preference field
      if (key === 'theme') {
        updateData.theme = value;
      } else if (key === 'locationDescription') {
        updateData.locationDescription = value;
      } else if (key === 'zipCode') {
        updateData.zipCode = value;
      } else if (key === 'rpgFlavorEnabled') {
        updateData.rpgFlavorEnabled = value;
      } else if (key === 'timezone') {
        updateData.timezone = value;
      }

      await db
        .update(preferences)
        .set(updateData)
        .where(eq(preferences.userId, user.id));
    } else {
      // Create new preferences record
      const newPrefs: any = {
        userId: user.id,
        theme: 'light', // default value
      };
      
      // Set the specific preference
      if (key === 'theme') {
        newPrefs.theme = value;
      } else if (key === 'locationDescription') {
        newPrefs.locationDescription = value;
      } else if (key === 'zipCode') {
        newPrefs.zipCode = value;
      } else if (key === 'rpgFlavorEnabled') {
        newPrefs.rpgFlavorEnabled = value;
      } else if (key === 'timezone') {
        newPrefs.timezone = value;
      }

      await db.insert(preferences).values(newPrefs);
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
  const { preferences: prefsData } = await c.req.json();

  if (!prefsData || typeof prefsData !== 'object') {
    return c.json({ error: 'Preferences object is required' }, 400);
  }

  const validKeys = ['theme', 'locationDescription', 'zipCode', 'rpgFlavorEnabled', 'timezone'];
  
  // Validate all keys
  for (const key of Object.keys(prefsData)) {
    if (!validKeys.includes(key)) {
      return c.json({ error: `Invalid preference key: ${key}` }, 400);
    }
  }

  try {
    // Check if preferences record exists for this user
    const existing = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      // Update existing preferences
      const updateData: Partial<Preference> = {
        updatedAt: new Date()
      };
      
      // Set each preference field
      if (prefsData.theme !== undefined) updateData.theme = prefsData.theme;
      if (prefsData.locationDescription !== undefined) updateData.locationDescription = prefsData.locationDescription;
      if (prefsData.zipCode !== undefined) updateData.zipCode = prefsData.zipCode;
      if (prefsData.rpgFlavorEnabled !== undefined) updateData.rpgFlavorEnabled = prefsData.rpgFlavorEnabled;
      if (prefsData.timezone !== undefined) updateData.timezone = prefsData.timezone;

      await db
        .update(preferences)
        .set(updateData)
        .where(eq(preferences.userId, user.id));
    } else {
      // Create new preferences record
      const newPrefs: any = {
        userId: user.id,
        theme: prefsData.theme || 'light',
        locationDescription: prefsData.locationDescription || null,
        zipCode: prefsData.zipCode || null,
        rpgFlavorEnabled: prefsData.rpgFlavorEnabled || false,
        timezone: prefsData.timezone || null,
      };

      await db.insert(preferences).values(newPrefs);
    }

    return c.json({ success: true, message: 'Preferences updated' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

// Delete a preference (reset to default)
app.delete('/:key', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  const key = c.req.param('key');

  const validKeys = ['theme', 'locationDescription', 'zipCode', 'rpgFlavorEnabled', 'timezone'];
  if (!validKeys.includes(key)) {
    return c.json({ error: `Invalid preference key: ${key}` }, 400);
  }

  try {
    // Reset the preference to its default value
    const updateData: Partial<Preference> = {
      updatedAt: new Date()
    };
    
    if (key === 'theme') {
      updateData.theme = 'light'; // default theme
    } else if (key === 'locationDescription') {
      updateData.locationDescription = null; // clear location
    } else if (key === 'zipCode') {
      updateData.zipCode = null; // clear zip code
    } else if (key === 'rpgFlavorEnabled') {
      updateData.rpgFlavorEnabled = false; // default to disabled
    } else if (key === 'timezone') {
      updateData.timezone = null; // clear timezone
    }

    await db
      .update(preferences)
      .set(updateData)
      .where(eq(preferences.userId, user.id));

    return c.json({ success: true, message: 'Preference reset to default' });
  } catch (error) {
    console.error('Error resetting preference:', error);
    return c.json({ error: 'Failed to reset preference' }, 500);
  }
});

export default app;
