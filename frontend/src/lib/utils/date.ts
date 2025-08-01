/**
 * Date utilities for handling date-only and datetime fields correctly
 *
 * This module provides functions to handle dates without timezone conversion issues.
 * Use these utilities instead of direct Date constructors for date-only fields.
 */

/**
 * Format a date-only string (YYYY-MM-DD) for display without timezone conversion
 * Used when wanting to display dates in a user-friendly format
 *
 * @param dateString - Date string in YYYY-MM-DD format (e.g., "1990-01-15")
 * @returns Formatted date string (e.g., "Jan 15, 1990") or "Not set" if null/empty
 */
export function formatDate(dateString: string | null): string {
  return formatDateTime(dateString, 'date-only');
}

/**
 * Parses a date string or Date object into a Date object, handling various formats
 *
 * @param value - Date or DateTime string in YYYY-MM-DD format (e.g., "1990-01-15"), ISO format, or Date object
 * @returns Date object representing the parsed date
 */
export function parseDateTime(value?: string | Date | null): Date {
  let date: Date;

  if (value === undefined || value === null) {
    date = new Date();
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // YYYY-MM-DD: parse manually to avoid timezone issues
      const [year, month, day] = value.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(value) || value.includes('T')) {
      // ISO string: use Date constructor
      // eslint-disable-next-line custom/no-direct-date-conversion
      date = new Date(value);
    } else {
      return new Date('Invalid date'); // Invalid format
    }
  } else {
    return new Date('Invalid date'); // Not a string or Date
  }

  if (isNaN(date.getTime())) {
    console.warn('formatDateTime: Invalid datetime value:', value);
    return new Date('Invalid date');
  }

  return date;
}

/**
 * Format a datetime ISO string with proper timezone handling
 *
 * @param format - Format type ('default', 'short', 'medium', 'full', 'time-only', 'date-only')
 * @param value - ISO datetime string (e.g., "2023-05-20T15:30:00Z") or DateObject
 * @returns Formatted datetime string
 */
export function formatDateTime(
  value?: string | Date | null,
  format: 'default' | 'short' | 'medium' | 'full' | 'time-only' | 'date-only' | 'yyyy-mm-dd' = 'default',
): string {
  const date = parseDateTime(value);

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid date';
  }

  // Special case for YYYY-MM-DD format
  if (format === 'yyyy-mm-dd') {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    return new Intl.DateTimeFormat('en-CA', options).format(date);
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

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Get the current date in YYYY-MM-DD format (for date input fields), timezone-aware
 * Used to generate consistent date strings for Experiments and Journals
 *
 * @param timezone - IANA timezone string (e.g., 'UTC', 'America/New_York'). If not provided, uses browser timezone.
 * @returns Today's date in YYYY-MM-DD format for the specified timezone
 */
export function getTodayDateString(): string {
  return formatDateTime(new Date(), 'yyyy-mm-dd');
}
