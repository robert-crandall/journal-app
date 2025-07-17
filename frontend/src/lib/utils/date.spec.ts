import { describe, it, expect } from 'vitest';
import { formatDateTime } from './date';

// Helper for predictable date
const fixedDate = new Date('2025-07-17T12:34:56Z');

// en-US: July 17, 2025, 12:34 PM
const enUSDefault = 'Jul 17, 2025, 12:34 PM';
const enUSShort = '7/17/25, 12:34 PM';
const enUSMedium = 'Jul 17, 2025, 12:34:56 PM';
const enUSFull = 'Thursday, July 17, 2025 at 12:34:56 PM GMT+0'; // May vary by environment
const enUSDateOnly = 'Jul 17, 2025';
const enUSJournal = '2025-07-17';

// ISO string for fixed date
const isoString = '2025-07-17T12:34:56Z';
const ymdString = '2025-07-17';

describe('formatDateTime', () => {
  it('formats current date/time by default', () => {
    const result = formatDateTime();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats ISO string', () => {
    expect(formatDateTime(isoString, 'default')).toContain('Jul 17, 2025');
  });

  it('formats Date object', () => {
    expect(formatDateTime(fixedDate, 'default')).toContain('Jul 17, 2025');
  });

  it('formats YYYY-MM-DD string', () => {
    expect(formatDateTime(ymdString, 'default')).toContain('Jul 17, 2025');
  });

  it('formats with journal format', () => {
    expect(formatDateTime(fixedDate, 'journal')).toBe('2025-07-17');
    expect(formatDateTime(ymdString, 'journal')).toBe('2025-07-17');
  });

  it('returns Invalid date for bad string', () => {
    expect(formatDateTime('not-a-date', 'default')).toBe('Invalid date');
  });

  it('defaults to now for null/undefined', () => {
    expect(typeof formatDateTime(null, 'default')).toBe('string');
    expect(typeof formatDateTime(undefined, 'default')).toBe('string');
  });

  it('formats current date/time with journal format (no value)', () => {
    const result = formatDateTime(undefined, 'journal');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats current date/time with date-only format (no value)', () => {
    const result = formatDateTime(undefined, 'date-only');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats current date/time with short format (no value)', () => {
    const result = formatDateTime(undefined, 'short');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats current date/time with full format (no value)', () => {
    const result = formatDateTime(undefined, 'full');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats current date/time with journal format (null value)', () => {
    const result = formatDateTime(null, 'journal');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats current date/time with journal format (no args)', () => {
    const result = formatDateTime(undefined, 'journal');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
