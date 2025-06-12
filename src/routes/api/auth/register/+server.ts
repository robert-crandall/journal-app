import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as argon2 from '@node-rs/argon2';

export async function POST({ request, locals }: RequestEvent) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validate inputs
    if (!username || !email || !password) {
      return json({ error: 'Username, email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Check if user already exists
    const existingUserByEmail = await db
      .select()
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .limit(1);

    if (existingUserByEmail.length > 0) {
      return json({ error: 'Email already in use' }, { status: 400 });
    }

    // Check username availability
    const existingUserByUsername = await db
      .select()
      .from(user)
      .where(eq(user.username, username.toLowerCase()))
      .limit(1);

    if (existingUserByUsername.length > 0) {
      return json({ error: 'Username already taken' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Create user
    const userId = randomUUID();
    const [newUser] = await db
      .insert(user)
      .values({
        id: userId,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash
      })
      .returning({
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt
      });

    return json({
      user: newUser
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return json({ error: 'Failed to create account' }, { status: 500 });
  }
}
