import { authStore, type User } from '../stores/auth';
import { api } from '../api';

// Interface for the JWT payload
interface JWTPayload {
	id: string;
	email: string;
	name: string;
	exp: number;
	iat: number;
}

/**
 * Decode a JWT token to extract its payload
 * @param token The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
function decodeJwt(token: string): JWTPayload | null {
	try {
		// Split the token into parts
		const parts = token.split('.');
		if (parts.length !== 3) {
			return null;
		}

		// Decode the payload part (the middle part)
		const payload = JSON.parse(atob(parts[1]));
		return payload as JWTPayload;
	} catch (e) {
		console.error('Failed to decode JWT:', e);
		return null;
	}
}

/**
 * Initialize the authentication state from localStorage
 */
export function initializeAuth(): Promise<void> {
	return new Promise((resolve) => {
		// Get token from localStorage (this is already done in the store creation)
		const token = localStorage.getItem('token');
		if (!token) {
			authStore.setInitialized(true);
			resolve();
			return;
		}

		// Try to decode the token to extract user information
		const payload = decodeJwt(token);
		if (!payload) {
			// Invalid token, clear it
			authStore.clearAuth();
			resolve();
			return;
		}

		// Check if token is expired
		const now = Math.floor(Date.now() / 1000);
		if (payload.exp && payload.exp < now) {
			// Token expired, clear auth
			authStore.clearAuth();
			resolve();
			return;
		}

		// Reconstruct user object from token payload
		const user: User = {
			id: payload.id,
			name: payload.name,
			email: payload.email,
			createdAt: new Date(payload.iat * 1000).toISOString() // Convert iat to ISO string
		};

		// Set user in auth store
		authStore.setAuth(user, token);
		resolve();
	});
}
