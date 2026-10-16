'use strict';

/**
 * src/config/adaptiveConfig.js
 *
 * Centralized Adaptive Decision Engine Configuration (Phase 4 V1).
 *
 * All adaptive decision thresholds, weights, and limits MUST be sourced
 * from this module. Do not hardcode magic numbers in adaptive services.
 */

module.exports = {
  // Algorithm version for auditability and response metadata
  ADAPTIVE_ALGORITHM_VERSION: 'v1',

  // Mastery calculation constants
  MASTERY_RECENT_WINDOW: 10,
  MASTERY_CONFIDENCE_FULL_AT: 10,
  MASTERY_RECENT_WEIGHT: 0.55,
  MASTERY_OVERALL_WEIGHT: 0.25,
  MASTERY_DIFFICULTY_WEIGHT: 0.20,

  // Prerequisite gating
  PREREQUISITE_MASTERY_THRESHOLD: 0.70,

  // Difficulty adaptation constants
  DIFFICULTY_RECENT_WINDOW: 5,
  MIN_ATTEMPTS_FOR_DIFFICULTY_SHIFT: 3,
  DIFFICULTY_UP_ACCURACY: 0.80,
  DIFFICULTY_DOWN_ACCURACY: 0.40,
  DEFAULT_START_DIFFICULTY: 2,

  // Highest difficulty mastered rule (V1 formal definition)
  DIFFICULTY_MASTERY_MIN_ATTEMPTS: 3,
  DIFFICULTY_MASTERY_ACCURACY: 0.80,

  // Question exclusion and candidate ranking
  RECENT_QUESTION_EXCLUSION_LIMIT: 20,
  PATTERN_MASTERY_NEED_WEIGHT: 0.70,
  PATTERN_OBJECTIVE_NEED_WEIGHT: 0.30,
};
