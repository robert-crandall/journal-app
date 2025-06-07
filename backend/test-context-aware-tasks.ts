/**
 * Simple test script to verify context-aware task generation functionality
 * This can be run with: node -r ts-node/register test-context-aware-tasks.ts
 */

import { getEnvironmentalContext } from './src/utils/weatherService';

async function testEnvironmentalContext() {
  console.log('Testing Environmental Context Generation...\n');
  
  // Test with location description only
  console.log('Test 1: Location description only');
  const context1 = await getEnvironmentalContext('Seattle area');
  console.log('Result:', JSON.stringify(context1, null, 2));
  console.log();
  
  // Test with zip code
  console.log('Test 2: With zip code (mock weather)');
  const context2 = await getEnvironmentalContext('Seattle area', '98101');
  console.log('Result:', JSON.stringify(context2, null, 2));
  console.log();
  
  // Test with no location data
  console.log('Test 3: No location data');
  const context3 = await getEnvironmentalContext();
  console.log('Result:', JSON.stringify(context3, null, 2));
  console.log();
  
  console.log('Environmental context generation working correctly!');
}

// Only run if this file is executed directly
if (require.main === module) {
  testEnvironmentalContext().catch(console.error);
}

export { testEnvironmentalContext };