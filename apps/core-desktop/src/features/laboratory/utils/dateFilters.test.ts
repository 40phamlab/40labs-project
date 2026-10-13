import { describe, expect, it } from 'vitest';
import { isInLabDatePeriod } from './dateFilters';
import { formatDate, formatDateTime } from '@40labs/i18n';

describe('laboratory calendar date periods', () => {
  const now = new Date(2026, 9, 13, 12, 0, 0);

  it('uses local midnight boundaries for today and excludes future/invalid dates', () => {
    expect(isInLabDatePeriod(new Date(2026, 9, 13, 0, 0).toISOString(), 'today', now)).toBe(true);
    expect(isInLabDatePeriod(new Date(2026, 9, 13, 12, 0, 1).toISOString(), 'today', now)).toBe(false);
    expect(isInLabDatePeriod('not-a-date', 'today', now)).toBe(false);
  });

  it('uses Monday-to-Monday and month-to-month boundaries', () => {
    expect(isInLabDatePeriod(new Date(2026, 9, 12, 0, 0).toISOString(), 'week', now)).toBe(true);
    expect(isInLabDatePeriod(new Date(2026, 9, 11, 23, 59).toISOString(), 'week', now)).toBe(false);
    expect(isInLabDatePeriod(new Date(2026, 9, 1, 0, 0).toISOString(), 'month', now)).toBe(true);
    expect(isInLabDatePeriod(new Date(2026, 8, 30, 23, 59).toISOString(), 'month', now)).toBe(false);
  });

  it('uses calendar arithmetic across DST transitions', () => {
    const previousTz = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
      const dstDay = new Date('2026-03-08T12:00:00-04:00');
      expect(isInLabDatePeriod('2026-03-08T11:30:00-04:00', 'today', dstDay)).toBe(true);
      expect(isInLabDatePeriod('2026-03-07T23:59:00-05:00', 'today', dstDay)).toBe(false);
    } finally {
      if (previousTz === undefined) delete process.env.TZ;
      else process.env.TZ = previousTz;
    }
  });

  it('uses the shared application locale formatters for dates and times', () => {
    const value = '2026-10-13T09:30:00Z';
    expect(formatDate(value)).toBe(new Intl.DateTimeFormat('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)));
    expect(formatDateTime(value)).toBe(new Intl.DateTimeFormat('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)));
    expect(formatDateTime('invalid')).toBe('');
  });
});
