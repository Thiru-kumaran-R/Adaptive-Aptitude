'use strict';

/**
 * StudyPlan Generation Service — Phase 5: Automated Planning Engine
 *
 * Resolves horizons, enforces conflict precedence, coordinates atomic
 * StudyPlan + DailyObjective creation, and reconciles targets.
 */

const mongoose = require('mongoose');
const StudyPlan = require('../../models/studyPlanModel');
const DailyObjective = require('../../models/dailyObjectiveModel');
const { userExists } = require('../userService');
const { assertGoalOwnership } = require('../goalService');
const { resolvePlanningScope } = require('./planningScopeService');
const { generateDailyObjectivesForHorizon } = require('./dailyObjectiveGenerationService');
const {
  DURATION_PRESETS,
  DEFAULT_DAILY_QUESTION_BUDGET,
  MIN_DAILY_QUESTION_BUDGET,
  MAX_DAILY_QUESTION_BUDGET,
  DEFAULT_DAILY_MINUTES,
  MIN_DAILY_MINUTES,
  MAX_DAILY_MINUTES,
  DEFAULT_MAX_PATTERNS_PER_DAY,
  MIN_PATTERNS_PER_DAY,
  MAX_PATTERNS_PER_DAY_LIMIT,
  DEFAULT_QUESTIONS_PER_PATTERN,
  PLANNING_TARGET_MASTERY,
  PLANNING_ALGORITHM_VERSION,
} = require('../../config/planningConfig');
const {
  normalizeLogicalDate,
  getLogicalToday,
  addLogicalDays,
  addCalendarMonths,
  compareLogicalDates,
  daysBetweenInclusive,
  formatLogicalDate,
} = require('../../utils/dateUtils');

/**
 * Resolves the planning horizon dates and day count.
 * Enforces conflict detection if both durationPreset and targetDate are provided.
 *
 * @param {Object} params
 * @param {string} [params.durationPreset]
 * @param {Date|string} [params.startDate]
 * @param {Date|string} [params.targetDate]
 * @param {Date|string} [params.referenceDate]
 * @returns {{ startDate: Date, endDate: Date, days: number }}
 */
const resolvePlanningHorizon = ({
  durationPreset,
  startDate,
  targetDate,
  referenceDate,
}) => {
  const normStart = normalizeLogicalDate(startDate || referenceDate || getLogicalToday());

  let presetEnd = null;
  let presetDays = null;

  if (durationPreset) {
    const preset = DURATION_PRESETS[durationPreset];
    if (!preset) {
      const err = new Error(
        `Invalid durationPreset "${durationPreset}". Supported presets: ${Object.keys(
          DURATION_PRESETS
        ).join(', ')}`
      );
      err.statusCode = 400;
      err.code = 'INVALID_DURATION_PRESET';
      throw err;
    }

    if (preset.type === 'days') {
      presetDays = preset.count;
      presetEnd = addLogicalDays(normStart, preset.count - 1);
    } else if (preset.type === 'months') {
      // Calendar month arithmetic: target date is start + months, inclusive end is target - 1 day
      const targetMonthDate = addCalendarMonths(normStart, preset.count);
      presetEnd = addLogicalDays(targetMonthDate, -1);
      presetDays = daysBetweenInclusive(normStart, presetEnd);
    }
  }

  let explicitEnd = null;
  let explicitDays = null;

  if (targetDate) {
    explicitEnd = normalizeLogicalDate(targetDate);
    if (compareLogicalDates(explicitEnd, normStart) < 0) {
      const err = new Error('targetDate must be on or after startDate.');
      err.statusCode = 400;
      err.code = 'INVALID_DATE_RANGE';
      throw err;
    }
    explicitDays = daysBetweenInclusive(normStart, explicitEnd);
  }

  // Conflict Precedence Rule:
  // If BOTH durationPreset and targetDate are provided, verify they resolve to the exact same horizon
  if (durationPreset && targetDate) {
    if (compareLogicalDates(presetEnd, explicitEnd) !== 0) {
      const err = new Error(
        `Planning horizon conflict: durationPreset "${durationPreset}" resolves to ${formatLogicalDate(
          presetEnd
        )} (${presetDays} days), but targetDate resolves to ${formatLogicalDate(
          explicitEnd
        )} (${explicitDays} days). Provide only one or ensure they agree.`
      );
      err.statusCode = 400;
      err.code = 'PLANNING_HORIZON_CONFLICT';
      throw err;
    }
    return { startDate: normStart, endDate: explicitEnd, days: explicitDays };
  }

  if (explicitEnd) {
    return { startDate: normStart, endDate: explicitEnd, days: explicitDays };
  }

  if (presetEnd) {
    return { startDate: normStart, endDate: presetEnd, days: presetDays };
  }

  // Default to 7-day preset if neither was supplied
  const defaultPreset = DURATION_PRESETS['7d'];
  const defaultEnd = addLogicalDays(normStart, defaultPreset.count - 1);
  return { startDate: normStart, endDate: defaultEnd, days: defaultPreset.count };
};

/**
 * Validates daily capacity parameters.
 */
const validateCapacity = ({ dailyQuestionBudget, dailyMinutes, maxPatternsPerDay }) => {
  const budget = dailyQuestionBudget != null ? parseInt(dailyQuestionBudget, 10) : DEFAULT_DAILY_QUESTION_BUDGET;
  if (isNaN(budget) || budget < MIN_DAILY_QUESTION_BUDGET || budget > MAX_DAILY_QUESTION_BUDGET) {
    const err = new Error(
      `dailyQuestionBudget must be an integer between ${MIN_DAILY_QUESTION_BUDGET} and ${MAX_DAILY_QUESTION_BUDGET}.`
    );
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const minutes = dailyMinutes != null ? parseInt(dailyMinutes, 10) : DEFAULT_DAILY_MINUTES;
  if (isNaN(minutes) || minutes < MIN_DAILY_MINUTES || minutes > MAX_DAILY_MINUTES) {
    const err = new Error(
      `dailyMinutes must be an integer between ${MIN_DAILY_MINUTES} and ${MAX_DAILY_MINUTES}.`
    );
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const patterns = maxPatternsPerDay != null ? parseInt(maxPatternsPerDay, 10) : DEFAULT_MAX_PATTERNS_PER_DAY;
  if (isNaN(patterns) || patterns < MIN_PATTERNS_PER_DAY || patterns > MAX_PATTERNS_PER_DAY_LIMIT) {
    const err = new Error(
      `maxPatternsPerDay must be an integer between ${MIN_PATTERNS_PER_DAY} and ${MAX_PATTERNS_PER_DAY_LIMIT}.`
    );
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return { dailyQuestionBudget: budget, dailyMinutes: minutes, maxPatternsPerDay: patterns };
};

/**
 * Generates and commits a new StudyPlan and DailyObjectives for a user goal.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.goalId
 * @param {string} [params.name] Optional plan name
 * @param {string} [params.durationPreset] e.g. '7d'
 * @param {Date|string} [params.startDate]
 * @param {Date|string} [params.targetDate]
 * @param {Date|string} [params.referenceDate]
 * @param {Object} params.scope { topics: [...] } or { patterns: [...] } or { allCanonicalPatterns: true }
 * @param {number} [params.dailyQuestionBudget=30]
 * @param {number} [params.dailyMinutes=60]
 * @param {number} [params.maxPatternsPerDay=3]
 * @param {boolean} [params.includeMastered=false]
 * @returns {Promise<Object>}
 */
const generateStudyPlan = async ({
  userId,
  goalId,
  name,
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
  // 1. Verify user exists
  if (!userId || !(await userExists(userId))) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // 2. Verify goal exists and belongs to user
  if (!goalId) {
    const err = new Error('goalId is required.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  const goal = await assertGoalOwnership(goalId, userId);

  // 3. Resolve planning horizon & validate conflicts
  const horizon = resolvePlanningHorizon({
    durationPreset,
    startDate,
    targetDate,
    referenceDate,
  });

  // 4. Validate capacity constraints
  const capacity = validateCapacity({
    dailyQuestionBudget,
    dailyMinutes,
    maxPatternsPerDay,
  });

  // 5. Resolve scope & topological ordering
  const includeMasteredFlag = includeMastered === true || scope?.includeMastered === true;
  const scopeResolution = await resolvePlanningScope(userId, scope, { includeMastered: includeMasteredFlag });

  // 6. Generate DailyObjective horizon documents
  const planId = new mongoose.Types.ObjectId();

  const objectiveGeneration = generateDailyObjectivesForHorizon({
    userId,
    planId,
    goalId: goal._id,
    startDate: horizon.startDate,
    days: horizon.days,
    orderedPatterns: scopeResolution.orderedPatterns,
    dailyQuestionBudget: capacity.dailyQuestionBudget,
    dailyMinutes: capacity.dailyMinutes,
    maxPatternsPerDay: capacity.maxPatternsPerDay,
  });

  // 7. Reconcile StudyPlan targets strictly with DailyObjectives
  const targets = [];
  const scheduledPatterns = objectiveGeneration.scheduledPatterns;
  const patternTotals = objectiveGeneration.patternQuestionTotals;

  for (const p of scheduledPatterns) {
    // Avoid duplicate target entries for same pattern if scheduled multiple times
    if (!targets.some((t) => t.pattern === p.pattern)) {
      targets.push({
        topic: p.topic,
        pattern: p.pattern,
        targetQuestions: patternTotals.get(p.pattern) || capacity.dailyQuestionBudget,
        targetMastery: PLANNING_TARGET_MASTERY,
      });
    }
  }

  // Calculate workloads
  const totalRequestedWorkload =
    (scheduledPatterns.length + objectiveGeneration.unscheduledPatterns.length) *
    DEFAULT_QUESTIONS_PER_PATTERN;
  const horizonQuestionCapacity = horizon.days * capacity.dailyQuestionBudget;
  const scheduledWorkload = Array.from(patternTotals.values()).reduce((sum, n) => sum + n, 0);
  const unscheduledWorkload =
    objectiveGeneration.unscheduledPatterns.length * DEFAULT_QUESTIONS_PER_PATTERN;

  const planName =
    name ||
    `${goal.title} — ${durationPreset || `${horizon.days}d`} Plan (${formatLogicalDate(
      horizon.startDate
    )})`;

  const studyPlanData = {
    _id: planId,
    userId,
    goalId: goal._id,
    name: planName,
    scope: horizon.days <= 14 ? 'short' : horizon.days <= 60 ? 'medium' : 'long',
    phase: 'core',
    startDate: horizon.startDate,
    endDate: horizon.endDate,
    status: 'active',
    targets,
    planningMeta: {
      algorithmVersion: PLANNING_ALGORITHM_VERSION,
      durationPreset: durationPreset || null,
      generatedAutomatically: true,
      dailyQuestionBudget: capacity.dailyQuestionBudget,
      dailyMinutes: capacity.dailyMinutes,
      maxPatternsPerDay: capacity.maxPatternsPerDay,
      includeMastered: includeMasteredFlag,
      generatedAt: new Date(),
    },
  };

  // 8. Commit with Transaction or Compensating Rollback
  let session = null;
  let createdPlan = null;
  let createdObjectives = [];

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const planArr = await StudyPlan.create([studyPlanData], { session });
    createdPlan = planArr[0];

    if (objectiveGeneration.objectives.length > 0) {
      createdObjectives = await DailyObjective.create(objectiveGeneration.objectives, {
        session,
        ordered: true,
      });
    }

    await session.commitTransaction();
  } catch (txErr) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_) {
        /* ignore */
      }
    }

    // Fallback: compensating rollback if transactions not supported by MongoDB standalone
    if (
      txErr.message &&
      txErr.message.includes('Transaction numbers are only allowed on a replica set member or mongos')
    ) {
      try {
        createdPlan = await StudyPlan.create(studyPlanData);
        if (objectiveGeneration.objectives.length > 0) {
          createdObjectives = await DailyObjective.create(objectiveGeneration.objectives);
        }
      } catch (insertErr) {
        // Compensating rollback: delete created plan and any objectives
        await StudyPlan.deleteOne({ _id: planId });
        await DailyObjective.deleteMany({ planId });
        throw insertErr;
      }
    } else {
      throw txErr;
    }
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (_) {
        /* ignore */
      }
    }
  }

  // Combined reason codes
  const combinedReasonCodes = Array.from(
    new Set([...scopeResolution.reasonCodes, ...objectiveGeneration.reasonCodes])
  );

  return {
    plan: createdPlan,
    objectives: createdObjectives,
    summary: {
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
    },
  };
};

module.exports = {
  resolvePlanningHorizon,
  validateCapacity,
  generateStudyPlan,
};
