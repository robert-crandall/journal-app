import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'journal-theme';

// Detect system preference
function getSystemTheme(): Theme {
  if (!browser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Get stored theme or fallback to system preference
function getInitialTheme(): Theme {
  if (!browser) return 'light';
  
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  return stored || getSystemTheme();
}

// Create theme store
function createThemeStore() {
  const { subscribe, set } = writable<Theme>(getInitialTheme());

  return {
    subscribe,
    
    // Set theme and persist to localStorage
    setTheme(theme: Theme) {
      if (browser) {
        localStorage.setItem(THEME_KEY, theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
      set(theme);
    },

    // Toggle between light and dark
    toggle() {
      const current = getInitialTheme();
      const newTheme = current === 'light' ? 'dark' : 'light';
      this.setTheme(newTheme);
    },

    // Initialize theme on app load
    init() {
      if (!browser) return;
      
      const theme = getInitialTheme();
      document.documentElement.setAttribute('data-theme', theme);
      set(theme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const stored = localStorage.getItem(THEME_KEY);
        if (!stored) {
          // Only update if user hasn't set a preference
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      
      // Return cleanup function
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  };
}

export const theme = createThemeStore();
