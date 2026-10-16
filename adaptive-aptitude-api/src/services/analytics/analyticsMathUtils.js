'use strict';

/**
 * Analytics Math and Utility Helpers
 *
 * Implements deterministic native math algorithms (median, decimal rounding,
 * logical-day boundary calculation, and mastery labeling).
 * Zero external statistics or math libraries.
 */

const { MASTERY_THRESHOLDS } = require('../../config/analyticsConfig');

/**
 * Round a numeric value to a specified number of decimal places for DTO presentation.
 * Returns null if the value is null or undefined.
 *
 * @param {number|null|undefined} value
 * @param {number} decimals
 * @returns {number|null}
 */
const roundTo = (value, decimals = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * Section 20 Median Algorithm
 *
 * For a numeric array V representing attempt times or samples:
 * 1. Filter out non-finite values, nulls, undefined values, and negative values (v < 0).
 * 2. If filtered length N = 0: return null.
 * 3. Sort array V in ascending numerical order.
 * 4. If N is odd: V[floor(N / 2)]
 * 5. If N is even: (V[N / 2 - 1] + V[N / 2]) / 2
 *
 * @param {Array<number>} values
 * @returns {number|null}
 */
const calculateMedian = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const valid = values.filter((v) => v !== null && v !== undefined && Number.isFinite(v) && v >= 0);
  const n = valid.length;
  if (n === 0) {
    return null;
  }

  valid.sort((a, b) => a - b);

  if (n % 2 === 1) {
    return valid[Math.floor(n / 2)];
  }

  const mid = n / 2;
  return (valid[mid - 1] + valid[mid]) / 2;
};

/**
 * Maps raw unrounded mastery to Phase 4-aligned diagnostic label.
 *
 * < 0.40  => weak
 * < 0.70  => developing
 * < 0.85  => proficient
 * >= 0.85 => mastered
 * null    => null
 *
 * @param {number|null|undefined} mastery
 * @returns {string|null}
 */
const getMasteryLabel = (mastery) => {
  if (mastery === null || mastery === undefined || !Number.isFinite(mastery)) {
    return null;
  }

  if (mastery < MASTERY_THRESHOLDS.WEAK) {
    return 'weak';
  }
  if (mastery < MASTERY_THRESHOLDS.DEVELOPING) {
    return 'developing';
  }
  if (mastery < MASTERY_THRESHOLDS.PROFICIENT) {
    return 'proficient';
  }
  return 'mastered';
};

/**
 * Computes UTC logical-day boundaries for a request-level referenceNow.
 *
 * @param {Date} referenceNow
 * @returns {{ todayStartUtc: Date, tomorrowStartUtc: Date }}
 */
const getLogicalDayBoundaries = (referenceNow) => {
  const todayStartUtc = new Date(
    Date.UTC(
      referenceNow.getUTCFullYear(),
      referenceNow.getUTCMonth(),
      referenceNow.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  const tomorrowStartUtc = new Date(todayStartUtc.getTime() + 86400000);

  return { todayStartUtc, tomorrowStartUtc };
};

module.exports = {
  roundTo,
  calculateMedian,
  getMasteryLabel,
  getLogicalDayBoundaries,
};
