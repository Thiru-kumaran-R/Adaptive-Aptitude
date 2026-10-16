'use strict';

/**
 * src/services/adaptive/difficultySelectionService.js
 *
 * Implements Phase 4 difficulty adaptation based on a 5-attempt recent window.
 *
 * Base Difficulty Order:
 *   1. DailyObjective pattern.targetDifficulty if present
 *   2. Rounded average difficulty of recent attempts for the pattern
 *   3. DEFAULT_START_DIFFICULTY (2)
 *
 * Minimum Evidence Before Shift:
 *   - At least MIN_ATTEMPTS_FOR_DIFFICULTY_SHIFT (3) recent attempts required.
 *   - Fewer than 3 attempts => adjustment = 0.
 *
 * Adjustment Rules:
 *   - recentAccuracy >= 0.80 => adjustment = +1 (DIFFICULTY_INCREASED)
 *   - recentAccuracy <= 0.40 => adjustment = -1 (DIFFICULTY_DECREASED)
 *   - 0.40 < recentAccuracy < 0.80 => adjustment = 0 (DIFFICULTY_HELD)
 *
 * Boundary Clamping:
 *   targetDifficulty = clamp(baseDifficulty + adjustment, 1, 10)
 */

const Attempt = require('../../models/attemptModel');
const config = require('../../config/adaptiveConfig');

/**
 * Select the target difficulty for a pattern.
 *
 * @param {string} userId
 * @param {string} topic
 * @param {string} pattern
 * @param {{ patternTargetDifficulty?: number }} [options]
 * @returns {Promise<{
 *   baseDifficulty: number,
 *   adjustment: number,
 *   targetDifficulty: number,
 *   recentAttemptCount: number,
 *   recentAccuracy: number,
 *   reasonCodes: string[]
 * }>}
 */
const selectTargetDifficulty = async (userId, topic, pattern, options = {}) => {
  const reasonCodes = [];

  // Query up to DIFFICULTY_RECENT_WINDOW (5) attempts for this pattern
  const recentAttempts = await Attempt.find({ userId, topic, pattern })
    .sort({ attemptedAt: -1 })
    .limit(config.DIFFICULTY_RECENT_WINDOW)
    .lean();

  const recentCount = recentAttempts.length;
  const recentCorrectCount = recentAttempts.filter((a) => a.isCorrect).length;
  const recentAccuracy = recentCount > 0 ? recentCorrectCount / recentCount : 0;

  // 1. Determine base difficulty
  let baseDifficulty;
  if (
    options.patternTargetDifficulty !== undefined &&
    options.patternTargetDifficulty !== null &&
    Number.isInteger(options.patternTargetDifficulty) &&
    options.patternTargetDifficulty >= 1 &&
    options.patternTargetDifficulty <= 10
  ) {
    baseDifficulty = options.patternTargetDifficulty;
    reasonCodes.push('TARGET_DIFFICULTY_USED');
  } else if (recentCount > 0) {
    const avgDiff =
      recentAttempts.reduce((sum, a) => sum + a.difficulty, 0) / recentCount;
    baseDifficulty = Math.round(avgDiff);
  } else {
    baseDifficulty = config.DEFAULT_START_DIFFICULTY;
  }

  // Clamp base difficulty to 1-10
  baseDifficulty = Math.min(10, Math.max(1, baseDifficulty));

  // 2. Determine adjustment
  let adjustment = 0;
  if (recentCount < config.MIN_ATTEMPTS_FOR_DIFFICULTY_SHIFT) {
    // Insufficient evidence: hold difficulty
    adjustment = 0;
    if (!reasonCodes.includes('TARGET_DIFFICULTY_USED')) {
      reasonCodes.push('DIFFICULTY_HELD');
    }
  } else {
    if (recentAccuracy >= config.DIFFICULTY_UP_ACCURACY) {
      adjustment = 1;
      reasonCodes.push('DIFFICULTY_INCREASED');
    } else if (recentAccuracy <= config.DIFFICULTY_DOWN_ACCURACY) {
      adjustment = -1;
      reasonCodes.push('DIFFICULTY_DECREASED');
    } else {
      adjustment = 0;
      reasonCodes.push('DIFFICULTY_HELD');
    }
  }

  // 3. Target difficulty with boundary clamping [1, 10]
  const targetDifficulty = Math.min(10, Math.max(1, baseDifficulty + adjustment));

  return {
    baseDifficulty,
    adjustment,
    targetDifficulty,
    recentAttemptCount: recentCount,
    recentAccuracy,
    reasonCodes,
  };
};

module.exports = {
  selectTargetDifficulty,
};
