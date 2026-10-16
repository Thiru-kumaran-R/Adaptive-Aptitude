'use strict';

/**
 * learningAssessmentGuard.js — Centralized User-Level Assessment Access Guard
 *
 * Enforces global finalization lockout, active mock security, and strict resource ownership
 * BEFORE context hydration, prompt construction, provider invocation, or fallback generation.
 */

const MockSession = require('../../models/mockSessionModel');
const Attempt = require('../../models/attemptModel');
const StudyPlan = require('../../models/studyPlanModel');
const DailyObjective = require('../../models/dailyObjectiveModel');
const { normalizeLogicalDate } = require('../../utils/dateUtils');
const { LEARNING_ERROR_CODES } = require('../../config/learningConfig');
const LearningError = require('../../utils/learning/LearningError');

/**
 * Executes centralized guard checks for the requesting user and endpoint.
 *
 * @param {Object} params
 * @param {string} params.userId - Requesting user ID
 * @param {string} params.endpoint - API route path ('/tutor', '/hint', '/explain-attempt', etc.)
 * @param {string} [params.taskType] - Canonical task type
 * @param {string} [params.questionId] - Target question ID for hints
 * @param {number} [params.hintLevel] - Requested hint level (1-5)
 * @param {string} [params.attemptId] - Target attempt ID for /explain-attempt
 * @param {string} [params.sessionId] - Target session ID for /mock-review
 * @param {string} [params.planId] - Target plan ID for /explain-plan
 * @param {string} [params.targetDate] - Target date string for /explain-plan
 * @returns {Promise<Object>} Any pre-fetched documents (e.g. attempt, mockSession, studyPlan, dailyObjective)
 */
async function assertAssessmentAccess({
  userId,
  endpoint,
  taskType,
  questionId,
  hintLevel,
  attemptId,
  sessionId,
  planId,
  targetDate,
}) {
  if (!userId) {
    throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'userId is required.');
  }

  // ── Step 1: Global Finalization Lockout ──────────────────────────────────
  // Check if ANY mock session for this user has finalizationState === 'in_progress'
  const finalizingSession = await MockSession.findOne({
    userId,
    finalizationState: 'in_progress',
  });

  if (finalizingSession) {
    // /explain-plan is decoupled from live mock finalization and remains allowed
    if (endpoint === '/explain-plan' || taskType === 'explain_plan') {
      // Allowed to proceed to Step 3
    } else {
      throw new LearningError(
        409,
        LEARNING_ERROR_CODES.FINALIZATION_IN_PROGRESS,
        'A mock session finalization is in progress for this user.'
      );
    }
  }

  // ── Step 2: Active Mock Sessions Check ────────────────────────────────────
  const activeSession = await MockSession.findOne({
    userId,
    status: { $in: ['created', 'started'] },
  });

  if (activeSession) {
    if (endpoint === '/mock-review' || taskType === 'mock_review') {
      throw new LearningError(
        409,
        LEARNING_ERROR_CODES.MOCK_SESSION_NOT_TERMINAL,
        'Cannot review an active mock session.'
      );
    }
    if (endpoint === '/tutor' || taskType === 'concept_tutor') {
      throw new LearningError(
        403,
        LEARNING_ERROR_CODES.ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED,
        'Tutoring is prohibited while a mock exam is active.'
      );
    }
    if (endpoint === '/hint' || taskType === 'hint') {
      throw new LearningError(
        403,
        LEARNING_ERROR_CODES.ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED,
        'Hints are prohibited while a mock exam is active.'
      );
    }
  }

  // ── Step 3: Resource Ownership & Endpoint-Specific Validation ───────────
  const preFetched = {};

  if (endpoint === '/hint' || taskType === 'hint') {
    if (hintLevel === 5) {
      const qualifyingAttempt = await Attempt.findOne({
        userId,
        questionId,
      }).sort({ attemptedAt: -1, _id: -1 });

      if (!qualifyingAttempt) {
        throw new LearningError(
          403,
          LEARNING_ERROR_CODES.ANSWER_REVEAL_LOCKED_ATTEMPT_REQUIRED,
          'Level 5 answer reveal requires a prior user-owned attempt on this question.'
        );
      }

      // If attempt was from a mock, active or finalizing session blocks it
      if (qualifyingAttempt.source === 'mock' && (activeSession || finalizingSession)) {
        if (finalizingSession) {
          throw new LearningError(
            409,
            LEARNING_ERROR_CODES.FINALIZATION_IN_PROGRESS,
            'Mock session finalization in progress.'
          );
        }
        throw new LearningError(
          403,
          LEARNING_ERROR_CODES.ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED,
          'Answer reveal for mock attempts is prohibited while mock is active.'
        );
      }
      preFetched.qualifyingAttempt = qualifyingAttempt;
    }
  }

  if (endpoint === '/explain-attempt' || taskType === 'explain_attempt') {
    if (!attemptId) {
      throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'attemptId is required.');
    }
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      throw new LearningError(404, LEARNING_ERROR_CODES.ATTEMPT_NOT_FOUND, 'Attempt not found.');
    }
    if (String(attempt.userId) !== String(userId)) {
      throw new LearningError(403, LEARNING_ERROR_CODES.FORBIDDEN, 'User does not own this attempt.');
    }

    if (attempt.source === 'mock') {
      if (!attempt.sessionId) {
        throw new LearningError(404, LEARNING_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session ID missing on attempt.');
      }
      const parentSession = await MockSession.findById(attempt.sessionId);
      if (!parentSession) {
        throw new LearningError(404, LEARNING_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Parent mock session not found.');
      }
      if (String(parentSession.userId) !== String(userId) || String(parentSession._id) !== String(attempt.sessionId)) {
        throw new LearningError(403, LEARNING_ERROR_CODES.FORBIDDEN, 'User does not own parent mock session.');
      }
      if (parentSession.status === 'abandoned') {
        throw new LearningError(400, LEARNING_ERROR_CODES.MOCK_SESSION_ABANDONED, 'Parent mock session was abandoned.');
      }
      if (['created', 'started'].includes(parentSession.status)) {
        throw new LearningError(
          403,
          LEARNING_ERROR_CODES.ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED,
          'Cannot explain attempts from an active mock session.'
        );
      }
      if (parentSession.finalizationState === 'in_progress') {
        throw new LearningError(
          409,
          LEARNING_ERROR_CODES.FINALIZATION_IN_PROGRESS,
          'Parent mock session finalization is in progress.'
        );
      }
      if (!['submitted', 'expired'].includes(parentSession.status) || parentSession.finalizationState !== 'completed') {
        throw new LearningError(
          409,
          LEARNING_ERROR_CODES.MOCK_SESSION_NOT_TERMINAL,
          'Parent mock session is not terminal or completed.'
        );
      }
      preFetched.parentSession = parentSession;
    }
    preFetched.attempt = attempt;
  }

  if (endpoint === '/mock-review' || taskType === 'mock_review') {
    if (!sessionId) {
      throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'sessionId is required.');
    }
    const mockSession = await MockSession.findById(sessionId);
    if (!mockSession) {
      throw new LearningError(404, LEARNING_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (String(mockSession.userId) !== String(userId)) {
      throw new LearningError(403, LEARNING_ERROR_CODES.FORBIDDEN, 'User does not own this mock session.');
    }
    if (mockSession.status === 'abandoned') {
      throw new LearningError(400, LEARNING_ERROR_CODES.MOCK_SESSION_ABANDONED, 'Mock session was abandoned.');
    }
    if (['created', 'started'].includes(mockSession.status)) {
      throw new LearningError(409, LEARNING_ERROR_CODES.MOCK_SESSION_NOT_TERMINAL, 'Mock session is still active.');
    }
    if (mockSession.finalizationState === 'in_progress') {
      throw new LearningError(
        409,
        LEARNING_ERROR_CODES.FINALIZATION_IN_PROGRESS,
        'Mock session finalization in progress.'
      );
    }
    if (!['submitted', 'expired'].includes(mockSession.status) || mockSession.finalizationState !== 'completed') {
      throw new LearningError(
        409,
        LEARNING_ERROR_CODES.MOCK_SESSION_NOT_TERMINAL,
        'Mock session is not terminal or completed.'
      );
    }
    preFetched.mockSession = mockSession;
  }

  if (endpoint === '/explain-plan' || taskType === 'explain_plan') {
    if (!planId) {
      throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'planId is required.');
    }
    if (!targetDate) {
      throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'targetDate is required.');
    }

    const studyPlan = await StudyPlan.findById(planId);
    if (!studyPlan) {
      throw new LearningError(404, LEARNING_ERROR_CODES.STUDY_PLAN_NOT_FOUND, 'Study plan not found.');
    }
    if (String(studyPlan.userId) !== String(userId)) {
      throw new LearningError(403, LEARNING_ERROR_CODES.FORBIDDEN, 'User does not own this study plan.');
    }

    const normalizedDate = normalizeLogicalDate(targetDate);
    const dailyObjective = await DailyObjective.findOne({
      userId,
      planId,
      date: normalizedDate,
    });

    if (!dailyObjective) {
      throw new LearningError(
        404,
        LEARNING_ERROR_CODES.DAILY_OBJECTIVE_NOT_FOUND,
        'Daily objective not found for plan and target date.'
      );
    }

    preFetched.studyPlan = studyPlan;
    preFetched.dailyObjective = dailyObjective;
  }

  return preFetched;
}

module.exports = {
  assertAssessmentAccess,
};
