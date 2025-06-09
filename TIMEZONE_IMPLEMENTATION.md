# Timezone Support Implementation Summary

## Problem
All date fields, such as journal date and task date, should support the user's time zone when calculating the date. In particular, `getOrGenerateTodaysTask` should pull the user's time zone, and use that to determine what date is used for tasks.

## Solution Implemented

### 1. Database Schema Changes
- Added `timezone` field to `preferences` table
- Generated migration file: `0020_warm_freak.sql`
- Field stores IANA timezone identifiers (e.g., "America/New_York")

### 2. Backend Timezone Utilities (`src/utils/timezone.ts`)
- `getTodayInTimezone(timezone)`: Gets current date in user's timezone as YYYY-MM-DD
- `getDayOfWeekInTimezone(timezone)`: Gets current day of week in user's timezone  
- `isValidTimezone(timezone)`: Validates timezone strings
- `getCommonTimezones()`: Returns list of common timezones for UI
- Graceful fallback to UTC for invalid/null timezones

### 3. Updated Core Functions
**`getOrGenerateTodaysTask()`**:
- Now fetches user's timezone preference first
- Uses `getTodayInTimezone()` to determine "today" based on user's location
- Passes timezone to all related functions

**`getTodaysStats()`**:
- Updated to accept timezone parameter
- Uses `getDayOfWeekInTimezone()` for day-of-week based stat filtering

**`markOldGptTasksAsSkipped()`**:
- Updated to use user's timezone for determining which tasks are "old"

### 4. Route Handler Updates
All route handlers updated to use timezone-aware date calculations:
- **tasks.ts**: `getActivePotions()` helper function
- **journals.ts**: Journal creation and `getActivePotions()` helper
- **potions.ts**: Potion creation and ending dates
- **adhocTasks.ts**: `getActivePotions()` helper function
- **preferences.ts**: Added timezone to valid preference keys

### 5. Frontend Changes (`src/routes/settings/+page.svelte`)
- Added timezone dropdown in Settings > Appearance tab
- 16 common timezone options included
- Integration with existing preferences API
- Clear description of timezone functionality

## Key Benefits
1. **Accurate Task Timing**: Daily tasks generate at the right time for each user
2. **Correct Day Assignment**: Stats assigned by day-of-week respect user's local time
3. **Proper Journal Dates**: Journal entries default to user's actual date
4. **A/B Testing Accuracy**: Potion date ranges work correctly across timezones
5. **Graceful Degradation**: Falls back to UTC if no timezone set or invalid timezone

## Testing
- Validated timezone utility functions work correctly
- Confirmed different timezones show different dates when crossing midnight
- Verified type checking passes
- Frontend builds successfully

## Files Modified
- `backend/src/db/schema.ts`
- `backend/src/utils/gptTaskGenerator.ts`
- `backend/src/routes/tasks.ts`
- `backend/src/routes/journals.ts`
- `backend/src/routes/potions.ts`
- `backend/src/routes/adhocTasks.ts`
- `backend/src/routes/preferences.ts`
- `frontend/src/routes/settings/+page.svelte`

## Migration Required
- Run `bun run db:migrate` to apply the timezone column to the preferences table

The implementation is complete and addresses the original issue comprehensively.