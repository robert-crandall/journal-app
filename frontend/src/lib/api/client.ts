import { hc } from 'hono/client'
// Import types directly from backend for proper type safety
import type { AppType } from '../../../../backend/src/index'

// API Base URL - use environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Create the typed Hono client following RPC best practices
export const api = hc<AppType>(API_BASE_URL)

// TEMPORARY: Fallback to simple fetch calls while debugging RPC issues
export const apiSimple = {
  journal: {
    status: {
      get: async (userId: string) => {
        const url = `${API_BASE_URL}/api/journal/status?userId=${userId}`
        console.log('Making status request to:', url)
        const response = await fetch(url)
        console.log('Status response status:', response.status, 'url:', response.url)
        return response
      }
    },
    'quick-start': {
      post: async (data: { userId: string }) => {
        const response = await fetch(`${API_BASE_URL}/api/journal/quick-start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        return response
      }
    },
    'quick-continue': {
      get: async (userId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/journal/quick-continue?userId=${userId}`)
        return response
      }
    },
    conversations: {
      messages: {
        post: async (conversationId: string, data: { userId: string, content: string, role: string }) => {
          const response = await fetch(`${API_BASE_URL}/api/journal/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          return response
        }
      },
      end: {
        put: async (conversationId: string, data: { userId: string }) => {
          const response = await fetch(`${API_BASE_URL}/api/journal/conversations/${conversationId}/end`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          return response
        }
      }
    }
  }
}

// Type-safe API call wrapper with error handling
export async function apiCall<T>(
  apiPromise: Promise<Response>
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await apiPromise
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { 
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}` 
      }
    }
    
    const data = await response.json()
    return { data }
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export default api
