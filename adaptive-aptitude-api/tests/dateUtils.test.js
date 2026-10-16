'use strict';

/**
 * tests/dateUtils.test.js — Phase 5: Date Utility Tests
 */

const {
  normalizeLogicalDate,
  getLogicalToday,
  addLogicalDays,
  addCalendarMonths,
  compareLogicalDates,
  daysBetweenInclusive,
  formatLogicalDate,
} = require('../src/utils/dateUtils');

describe('Date Utilities (Phase 5)', () => {
  it('normalizes dates to midnight UTC', () => {
    const d = normalizeLogicalDate('2026-10-15T15:30:45.123Z');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(9); // October (0-indexed)
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCSeconds()).toBe(0);
    expect(d.getUTCMilliseconds()).toBe(0);
  });

  it('supports deterministic referenceDate for getLogicalToday', () => {
    const ref = '2026-10-01';
    const today = getLogicalToday(ref);
    expect(formatLogicalDate(today)).toBe('2026-10-01');
  });

  it('adds logical days correctly', () => {
    const start = '2026-10-01';
    const plus3 = addLogicalDays(start, 3);
    expect(formatLogicalDate(plus3)).toBe('2026-10-04');

    // Month boundary rollover
    const plus31 = addLogicalDays(start, 31);
    expect(formatLogicalDate(plus31)).toBe('2026-11-01');
  });

  it('performs true calendar month arithmetic', () => {
    const start = '2026-10-01';
    const plus1m = addCalendarMonths(start, 1);
    expect(formatLogicalDate(plus1m)).toBe('2026-11-01');

    const plus3m = addCalendarMonths(start, 3);
    expect(formatLogicalDate(plus3m)).toBe('2027-01-01');

    // Month-end clamping (Jan 31 + 1 month -> Feb 28 in non-leap year)
    const jan31 = '2027-01-31';
    const feb28 = addCalendarMonths(jan31, 1);
    expect(formatLogicalDate(feb28)).toBe('2027-02-28');
  });

  it('compares logical dates accurately', () => {
    expect(compareLogicalDates('2026-10-01', '2026-10-02')).toBe(-1);
    expect(compareLogicalDates('2026-10-05', '2026-10-05')).toBe(0);
    expect(compareLogicalDates('2026-10-10', '2026-10-05')).toBe(1);
  });

  it('computes inclusive days between two dates', () => {
    expect(daysBetweenInclusive('2026-10-01', '2026-10-01')).toBe(1);
    expect(daysBetweenInclusive('2026-10-01', '2026-10-03')).toBe(3);
    expect(daysBetweenInclusive('2026-10-01', '2026-10-07')).toBe(7);
  });

  it('formats dates consistently to YYYY-MM-DD', () => {
    const d = new Date(Date.UTC(2026, 9, 5));
    expect(formatLogicalDate(d)).toBe('2026-10-05');
  });

  it('verifies cross-phase logical date consistency (Phase 3 DailyObjective === Phase 5)', () => {
    // Legacy Phase 3 normalization logic:
    const phase3Normalize = (date) => {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    };

    const testDates = [
      '2026-10-01T04:23:12.456Z',
      '2026-12-31T23:59:59.999Z',
      '2027-01-01T00:00:00.000Z',
      '2028-02-29T12:00:00.000Z',
    ];

    for (const td of testDates) {
      const p3 = phase3Normalize(td);
      const p5 = normalizeLogicalDate(td);
      expect(p5.getTime()).toBe(p3.getTime());
      expect(p5.toISOString()).toBe(p3.toISOString());
    }
  });

  it('handles leap years and 30-day month clamping accurately', () => {
    // Leap year: Jan 31, 2028 + 1 month -> Feb 29, 2028
    const leapJan31 = '2028-01-31';
    const leapFeb29 = addCalendarMonths(leapJan31, 1);
    expect(formatLogicalDate(leapFeb29)).toBe('2028-02-29');

    // 30-day month clamping: Mar 31, 2026 + 1 month -> Apr 30, 2026
    const mar31 = '2026-03-31';
    const apr30 = addCalendarMonths(mar31, 1);
    expect(formatLogicalDate(apr30)).toBe('2026-04-30');

    // Aug 31 + 1 month -> Sep 30
    const aug31 = '2026-08-31';
    const sep30 = addCalendarMonths(aug31, 1);
    expect(formatLogicalDate(sep30)).toBe('2026-09-30');
  });
});
