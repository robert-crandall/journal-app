import { hash, compare } from 'bcryptjs';

/**
 * Auth utility functions for password hashing and comparison.
 * Uses bcryptjs for consistent behavior across all environments.
 */

/**
 * Hash a password using bcrypt with a salt rounds of 10.
 * @param password The plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10);
}

/**
 * Verify a password against its hash using bcrypt.
 * @param password The plain text password to verify
 * @param hash The hash to verify against
 * @returns true if the password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await compare(password, hash);
}
