'use strict';

/**
 * Planning Preview Service — Phase 5: Automated Planning Engine
 *
 * Provides non-destructive plan preview without writing any documents
 * to MongoDB (StudyPlan, DailyObjective, or RevisionItem).
 */

const { userExists } = require('../userService');
const { assertGoalOwnership } = require('../goalService');
const { resolvePlanningHorizon, validateCapacity } = require('./studyPlanGenerationService');
const { resolvePlanningScope } = require('./planningScopeService');
const { generateDailyObjectivesForHorizon } = require('./dailyObjectiveGenerationService');
const {
  DEFAULT_QUESTIONS_PER_PATTERN,
  PLANNING_TARGET_MASTERY,
  PLANNING_ALGORITHM_VERSION,
} = require('../../config/planningConfig');
const { formatLogicalDate } = require('../../utils/dateUtils');
const mongoose = require('mongoose');

/**
 * Simulates plan generation without persisting any changes.
 *
 * @param {Object} params
 * @returns {Promise<Object>} Preview summary and staged objectives
 */
const previewStudyPlan = async ({
  userId,
  goalId,
  durationPreset,
  startDate,
  targetDate,
  referenceDate,
  scope,
  dailyQuestionBudget,
  dailyMinutes,
  maxPatternsPerDay,
  includeMastered,
}) => {
  if (!userId || !(await userExists(userId))) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  if (!goalId) {
    const err = new Error('goalId is required.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  const goal = await assertGoalOwnership(goalId, userId);

  const horizon = resolvePlanningHorizon({
    durationPreset,
    startDate,
    targetDate,
    referenceDate,
  });

  const capacity = validateCapacity({
    dailyQuestionBudget,
    dailyMinutes,
    maxPatternsPerDay,
  });

  const includeMasteredFlag = includeMastered === true || scope?.includeMastered === true;
  const scopeResolution = await resolvePlanningScope(userId, scope, { includeMastered: includeMasteredFlag });

  // Use a simulated planId for preview objectives
  const mockPlanId = new mongoose.Types.ObjectId();

  const objectiveGeneration = generateDailyObjectivesForHorizon({
    userId,
    planId: mockPlanId,
    goalId: goal._id,
    startDate: horizon.startDate,
    days: horizon.days,
    orderedPatterns: scopeResolution.orderedPatterns,
    dailyQuestionBudget: capacity.dailyQuestionBudget,
    dailyMinutes: capacity.dailyMinutes,
    maxPatternsPerDay: capacity.maxPatternsPerDay,
  });

  const scheduledPatterns = objectiveGeneration.scheduledPatterns;
  const patternTotals = objectiveGeneration.patternQuestionTotals;

  const proposedTargets = [];
  for (const p of scheduledPatterns) {
    if (!proposedTargets.some((t) => t.pattern === p.pattern)) {
      proposedTargets.push({
        topic: p.topic,
        pattern: p.pattern,
        targetQuestions: patternTotals.get(p.pattern) || capacity.dailyQuestionBudget,
        targetMastery: PLANNING_TARGET_MASTERY,
      });
    }
  }

  const totalRequestedWorkload =
    (scheduledPatterns.length + objectiveGeneration.unscheduledPatterns.length) *
    DEFAULT_QUESTIONS_PER_PATTERN;
  const horizonQuestionCapacity = horizon.days * capacity.dailyQuestionBudget;
  const scheduledWorkload = Array.from(patternTotals.values()).reduce((sum, n) => sum + n, 0);
  const unscheduledWorkload =
    objectiveGeneration.unscheduledPatterns.length * DEFAULT_QUESTIONS_PER_PATTERN;

  const combinedReasonCodes = Array.from(
    new Set([...scopeResolution.reasonCodes, ...objectiveGeneration.reasonCodes])
  );

  return {
    algorithmVersion: PLANNING_ALGORITHM_VERSION,
    startDate: formatLogicalDate(horizon.startDate),
    endDate: formatLogicalDate(horizon.endDate),
    days: horizon.days,
    durationPreset: durationPreset || null,
    dailyQuestionBudget: capacity.dailyQuestionBudget,
    dailyMinutes: capacity.dailyMinutes,
    maxPatternsPerDay: capacity.maxPatternsPerDay,
    patternsRequested: scopeResolution.patternsRequested,
    prerequisitesAdded: scopeResolution.prerequisitesAdded.length,
    prerequisitesList: scopeResolution.prerequisitesAdded,
    patternsAlreadyMastered: scopeResolution.patternsAlreadyMastered.length,
    patternsScheduled: scheduledPatterns.length,
    patternsUnscheduled: objectiveGeneration.unscheduledPatterns.length,
    unscheduledPatterns: objectiveGeneration.unscheduledPatterns.map((p) => p.pattern),
    totalRequestedWorkload,
    horizonQuestionCapacity,
    scheduledWorkload,
    unscheduledWorkload,
    capacityShortfall: objectiveGeneration.capacityShortfall,
    reasonCodes: combinedReasonCodes,
    proposedTargets,
    objectives: objectiveGeneration.objectives.map((obj) => ({
      date: formatLogicalDate(obj.date),
      topic: obj.topic,
      patterns: obj.patterns,
      targetMinutes: obj.targetMinutes,
      actualMinutes: obj.actualMinutes ?? 0,
      status: obj.status,
    })),
  };
};

module.exports = {
  previewStudyPlan,
};
