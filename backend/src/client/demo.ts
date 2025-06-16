// Demo usage of the type-safe Journal API client
// This shows how a frontend application would use the client

import { 
  JournalApiClient, 
  createJournalApiClient, 
  journalApi,
  ApiError,
  type RegisterInput,
  type LoginInput,
  type UserContextInput,
  type UserPreferencesInput
} from './index';

// Example 1: Using the default client instance
async function basicUsageExample() {
  try {
    // Health check
    const health = await journalApi.healthCheck();
    console.log('API Health:', health);

    // Register a new user
    const registerData: RegisterInput = {
      email: 'demo@example.com',
      password: 'securepassword123',
      firstName: 'Demo',
      lastName: 'User'
    };

    const registerResult = await journalApi.register(registerData);
    
    if (registerResult.success) {
      console.log('User registered:', registerResult.data?.user);
      console.log('Token automatically set:', journalApi.isAuthenticated());
      
      // Get user profile (token is automatically included)
      const profile = await journalApi.getProfile();
      console.log('User profile:', profile.data);
    }

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API Error:', error.message, error.status);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 2: Using a custom client instance
async function customClientExample() {
  const client = createJournalApiClient({
    baseUrl: 'https://api.myjournal.app',
    timeout: 15000,
    defaultHeaders: {
      'X-Client-Version': '1.0.0'
    }
  });

  try {
    // Login with existing credentials
    const loginData: LoginInput = {
      email: 'existing@example.com',
      password: 'mypassword'
    };

    const loginResult = await client.login(loginData);
    
    if (loginResult.success) {
      console.log('Logged in successfully');
      
      // Update user context
      const contexts: UserContextInput[] = [
        {
          key: 'About me',
          values: ['Software developer', 'Loves TypeScript', 'Wants to improve productivity']
        },
        {
          key: 'Goals',
          values: ['Learn new technologies', 'Exercise regularly', 'Read more books']
        }
      ];

      const contextResult = await client.updateContext(contexts);
      console.log('Context updated:', contextResult.data);

      // Update preferences
      const preferences: UserPreferencesInput = {
        theme: 'dark',
        accentColor: 'purple',
        timezone: 'America/New_York'
      };

      const prefsResult = await client.updatePreferences(preferences);
      console.log('Preferences updated:', prefsResult.data);
    }

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API Error:', error.message, error.status);
      
      if (error.status === 401) {
        console.log('Authentication required - redirecting to login');
        // Handle authentication error
      }
    }
  }
}

// Example 3: React Hook pattern (for React applications)
// This would be in a separate file like useJournalApi.ts
export function useJournalApi() {
  // In a real React app, you'd use useState and useEffect
  const client = journalApi;

  const login = async (credentials: LoginInput) => {
    try {
      const result = await client.login(credentials);
      if (result.success) {
        // Token is automatically set
        return { success: true, user: result.data?.user };
      }
      return { success: false, error: result.error };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    await client.logout();
    // In a real app, you'd also clear any local state
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string }) => {
    try {
      const result = await client.updateProfile(data);
      return { success: result.success, user: result.data };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Update failed' };
    }
  };

  return {
    login,
    logout,
    updateProfile,
    isAuthenticated: client.isAuthenticated(),
    getProfile: () => client.getProfile(),
    getContext: () => client.getContext(),
    updateContext: (contexts: UserContextInput[]) => client.updateContext(contexts),
    getPreferences: () => client.getPreferences(),
    updatePreferences: (prefs: UserPreferencesInput) => client.updatePreferences(prefs),
  };
}

// Example 4: Svelte store pattern (for SvelteKit applications)
// This would be in a separate file like journalStore.ts
import { writable } from 'svelte/store';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  });

  return {
    subscribe,
    login: async (credentials: LoginInput) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await journalApi.login(credentials);
        
        if (result.success) {
          update(state => ({
            ...state,
            user: result.data?.user,
            isAuthenticated: true,
            loading: false
          }));
          return { success: true };
        } else {
          update(state => ({
            ...state,
            error: result.error || 'Login failed',
            loading: false
          }));
          return { success: false, error: result.error };
        }
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Login failed';
        update(state => ({
          ...state,
          error: errorMessage,
          loading: false
        }));
        return { success: false, error: errorMessage };
      }
    },
    logout: async () => {
      await journalApi.logout();
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
    },
    clearError: () => {
      update(state => ({ ...state, error: null }));
    }
  };
}

export const authStore = createAuthStore();

// Export for demonstration
export {
  basicUsageExample,
  customClientExample,
};
