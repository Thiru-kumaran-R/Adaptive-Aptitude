'use strict';

/**
 * src/services/adaptive/masteryService.js
 *
 * Implements Phase 4 V1 Mastery Calculation and Highest Difficulty Mastered.
 *
 * Inputs:
 *   - recentAccuracy: Accuracy over up to MASTERY_RECENT_WINDOW (10) attempts
 *   - overallAccuracy: Total correct / total attempts
 *   - recentDifficultyCompetence: Average difficulty of correctly answered recent attempts / 10
 *   - attemptConfidence: min(totalAttempts / MASTERY_CONFIDENCE_FULL_AT, 1)
 *
 * NOTE: timeTaken is EXPLICITLY EXCLUDED from Phase 4 V1 mastery calculation
 * as the system does not yet possess pattern-specific population timing baselines.
 *
 * Formulas:
 *   rawMastery = (0.55 * recentAccuracy) + (0.25 * overallAccuracy) + (0.20 * recentDifficultyCompetence)
 *   finalMastery = rawMastery * (0.60 + 0.40 * attemptConfidence)
 *   Clamped to [0.0, 1.0]. If totalAttempts === 0 => mastery = 0.
 */

const Attempt = require('../../models/attemptModel');
const StudentProgress = require('../../models/studentProgressModel');
const config = require('../../config/adaptiveConfig');

/**
 * Classify numeric mastery into human-readable label via numeric threshold checks.
 *
 * @param {number} mastery - Numeric mastery in range [0, 1]
 * @returns {'weak' | 'developing' | 'proficient' | 'mastered'}
 */
const getMasteryLabel = (mastery) => {
  if (mastery < 0.40) {
    return 'weak';
  }
  if (mastery < 0.70) {
    return 'developing';
  }
  if (mastery < 0.85) {
    return 'proficient';
  }
  return 'mastered';
};

/**
 * Calculates highest difficulty mastered for a pattern.
 *
 * Rule: At least DIFFICULTY_MASTERY_MIN_ATTEMPTS (3) attempts exist at that exact difficulty,
 * AND accuracy at that difficulty >= DIFFICULTY_MASTERY_ACCURACY (0.80).
 *
 * @param {string} userId
 * @param {string} topic
 * @param {string} pattern
 * @returns {Promise<number>} Highest qualifying difficulty (1-10) or 0
 */
const calculateHighestDifficultyMastered = async (userId, topic, pattern) => {
  const diffGroups = await Attempt.aggregate([
    { $match: { userId, topic, pattern } },
    {
      $group: {
        _id: '$difficulty',
        totalAttempts: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
      },
    },
  ]);

  let highest = 0;
  for (const group of diffGroups) {
    const diff = group._id;
    const total = group.totalAttempts;
    const accuracy = total > 0 ? group.correct / total : 0;

    if (
      total >= config.DIFFICULTY_MASTERY_MIN_ATTEMPTS &&
      accuracy >= config.DIFFICULTY_MASTERY_ACCURACY
    ) {
      if (diff > highest) {
        highest = diff;
      }
    }
  }

  return highest;
};

/**
 * Calculates V1 Mastery for a user, topic, and pattern from Attempt history.
 *
 * @param {string} userId
 * @param {string} topic
 * @param {string} pattern
 * @returns {Promise<{
 *   mastery: number,
 *   rawMastery: number,
 *   recentAccuracy: number,
 *   overallAccuracy: number,
 *   recentDifficultyCompetence: number,
 *   attemptConfidence: number,
 *   totalAttempts: number,
 *   masteryLabel: string
 * }>}
 */
const calculatePatternMastery = async (userId, topic, pattern) => {
  // Query total attempts and correct count using indexed query
  const [totalAttempts, totalCorrect, recentAttempts] = await Promise.all([
    Attempt.countDocuments({ userId, topic, pattern }),
    Attempt.countDocuments({ userId, topic, pattern, isCorrect: true }),
    Attempt.find({ userId, topic, pattern })
      .sort({ attemptedAt: -1 })
      .limit(config.MASTERY_RECENT_WINDOW)
      .lean(),
  ]);

  if (totalAttempts === 0) {
    return {
      mastery: 0,
      rawMastery: 0,
      recentAccuracy: 0,
      overallAccuracy: 0,
      recentDifficultyCompetence: 0,
      attemptConfidence: 0,
      totalAttempts: 0,
      masteryLabel: getMasteryLabel(0),
    };
  }

  // 1. Recent accuracy (up to MASTERY_RECENT_WINDOW)
  const recentCount = recentAttempts.length;
  const recentCorrectCount = recentAttempts.filter((a) => a.isCorrect).length;
  const recentAccuracy = recentCount > 0 ? recentCorrectCount / recentCount : 0;

  // 2. Overall accuracy
  const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  // 3. Recent difficulty competence: average difficulty of CORRECT recent attempts / 10
  const correctRecent = recentAttempts.filter((a) => a.isCorrect);
  const recentDifficultyCompetence =
    correctRecent.length > 0
      ? correctRecent.reduce((sum, a) => sum + a.difficulty, 0) / correctRecent.length / 10
      : 0;

  // 4. Attempt confidence
  const attemptConfidence = Math.min(totalAttempts / config.MASTERY_CONFIDENCE_FULL_AT, 1);

  // 5. Raw mastery
  const rawMastery =
    config.MASTERY_RECENT_WEIGHT * recentAccuracy +
    config.MASTERY_OVERALL_WEIGHT * overallAccuracy +
    config.MASTERY_DIFFICULTY_WEIGHT * recentDifficultyCompetence;

  // 6. Confidence-adjusted mastery
  const confidenceMultiplier = 0.60 + 0.40 * attemptConfidence;
  const computedMastery = rawMastery * confidenceMultiplier;

  // Clamp to [0, 1]
  const mastery = Math.min(1, Math.max(0, computedMastery));

  return {
    mastery,
    rawMastery,
    recentAccuracy,
    overallAccuracy,
    recentDifficultyCompetence,
    attemptConfidence,
    totalAttempts,
    masteryLabel: getMasteryLabel(mastery),
  };
};

/**
 * Recalculates both mastery and highestDifficultyMastered from Attempt history
 * and persists the results to StudentProgress.
 *
 * @param {string} userId
 * @param {string} topic
 * @param {string} pattern
 * @param {{ session?: mongoose.ClientSession }} [opts]
 * @returns {Promise<object>} The updated StudentProgress document
 */
const recalculateAndPersistPatternMastery = async (userId, topic, pattern, { session } = {}) => {
  const [masteryData, highestDiff] = await Promise.all([
    calculatePatternMastery(userId, topic, pattern),
    calculateHighestDifficultyMastered(userId, topic, pattern),
  ]);

  const update = {
    $set: {
      mastery: masteryData.mastery,
      highestDifficultyMastered: highestDiff,
    },
  };

  const opts = {
    new: true,
    upsert: true,
    ...(session ? { session } : {}),
  };

  const updatedProgress = await StudentProgress.findOneAndUpdate(
    { userId, topic, pattern },
    update,
    opts
  );

  return updatedProgress;
};

/**
 * Deterministic recovery utility for repairing stale derived learning state.
 *
 * @param {string} userId
 * @param {string} topic
 * @param {string} pattern
 * @returns {Promise<{ userId, topic, pattern, mastery, highestDifficultyMastered }>}
 */
const recalculatePatternLearningState = async (userId, topic, pattern) => {
  const updated = await recalculateAndPersistPatternMastery(userId, topic, pattern);
  return {
    userId,
    topic,
    pattern,
    mastery: updated.mastery,
    highestDifficultyMastered: updated.highestDifficultyMastered,
  };
};

module.exports = {
  getMasteryLabel,
  calculatePatternMastery,
  calculateHighestDifficultyMastered,
  recalculateAndPersistPatternMastery,
  recalculatePatternLearningState,
};
