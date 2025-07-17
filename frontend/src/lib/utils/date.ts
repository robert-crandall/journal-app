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
  return formatDateTime(dateString, 'date-only');
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
  format: 'default' | 'short' | 'medium' | 'full' | 'time-only' | 'date-only' | 'journal' = 'default',
): string {
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
      date = new Date(value);
    } else {
      return 'Invalid date';
    }
  } else {
    return 'Invalid date';
  }

  if (isNaN(date.getTime())) {
    console.warn('formatDateTime: Invalid datetime value:', value);
    return 'Invalid date';
  }

  // Special case for YYYY-MM-DD format
  if (format === 'journal') {
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
 * Get the current datetime in a specified timezone and format
 *
 * @param format - Format type ('default', 'short', 'medium', 'full', 'time-only', 'date-only', 'yyyy-mm-dd')
 * @param dateTimeObj - Date object to format (default: current date)
 * @returns Formatted current datetime string
 */
export function getNowDateTimeString(
  format: 'default' | 'short' | 'medium' | 'full' | 'time-only' | 'date-only' | 'yyyy-mm-dd' = 'default',
  dateTimeObj?: Date,
): string {
  const now = dateTimeObj ?? new Date();

  // Special case for YYYY-MM-DD format
  if (format === 'yyyy-mm-dd') {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
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
