// Shared constants for E2E tests
// This file contains all the test credentials, URLs, and configuration

export const TEST_CONFIG = {
  // API Configuration
  FRONTEND_BASE_URL: process.env.BASE_URL || 'http://localhost:4173',
  PORT: process.env.PORT || 3001,
  API_BASE_URL: `http://localhost:${process.env.PORT || 3001}`,

  // Test User Credentials
  USER: {
    email: 'user@example.com',
    password: 'password123',
    username: 'testuser',
  },

  // Test Timeouts
  TIMEOUTS: {
    LOGIN: 10000,
    PAGE_LOAD: 15000,
    API_REQUEST: 10000,
    ELEMENT_VISIBLE: 5000,
  },
} as const;

// Type definitions for test users
export type TestUser = typeof TEST_CONFIG.USER;
