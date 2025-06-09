import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import api, { type User } from './api.js';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// Create the auth store
function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    
    // Initialize auth state on app load
    async init() {
      if (!browser) return;
      
      const token = api.getToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const user = await api.me();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (error) {
        // Token is invalid, clear it
        api.clearAuth();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    },

    // Login with email and password
    async login(email: string, password: string) {
      update(state => ({ ...state, isLoading: true }));
      
      try {
        const response = await api.login({ email, password });
        set({ user: response.user, isAuthenticated: true, isLoading: false });
        return response.user;
      } catch (error) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        throw error;
      }
    },

    // Register new user
    async register(email: string, password: string, name: string, timezone?: string) {
      update(state => ({ ...state, isLoading: true }));
      
      try {
        const response = await api.register({ email, password, name, timezone });
        set({ user: response.user, isAuthenticated: true, isLoading: false });
        return response.user;
      } catch (error) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        throw error;
      }
    },

    // Logout
    async logout() {
      await api.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    },

    // Refresh user data
    async refresh() {
      if (!api.isAuthenticated()) return;
      
      try {
        const user = await api.me();
        update(state => ({ ...state, user }));
      } catch (error) {
        // If refresh fails, user might be logged out
        await this.logout();
      }
    },

    // Utility methods
    setLoading(loading: boolean) {
      update(state => ({ ...state, isLoading: loading }));
    },

    clearError() {
      // This store doesn't manage errors directly, but this method
      // can be used by components to clear their local error states
    }
  };
}

export const auth = createAuthStore();
