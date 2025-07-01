import { browser } from '$app/environment';

// Theme store using Svelte 5 runes
class ThemeStore {
  #theme = $state<'light' | 'dark'>('light');

  constructor() {
    // Initialize theme from localStorage or system preference
    if (browser) {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (saved) {
        this.#theme = saved;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.#theme = 'dark';
      }
      
      // Apply theme immediately
      this.applyTheme();
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('theme')) {
          this.#theme = e.matches ? 'dark' : 'light';
          this.applyTheme();
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
    }
  }

  get theme() {
    return this.#theme;
  }

  get isDark() {
    return this.#theme === 'dark';
  }

  get isLight() {
    return this.#theme === 'light';
  }

  setTheme(theme: 'light' | 'dark') {
    this.#theme = theme;
    if (browser) {
      localStorage.setItem('theme', theme);
      this.applyTheme();
    }
  }

  toggleTheme() {
    this.setTheme(this.#theme === 'light' ? 'dark' : 'light');
  }

  private applyTheme() {
    if (browser) {
      document.documentElement.setAttribute('data-theme', this.#theme);
      document.documentElement.classList.toggle('dark', this.#theme === 'dark');
    }
  }
}

export const themeStore = new ThemeStore();
