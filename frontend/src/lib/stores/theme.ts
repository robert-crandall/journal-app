import { writable } from 'svelte/store'

export type Theme = 'light' | 'dark' | 'auto'

// Theme store
export const theme = writable<Theme>('auto')

// Apply theme to document
export function applyTheme(newTheme: Theme) {
  const root = document.documentElement
  
  if (newTheme === 'auto') {
    // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', newTheme === 'dark')
  }
  
  // Save preference
  localStorage.setItem('theme', newTheme)
  theme.set(newTheme)
}

// Initialize theme
export function initializeTheme() {
  if (typeof window === 'undefined') return
  
  const savedTheme = localStorage.getItem('theme') as Theme || 'auto'
  applyTheme(savedTheme)
  
  // Listen for system theme changes when in auto mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === 'auto') {
      document.documentElement.classList.toggle('dark', e.matches)
    }
  })
}

// Toggle between light and dark (skipping auto for manual toggle)
export function toggleTheme() {
  const currentTheme = localStorage.getItem('theme') as Theme || 'auto'
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  applyTheme(newTheme)
}
