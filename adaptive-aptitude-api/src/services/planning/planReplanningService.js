'use strict';

/**
 * Plan Replanning Service — Phase 5: Automated Planning Engine
 *
 * Performs progress-aware, deterministic replanning:
 *   - Preserves historical completed objectives and past dates
 *   - Preserves today's objective if any progress has occurred
 *   - Removes pending future objectives and reschedules remaining unmet patterns
 *   - Reconciles updated StudyPlan targets with new DailyObjectives
 *   - Emits auditable replanning reports
 */

const DailyObjective = require('../../models/dailyObjectiveModel');
const StudyPlan = require('../../models/studyPlanModel');
const StudentProgress = require('../../models/studentProgressModel');
const { assertPlanOwnership } = require('../studyPlanService');
const { resolvePlanningScope } = require('./planningScopeService');
const { generateDailyObjectivesForHorizon } = require('./dailyObjectiveGenerationService');
const {
  PLANNING_TARGET_MASTERY,
  PLANNING_REASON_CODES,
  PLANNING_ALGORITHM_VERSION,
  DEFAULT_DAILY_QUESTION_BUDGET,
  DEFAULT_DAILY_MINUTES,
  DEFAULT_MAX_PATTERNS_PER_DAY,
} = require('../../config/planningConfig');
const {
  getLogicalToday,
  addLogicalDays,
  compareLogicalDates,
  daysBetweenInclusive,
  formatLogicalDate,
  normalizeLogicalDate,
} = require('../../utils/dateUtils');

/**
 * Re-evaluates a study plan and regenerates future pending objectives.
 *
 * @param {string} planId
 * @param {string} userId
 * @param {Object} [options]
 * @param {Date|string} [options.referenceDate]
 * @returns {Promise<Object>}
 */
const replanStudyPlan = async (planId, userId, options = {}) => {
  const plan = await assertPlanOwnership(planId, userId);

  const referenceDate = getLogicalToday(options.referenceDate);
  const cutoffDate = normalizeLogicalDate(referenceDate);

  // 1. Fetch all existing objectives for this plan
  const existingObjectives = await DailyObjective.find({ planId, userId }).sort({ date: 1 });

  const preservedObjectives = [];
  const objectivesToRemove = [];

  // Cutoff rules:
  // - Past dates (date < cutoff): immutable
  // - Completed objectives: immutable
  // - Today (date === cutoff): preserve if completedQuestions > 0 or in_progress/completed
  // - Future (date > cutoff): pending objectives eligible for replacement
  let startReplanDate = addLogicalDays(cutoffDate, 1);

  for (const obj of existingObjectives) {
    const dateComp = compareLogicalDates(obj.date, cutoffDate);
    const hasProgress =
      obj.status === 'completed' ||
      obj.status === 'in_progress' ||
      (Array.isArray(obj.patterns) && obj.patterns.some((p) => p.completedQuestions > 0));

    if (dateComp < 0 || obj.status === 'completed') {
      // Past or completed: strictly immutable
      preservedObjectives.push(obj);
    } else if (dateComp === 0) {
      // Today: preserve if progress exists OR unless explicit replan request permits replacement
      const allowReplaceToday = options.allowReplaceToday === true || options.replaceToday === true;
      if (hasProgress || !allowReplaceToday) {
        preservedObjectives.push(obj);
      } else {
        // Today has 0 progress AND explicit replan request permits today's replacement
        objectivesToRemove.push(obj);
        startReplanDate = cutoffDate;
      }
    } else {
      // Future date
      if (obj.status === 'pending') {
        objectivesToRemove.push(obj);
      } else {
        // In-progress or other non-pending future objective: preserve
        preservedObjectives.push(obj);
      }
    }
  }

  // 2. Determine remaining horizon
  const planEndDate = normalizeLogicalDate(plan.endDate);
  if (compareLogicalDates(startReplanDate, planEndDate) > 0) {
    // Plan horizon has already concluded
    return {
      success: true,
      message: 'Plan horizon has already elapsed. No future objectives to replan.',
      preservedObjectives: preservedObjectives.length,
      removedFutureObjectives: 0,
      newObjectives: 0,
      patternsRescheduled: 0,
      patternsSkippedAsMastered: 0,
      unscheduledPatterns: [],
      remainingCapacity: 0,
    };
  }

  const remainingDays = daysBetweenInclusive(startReplanDate, planEndDate);

  // Identify all dates already occupied by preserved objectives
  const preservedDateSet = new Set(
    preservedObjectives.map((o) => formatLogicalDate(o.date))
  );

  const availableDates = [];
  for (let d = 0; d < remainingDays; d++) {
    const candidateDate = addLogicalDays(startReplanDate, d);
    if (!preservedDateSet.has(formatLogicalDate(candidateDate))) {
      availableDates.push(candidateDate);
    }
  }

  // 3. Extract original patterns from StudyPlan targets
  const targetPatterns = (plan.targets || []).map((t) => t.pattern).filter(Boolean);
  const targetTopics = (plan.targets || []).map((t) => t.topic);

  // Preserve intentional includeMastered semantics from plan metadata unless explicitly overridden in options
  const includeMastered =
    options.includeMastered !== undefined
      ? options.includeMastered === true
      : plan.planningMeta?.includeMastered === true;

  // Re-resolve scope using live StudentProgress
  const scopeResolution = await resolvePlanningScope(
    userId,
    { patterns: targetPatterns.length > 0 ? targetPatterns : undefined, topics: targetPatterns.length === 0 ? Array.from(new Set(targetTopics)) : undefined },
    { includeMastered }
  );

  // 4. Daily capacity settings from plan metadata or defaults
  const dailyQuestionBudget =
    plan.planningMeta?.dailyQuestionBudget || DEFAULT_DAILY_QUESTION_BUDGET;
  const dailyMinutes = plan.planningMeta?.dailyMinutes || DEFAULT_DAILY_MINUTES;
  const maxPatternsPerDay =
    plan.planningMeta?.maxPatternsPerDay || DEFAULT_MAX_PATTERNS_PER_DAY;

  // 5. Generate new objectives for available days
  const objectiveGeneration = generateDailyObjectivesForHorizon({
    userId,
    planId: plan._id,
    goalId: plan.goalId,
    startDate: startReplanDate,
    days: availableDates.length,
    targetDates: availableDates,
    orderedPatterns: scopeResolution.orderedPatterns,
    dailyQuestionBudget,
    dailyMinutes,
    maxPatternsPerDay,
  });

  // 6. Delete replaced future pending objectives
  if (objectivesToRemove.length > 0) {
    const idsToRemove = objectivesToRemove.map((o) => o._id);
    await DailyObjective.deleteMany({ _id: { $in: idsToRemove } });
  }

  // 7. Insert new future objectives
  let createdObjectives = [];
  if (objectiveGeneration.objectives.length > 0) {
    createdObjectives = await DailyObjective.create(objectiveGeneration.objectives);
  }

  // 8. Reconcile updated StudyPlan targets with all active objectives (preserved + new)
  const allCurrentObjectives = [...preservedObjectives, ...createdObjectives];
  const combinedPatternTotals = new Map();

  for (const obj of allCurrentObjectives) {
    for (const p of obj.patterns || []) {
      combinedPatternTotals.set(
        p.pattern,
        (combinedPatternTotals.get(p.pattern) || 0) + p.targetQuestions
      );
    }
  }

  const updatedTargets = [];
  for (const [patternName, totalQuestions] of combinedPatternTotals.entries()) {
    // Find topic from existing targets or registry
    const existingTarget = (plan.targets || []).find((t) => t.pattern === patternName);
    const topic = existingTarget?.topic || objectiveGeneration.scheduledPatterns.find((p) => p.pattern === patternName)?.topic;

    updatedTargets.push({
      topic: topic || 'General',
      pattern: patternName,
      targetQuestions: totalQuestions,
      targetMastery: PLANNING_TARGET_MASTERY,
    });
  }

  await StudyPlan.updateOne(
    { _id: plan._id },
    {
      $set: {
        targets: updatedTargets,
        'planningMeta.generatedAt': new Date(),
      },
    }
  );

  const remainingCapacity = remainingDays * dailyQuestionBudget;

  return {
    success: true,
    planId: plan._id,
    algorithmVersion: PLANNING_ALGORITHM_VERSION,
    replanCutoffDate: formatLogicalDate(cutoffDate),
    startReplanDate: formatLogicalDate(startReplanDate),
    remainingDays,
    preservedObjectives: preservedObjectives.length,
    removedFutureObjectives: objectivesToRemove.length,
    newObjectives: createdObjectives.length,
    patternsRescheduled: objectiveGeneration.scheduledPatterns.length,
    patternsSkippedAsMastered: scopeResolution.patternsAlreadyMastered.length,
    unscheduledPatterns: objectiveGeneration.unscheduledPatterns.map((p) => p.pattern),
    remainingCapacity,
    reasonCodes: [
      PLANNING_REASON_CODES.FUTURE_OBJECTIVES_REPLANNED,
      ...(objectiveGeneration.capacityShortfall ? [PLANNING_REASON_CODES.CAPACITY_LIMIT_REACHED] : []),
    ],
  };
};

module.exports = {
  replanStudyPlan,
};
