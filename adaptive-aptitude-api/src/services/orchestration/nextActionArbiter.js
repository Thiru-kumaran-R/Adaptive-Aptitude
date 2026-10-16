'use strict';

/**
 * Next-Action Arbiter — Phase 9
 *
 * Implements Section 11, 24, 35.1:
 *   - Resolves the single highest-priority next best action
 *   - Handles active mock test lockout (status: active_mock_in_progress)
 *   - Handles diagnostic fallback states (NEW_USER_NO_HISTORY, NO_ACTIVE_STUDY_PLAN)
 *   - Handles empty candidate states (NO_ELIGIBLE_ACTION)
 *   - Serializes clean, complete DTOs
 */

const MockSession = require('../../models/mockSessionModel');
const { generateCandidates } = require('./candidateGenerationService');
const { roundTo } = require('./orchestrationUtils');
const policyGovernanceService = require('../governance/policyGovernanceService');

/**
 * Formats an action candidate into the canonical Action DTO shape.
 *
 * @param {Object} action
 * @returns {Object}
 */
const formatActionDTO = (action) => {
  return {
    actionId: action.actionId,
    actionType: action.actionType,
    actionSubtype: action.actionSubtype,
    policyPriorityClass: action.policyPriorityClass,
    urgencyScore: roundTo(action.urgencyScore, 2),
    priorityTier: action.priorityTier,
    topic: action.topic,
    pattern: action.pattern,
    prescribedQuestions: action.prescribedQuestions,
    estimatedMinutes: action.estimatedMinutes,
    rationale: {
      reasonCode: action.rationale.reasonCode,
      description: action.rationale.description,
    },
    executionIntent: action.executionIntent,
  };
};

/**
 * Computes the Next-Best-Action for the specified user and context.
 *
 * @param {Object} orchestrationContext
 * @returns {Promise<Object>}
 */
const getNextAction = async (orchestrationContext) => {
  const { userId, goal, explicitGoalProvided, referenceNow } = orchestrationContext;

  const policySnapshot =
    orchestrationContext.policySnapshot ||
    (await policyGovernanceService.resolveActivePolicySnapshot(referenceNow));

  const policyProvenance = {
    policyVersion: policySnapshot.policyVersion,
    policyFingerprint: policySnapshot.policyFingerprint,
    policySource: policySnapshot.source,
  };

  // 1. Active Mock Test Gate
  const activeMock = await MockSession.findOne({
    userId,
    status: { $in: ['created', 'started'] },
  }).lean();

  if (activeMock) {
    return {
      status: 'active_mock_in_progress',
      reason: 'ACTIVE_MOCK_SESSION_EXISTS',
      activeMockSessionId: String(activeMock._id),
      nextAction: null,
      policyProvenance,
    };
  }

  // 2. Generate Candidate Pool
  const context = await generateCandidates({
    userId,
    goal,
    explicitGoalProvided,
    referenceNow,
    policySnapshot,
  });

  // 3. Fallback Actions (New User or No Active Plan)
  if (context.fallbackAction) {
    return {
      status: context.status,
      reason: context.reason,
      nextAction: formatActionDTO(context.fallbackAction),
      policyProvenance,
    };
  }

  // 4. No Eligible Action State
  if (!context.candidates || context.candidates.length === 0) {
    return {
      status: 'calculated',
      reason: 'NO_ELIGIBLE_ACTION',
      nextAction: null,
      policyProvenance,
    };
  }

  // 5. Normal Success State (Highest ranked candidate wins)
  const winningAction = context.candidates[0];
  return {
    status: 'calculated',
    reason: 'NEXT_ACTION_RESOLVED',
    nextAction: formatActionDTO(winningAction),
    policyProvenance,
  };
};

module.exports = {
  formatActionDTO,
  getNextAction,
};
