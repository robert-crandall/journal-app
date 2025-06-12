import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { toneTag } from './schema.js';

// Load environment variables from .env for the seed script
import { config } from 'dotenv';
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

const defaultToneTags = [
	'overwhelmed',
	'calm',
	'frustrated',
	'excited',
	'anxious',
	'content',
	'motivated',
	'tired',
	'focused',
	'scattered',
	'hopeful',
	'discouraged',
	'energized',
	'peaceful',
	'stressed',
	'confident',
	'uncertain',
	'grateful',
	'irritated',
	'accomplished'
];

export async function seedToneTags() {
	console.log('Seeding tone tags...');
	
	try {
		for (const tagName of defaultToneTags) {
			await db.insert(toneTag).values({
				name: tagName
			}).onConflictDoNothing();
		}
		
		console.log('✅ Tone tags seeded successfully');
	} catch (error) {
		console.error('❌ Error seeding tone tags:', error);
		throw error;
	}
}

export async function runSeeds() {
	await seedToneTags();
}

// Run seeds if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runSeeds().catch(console.error);
}
