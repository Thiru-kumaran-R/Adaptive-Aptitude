'use strict';

/**
 * Date Utility — Phase 5: Automated Planning & Revision Engine
 *
 * Provides centralized logical-date arithmetic and normalization.
 * Reuses the Phase 3 midnight-UTC logical date strategy.
 * Accepts an optional referenceDate across functions to enable 100% deterministic testing.
 */

/**
 * Normalize a Date or date string to midnight UTC (beginning of the logical day).
 *
 * @param {Date|string|number} date
 * @returns {Date}
 */
const normalizeLogicalDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date provided for normalization: "${date}"`);
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

/**
 * Returns today's logical date, or normalizes referenceDate if provided.
 *
 * @param {Date|string|number} [referenceDate]
 * @returns {Date}
 */
const getLogicalToday = (referenceDate) => {
  return referenceDate ? normalizeLogicalDate(referenceDate) : normalizeLogicalDate(new Date());
};

/**
 * Add an integer number of logical days to a date.
 *
 * @param {Date|string|number} date
 * @param {number} days
 * @returns {Date}
 */
const addLogicalDays = (date, days) => {
  const norm = normalizeLogicalDate(date);
  const result = new Date(norm.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return normalizeLogicalDate(result);
};

/**
 * Add an integer number of calendar months using true calendar arithmetic.
 * Handles month-end rollovers (e.g. Jan 31 + 1 month -> Feb 28/29).
 *
 * @param {Date|string|number} date
 * @param {number} months
 * @returns {Date}
 */
const addCalendarMonths = (date, months) => {
  const norm = normalizeLogicalDate(date);
  const targetYear = norm.getUTCFullYear();
  const targetMonth = norm.getUTCMonth() + months;
  const targetDay = norm.getUTCDate();

  // Determine the last day of the target month
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(targetDay, lastDayOfTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth, clampedDay, 0, 0, 0, 0));
};

/**
 * Compare two logical dates.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 *
 * @param {Date|string|number} a
 * @param {Date|string|number} b
 * @returns {number}
 */
const compareLogicalDates = (a, b) => {
  const timeA = normalizeLogicalDate(a).getTime();
  const timeB = normalizeLogicalDate(b).getTime();
  if (timeA < timeB) return -1;
  if (timeA > timeB) return 1;
  return 0;
};

/**
 * Calculate the number of inclusive logical days between startDate and endDate.
 *
 * @param {Date|string|number} startDate
 * @param {Date|string|number} endDate
 * @returns {number}
 */
const daysBetweenInclusive = (startDate, endDate) => {
  const start = normalizeLogicalDate(startDate).getTime();
  const end = normalizeLogicalDate(endDate).getTime();
  const diffMs = end - start;
  return Math.round(diffMs / (24 * 60 * 60 * 1000)) + 1;
};

/**
 * Format a Date object to YYYY-MM-DD string.
 *
 * @param {Date|string|number} date
 * @returns {string}
 */
const formatLogicalDate = (date) => {
  const d = normalizeLogicalDate(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = {
  normalizeLogicalDate,
  getLogicalToday,
  addLogicalDays,
  addCalendarMonths,
  compareLogicalDates,
  daysBetweenInclusive,
  formatLogicalDate,
};
