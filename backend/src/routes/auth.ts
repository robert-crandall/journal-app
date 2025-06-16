import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { UserService } from '../services/user.service';
import { authMiddleware } from '../lib/middleware';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  updateUserContextSchema,
  userPreferencesSchema,
  updateProfileSchema,
} from '../lib/validation';

const auth = new Hono();
const userService = new UserService();

// Public routes
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await userService.register(data);
    
    return c.json({
      success: true,
      data: result,
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    }, 400);
  }
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await userService.login(data);
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    }, 401);
  }
});

auth.post('/password-reset/request', zValidator('json', passwordResetRequestSchema), async (c) => {
  try {
    const { email } = c.req.valid('json');
    const result = await userService.requestPasswordReset(email);
    
    return c.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to process password reset request',
    }, 500);
  }
});

auth.post('/password-reset/confirm', zValidator('json', passwordResetConfirmSchema), async (c) => {
  try {
    const { token, newPassword } = c.req.valid('json');
    await userService.resetPassword(token, newPassword);
    
    return c.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Password reset failed',
    }, 400);
  }
});

// Protected routes
auth.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const userData = await userService.getUserById(user.userId);
    
    if (!userData) {
      return c.json({
        success: false,
        error: 'User not found',
      }, 404);
    }
    
    return c.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch user data',
    }, 500);
  }
});

auth.put('/me', authMiddleware, zValidator('json', updateProfileSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.req.valid('json');
    const updatedUser = await userService.updateProfile(user.userId, data);
    
    return c.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update profile',
    }, 500);
  }
});

auth.get('/me/context', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const contexts = await userService.getUserContext(user.userId);
    
    return c.json({
      success: true,
      data: contexts,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch user context',
    }, 500);
  }
});

auth.put('/me/context', authMiddleware, zValidator('json', updateUserContextSchema), async (c) => {
  try {
    const user = c.get('user');
    const { contexts } = c.req.valid('json');
    const updatedContexts = await userService.updateUserContext(user.userId, contexts);
    
    return c.json({
      success: true,
      data: updatedContexts,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update user context',
    }, 500);
  }
});

auth.get('/me/preferences', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const preferences = await userService.getUserPreferences(user.userId);
    
    return c.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch user preferences',
    }, 500);
  }
});

auth.put('/me/preferences', authMiddleware, zValidator('json', userPreferencesSchema), async (c) => {
  try {
    const user = c.get('user');
    const preferences = c.req.valid('json');
    const updatedPreferences = await userService.updateUserPreferences(user.userId, preferences);
    
    return c.json({
      success: true,
      data: updatedPreferences,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update user preferences',
    }, 500);
  }
});

export { auth };
