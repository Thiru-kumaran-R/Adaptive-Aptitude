'use strict';

/**
 * Speed-Accuracy Matrix Service
 *
 * Implements Section 18, 19, 20, 21:
 *   - Non-mock attempt scanning within rolling windowDays (and optional topic filter)
 *   - Pattern+Difficulty baseline sample evaluation (MIN_SPEED_BASELINE_SAMPLES = 3)
 *   - Deterministic quadrant classification:
 *       accurateAndFast, accurateAndSlow, fastErrorRushing, slowErrorStruggling
 *   - Rushing risk score with zero-denominator safety
 *   - Overall aggregate medians (medianTimeCorrectSeconds, medianTimeIncorrectSeconds)
 */

const Attempt = require('../../models/attemptModel');
const {
  DEFAULT_WINDOW_DAYS,
  MAX_ATTEMPTS_ANALYZED,
  MIN_SPEED_BASELINE_SAMPLES,
  SPEED_RUSHING_THRESHOLD_MULTIPLIER,
  NON_MOCK_ATTEMPT_SOURCES,
} = require('../../config/analyticsConfig');
const {
  roundTo,
  calculateMedian,
} = require('./analyticsMathUtils');

/**
 * Computes the speed-accuracy matrix and summary window analytics.
 *
 * @param {string} userId
 * @param {number} [windowDays=DEFAULT_WINDOW_DAYS]
 * @param {string|null} [topic=null]
 * @param {Date} referenceNow
 * @returns {Promise<Object>}
 */
const getSpeedAccuracyMatrix = async (
  userId,
  windowDays = DEFAULT_WINDOW_DAYS,
  topic = null,
  referenceNow = new Date()
) => {
  const windowCutoff = new Date(referenceNow.getTime() - windowDays * 86400000);

  const query = {
    userId,
    source: { $in: NON_MOCK_ATTEMPT_SOURCES },
    attemptedAt: { $gte: windowCutoff },
  };

  if (topic) {
    query.topic = topic;
  }

  const loadedAttempts = await Attempt.find(query)
    .sort({ attemptedAt: -1, _id: -1 })
    .limit(MAX_ATTEMPTS_ANALYZED)
    .lean();

  const attemptsAnalyzed = loadedAttempts.length;

  // Aggregate collections for overall correct/incorrect medians
  const correctTimes = [];
  const incorrectTimes = [];

  // Group attempts by pattern and difficulty for quadrant baseline calculation
  const groups = new Map();

  for (const a of loadedAttempts) {
    if (a.isCorrect === true) {
      correctTimes.push(a.timeTaken);
    } else {
      incorrectTimes.push(a.timeTaken);
    }

    const groupKey = `${a.pattern}:::${a.difficulty}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(a);
  }

  let accurateAndFast = 0;
  let accurateAndSlow = 0;
  let fastErrorRushing = 0;
  let slowErrorStruggling = 0;
  let insufficientBaselineCount = 0;

  for (const [, attemptsInGroup] of groups) {
    const correctAttemptsInGroup = attemptsInGroup.filter((a) => a.isCorrect === true);

    if (correctAttemptsInGroup.length < MIN_SPEED_BASELINE_SAMPLES) {
      insufficientBaselineCount += attemptsInGroup.length;
    } else {
      const correctTimesInGroup = correctAttemptsInGroup.map((a) => a.timeTaken);
      const tMedian = calculateMedian(correctTimesInGroup);
      const rushingThreshold = SPEED_RUSHING_THRESHOLD_MULTIPLIER * tMedian;

      for (const a of attemptsInGroup) {
        if (a.isCorrect === true) {
          if (a.timeTaken <= tMedian) {
            accurateAndFast += 1;
          } else {
            accurateAndSlow += 1;
          }
        } else {
          if (a.timeTaken < rushingThreshold) {
            fastErrorRushing += 1;
          } else {
            slowErrorStruggling += 1;
          }
        }
      }
    }
  }

  // Rushing Risk Score
  const totalClassifiedIncorrect = fastErrorRushing + slowErrorStruggling;
  let rushingRiskScore = null;
  if (totalClassifiedIncorrect > 0) {
    rushingRiskScore = roundTo(fastErrorRushing / totalClassifiedIncorrect, 2);
  }

  // Overall Aggregate Medians (DTO Serialization)
  const medianTimeCorrectRaw = calculateMedian(correctTimes);
  const medianTimeIncorrectRaw = calculateMedian(incorrectTimes);

  const medianTimeCorrectSeconds = roundTo(medianTimeCorrectRaw, 2);
  const medianTimeIncorrectSeconds = roundTo(medianTimeIncorrectRaw, 2);

  return {
    analysisWindow: {
      windowDays,
      attemptsAnalyzed,
    },
    speedAccuracyMatrix: {
      quadrantCounts: {
        accurateAndFast,
        accurateAndSlow,
        fastErrorRushing,
        slowErrorStruggling,
      },
      insufficientBaselineCount,
      rushingRiskScore,
      medianTimeCorrectSeconds,
      medianTimeIncorrectSeconds,
    },
  };
};

module.exports = {
  getSpeedAccuracyMatrix,
};
