import { writable } from 'svelte/store'
import { browser } from '$app/environment'

type Theme = 'light' | 'dark' | 'system'

function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>('system')

  // Initialize theme from localStorage if in browser
  if (browser) {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      set(stored)
    }
  }

  function setTheme(theme: Theme) {
    if (browser) {
      localStorage.setItem('theme', theme)
      applyTheme(theme)
    }
    set(theme)
  }

  function applyTheme(theme: Theme) {
    if (!browser) return

    const root = document.documentElement
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }

  // Listen for system theme changes
  if (browser) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      const currentTheme = localStorage.getItem('theme') as Theme | null
      if (currentTheme === 'system' || !currentTheme) {
        applyTheme('system')
      }
    })

    // Apply initial theme
    const initialTheme = (localStorage.getItem('theme') as Theme) || 'system'
    applyTheme(initialTheme)
  }

  return {
    subscribe,
    setTheme,
    toggle: () => update(current => {
      const newTheme = current === 'light' ? 'dark' : 'light'
      setTheme(newTheme)
      return newTheme
    })
  }
}

export const theme = createThemeStore()
