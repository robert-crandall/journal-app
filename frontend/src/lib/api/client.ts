import { hc } from '@hono/hc'
// Note: We'll use 'any' type until backend types are properly exported
// import type { AppType } from '../../../backend/src/index'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = hc<any>(API_BASE_URL)

// Helper function for handling API responses
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }
  
  const result = await response.json()
  
  if ('success' in result && !result.success) {
    throw new Error(result.error || 'Operation failed')
  }
  
  return result.data || result
}
