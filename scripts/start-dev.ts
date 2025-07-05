#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Kill processes using specified ports (macOS/Linux)
function killProcessesOnPorts(ports) {
	const { spawnSync } = require('child_process');
	ports.forEach((port) => {
		try {
			// lsof -ti tcp:<port> | xargs kill -9
			const lsof = spawnSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf-8' });
			const pids = lsof.stdout.split('\n').filter(Boolean);
			if (pids.length > 0) {
				spawnSync('kill', ['-9', ...pids]);
				console.log(`✅ Killed process(es) on port ${port}: ${pids.join(', ')}`);
			}
		} catch (e) {
			console.warn(`⚠️  Could not kill process on port ${port}:`, e.message);
		}
	});
}

// Use concurrently to run both services with combined logs
async function startDev() {
	console.log('🚀 Starting development environment...');
	console.log('📝 This will show logs from both backend and frontend');
	console.log('🔍 Press Ctrl+C to stop all services\n');

	// Check for --force flag
	if (process.argv.includes('--force')) {
		console.log('🛑 --force flag detected: Killing processes on ports 5173...');
		killProcessesOnPorts([5173]);
	}

	// Apply database migrations
	console.log('🗄️  Applying database migrations...');
	try {
		const { spawnSync } = require('child_process');
		const migrateResult = spawnSync('bun', ['run', 'db:migrate'], { stdio: 'inherit' });

		if (migrateResult.status === 0) {
			console.log('✅ Database schema pushed successfully\n');
		} else {
			console.warn('⚠️  Database migration failed, but continuing with server start...\n');
		}
	} catch (error) {
		console.warn('⚠️  Could not run database migrations:', error.message);
		console.warn('   Continuing with server start...\n');
	}

	// Start the development server
	console.log('🚀 Starting Vite development server...\n');
	const devServer = spawn('bun', ['vite', 'dev'], {
		stdio: 'inherit',
		shell: true
	});

	// Handle process termination
	process.on('SIGINT', () => {
		console.log('\n🛑 Shutting down development server...');
		devServer.kill('SIGINT');
		process.exit(0);
	});

	process.on('SIGTERM', () => {
		console.log('\n🛑 Terminating development server...');
		devServer.kill('SIGTERM');
		process.exit(0);
	});

	devServer.on('close', (code) => {
		console.log(`\n📊 Development server exited with code ${code}`);
		process.exit(code);
	});
}

startDev();
