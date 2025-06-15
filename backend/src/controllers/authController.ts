import { Context } from 'hono';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, generateToken } from '../utils/authUtils';
import { UserLoginInput, UserRegisterInput, ApiResponse, User } from '../types/api';
import { HTTPException } from 'hono/http-exception';

export async function register(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as UserRegisterInput;
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      throw new HTTPException(400, { message: 'Email already registered' });
    }
    
    // Hash the password
    const passwordHash = hashPassword(body.password);
    
    // Insert new user
    const newUser = await db.insert(users).values({
      email: body.email,
      passwordHash,
      name: body.name,
      timezone: body.timezone || 'UTC',
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      timezone: users.timezone,
      createdAt: users.createdAt,
    });
    
    // Generate JWT token
    const token = generateToken({ id: newUser[0].id, email: newUser[0].email });
    
    const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: {
        user: newUser[0],
        token,
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Registration error:', error);
    throw new HTTPException(500, { message: 'Failed to register user' });
  }
}

export async function login(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as UserLoginInput;
    
    // Get user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);
    
    if (userResult.length === 0) {
      throw new HTTPException(401, { message: 'Invalid email or password' });
    }
    
    const user = userResult[0];
    
    // Verify password
    const hashedPassword = hashPassword(body.password);
    if (hashedPassword !== user.passwordHash) {
      throw new HTTPException(401, { message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email });
    
    const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
          createdAt: user.createdAt.toISOString(),
        },
        token,
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Login error:', error);
    throw new HTTPException(500, { message: 'Failed to log in' });
  }
}

export async function me(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    
    // Get user from database
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        timezone: users.timezone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);
    
    if (userResult.length === 0) {
      throw new HTTPException(404, { message: 'User not found' });
    }
    
    const response: ApiResponse<{ user: User }> = {
      success: true,
      data: {
        user: {
          ...userResult[0],
          createdAt: userResult[0].createdAt.toISOString(),
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Me endpoint error:', error);
    throw new HTTPException(500, { message: 'Failed to get user information' });
  }
}
