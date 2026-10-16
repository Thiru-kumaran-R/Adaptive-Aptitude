'use strict';

/**
 * Revision State Transition Helper — Phase 5: Spaced Revision Engine
 *
 * Pure function state machine governing RevisionItem transitions.
 * Reused identically by both live attempt processing and historical state rebuilds.
 *
 * Explicit Rule Precedence:
 *   1. IF source === 'revision' AND isCorrect === false:
 *      Revision failure reset (stage 0, interval 1d, reset consecutive successes).
 *   2. ELSE IF source === 'revision' AND isCorrect === true:
 *      Advance interval stage (1d -> 3d -> 7d -> 14d -> 30d).
 *      At 30-day review: completes only if mastery >= 0.85; else reschedules 30d.
 *   3. ELSE IF source !== 'revision' AND isCorrect === false:
 *      Normal incorrect attempt schedules/resets item (stage 0, interval 1d).
 *   4. ELSE:
 *      Correct non-revision attempt does NOT advance revision stage.
 */

const {
  REVISION_INTERVAL_DAYS,
  REVISION_COMPLETION_MASTERY,
  REVISION_REASON_CODES,
  REVISION_ALGORITHM_VERSION,
} = require('../../config/revisionConfig');
const { normalizeLogicalDate, addLogicalDays } = require('../../utils/dateUtils');

/**
 * Computes the next RevisionItem state from an attempt and current state.
 *
 * @param {Object|null} currentState Existing RevisionItem (or null)
 * @param {Object} attempt Attempt document
 * @param {number} mastery Current student mastery for this pattern (0 to 1)
 * @param {Date|string} [referenceDate] Optional reference date for deterministic testing
 * @returns {{ state: Object|null, reasonCode: string|null, changed: boolean }}
 */
const transitionRevisionState = (currentState, attempt, mastery = 0, referenceDate = null) => {
  const attemptIdStr = attempt._id ? attempt._id.toString() : null;

  // Durable idempotency check:
  // Reject immediate duplicates via lastProcessedAttemptId,
  // AND non-consecutive duplicates via bounded processedAttemptIds ring buffer.
  const isDuplicate =
    currentState &&
    attemptIdStr &&
    ((currentState.lastProcessedAttemptId && currentState.lastProcessedAttemptId.toString() === attemptIdStr) ||
     (Array.isArray(currentState.processedAttemptIds) &&
      currentState.processedAttemptIds.some((id) => id && id.toString() === attemptIdStr)));

  if (isDuplicate) {
    return { state: currentState, reasonCode: null, changed: false };
  }

  // Compute bounded processedAttemptIds array (capped at 50)
  const computeProcessedIds = () => {
    const existing = (currentState?.processedAttemptIds || []).map((id) =>
      id?.toString ? id.toString() : String(id)
    );
    if (attemptIdStr && !existing.includes(attemptIdStr)) {
      existing.push(attemptIdStr);
    }
    while (existing.length > 50) {
      existing.shift();
    }
    return existing;
  };
  const processedAttemptIds = computeProcessedIds();

  const logicalDate = normalizeLogicalDate(referenceDate || attempt.attemptedAt || new Date());

  // Rule 1: Failed revision attempt
  if (attempt.source === 'revision' && !attempt.isCorrect) {
    return {
      state: {
        userId: attempt.userId,
        topic: attempt.topic,
        pattern: attempt.pattern,
        stage: 0,
        intervalDays: 1,
        nextReviewDate: addLogicalDays(logicalDate, 1),
        lastReviewedAt: attempt.attemptedAt || new Date(),
        lastOutcome: 'incorrect',
        consecutiveRevisionSuccesses: 0,
        status: 'scheduled',
        triggerAttemptId: attempt._id,
        lastProcessedAttemptId: attempt._id,
        processedAttemptIds,
        algorithmVersion: REVISION_ALGORITHM_VERSION,
      },
      reasonCode: REVISION_REASON_CODES.REVISION_FAILURE_RESET,
      changed: true,
    };
  }

  // Rule 2: Successful revision attempt
  if (attempt.source === 'revision' && attempt.isCorrect) {
    const currentStage = currentState ? currentState.stage : 0;
    const finalStageIndex = REVISION_INTERVAL_DAYS.length - 1;

    // Check if we are at the final stage (stage 4, 30 days)
    if (currentStage >= finalStageIndex) {
      if (mastery >= REVISION_COMPLETION_MASTERY) {
        return {
          state: {
            userId: attempt.userId,
            topic: attempt.topic,
            pattern: attempt.pattern,
            stage: currentStage,
            intervalDays: 30,
            nextReviewDate: addLogicalDays(logicalDate, 30),
            lastReviewedAt: attempt.attemptedAt || new Date(),
            lastOutcome: 'correct',
            consecutiveRevisionSuccesses: (currentState?.consecutiveRevisionSuccesses || 0) + 1,
            status: 'completed',
            triggerAttemptId: currentState?.triggerAttemptId || attempt._id,
            lastProcessedAttemptId: attempt._id,
            processedAttemptIds,
            algorithmVersion: REVISION_ALGORITHM_VERSION,
          },
          reasonCode: REVISION_REASON_CODES.REVISION_FINAL_STAGE_COMPLETED,
          changed: true,
        };
      } else {
        // Mastery < 0.85: stay scheduled with another 30-day review
        return {
          state: {
            userId: attempt.userId,
            topic: attempt.topic,
            pattern: attempt.pattern,
            stage: currentStage,
            intervalDays: 30,
            nextReviewDate: addLogicalDays(logicalDate, 30),
            lastReviewedAt: attempt.attemptedAt || new Date(),
            lastOutcome: 'correct',
            consecutiveRevisionSuccesses: (currentState?.consecutiveRevisionSuccesses || 0) + 1,
            status: 'scheduled',
            triggerAttemptId: currentState?.triggerAttemptId || attempt._id,
            lastProcessedAttemptId: attempt._id,
            processedAttemptIds,
            algorithmVersion: REVISION_ALGORITHM_VERSION,
          },
          reasonCode: REVISION_REASON_CODES.REVISION_FINAL_STAGE_EXTENDED,
          changed: true,
        };
      }
    } else {
      // Advance to next interval in progression [1, 3, 7, 14, 30]
      const nextStage = currentStage + 1;
      const nextInterval = REVISION_INTERVAL_DAYS[nextStage];
      return {
        state: {
          userId: attempt.userId,
          topic: attempt.topic,
          pattern: attempt.pattern,
          stage: nextStage,
          intervalDays: nextInterval,
          nextReviewDate: addLogicalDays(logicalDate, nextInterval),
          lastReviewedAt: attempt.attemptedAt || new Date(),
          lastOutcome: 'correct',
          consecutiveRevisionSuccesses: (currentState?.consecutiveRevisionSuccesses || 0) + 1,
          status: 'scheduled',
          triggerAttemptId: currentState?.triggerAttemptId || attempt._id,
          lastProcessedAttemptId: attempt._id,
          processedAttemptIds,
          algorithmVersion: REVISION_ALGORITHM_VERSION,
        },
        reasonCode: REVISION_REASON_CODES.REVISION_SUCCESS_ADVANCED,
        changed: true,
      };
    }
  }

  // Rule 3: Incorrect non-revision attempt
  if (attempt.source !== 'revision' && !attempt.isCorrect) {
    return {
      state: {
        userId: attempt.userId,
        topic: attempt.topic,
        pattern: attempt.pattern,
        stage: 0,
        intervalDays: 1,
        nextReviewDate: addLogicalDays(logicalDate, 1),
        lastReviewedAt: attempt.attemptedAt || new Date(),
        lastOutcome: 'incorrect',
        consecutiveRevisionSuccesses: 0,
        status: 'scheduled',
        triggerAttemptId: attempt._id,
        lastProcessedAttemptId: attempt._id,
        processedAttemptIds,
        algorithmVersion: REVISION_ALGORITHM_VERSION,
      },
      reasonCode: REVISION_REASON_CODES.INCORRECT_ATTEMPT_SCHEDULED,
      changed: true,
    };
  }

  // Rule 4: Correct non-revision attempt -> does not advance revision stage
  return {
    state: currentState,
    reasonCode: null,
    changed: false,
  };
};

module.exports = {
  transitionRevisionState,
};
