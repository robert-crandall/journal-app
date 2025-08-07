import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { users } from '../db/schema';
import { env } from '../env';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { hashPassword, verifyPassword } from '../utils/auth';
import { registerSchema, loginSchema, updateUserValidationSchema } from '../validation/users';
import { jwtAuth } from '../middleware/auth';
import type { UpdateUserRequest, UpdateUserAvatarRequest } from '../../../shared/types/users';
import logger, { handleApiError } from '../utils/logger';
import { z } from 'zod';
import { createAvatarSchema } from '../utils/avatar';

// Chain methods for RPC compatibility
const app = new Hono()
  // Check if registration is enabled
  .get('/registration-status', async (c) => {
    return c.json({ enabled: env.ALLOW_REGISTRATION });
  })
  // User registration endpoint
  .post('/', zValidator('json', registerSchema), async (c) => {
    // Check if registration is allowed
    if (!env.ALLOW_REGISTRATION) {
      return c.json({ error: 'Registration is currently disabled' }, 403);
    }

    const data = c.req.valid('json');
    const { name, email, password } = data;

    try {
      // Check if user already exists
      const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUsers.length > 0) {
        return c.json({ error: 'Email already in use' }, 409);
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
          avatar: data.avatar || null,
          gptTone: data.gptTone || 'friendly',
          heightCm: data.heightCm || null,
          sex: data.sex || null,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          gptTone: users.gptTone,
          heightCm: users.heightCm,
          sex: users.sex,
          createdAt: users.createdAt,
        });

      // Generate JWT token
      const token = await sign(
        {
          userId: newUser.id,
          email: newUser.email,
          name: newUser.name,
          iat: Math.floor(Date.now() / 1000), // issued at
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // expires in 24 hours
        },
        env.JWT_SECRET,
      );

      return c.json(
        {
          user: newUser,
          token,
        },
        201,
      );
    } catch (error) {
      console.error('Registration error:', error);
      return c.json({ error: 'Failed to register user' }, 500);
    }
  })
  // User login endpoint
  .post('/login', zValidator('json', loginSchema), async (c) => {
    const data = c.req.valid('json');
    const { email, password, rememberMe } = data;

    try {
      // Find user by email
      const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUsers.length === 0) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }

      const user = existingUsers[0];

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }

      // Generate JWT token with appropriate expiration
      const expirationTime = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24 hours
      const token = await sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          iat: Math.floor(Date.now() / 1000), // issued at
          exp: Math.floor(Date.now() / 1000) + expirationTime,
        },
        env.JWT_SECRET,
      );

      return c.json(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            gptTone: user.gptTone,
            createdAt: user.createdAt,
          },
          token,
        },
        200,
      );
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Failed to login user' }, 500);
    }
  })
  // Get current user profile
  .get('/profile', jwtAuth, async (c) => {
    try {
      const userId = c.get('userId');

      const userProfile = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          gptTone: users.gptTone,
          heightCm: users.heightCm,
          sex: users.sex,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userProfile.length === 0) {
        return c.json(
          {
            success: false,
            error: 'User not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: userProfile[0],
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch user profile');
    }
  })
  // Update user profile
  .put('/profile', jwtAuth, zValidator('json', updateUserValidationSchema), async (c) => {
    try {
      const userId = c.get('userId');
      const data = c.req.valid('json') as UpdateUserRequest;

      // Check if email is being changed and if it's already in use
      if (data.email) {
        const existingUsers = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

        if (existingUsers.length > 0 && existingUsers[0].id !== userId) {
          return c.json(
            {
              success: false,
              error: 'Email already in use',
            },
            409,
          );
        }
      }

      const updatedUser = await db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          gptTone: users.gptTone,
          heightCm: users.heightCm,
          sex: users.sex,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      if (updatedUser.length === 0) {
        return c.json(
          {
            success: false,
            error: 'User not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: updatedUser[0],
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update user profile');
    }
  })
  // Update/remove user avatar
  .patch('/avatar', jwtAuth, zValidator('json', z.object(createAvatarSchema())), async (c) => {
    try {
      const userId = c.get('userId');
      const data = c.req.valid('json') as UpdateUserAvatarRequest;

      const updatedUser = await db
        .update(users)
        .set({
          avatar: data.avatar || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          gptTone: users.gptTone,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      if (updatedUser.length === 0) {
        return c.json(
          {
            success: false,
            error: 'User not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: updatedUser[0],
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update user avatar');
    }
  });

export default app;
