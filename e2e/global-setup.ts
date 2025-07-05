import { execSync } from 'child_process';

async function globalSetup() {
	console.log('🧪 Setting up test environment...');

	// Set test environment
	process.env.NODE_ENV = 'test';

	// Setup test database
	try {
		console.log('🗄️  Setting up test database...');
		execSync('NODE_ENV=test tsx scripts/setup-db.ts --reset', {
			stdio: 'inherit',
			env: { ...process.env, NODE_ENV: 'test' }
		});
		console.log('✅ Test database setup complete');
	} catch (error) {
		console.error('❌ Failed to setup test database:', error);
		// Don't fail the tests if database setup fails in CI
		if (!process.env.CI) {
			throw error;
		}
	}
}

export default globalSetup;
