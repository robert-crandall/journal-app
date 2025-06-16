import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Available daisyUI themes
export const THEMES = [
  'light',
  'dark', 
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset'
] as const;

export type Theme = typeof THEMES[number];

function createThemeStore() {
  const { subscribe, set } = writable<Theme>('light');

  return {
    subscribe,
    
    // Initialize theme from localStorage or system preference
    init: () => {
      if (!browser) return;
      
      const stored = localStorage.getItem('theme') as Theme;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const theme = stored || (prefersDark ? 'dark' : 'light');
      set(theme);
      document.documentElement.setAttribute('data-theme', theme);
    },

    // Set theme
    setTheme: (theme: Theme) => {
      if (!browser) return;
      
      set(theme);
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    },

    // Toggle between light and dark
    toggle: () => {
      if (!browser) return;
      
      const current = localStorage.getItem('theme') as Theme || 'light';
      const newTheme = current === 'light' ? 'dark' : 'light';
      
      set(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };
}

export const themeStore = createThemeStore();
