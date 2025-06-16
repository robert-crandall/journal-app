import { eq, and } from 'drizzle-orm';
import { db, users, userContext, userPreferences, passwordResetTokens } from '../db';
import { hashPassword, verifyPassword, generateToken, generateResetToken, getTokenExpirationTime } from '../lib/auth';
import type { RegisterInput, LoginInput, UserContextInput, UserPreferencesInput, UpdateProfileInput } from '../lib/validation';

export class UserService {
  async register(data: RegisterInput) {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    
    if (existingUser.length > 0) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    }).returning();

    // Create default preferences
    await db.insert(userPreferences).values({
      userId: newUser.id,
      theme: 'light',
      accentColor: 'blue',
      timezone: 'UTC',
    });

    // Generate token
    const token = await generateToken({ userId: newUser.id, email: newUser.email });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isEmailVerified: newUser.isEmailVerified,
        createdAt: newUser.createdAt,
      },
      token,
    };
  }

  async login(data: LoginInput) {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await verifyPassword(data.password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = await generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getUserById(userId: string) {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isEmailVerified: users.isEmailVerified,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, userId)).limit(1);

    return user || null;
  }

  async getUserContext(userId: string) {
    const contexts = await db.select().from(userContext).where(eq(userContext.userId, userId));
    
    return contexts.map(ctx => ({
      id: ctx.id,
      key: ctx.key,
      values: ctx.values as string[],
      createdAt: ctx.createdAt,
      updatedAt: ctx.updatedAt,
    }));
  }

  async updateUserContext(userId: string, contexts: UserContextInput[]) {
    // Delete existing contexts
    await db.delete(userContext).where(eq(userContext.userId, userId));

    // Insert new contexts
    if (contexts.length > 0) {
      await db.insert(userContext).values(
        contexts.map(ctx => ({
          userId,
          key: ctx.key,
          values: ctx.values,
        }))
      );
    }

    return this.getUserContext(userId);
  }

  async getUserPreferences(userId: string) {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    
    if (!prefs) {
      // Create default preferences if they don't exist
      const [newPrefs] = await db.insert(userPreferences).values({
        userId,
        theme: 'light',
        accentColor: 'blue',
        timezone: 'UTC',
      }).returning();
      
      return {
        theme: newPrefs.theme,
        accentColor: newPrefs.accentColor,
        timezone: newPrefs.timezone,
      };
    }

    return {
      theme: prefs.theme,
      accentColor: prefs.accentColor,
      timezone: prefs.timezone,
    };
  }

  async updateUserPreferences(userId: string, preferences: UserPreferencesInput) {
    const [updatedPrefs] = await db.update(userPreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    return {
      theme: updatedPrefs.theme,
      accentColor: updatedPrefs.accentColor,
      timezone: updatedPrefs.timezone,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const [updatedUser] = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isEmailVerified: updatedUser.isEmailVerified,
      createdAt: updatedUser.createdAt,
    };
  }

  async requestPasswordReset(email: string) {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user) {
      // Don't reveal if user exists or not
      return { success: true };
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = getTokenExpirationTime(1); // 1 hour

    // Store reset token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // In a real app, you would send an email here
    console.log(`Password reset token for ${email}: ${token}`);

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find valid reset token
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false)
        )
      )
      .limit(1);

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return { success: true };
  }
}
