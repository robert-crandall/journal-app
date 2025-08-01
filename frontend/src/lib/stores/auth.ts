import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// API response user type (dates are serialized as strings in JSON)
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  gptTone: string;
  createdAt: string;
}

// Authentication store state
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Create the authentication store
function createAuthStore() {
  // Get initial token from localStorage
  const initialToken = browser ? localStorage.getItem('token') : null;

  // Initial state
  const initialState: AuthState = {
    user: null,
    token: initialToken,
    loading: false,
    error: null,
    initialized: false,
  };

  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    // Set the user and token after successful authentication
    setAuth: (user: User, token: string) => {
      if (browser) {
        localStorage.setItem('token', token);
      }

      update((state) => ({
        ...state,
        user,
        token,
        loading: false,
        error: null,
        initialized: true,
      }));
    },

    // Update user data (e.g., after profile or avatar update)
    updateUser: (updatedUser: User) => {
      update((state) => ({
        ...state,
        user: updatedUser,
      }));
    },

    // Clear authentication state on logout
    clearAuth: () => {
      if (browser) {
        localStorage.removeItem('token');
      }

      update((state) => ({
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
        initialized: true,
      }));
    },

    // Set loading state
    setLoading: (isLoading: boolean) => {
      update((state) => ({ ...state, loading: isLoading }));
    },

    // Set error state
    setError: (errorMessage: string | null) => {
      update((state) => ({ ...state, error: errorMessage, loading: false }));
    },

    // Set initialized state
    setInitialized: (initialized: boolean = true) => {
      update((state) => ({ ...state, initialized }));
    },
  };
}

// Export the authentication store
export const authStore = createAuthStore();
