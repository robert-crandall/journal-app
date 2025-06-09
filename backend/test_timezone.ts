#!/usr/bin/env bun

/**
 * Simple test script to validate timezone functionality
 */

import { getTodayInTimezone, getDayOfWeekInTimezone, isValidTimezone } from './src/utils/timezone';

function testTimezoneUtils() {
  console.log('Testing timezone utilities...\n');

  // Test 1: Valid timezone
  console.log('Test 1: Valid timezone (America/New_York)');
  const todayEST = getTodayInTimezone('America/New_York');
  const dayEST = getDayOfWeekInTimezone('America/New_York');
  console.log(`Today in EST: ${todayEST}`);
  console.log(`Day of week in EST: ${dayEST}`);
  console.log('');

  // Test 2: Different timezone
  console.log('Test 2: Different timezone (Asia/Tokyo)');
  const todayJST = getTodayInTimezone('Asia/Tokyo');
  const dayJST = getDayOfWeekInTimezone('Asia/Tokyo');
  console.log(`Today in JST: ${todayJST}`);
  console.log(`Day of week in JST: ${dayJST}`);
  console.log('');

  // Test 3: Invalid timezone (should fallback)
  console.log('Test 3: Invalid timezone');
  const todayInvalid = getTodayInTimezone('Invalid/Timezone');
  const dayInvalid = getDayOfWeekInTimezone('Invalid/Timezone');
  console.log(`Today with invalid timezone: ${todayInvalid}`);
  console.log(`Day of week with invalid timezone: ${dayInvalid}`);
  console.log('');

  // Test 4: Null timezone (should fallback)
  console.log('Test 4: Null timezone');
  const todayNull = getTodayInTimezone(null);
  const dayNull = getDayOfWeekInTimezone(null);
  console.log(`Today with null timezone: ${todayNull}`);
  console.log(`Day of week with null timezone: ${dayNull}`);
  console.log('');

  // Test 5: Timezone validation
  console.log('Test 5: Timezone validation');
  console.log(`Is "America/New_York" valid? ${isValidTimezone('America/New_York')}`);
  console.log(`Is "Invalid/Timezone" valid? ${isValidTimezone('Invalid/Timezone')}`);
  console.log('');

  console.log('All tests completed successfully!');
}

// Run tests
testTimezoneUtils();