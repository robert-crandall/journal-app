import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '$lib/api/client';
import { journalApi } from '$lib/api/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  return {
    subscribe,
    
    // Initialize auth state from stored token
    init: async () => {
      if (!browser) return;
      
      const token = localStorage.getItem('auth_token');
      if (token) {
        journalApi.setToken(token);
        try {
          const response = await journalApi.getProfile();
          if (response.success && response.data) {
            set({
              user: response.data,
              isLoading: false,
              isAuthenticated: true
            });
          } else {
            // Invalid token, clear it
            localStorage.removeItem('auth_token');
            journalApi.clearToken();
            set({
              user: null,
              isLoading: false,
              isAuthenticated: false
            });
          }
        } catch {
          // Error fetching profile, clear token
          localStorage.removeItem('auth_token');
          journalApi.clearToken();
          set({
            user: null,
            isLoading: false,
            isAuthenticated: false
          });
        }
      } else {
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    },

    // Login
    login: async (user: User, token: string) => {
      if (browser) {
        localStorage.setItem('auth_token', token);
      }
      journalApi.setToken(token);
      set({
        user,
        isLoading: false,
        isAuthenticated: true
      });
    },

    // Logout
    logout: async () => {
      try {
        await journalApi.logout();
      } catch {
        // Continue with logout even if API call fails
      }
      
      if (browser) {
        localStorage.removeItem('auth_token');
      }
      journalApi.clearToken();
      set({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
    },

    // Update user data
    updateUser: (user: User) => {
      update(state => ({
        ...state,
        user
      }));
    },

    // Set loading state
    setLoading: (isLoading: boolean) => {
      update(state => ({
        ...state,
        isLoading
      }));
    }
  };
}

export const authStore = createAuthStore();
