// API-based seeding script for E2E tests
// This script uses direct database operations to create test data for the journal app

import { TEST_CONFIG } from './test-config';

// Direct database seeding using SQL commands
// This approach bypasses API endpoints since the journal app doesn't have user creation APIs

async function executeSQL(query: string, params: any[] = []): Promise<any> {
	// This is a placeholder - in a real implementation, you'd use a database client
	// For now, we'll use the backend's database connection
	const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/test/execute-sql`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query, params })
	});
	
	if (!response.ok) {
		throw new Error(`SQL execution failed: ${response.statusText}`);
	}
	
	return response.json();
}

async function createTestUser() {
	console.log('Creating test user...');
	
	const testUser = TEST_CONFIG.TEST_USER;
	
	// Insert user into users table (no isAdmin field)
	const insertUserQuery = `
		INSERT INTO users (id, email, name, "created_at", "updated_at")
		VALUES ($1, $2, $3, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			email = EXCLUDED.email,
			name = EXCLUDED.name,
			"updated_at" = NOW()
		RETURNING *;
	`;
	
	try {
		const result = await executeSQL(insertUserQuery, [
			testUser.id,
			testUser.email,
			testUser.name
		]);
		
		console.log('✅ Test user created/updated successfully');
		return result.rows[0];
	} catch (error) {
		console.error('❌ Failed to create test user:', error);
		throw error;
	}
}

async function createTestCharacter(userId: string) {
	console.log('Creating test character...');
	
	const testCharacter = TEST_CONFIG.TEST_CHARACTER;
	
	// First create character (don't use ON CONFLICT since user_id is not unique)
	const insertCharacterQuery = `
		INSERT INTO characters (id, "user_id", name, class, "created_at", "updated_at")
		VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
		RETURNING *;
	`;
	
	try {
		const characterResult = await executeSQL(insertCharacterQuery, [
			userId,
			testCharacter.name,
			testCharacter.class
		]);
		
		const character = characterResult.rows[0];
		
		// Then create character stats for different categories
		const statCategories = [
			{ category: 'Strength', currentXp: 250, currentLevel: testCharacter.level },
			{ category: 'Intelligence', currentXp: 200, currentLevel: testCharacter.level - 1 },
			{ category: 'Charisma', currentXp: 300, currentLevel: testCharacter.level },
		];
		
		const createdStats = [];
		for (const stat of statCategories) {		const insertStatQuery = `
			INSERT INTO character_stats (id, "character_id", category, "current_xp", "current_level", "total_xp", "created_at", "updated_at")
			VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
			RETURNING *;
		`;
			
			const statResult = await executeSQL(insertStatQuery, [
				character.id,
				stat.category,
				stat.currentXp,
				stat.currentLevel,
				testCharacter.totalXp
			]);
			
			createdStats.push(statResult.rows[0]);
		}
		
		console.log('✅ Test character created/updated successfully');
		return {
			character,
			stats: createdStats
		};
	} catch (error) {
		console.error('❌ Failed to create test character:', error);
		throw error;
	}
}

async function createTestJournalConversation(userId: string) {
	console.log('Creating test journal conversation...');
	
	// Create a journal conversation
	const insertConversationQuery = `
		INSERT INTO journal_conversations (id, "user_id", "is_active", "created_at", "updated_at")
		VALUES (gen_random_uuid(), $1, false, NOW(), NOW())
		RETURNING *;
	`;
	
	try {
		const conversationResult = await executeSQL(insertConversationQuery, [userId]);
		const conversation = conversationResult.rows[0];
		
		// Add test messages to the conversation
		const messages = TEST_CONFIG.TEST_JOURNAL_MESSAGES;
		const createdMessages = [];
		
		for (let i = 0; i < messages.length; i++) {
			const message = messages[i];		const insertMessageQuery = `
			INSERT INTO journal_entries (id, "conversation_id", "user_id", content, role, "created_at")
			VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW() + INTERVAL '${i} minutes')
			RETURNING *;
		`;
			
			const messageResult = await executeSQL(insertMessageQuery, [
				conversation.id,
				userId,
				message.content,
				message.role
			]);
			
			createdMessages.push(messageResult.rows[0]);
		}
		
		console.log('✅ Test journal conversation created successfully');
		return {
			conversation,
			messages: createdMessages
		};
	} catch (error) {
		console.error('❌ Failed to create test journal conversation:', error);
		throw error;
	}
}

async function clearFamilyMemberTestData(userId: string) {	
	try {
		// Delete family member interactions first (foreign key dependency)
		await executeSQL('DELETE FROM family_member_interactions WHERE "family_member_id" IN (SELECT id FROM family_members WHERE "user_id" = $1)', [userId]);
		// Then delete family members
		await executeSQL('DELETE FROM family_members WHERE "user_id" = $1', [userId]);
	} catch (error) {
		console.log('⚠️ Could not clear family member data, continuing...');
	}
}

async function clearExistingTestData(userId: string) {
	console.log('Clearing existing test data...');
	
	try {
		// Delete in reverse order of dependencies
		await executeSQL('DELETE FROM journal_entries WHERE "user_id" = $1', [userId]);
		await executeSQL('DELETE FROM journal_conversations WHERE "user_id" = $1', [userId]);
		await executeSQL('DELETE FROM character_stats WHERE "character_id" IN (SELECT id FROM characters WHERE "user_id" = $1)', [userId]);
		await executeSQL('DELETE FROM characters WHERE "user_id" = $1', [userId]);
		
		// Delete family member data
		await executeSQL('DELETE FROM family_member_interactions WHERE "family_member_id" IN (SELECT id FROM family_members WHERE "user_id" = $1)', [userId]);
		await executeSQL('DELETE FROM family_members WHERE "user_id" = $1', [userId]);
		
		console.log('✅ Existing test data cleared');
	} catch (error) {
		console.log('⚠️ Could not clear all existing data, continuing...');
	}
}

async function seedTestDataViaAPI() {
	console.log('🌱 Seeding test data for journal app...');
	
	try {
		const testUser = TEST_CONFIG.TEST_USER;
		
		// Clear existing test data
		await clearExistingTestData(testUser.id);
		
		// Create test user
		const user = await createTestUser();
		console.log(`✅ Created user: ${user.email}`);
		
		// Create test character
		const { character, stats } = await createTestCharacter(testUser.id);
		console.log(`✅ Created character: ${character.name} with ${stats.length} stat categories`);
		
		// Create test journal conversation
		const { conversation, messages } = await createTestJournalConversation(testUser.id);
		console.log(`✅ Created journal conversation with ${messages.length} messages`);
		
		console.log('🎉 Test data seeded successfully!');
		console.log('📋 Summary:');
		console.log(`  - User: ${user.email} (ID: ${user.id})`);
		console.log(`  - Character: ${character.name} with ${stats.length} stat categories`);
		console.log(`  - Journal Conversation: ${conversation.id}`);
		console.log(`  - Journal Messages: ${messages.length}`);
		
		return {
			user,
			character,
			stats,
			conversation,
			messages
		};
	} catch (error) {
		console.error('❌ Error seeding test data:', error);
		throw error;
	}
}

// Run seeding if called directly
if (typeof require !== 'undefined' && require.main === module) {
	seedTestDataViaAPI().then(() => {
		process.exit(0);
	}).catch((error) => {
		console.error(error);
		process.exit(1);
	});
}

export { seedTestDataViaAPI, clearFamilyMemberTestData };
