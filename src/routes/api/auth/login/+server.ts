import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, session } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as argon2 from '@node-rs/argon2';
import { randomUUID } from 'crypto';

export async function POST({ request, cookies }: RequestEvent) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user by email
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .limit(1);

    if (!existingUser) {
      return json({ error: 'Invalid email or password' }, { status: 400 });
    }

    // Verify password
    const validPassword = await argon2.verify(existingUser.passwordHash, password);
    if (!validPassword) {
      return json({ error: 'Invalid email or password' }, { status: 400 });
    }

    // Create new session
    const sessionId = randomUUID();
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30); // 30 days session

    await db.insert(session).values({
      id: sessionId,
      userId: existingUser.id,
      expiresAt: sessionExpiry
    });

    // Set session cookie
    cookies.set('session', sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
      sameSite: 'lax'
    });

    return json({
      user: {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return json({ error: 'Failed to login' }, { status: 500 });
  }
}
