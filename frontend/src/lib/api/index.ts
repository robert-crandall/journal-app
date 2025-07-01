import { hc } from 'hono/client';
import { browser } from '$app/environment';

// API client configuration - get the URL from environment variables
const API_BASE_URL = browser ? 
  (import.meta.env['VITE_API_URL'] || 'http://localhost:3000') : 
  'http://localhost:3000';

// Create Hono client instance
// Note: We use 'any' type for now since we don't have the backend AppType exported yet
// This will be replaced with proper typing in Task 4.0
export const api = hc<any>(API_BASE_URL);
