// Authentication context and provider
// Manages authentication state and provides auth utilities throughout the app

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { journalApi, User, UserPreferences, UserContext, ApiError } from './api';
import { authStorageUtils, preferencesStorageUtils } from './storage';

export interface AuthContextType {
  // Authentication state
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // User preferences
  preferences: UserPreferences | null;
  userContext: UserContext[] | null;

  // Authentication methods
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  // Profile methods
  updateProfile: (data: { firstName?: string; lastName?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;

  // Preferences methods
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  refreshPreferences: () => Promise<void>;

  // Context methods
  updateUserContext: (contexts: { key: string; values: string[] }[]) => Promise<void>;
  refreshUserContext: () => Promise<void>;

  // Utility methods
  clearAllData: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [userContext, setUserContext] = useState<UserContext[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = authStorageUtils.getToken();
        const storedUser = authStorageUtils.getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          journalApi.setToken(storedToken);

          // Try to refresh user data
          try {
            const profileResponse = await journalApi.getProfile();
            if (profileResponse.success && profileResponse.data) {
              setUser(profileResponse.data);
              authStorageUtils.setUser(profileResponse.data);
            }
          } catch (error) {
            // If token is invalid, clear auth data
            if (error instanceof ApiError && error.status === 401) {
              await logout();
            }
          }

          // Load preferences and context
          await Promise.all([
            refreshPreferences(),
            refreshUserContext(),
          ]);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await journalApi.login({ email, password });
      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        
        // Store in secure storage
        authStorageUtils.setToken(authToken);
        authStorageUtils.setUser(userData);

        // Load additional data
        await Promise.all([
          refreshPreferences(),
          refreshUserContext(),
        ]);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: { email: string; password: string; firstName?: string; lastName?: string }): Promise<void> => {
    try {
      const response = await journalApi.register(data);
      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        
        // Store in secure storage
        authStorageUtils.setToken(authToken);
        authStorageUtils.setUser(userData);

        // Initialize default preferences
        const defaultPreferences: UserPreferences = {
          theme: 'light',
          accentColor: 'blue',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        try {
          await journalApi.updatePreferences(defaultPreferences);
          setPreferences(defaultPreferences);
          preferencesStorageUtils.setTheme(defaultPreferences.theme);
          preferencesStorageUtils.setAccentColor(defaultPreferences.accentColor);
          preferencesStorageUtils.setTimezone(defaultPreferences.timezone);
        } catch (error) {
          console.warn('Failed to set default preferences:', error);
        }
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await journalApi.logout();
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Clear state
      setUser(null);
      setToken(null);
      setPreferences(null);
      setUserContext(null);
      
      // Clear storage
      authStorageUtils.clearAll();
    }
  };

  const requestPasswordReset = async (email: string): Promise<void> => {
    const response = await journalApi.requestPasswordReset(email);
    if (!response.success) {
      throw new Error(response.error || 'Password reset request failed');
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    const response = await journalApi.resetPassword(token, newPassword);
    if (!response.success) {
      throw new Error(response.error || 'Password reset failed');
    }
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string }): Promise<void> => {
    const response = await journalApi.updateProfile(data);
    if (response.success && response.data) {
      setUser(response.data);
      authStorageUtils.setUser(response.data);
    } else {
      throw new Error(response.error || 'Profile update failed');
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const response = await journalApi.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        authStorageUtils.setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const updatePreferences = async (newPreferences: UserPreferences): Promise<void> => {
    const response = await journalApi.updatePreferences(newPreferences);
    if (response.success && response.data) {
      setPreferences(response.data);
      
      // Update local storage
      preferencesStorageUtils.setTheme(response.data.theme);
      preferencesStorageUtils.setAccentColor(response.data.accentColor);
      preferencesStorageUtils.setTimezone(response.data.timezone);
    } else {
      throw new Error(response.error || 'Preferences update failed');
    }
  };

  const refreshPreferences = async (): Promise<void> => {
    try {
      const response = await journalApi.getPreferences();
      if (response.success && response.data) {
        setPreferences(response.data);
        
        // Update local storage
        preferencesStorageUtils.setTheme(response.data.theme);
        preferencesStorageUtils.setAccentColor(response.data.accentColor);
        preferencesStorageUtils.setTimezone(response.data.timezone);
      }
    } catch (error) {
      console.error('Failed to refresh preferences:', error);
    }
  };

  const updateUserContext = async (contexts: { key: string; values: string[] }[]): Promise<void> => {
    const response = await journalApi.updateContext(contexts);
    if (response.success && response.data) {
      setUserContext(response.data);
      preferencesStorageUtils.setUserContext(response.data);
    } else {
      throw new Error(response.error || 'User context update failed');
    }
  };

  const refreshUserContext = async (): Promise<void> => {
    try {
      const response = await journalApi.getContext();
      if (response.success && response.data) {
        setUserContext(response.data);
        preferencesStorageUtils.setUserContext(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user context:', error);
    }
  };

  const clearAllData = (): void => {
    setUser(null);
    setToken(null);
    setPreferences(null);
    setUserContext(null);
    authStorageUtils.clearAll();
    preferencesStorageUtils.clearAll();
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    preferences,
    userContext,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    refreshProfile,
    updatePreferences,
    refreshPreferences,
    updateUserContext,
    refreshUserContext,
    clearAllData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
