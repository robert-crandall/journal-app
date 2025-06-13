// General utility functions
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'

// Tailwind CSS class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const dateUtils = {
  // Format date for display
  formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      if (!isValid(dateObj)) return 'Invalid date'
      return format(dateObj, formatStr)
    } catch {
      return 'Invalid date'
    }
  },

  // Format date for datetime-local input
  formatForInput(date: string | Date): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      if (!isValid(dateObj)) return ''
      return format(dateObj, "yyyy-MM-dd'T'HH:mm")
    } catch {
      return ''
    }
  },

  // Get relative time
  getRelativeTime(date: string | Date): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      if (!isValid(dateObj)) return 'Unknown time'
      
      const now = new Date()
      const diffInMs = now.getTime() - dateObj.getTime()
      const diffInHours = diffInMs / (1000 * 60 * 60)
      const diffInDays = diffInHours / 24

      if (diffInHours < 1) {
        const minutes = Math.floor(diffInMs / (1000 * 60))
        return minutes < 1 ? 'Just now' : `${minutes} minutes ago`
      } else if (diffInDays < 1) {
        return `${Math.floor(diffInHours)} hours ago`
      } else if (diffInDays < 7) {
        return `${Math.floor(diffInDays)} days ago`
      } else {
        return this.formatDate(dateObj)
      }
    } catch {
      return 'Unknown time'
    }
  }
}

// Text utilities
export const textUtils = {
  // Truncate text with ellipsis
  truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  },

  // Convert text to title case
  toTitleCase(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  },

  // Generate initials from name
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  },

  // Count words in text
  countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }
}

// Array utilities
export const arrayUtils = {
  // Group array by key
  groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  // Remove duplicate items
  unique<T>(array: T[], keyFn?: (item: T) => any): T[] {
    if (!keyFn) {
      return Array.from(new Set(array))
    }
    
    const seen = new Set()
    return array.filter(item => {
      const key = keyFn(item)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }
}

// Local storage utilities with error handling
export const storageUtils = {
  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },

  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
      return defaultValue
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }
}

// Theme utilities
export const themeUtils = {
  getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  },

  applyTheme(theme: 'light' | 'dark' | 'dracula'): void {
    document.documentElement.setAttribute('data-theme', theme)
  }
}
