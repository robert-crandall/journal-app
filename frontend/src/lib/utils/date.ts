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
 * Format a date-only string in a custom format
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @param format - Format type ('short', 'long', 'numeric')
 * @returns Formatted date string
 */
export function formatDateCustom(dateString: string | null, format: 'short' | 'long' | 'numeric' = 'short'): string {
  if (!dateString) return 'Not set';

  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.warn('formatDateCustom: Invalid date format, expected YYYY-MM-DD:', dateString);
    return 'Invalid date';
  }

  // Parse the date components manually to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);

  // Create date in local timezone without any UTC conversion using the correct
  // approach for date-only fields - creating with explicit components rather than string parsing
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    numeric: { year: 'numeric', month: '2-digit', day: '2-digit' },
  };

  return date.toLocaleDateString('en-US', formatOptions[format]);
}

/**
 * Get the current date in YYYY-MM-DD format (for date input fields)
 *
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  // Get the current date components
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Create date string in YYYY-MM-DD format without using Date object
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string is a valid YYYY-MM-DD format
 *
 * @param dateString - The date string to validate
 * @returns True if valid YYYY-MM-DD format
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  // Create date using explicit components to avoid timezone issues
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  // Check if the date is valid and matches the input
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
