/**
 * Date utilities for handling date-only and datetime fields correctly
 *
 * This module provides functions to handle dates without timezone conversion issues.
 * Use these utilities instead of direct Date constructors for date-only fields.
 */

/**
 * Format a date-only string (YYYY-MM-DD) for display without timezone conversion
 *
 * @param dateString - Date string in YYYY-MM-DD format (e.g., "1990-01-15")
 * @returns Formatted date string (e.g., "Jan 15, 1990") or "Not set" if null/empty
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not set';

  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.warn('formatDate: Invalid date format, expected YYYY-MM-DD:', dateString);
    return 'Invalid date';
  }

  // Parse the date components manually to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);

  // Create date in local timezone without any UTC conversion
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a datetime ISO string with proper timezone handling
 *
 * @param isoString - ISO datetime string (e.g., "2023-05-20T15:30:00Z")
 * @param format - Format type ('default', 'short', 'medium', 'full', 'time-only', 'date-only')
 * @param timezone - Timezone for display (default: 'local')
 * @returns Formatted datetime string
 */
export function formatDateTime(
  isoString: string,
  format: 'default' | 'short' | 'medium' | 'full' | 'time-only' | 'date-only' = 'default',
  timezone: string = 'local',
): string {
  if (!isoString) return 'Not set';

  // For ISO datetime strings, the Date constructor works correctly
  // eslint-disable-next-line custom/no-direct-date-conversion
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    console.warn('formatDateTime: Invalid datetime string:', isoString);
    return 'Invalid date';
  }

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    default: { dateStyle: 'medium', timeStyle: 'short' },
    short: { dateStyle: 'short', timeStyle: 'short' },
    medium: { dateStyle: 'medium', timeStyle: 'medium' },
    full: { dateStyle: 'full', timeStyle: 'long' },
    'time-only': { timeStyle: 'short' },
    'date-only': { dateStyle: 'medium' },
  };

  const options: Intl.DateTimeFormatOptions = { ...formatOptions[format] };

  if (timezone !== 'local') {
    options.timeZone = timezone;
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Get the current datetime in a specified timezone and format
 *
 * @param format - Format type ('default', 'short', 'medium', 'full', 'time-only', 'date-only', 'yyyy-mm-dd')
 * @param timezone - Timezone for display (default: 'local')
 * @returns Formatted current datetime string
 */
export function getNowDateTimeString(
  format: 'default' | 'short' | 'medium' | 'full' | 'time-only' | 'date-only' | 'yyyy-mm-dd' = 'default',
  timezone: string = 'local',
): string {
  const now = new Date();

  // Special case for YYYY-MM-DD format
  if (format === 'yyyy-mm-dd') {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    if (timezone !== 'local') {
      options.timeZone = timezone;
    }

    return new Intl.DateTimeFormat('en-CA', options).format(now);
  }

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    default: { dateStyle: 'medium', timeStyle: 'short' },
    short: { dateStyle: 'short', timeStyle: 'short' },
    medium: { dateStyle: 'medium', timeStyle: 'medium' },
    full: { dateStyle: 'full', timeStyle: 'long' },
    'time-only': { timeStyle: 'short' },
    'date-only': { dateStyle: 'medium' },
  };

  const options: Intl.DateTimeFormatOptions = { ...formatOptions[format] };

  if (timezone !== 'local') {
    options.timeZone = timezone;
  }

  return new Intl.DateTimeFormat('en-US', options).format(now);
}

/**
 * Get the current date in YYYY-MM-DD format (for date input fields), timezone-aware
 *
 * @param timezone - IANA timezone string (e.g., 'UTC', 'America/New_York'). If not provided, uses browser timezone.
 * @returns Today's date in YYYY-MM-DD format for the specified timezone
 */
export function getTodayDateString(): string {
  return getNowDateTimeString('yyyy-mm-dd');
}

/** Get the current date as a date object */
export function getToday(): Date {
  return new Date(getTodayDateString());
}
