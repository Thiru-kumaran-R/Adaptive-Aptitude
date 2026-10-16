'use strict';

/**
 * Execution Intent Builder — Phase 9
 *
 * Implements Section 29 discriminated union:
 *   - AdaptivePracticeIntent
 *   - RevisionPracticeIntent
 *   - MockAssessmentIntent
 *   - DiagnosticAssessmentIntent
 */

/**
 * Builds an AdaptivePracticeIntent.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.topic
 * @param {string|null} [params.pattern=null]
 * @param {string|null} [params.planId=null]
 * @returns {Object}
 */
const buildAdaptivePracticeIntent = ({ userId, topic, pattern = null, planId = null }) => {
  const params = { userId, topic };
  if (pattern) {
    params.pattern = pattern;
  }
  if (planId) {
    params.planId = String(planId);
  }

  return {
    capability: 'ADAPTIVE_PRACTICE',
    topic,
    pattern: pattern || null,
    planId: planId ? String(planId) : null,
    questionDelivery: {
      endpoint: '/api/v1/adaptive/next-question',
      method: 'GET',
      params,
    },
    attemptSubmissionContext: {
      endpoint: '/api/v1/attempts',
      method: 'POST',
      source: 'practice',
    },
  };
};

/**
 * Builds a RevisionPracticeIntent.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.revisionItemId
 * @param {string} params.topic
 * @param {string} params.pattern
 * @returns {Object}
 */
const buildRevisionPracticeIntent = ({ userId, revisionItemId, topic, pattern }) => {
  return {
    capability: 'REVISION_PRACTICE',
    revisionItemId: String(revisionItemId),
    topic,
    pattern,
    questionDelivery: {
      endpoint: '/api/v1/adaptive/next-question',
      method: 'GET',
      params: {
        userId,
        topic,
        pattern,
      },
    },
    attemptSubmissionContext: {
      endpoint: '/api/v1/attempts',
      method: 'POST',
      source: 'revision',
      revisionItemId: String(revisionItemId),
    },
  };
};

/**
 * Builds a MockAssessmentIntent.
 *
 * @param {Object} params
 * @param {string} params.goalId
 * @returns {Object}
 */
const buildMockAssessmentIntent = ({ goalId }) => {
  return {
    capability: 'MOCK_ASSESSMENT',
    goalId: String(goalId),
    requiresBlueprintSelection: true,
    targetEndpoint: null,
    estimatedDurationMinutes: null,
  };
};

/**
 * Builds a DiagnosticAssessmentIntent.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.topic
 * @param {string} params.pattern
 * @returns {Object}
 */
const buildDiagnosticAssessmentIntent = ({ userId, topic, pattern }) => {
  return {
    capability: 'DIAGNOSTIC_ASSESSMENT',
    deliveryMode: 'SEQUENTIAL_ADAPTIVE',
    prescribedQuestionCount: 10,
    topic,
    pattern,
    questionDelivery: {
      endpoint: '/api/v1/adaptive/next-question',
      method: 'GET',
      params: {
        userId,
        topic,
        pattern,
      },
    },
    attemptSubmissionContext: {
      endpoint: '/api/v1/attempts',
      method: 'POST',
      source: 'practice',
    },
  };
};

module.exports = {
  buildAdaptivePracticeIntent,
  buildRevisionPracticeIntent,
  buildMockAssessmentIntent,
  buildDiagnosticAssessmentIntent,
};
