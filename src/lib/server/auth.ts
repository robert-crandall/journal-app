import { hash, verify } from '@node-rs/argon2';
import { nanoid } from 'nanoid';
import { db } from './db/index.js';
import { sessions, users, type User, type Session } from './db/schema.js';
import { eq } from 'drizzle-orm';

// Session configuration
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days

// Password hashing
export async function hashPassword(password: string): Promise<string> {
	return await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	return await verify(hash, password);
}

// Session management
export async function createSession(userId: string): Promise<string> {
	const sessionId = nanoid();
	const expiresAt = new Date(Date.now() + SESSION_DURATION);

	await db.insert(sessions).values({
		id: sessionId,
		userId,
		expiresAt
	});

	return sessionId;
}

export async function validateSession(
	sessionId: string
): Promise<{ user: User; session: Session } | null> {
	const result = await db
		.select({
			user: users,
			session: sessions
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const { user, session } = result[0];

	// Check if session has expired
	if (session.expiresAt < new Date()) {
		await deleteSession(sessionId);
		return null;
	}

	return { user, session };
}

export async function deleteSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteUserSessions(userId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}

// User management
export async function createUser(email: string, password: string, name: string): Promise<User> {
	const passwordHash = await hashPassword(password);

	const result = await db
		.insert(users)
		.values({
			email,
			passwordHash,
			name
		})
		.returning();

	return result[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
	const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
	return result.length > 0 ? result[0] : null;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
	const user = await getUserByEmail(email);
	if (!user) {
		return null;
	}

	const isValidPassword = await verifyPassword(user.passwordHash, password);
	if (!isValidPassword) {
		return null;
	}

	return user;
}
