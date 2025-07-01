import { browser } from '$app/environment';

// Token management utilities
export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'auth_user';

  static getToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem(TokenManager.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (!browser) return;
    localStorage.setItem(TokenManager.TOKEN_KEY, token);
  }

  static removeToken(): void {
    if (!browser) return;
    localStorage.removeItem(TokenManager.TOKEN_KEY);
  }

  static getStoredUser(): any | null {
    if (!browser) return null;
    const userStr = localStorage.getItem(TokenManager.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      return null;
    }
  }

  static setStoredUser(user: any): void {
    if (!browser) return;
    localStorage.setItem(TokenManager.USER_KEY, JSON.stringify(user));
  }

  static removeStoredUser(): void {
    if (!browser) return;
    localStorage.removeItem(TokenManager.USER_KEY);
  }

  static clearAll(): void {
    TokenManager.removeToken();
    TokenManager.removeStoredUser();
  }

  // Check if token is expired (basic JWT parsing without verification)
  static isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]!));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true; // If we can't parse it, consider it expired
    }
  }

  // Get token with expiry check
  static getValidToken(): string | null {
    const token = TokenManager.getToken();
    if (!token) return null;
    
    if (TokenManager.isTokenExpired(token)) {
      TokenManager.clearAll();
      return null;
    }
    
    return token;
  }
}

// JWT utilities
export function createAuthHeader(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`
  };
}

export function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1]!;
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error('Failed to parse JWT payload:', error);
    return null;
  }
}
