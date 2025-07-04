// API-based seeding script for E2E tests
// This script uses the actual API endpoints to create test data
//
// CONFIGURATION:
// Modify SEED_CONFIG below to enable/disable different types of seeding:
// - CLEAR_DATA: Clear existing test data before seeding
// - CREATE_CHARACTER: Create a test character with backstory and goals
// - CREATE_STATS: Create basic test stats (Fitness, Learning, Creativity)
// - ADD_INITIAL_XP: Grant some initial XP to stats
// - CREATE_ADVANCED_STATS: Create additional predefined stats from the backend
// - LEVEL_UP_STATS: Grant enough XP for some stats to be ready for level up
//
// USAGE:
// - Run directly: `bun run frontend/tests/e2e/seed-data.ts`
// - Import functions: `import { createTestStats, addXpToStats } from './seed-data.ts'`

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

async function createTestCharacter(authToken: string) {
	console.log('Creating test character...');

	const characterData = {
		name: 'Test Hero',
		characterClass: 'Adventurer',
		backstory: 'A brave soul on a quest for self-improvement and personal growth.',
		goals: 'Master new skills, build healthy habits, and level up in life.',
		motto: 'Progress over perfection!'
	};

	const result = await apiRequest('/api/characters', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${authToken}`
		},
		body: JSON.stringify(characterData)
	});

	if (result.success) {
		console.log('✅ Test character created successfully');
		return result.data;
	} else if (result.error?.includes('already has a character')) {
		console.log('Character already exists, continuing...');
		// Get existing character
		const getResult = await apiRequest('/api/characters', {
			headers: {
				'Authorization': `Bearer ${authToken}`
			}
		});
		if (getResult.success) {
			return getResult.data;
		}
	} else {
		console.error(`❌ Failed to create character: ${result.error}`);
		throw new Error(`Failed to create test character: ${result.error}`);
	}
}

async function createTestStats(authToken: string) {
	console.log('Creating test stats...');

	const testStats = [
		{
			name: 'Fitness',
			description: 'Physical health and strength - the foundation of a strong body and mind.',
			exampleActivities: [
				{ description: 'Complete a 30-minute workout', suggestedXp: 25 },
				{ description: 'Go for a 2-mile run', suggestedXp: 30 },
				{ description: 'Do 50 pushups', suggestedXp: 20 },
				{ description: 'Attend a fitness class', suggestedXp: 35 }
			]
		},
		{
			name: 'Learning',
			description: 'Continuous education and skill development across all areas of life.',
			exampleActivities: [
				{ description: 'Read for 1 hour', suggestedXp: 20 },
				{ description: 'Complete an online course module', suggestedXp: 35 },
				{ description: 'Practice a new skill for 30 minutes', suggestedXp: 25 },
				{ description: 'Watch an educational video', suggestedXp: 15 }
			]
		},
		{
			name: 'Creativity',
			description: 'Artistic expression and innovative thinking to fuel imagination.',
			exampleActivities: [
				{ description: 'Work on a creative project', suggestedXp: 30 },
				{ description: 'Write for 30 minutes', suggestedXp: 25 },
				{ description: 'Draw or sketch something', suggestedXp: 20 },
				{ description: 'Learn a creative skill', suggestedXp: 35 }
			]
		}
	];

	const createdStats = [];

	for (const stat of testStats) {
		const result = await apiRequest('/api/stats', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${authToken}`
			},
			body: JSON.stringify(stat)
		});

		if (result.success) {
			console.log(`✅ Created stat: ${stat.name}`);
			createdStats.push(result.data);
		} else {
			console.log(`⚠️ Could not create stat ${stat.name}: ${result.error}`);
		}
	}

	return createdStats;
}

// Configuration flags for what to seed
const SEED_CONFIG = {
	CLEAR_DATA: true,
	CREATE_CHARACTER: true,
	CREATE_STATS: true,
	ADD_INITIAL_XP: true,
	CREATE_ADVANCED_STATS: false, // Create additional predefined stats
	LEVEL_UP_STATS: false // Grant enough XP for level ups
};

async function createAdvancedStats(authToken: string) {
	console.log('Creating advanced test stats...');

	// Use some predefined stats for variety
	const predefinedStatsResult = await apiRequest('/api/stats/predefined');
	
	if (!predefinedStatsResult.success) {
		console.log('⚠️ Could not fetch predefined stats, creating custom ones');
		return [];
	}

	const predefinedStats = predefinedStatsResult.data;
	const statsToCreate = predefinedStats.slice(0, 3); // Get first 3 predefined stats

	const createdStats = [];

	for (const stat of statsToCreate) {
		const result = await apiRequest('/api/stats', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${authToken}`
			},
			body: JSON.stringify(stat)
		});

		if (result.success) {
			console.log(`✅ Created advanced stat: ${stat.name}`);
			createdStats.push(result.data);
		} else {
			console.log(`⚠️ Could not create advanced stat ${stat.name}: ${result.error}`);
		}
	}

	return createdStats;
}

async function levelUpStats(authToken: string, stats: any[]) {
	console.log('Granting enough XP for level ups...');

	const levelUpGrants = [
		{
			statName: 'Fitness',
			xpAmount: 250, // 50 (already has) + 250 = 300 total (enough for Level 2)
			reason: 'Completed an intense month-long fitness challenge'
		},
		{
			statName: 'Learning',
			xpAmount: 560, // 40 (already has) + 560 = 600 total (enough for Level 3)
			reason: 'Finished a comprehensive online course with certification'
		}
	];

	for (const grant of levelUpGrants) {
		const stat = stats.find(s => s.name === grant.statName);
		if (!stat) {
			console.log(`⚠️ Stat ${grant.statName} not found, skipping level up XP grant`);
			continue;
		}

		const result = await apiRequest(`/api/stats/${stat.id}/xp`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${authToken}`
			},
			body: JSON.stringify({
				statId: stat.id,
				xpAmount: grant.xpAmount,
				sourceType: 'quest',
				reason: grant.reason
			})
		});

		if (result.success) {
			console.log(`✅ Granted ${grant.xpAmount} XP to ${grant.statName} (ready for level up!)`);
		} else {
			console.log(`⚠️ Could not grant level up XP to ${grant.statName}: ${result.error}`);
		}
	}
}

async function addXpToStats(authToken: string, stats: any[]) {
	console.log('Adding XP to test stats...');

	const xpGrants = [
		{
			statName: 'Fitness',
			xpAmount: 50,
			reason: 'Completed morning workout routine with cardio and strength training'
		},
		{
			statName: 'Learning',
			xpAmount: 40,
			reason: 'Read a chapter from a programming book and took notes'
		},
		{
			statName: 'Creativity',
			xpAmount: 35,
			reason: 'Worked on a personal art project for 45 minutes'
		}
	];

	for (const grant of xpGrants) {
		const stat = stats.find(s => s.name === grant.statName);
		if (!stat) {
			console.log(`⚠️ Stat ${grant.statName} not found, skipping XP grant`);
			continue;
		}

		const result = await apiRequest(`/api/stats/${stat.id}/xp`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${authToken}`
			},
			body: JSON.stringify({
				statId: stat.id,
				xpAmount: grant.xpAmount,
				sourceType: 'adhoc',
				reason: grant.reason
			})
		});

		if (result.success) {
			console.log(`✅ Granted ${grant.xpAmount} XP to ${grant.statName}`);
		} else {
			console.log(`⚠️ Could not grant XP to ${grant.statName}: ${result.error}`);
		}
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

		// Clear existing data (if enabled)
		if (SEED_CONFIG.CLEAR_DATA) {
			await clearExistingData(authToken);
			console.log('✅ Existing data cleared');
		}

		let character;
		// Create test character (if enabled)
		if (SEED_CONFIG.CREATE_CHARACTER) {
			character = await createTestCharacter(authToken);
			console.log('✅ Test character created');
		}

		let stats = [];
		// Create test stats (if enabled)
		if (SEED_CONFIG.CREATE_STATS) {
			stats = await createTestStats(authToken);
			console.log('✅ Test stats created');
		}

		// Create additional advanced stats (if enabled)
		if (SEED_CONFIG.CREATE_ADVANCED_STATS) {
			const advancedStats = await createAdvancedStats(authToken);
			stats = [...stats, ...advancedStats];
			console.log('✅ Advanced stats created');
		}

		// Add some initial XP to stats (if enabled)
		if (SEED_CONFIG.ADD_INITIAL_XP && stats.length > 0) {
			await addXpToStats(authToken, stats);
			console.log('✅ Initial XP granted to stats');
		}

		// Grant enough XP for level ups (if enabled)
		if (SEED_CONFIG.LEVEL_UP_STATS && stats.length > 0) {
			await levelUpStats(authToken, stats);
			console.log('✅ Level-up XP granted to stats');
		}

		console.log('🎉 Test data seeding completed successfully!');
		console.log(`📊 Summary: ${character ? '1 character' : 'No character'}, ${stats.length} stats`);
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

// Export functions for use in tests or other scripts
export { 
	seedTestDataViaAPI,
	createTestUser,
	createTestCharacter,
	createTestStats,
	createAdvancedStats,
	addXpToStats,
	levelUpStats,
	clearExistingData,
	SEED_CONFIG
};
