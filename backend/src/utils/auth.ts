import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type User } from '../db/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function generateToken(userId: string): Promise<string> {
  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
  };
  return await sign(payload, JWT_SECRET);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const payload = await verify(token, JWT_SECRET) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const userId = await verifyToken(token);
    if (!userId) {
      return null;
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    return user || null;
  } catch {
    return null;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    return user || null;
  } catch {
    return null;
  }
}
