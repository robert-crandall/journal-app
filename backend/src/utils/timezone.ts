/**
 * Timezone utility functions for handling user-specific date calculations
 */

/**
 * Get the current date in the user's timezone as YYYY-MM-DD format
 * @param timezone IANA timezone identifier (e.g., 'America/New_York')
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayInTimezone(timezone?: string | null): string {
  const now = new Date();
  
  if (!timezone) {
    // Fallback to UTC if no timezone specified
    return now.toISOString().split('T')[0];
  }
  
  try {
    // Use Intl.DateTimeFormat to get date in user's timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    return formatter.format(now); // Returns YYYY-MM-DD format
  } catch (error) {
    console.warn(`Invalid timezone '${timezone}', falling back to UTC`);
    return now.toISOString().split('T')[0];
  }
}

/**
 * Get the current day of the week in the user's timezone
 * @param timezone IANA timezone identifier (e.g., 'America/New_York')
 * @returns Day of week as a string (e.g., 'Monday', 'Tuesday', etc.)
 */
export function getDayOfWeekInTimezone(timezone?: string | null): string {
  const now = new Date();
  
  if (!timezone) {
    // Fallback to local server timezone if no timezone specified
    return now.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  try {
    // Use Intl.DateTimeFormat to get day of week in user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long'
    });
    
    return formatter.format(now);
  } catch (error) {
    console.warn(`Invalid timezone '${timezone}', falling back to local timezone`);
    return now.toLocaleDateString('en-US', { weekday: 'long' });
  }
}

/**
 * Validate if a timezone string is a valid IANA timezone identifier
 * @param timezone Timezone string to validate
 * @returns True if valid, false otherwise
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a list of common timezone identifiers for UI selection
 * @returns Array of timezone objects with label and value
 */
export function getCommonTimezones(): Array<{ label: string; value: string }> {
  return [
    { label: 'Eastern Time (ET)', value: 'America/New_York' },
    { label: 'Central Time (CT)', value: 'America/Chicago' },
    { label: 'Mountain Time (MT)', value: 'America/Denver' },
    { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
    { label: 'Alaska Time (AKT)', value: 'America/Anchorage' },
    { label: 'Hawaii Time (HST)', value: 'Pacific/Honolulu' },
    { label: 'Greenwich Mean Time (GMT)', value: 'Europe/London' },
    { label: 'Central European Time (CET)', value: 'Europe/Paris' },
    { label: 'Eastern European Time (EET)', value: 'Europe/Helsinki' },
    { label: 'Moscow Time (MSK)', value: 'Europe/Moscow' },
    { label: 'India Standard Time (IST)', value: 'Asia/Kolkata' },
    { label: 'China Standard Time (CST)', value: 'Asia/Shanghai' },
    { label: 'Japan Standard Time (JST)', value: 'Asia/Tokyo' },
    { label: 'Australian Eastern Time (AET)', value: 'Australia/Sydney' },
    { label: 'Australian Central Time (ACT)', value: 'Australia/Adelaide' },
    { label: 'Australian Western Time (AWT)', value: 'Australia/Perth' },
  ];
}