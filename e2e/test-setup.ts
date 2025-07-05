import { test as base } from '@playwright/test';

// Simple re-export of test with no modifications for now
// Database setup will be handled in global setup
export const test = base;
export { expect } from '@playwright/test';
