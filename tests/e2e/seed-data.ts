// API-based seeding script for E2E tests
// This script uses the actual API endpoints to create test data

import { TEST_CONFIG } from './test-config';

const API_BASE_URL = TEST_CONFIG.API_BASE_URL;

interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
}

async function apiRequest<T = any>(
	endpoint: string,
	options: RequestInit = {}
): Promise<ApiResponse<T>> {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: options.method || 'GET',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			body: options.body
		});

		if (!response.ok) {
			const errorText = await response.text();
			return { success: false, error: `HTTP ${response.status}: ${errorText}` };
		}

		const data = await response.json();
		return { success: true, data };
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

async function createTestUser() {
	console.log('Creating test user...');

	// First try to register the user
	const result = await apiRequest('/api/users', {
		method: 'POST',
		body: JSON.stringify({
			name: TEST_CONFIG.USER.username,
			email: TEST_CONFIG.USER.email,
			password: TEST_CONFIG.USER.password
		})
	});

	let userData;

	if (result.success) {
		console.log('✅ Test user created successfully');
		userData = result.data;
	} else if (result.error?.includes('already exists') || result.error?.includes('already in use')) {
		console.log('User already exists, trying to login...');
		// Try to login to verify credentials work
		const loginResult = await apiRequest('/api/users/login', {
			method: 'POST',
			body: JSON.stringify({
				email: TEST_CONFIG.USER.email,
				password: TEST_CONFIG.USER.password
			})
		});

		if (loginResult.success) {
			console.log('✅ Test user exists and credentials work');
			userData = loginResult.data;
		} else {
			throw new Error(`Failed to login with existing user: ${loginResult.error}`);
		}
	} else {
		throw new Error(`Failed to create test user: ${result.error}`);
	}

	return userData;
}

async function clearExistingData(authToken: string) {
	console.log('Clearing existing test data...');

	try {
		const response = await fetch(`${API_BASE_URL}/api/test/cleanup`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
				// Optionally add an auth header if you want extra security
				// 'Authorization': `Bearer ${authToken}`
			}
		});
		if (!response.ok) throw new Error(`Cleanup failed: ${response.statusText}`);
		console.log('✅ Existing data cleared');
	} catch (error) {
		console.log('⚠️ Could not clear all existing data, continuing...');
	}
}

async function seedTestDataViaAPI() {
	console.log('🌱 Seeding test data via API...');

	try {
		// Create test admin user and get auth token
		const userResult = await createTestUser();
		const authToken = userResult.token || userResult.accessToken;

		if (!authToken) {
			throw new Error('No auth token received from user creation/login');
		}

		// Clear existing data
		await clearExistingData(authToken);
		console.log('✅ Existing data cleared');
	} catch (error) {
		console.error('❌ Error seeding test data:', error);
		throw error;
	}
}

// Run seeding if called directly
if (import.meta.main) {
	await seedTestDataViaAPI();
	process.exit(0);
}

export { seedTestDataViaAPI };
