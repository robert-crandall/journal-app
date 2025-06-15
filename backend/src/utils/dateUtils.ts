import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

/**
 * Converts a local date to UTC considering the user's timezone
 * @param dateTime The date to convert
 * @param timezone The user's timezone (e.g., 'America/New_York')
 * @returns UTC date string in ISO format
 */
export function localToUTC(dateTime: Date, timezone: string): string {
  const utcDate = zonedTimeToUtc(dateTime, timezone);
  return utcDate.toISOString();
}

/**
 * Converts a UTC date to local time in the user's timezone
 * @param utcDateTime The UTC date to convert 
 * @param timezone The user's timezone (e.g., 'America/New_York')
 * @returns Date object in the user's local time
 */
export function utcToLocal(utcDateTime: Date | string, timezone: string): Date {
  const date = typeof utcDateTime === 'string' ? new Date(utcDateTime) : utcDateTime;
  return utcToZonedTime(date, timezone);
}

/**
 * Formats a date for display in the user's timezone
 * @param date The date to format
 * @param timezone The user's timezone
 * @param formatString The format pattern to use
 * @returns Formatted date string in the user's timezone
 */
export function formatDateInTimezone(
  date: Date | string, 
  timezone: string,
  formatString: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = utcToZonedTime(dateObj, timezone);
  return format(zonedDate, formatString, { timeZone: timezone });
}

/**
 * Parses a local date without timezone conversion
 * Used for date-only fields like birthdays
 * @param dateString The date string in YYYY-MM-DD format
 * @returns Date object representing the local date
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get current date in UTC ISO format
 * @returns Current UTC date as ISO string
 */
export function getCurrentUTC(): string {
  return new Date().toISOString();
}

/**
 * Get today's date in YYYY-MM-DD format in the user's timezone
 * @param timezone The user's timezone
 * @returns Today's date string
 */
export function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  const zonedDate = utcToZonedTime(now, timezone);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone });
}
