// Secure storage utilities for the app
// Uses react-native-mmkv for secure, fast key-value storage
// Falls back to localStorage on web for compatibility

import { Platform } from 'react-native';

// Storage interface for consistency
interface Storage {
  set: (key: string, value: string | number | boolean) => void;
  getString: (key: string) => string | undefined;
  getNumber: (key: string) => number | undefined;
  getBoolean: (key: string) => boolean | undefined;
  delete: (key: string) => void;
  clearAll: () => void;
}

// Web storage implementation using localStorage
class WebStorage implements Storage {
  private prefix: string;

  constructor(id: string) {
    this.prefix = `${id}:`;
  }

  set(key: string, value: string | number | boolean): void {
    try {
      localStorage.setItem(this.prefix + key, String(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  getString(key: string): string | undefined {
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value || undefined;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return undefined;
    }
  }

  getNumber(key: string): number | undefined {
    const value = this.getString(key);
    return value ? Number(value) : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.getString(key);
    return value ? value === 'true' : undefined;
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  clearAll(): void {
    try {
      // Clear only items with our prefix
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}

// MMKV storage implementation for native platforms
class MMKVStorage implements Storage {
  private storage: any;

  constructor(id: string, useEncryption = false) {
    const { MMKV } = require('react-native-mmkv');
    this.storage = new MMKV({
      id,
      // Only use encryption on native platforms (iOS/Android)
      ...(Platform.OS !== 'web' && useEncryption && { encryptionKey: `${id}-key` }),
    });
  }

  set(key: string, value: string | number | boolean): void {
    this.storage.set(key, value);
  }

  getString(key: string): string | undefined {
    return this.storage.getString(key);
  }

  getNumber(key: string): number | undefined {
    return this.storage.getNumber(key);
  }

  getBoolean(key: string): boolean | undefined {
    return this.storage.getBoolean(key);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clearAll(): void {
    this.storage.clearAll();
  }
}

// Factory function to create appropriate storage based on platform
function createStorage(id: string, useEncryption = false): Storage {
  if (Platform.OS === 'web') {
    return new WebStorage(id);
  } else {
    return new MMKVStorage(id, useEncryption);
  }
}

// Create storage instances
const authStorage = createStorage('journal-app-auth', true);
const preferencesStorage = createStorage('journal-app-preferences', false);

// Auth storage utilities
export const authStorageUtils = {
  // Token management
  setToken: (token: string): void => {
    authStorage.set('auth_token', token);
  },

  getToken: (): string | null => {
    return authStorage.getString('auth_token') || null;
  },

  clearToken: (): void => {
    authStorage.delete('auth_token');
  },

  // User data
  setUser: (user: any): void => {
    authStorage.set('user_data', JSON.stringify(user));
  },

  getUser: (): any | null => {
    const userData = authStorage.getString('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  clearUser: (): void => {
    authStorage.delete('user_data');
  },

  // Check if user is logged in
  isLoggedIn: (): boolean => {
    return !!authStorage.getString('auth_token');
  },

  // Clear all auth data
  clearAll: (): void => {
    authStorage.clearAll();
  },
};

// Preferences storage utilities
export const preferencesStorageUtils = {
  // Theme preferences
  setTheme: (theme: string): void => {
    preferencesStorage.set('theme', theme);
  },

  getTheme: (): string => {
    return preferencesStorage.getString('theme') || 'light';
  },

  // Accent color
  setAccentColor: (color: string): void => {
    preferencesStorage.set('accent_color', color);
  },

  getAccentColor: (): string => {
    return preferencesStorage.getString('accent_color') || 'primary';
  },

  // Timezone
  setTimezone: (timezone: string): void => {
    preferencesStorage.set('timezone', timezone);
  },

  getTimezone: (): string => {
    return preferencesStorage.getString('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  // User context data
  setUserContext: (context: any[]): void => {
    preferencesStorage.set('user_context', JSON.stringify(context));
  },

  getUserContext: (): any[] => {
    const context = preferencesStorage.getString('user_context');
    return context ? JSON.parse(context) : [];
  },

  clearUserContext: (): void => {
    preferencesStorage.delete('user_context');
  },

  // Onboarding state
  setOnboardingCompleted: (completed: boolean): void => {
    preferencesStorage.set('onboarding_completed', completed);
  },

  isOnboardingCompleted: (): boolean => {
    return preferencesStorage.getBoolean('onboarding_completed') || false;
  },

  // Clear all preferences
  clearAll: (): void => {
    preferencesStorage.clearAll();
  },
};

// General storage utilities
export const storageUtils = {
  // Clear all app data
  clearAllData: (): void => {
    authStorageUtils.clearAll();
    preferencesStorageUtils.clearAll();
  },

  // Get app version for migration purposes
  getAppVersion: (): string => {
    return preferencesStorage.getString('app_version') || '1.0.0';
  },

  setAppVersion: (version: string): void => {
    preferencesStorage.set('app_version', version);
  },
};
