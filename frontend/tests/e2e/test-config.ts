// Shared constants for E2E tests
// This file contains all the test credentials, URLs, and configuration

export const TEST_CONFIG = {
	// API Configuration
	API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
	FRONTEND_BASE_URL: process.env.BASE_URL || 'http://localhost:5173',

	// Database Configuration
	DATABASE_URL: 'postgresql://test:test@localhost:5434/journal_app',
	JWT_SECRET: 'test-secret-at-least-32-chars-long',

	// Test User Data
	TEST_USER: {
		id: 'b8a9c1e2-f3d4-5e6f-7a8b-9c0d1e2f3a4b',
		email: 'test@example.com',
		name: 'Test User',
		isAdmin: false
	},

	// Test Character Data
	TEST_CHARACTER: {
		name: 'Test Hero',
		level: 5,
		totalXp: 1250,
		class: 'Warrior'
	},

	// Test Journal Data
	TEST_JOURNAL_MESSAGES: [
		{
			role: 'assistant',
			content: 'Welcome to your journal! How has your day been so far? What would you like to explore today?'
		},
		{
			role: 'user',
			content: 'Today was really productive. I finished a big project at work and feel accomplished.'
		},
		{
			role: 'assistant',
			content: 'That sounds fantastic! Completing a big project is such a rewarding feeling. What aspects of the project challenged you the most, and how did you overcome those challenges?'
		},
		{
			role: 'user',
			content: 'The biggest challenge was coordinating with multiple team members across different time zones.'
		}
	],

	// Test Timeouts
	TIMEOUTS: {
		LOGIN: 10000,
		PAGE_LOAD: 15000,
		API_REQUEST: 10000,
		ELEMENT_VISIBLE: 5000
	}
} as const;

// Type definitions for test data
export type TestUser = typeof TEST_CONFIG.TEST_USER;
export type TestCharacter = typeof TEST_CONFIG.TEST_CHARACTER;
export type TestMessage = typeof TEST_CONFIG.TEST_JOURNAL_MESSAGES[0];
