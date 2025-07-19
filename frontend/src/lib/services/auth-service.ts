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
export async function initializeAuth(): Promise<void> {
  // Get token from localStorage (this is already done in the store creation)
  const token = localStorage.getItem('token');
  if (!token) {
    authStore.setInitialized(true);
    return;
  }

  // Try to decode the token to extract user information
  const payload = decodeJwt(token);
  if (!payload) {
    // Invalid token, clear it
    authStore.clearAuth();
    return;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    // Token expired, clear auth
    authStore.clearAuth();
    return;
  }

  try {
    // Fetch current user profile to get complete data including avatar
    const response = await api.api.users.profile.$get(
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        // Use the complete user profile from API
        const user: User = {
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          avatar: result.data.avatar,
          createdAt: result.data.createdAt,
        };

        // Set user in auth store with complete profile
        authStore.setAuth(user, token);
        return;
      }
    }

    // Fallback: if API call fails, use basic data from token
    console.warn('Failed to fetch user profile, using token data as fallback');
    const user: User = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      avatar: null,
      createdAt: new Date(payload.iat * 1000).toISOString(),
    };

    authStore.setAuth(user, token);
  } catch (error) {
    console.error('Failed to fetch user profile during auth initialization:', error);

    // Fallback: use basic data from token
    const user: User = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      avatar: null,
      createdAt: new Date(payload.iat * 1000).toISOString(),
    };

    authStore.setAuth(user, token);
  }
}
