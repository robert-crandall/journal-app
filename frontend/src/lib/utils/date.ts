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
 * @param timezone - Timezone for display (default: 'local')
 * @returns Formatted datetime string
 */
export function formatDateTime(isoString: string, timezone: string = 'local'): string {
  if (!isoString) return 'Not set';

  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    console.warn('formatDateTime: Invalid datetime string:', isoString);
    return 'Invalid date';
  }

  const options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  };

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

  // Create date in local timezone without any UTC conversion
  const date = new Date(year, month - 1, day);

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
  const date = new Date(year, month - 1, day);

  // Check if the date is valid and matches the input
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
