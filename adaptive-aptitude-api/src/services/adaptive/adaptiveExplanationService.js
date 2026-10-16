'use strict';

/**
 * src/services/adaptive/adaptiveExplanationService.js
 *
 * Assembles concise, machine-readable explanation structures and reason codes.
 *
 * Implemented Reason Codes:
 *   - EXPLICIT_PATTERN
 *   - DAILY_OBJECTIVE
 *   - ACTIVE_STUDY_PLAN
 *   - LOW_MASTERY
 *   - UNSEEN_PATTERN
 *   - FOUNDATIONAL_FALLBACK
 *   - PREREQUISITE_NOT_MASTERED
 *   - PREREQUISITE_REMEDIATION
 *   - DIFFICULTY_INCREASED
 *   - DIFFICULTY_DECREASED
 *   - DIFFICULTY_HELD
 *   - TARGET_DIFFICULTY_USED
 *   - DIFFICULTY_FALLBACK
 *   - RECENT_QUESTION_EXCLUDED
 *   - RECENT_EXCLUSION_RELAXED
 */

const config = require('../../config/adaptiveConfig');
const { getMasteryLabel } = require('./masteryService');

/**
 * Valid set of implemented reason codes.
 */
const VALID_REASON_CODES = new Set([
  'EXPLICIT_PATTERN',
  'DAILY_OBJECTIVE',
  'ACTIVE_STUDY_PLAN',
  'LOW_MASTERY',
  'UNSEEN_PATTERN',
  'FOUNDATIONAL_FALLBACK',
  'PREREQUISITE_NOT_MASTERED',
  'PREREQUISITE_REMEDIATION',
  'DIFFICULTY_INCREASED',
  'DIFFICULTY_DECREASED',
  'DIFFICULTY_HELD',
  'TARGET_DIFFICULTY_USED',
  'DIFFICULTY_FALLBACK',
  'RECENT_QUESTION_EXCLUDED',
  'RECENT_EXCLUSION_RELAXED',
]);

/**
 * Build the structured decision payload.
 *
 * @param {object} params
 * @returns {object} Formatted decision object
 */
const buildDecisionPayload = ({
  requestedPattern,
  selectedTopic,
  selectedPattern,
  mastery,
  recentAccuracy,
  baseDifficulty,
  adjustment,
  targetDifficulty,
  selectedDifficulty,
  fallbackUsed,
  prerequisiteRedirect,
  rawReasonCodes = [],
}) => {
  // Deduplicate and filter valid reason codes in stable insertion order
  const reasonCodes = [];
  const seen = new Set();
  for (const code of rawReasonCodes) {
    if (VALID_REASON_CODES.has(code) && !seen.has(code)) {
      seen.add(code);
      reasonCodes.push(code);
    }
  }

  return {
    algorithmVersion: config.ADAPTIVE_ALGORITHM_VERSION,
    requestedPattern: requestedPattern || undefined,
    selectedTopic,
    selectedPattern,
    mastery: Number(mastery.toFixed(4)),
    masteryLabel: getMasteryLabel(mastery),
    recentAccuracy: Number(recentAccuracy.toFixed(4)),
    targetDifficulty,
    selectedDifficulty,
    isFallback: fallbackUsed,
    difficulty: {
      baseDifficulty,
      adjustment,
      targetDifficulty,
      selectedDifficulty,
      fallbackUsed,
    },
    prerequisiteRedirect,
    reasonCodes,
  };
};

module.exports = {
  VALID_REASON_CODES,
  buildDecisionPayload,
};
