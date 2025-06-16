import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  // Calculate expiration time (7 days from now)
  const expirationTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days in seconds
  
  const tokenPayload = {
    ...payload,
    exp: expirationTime,
  };
  
  return await sign(tokenPayload, JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const payload = await verify(token, JWT_SECRET);
  return payload as unknown as JWTPayload;
}

export function generateResetToken(): string {
  return uuidv4();
}

export function getTokenExpirationTime(hoursFromNow: number = 1): Date {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
}
