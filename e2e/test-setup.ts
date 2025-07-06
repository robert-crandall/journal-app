import { test as base } from '@playwright/test';

// Simple re-export of test with no modifications for now
// Database setup will be handled in global setup
export const test = base;
export { expect } from '@playwright/test';

export const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
};

export async function cleanupTestData() {
  // Family data cleanup will be handled through UI interactions
  // No direct database operations needed in tests
}
