import { hc } from '@hono/hc'

// We'll need to import the actual app type from the backend once available
// For now, we'll create a placeholder type structure

// API Base URL - use environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Create the typed Hono client
export const api = hc<any>(API_BASE_URL)

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
