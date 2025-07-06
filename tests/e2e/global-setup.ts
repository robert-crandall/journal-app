import { chromium, type FullConfig } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

async function waitForBackend(maxAttempts = 30, delayMs = 1000): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/health`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Backend not ready yet
    }

    console.log(`Waiting for backend... (attempt ${i + 1}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

async function runSeeding(): Promise<void> {
  // Import the seeding function
  const { seedTestDataViaAPI } = await import('./seed-data');
  await seedTestDataViaAPI();
}

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup starting...');

  // Wait for backend to be ready
  console.log('⏳ Waiting for backend to be ready...');
  const backendReady = await waitForBackend();

  if (!backendReady) {
    throw new Error('Backend failed to start within timeout period');
  }

  console.log('✅ Backend is ready');

  // Run seeding
  console.log('🌱 Seeding test data...');
  try {
    await runSeeding();
    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed test data:', error);
    throw error;
  }

  console.log('🎉 Global setup completed');
}

export default globalSetup;
