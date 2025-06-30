// Shared constants for E2E tests
// This file contains all the test credentials, URLs, and configuration

export const TEST_CONFIG = {
	// API Configuration
	API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
	FRONTEND_BASE_URL: process.env.BASE_URL || 'http://localhost:4173',

	// Database Configuration
	DATABASE_URL: 'postgresql://test:test@localhost:5433/example_app',
	JWT_SECRET: 'test-secret-at-least-32-chars-long',

	// Test User Credentials
	USER: {
		email: 'user@example.com',
		password: 'password123',
		username: 'testuser'
	},

	// Test Timeouts
	TIMEOUTS: {
		LOGIN: 10000,
		PAGE_LOAD: 15000,
		API_REQUEST: 10000,
		ELEMENT_VISIBLE: 5000
	}
} as const;

// Type definitions for test users
export type TestUser = typeof TEST_CONFIG.USER;
