'use strict';

/**
 * src/services/adaptive/adaptiveEngine.js
 *
 * Phase 4 Adaptive Decision Engine Orchestrator.
 *
 * Implements the deterministic, non-LLM, explainable pipeline:
 *   1. Validate user existence
 *   2. Determine candidate pattern (candidate hierarchy, priority scoring, remediation)
 *   3. Select target difficulty (5-attempt window, 3-attempt evidence threshold, +/-1 shift)
 *   4. Select question deterministically (recent exclusion, outward difficulty fallback, DTO sanitization)
 *   5. Assemble explainable decision metadata with reason codes
 *   6. Safe structured logging
 *
 * STATELENESS:
 *   Derives decisions dynamically from existing persistent data.
 *   Does not maintain in-memory sessions or generate persistent study plans.
 */

const { userExists } = require('../userService');
const { selectCandidatePattern } = require('./patternSelectionService');
const { selectTargetDifficulty } = require('./difficultySelectionService');
const { selectQuestion } = require('./questionSelectionService');
const { buildDecisionPayload } = require('./adaptiveExplanationService');

/**
 * Select the next adaptive question for a student.
 *
 * @param {string} userId - Application-level student identity
 * @param {{ topic?: string, pattern?: string, planId?: string }} [constraints]
 * @returns {Promise<{
 *   question: {
 *     _id: any,
 *     question: string,
 *     options: string[],
 *     topic: string,
 *     pattern: string,
 *     difficulty: number
 *   },
 *   decision: object
 * }>}
 */
const getNextQuestion = async (userId, constraints = {}) => {
  // 1. Verify user exists
  if (!userId) {
    const err = new Error('User ID is required.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const exists = await userExists(userId);
  if (!exists) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const accumulatedReasonCodes = [];

  // 2. Pattern selection (with constraint checks and prerequisite remediation)
  const patternResult = await selectCandidatePattern(userId, constraints);
  accumulatedReasonCodes.push(...patternResult.reasonCodes);

  const selectedTopic = patternResult.topic;
  const selectedPattern = patternResult.pattern;

  // 3. Difficulty selection
  const diffResult = await selectTargetDifficulty(userId, selectedTopic, selectedPattern, {
    patternTargetDifficulty: patternResult.targetDifficulty,
  });
  accumulatedReasonCodes.push(...diffResult.reasonCodes);

  // 4. Question selection
  const qResult = await selectQuestion(
    userId,
    selectedTopic,
    selectedPattern,
    diffResult.targetDifficulty
  );
  accumulatedReasonCodes.push(...qResult.reasonCodes);

  // 5. Build structured decision explanation
  const decision = buildDecisionPayload({
    requestedPattern: patternResult.requestedPattern,
    selectedTopic,
    selectedPattern,
    mastery: patternResult.mastery,
    recentAccuracy: diffResult.recentAccuracy,
    baseDifficulty: diffResult.baseDifficulty,
    adjustment: diffResult.adjustment,
    targetDifficulty: diffResult.targetDifficulty,
    selectedDifficulty: qResult.selectedDifficulty,
    fallbackUsed: qResult.fallbackUsed,
    prerequisiteRedirect: patternResult.prerequisiteRedirect,
    rawReasonCodes: accumulatedReasonCodes,
  });

  // 6. Safe logging (NO answer, correctAnswer, or explanation content logged)
  if (process.env.NODE_ENV !== 'test') {
    console.log(
      `[AdaptiveEngine] userId=${userId} topic="${selectedTopic}" pattern="${selectedPattern}" ` +
      `targetDiff=${diffResult.targetDifficulty} selectedDiff=${qResult.selectedDifficulty} ` +
      `reasons=[${decision.reasonCodes.join(',')}]`
    );
  }

  return {
    question: qResult.question,
    decision,
  };
};

module.exports = {
  getNextQuestion,
};
