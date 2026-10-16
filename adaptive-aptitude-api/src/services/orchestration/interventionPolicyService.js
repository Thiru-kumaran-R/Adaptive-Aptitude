'use strict';

/**
 * Cognitive Intervention Policy Service — Phase 9
 *
 * Implements Section 30, 31, 35.3:
 *   - Diagnostic intervention cards:
 *       1. PREREQUISITE_BOTTLENECK (sourced from Phase 8 readiness, plan-aligned, M < 0.70)
 *       2. RUSHING_CALIBRATION (rushingRiskScore >= 0.60, anchor topic resolved)
 *   - Strict severity derivation: intervention.severity = correspondingAction.priorityTier
 *   - Deterministic IDs and templates
 *   - Interventions remain observable even during active mock tests
 */

const Goal = require('../../models/goalModel');
const StudyPlan = require('../../models/studyPlanModel');
const DailyObjective = require('../../models/dailyObjectiveModel');
const StudentProgress = require('../../models/studentProgressModel');

const patternRegistryService = require('../patternRegistryService');
const readinessService = require('../analytics/readinessService');
const speedAccuracyMatrixService = require('../analytics/speedAccuracyMatrixService');

const {
  ACTION_TYPES,
  ACTION_SUBTYPES,
  INTERVENTION_CATEGORIES,
} = require('../../config/orchestrationConfig');

const {
  getLogicalDayBoundaries,
  buildInterventionId,
} = require('./orchestrationUtils');

const {
  calculateUrgencyScore,
} = require('./urgencyScoringService');

const {
  resolvePacingTargetTopic,
} = require('./candidateGenerationService');
const policyGovernanceService = require('../governance/policyGovernanceService');

/**
 * Computes active diagnostic interventions for a student.
 *
 * @param {Object} orchestrationContext
 * @returns {Promise<Object>}
 */
const getInterventions = async (orchestrationContext) => {
  const { userId, goal, explicitGoalProvided, referenceNow } = orchestrationContext;

  const policySnapshot =
    orchestrationContext.policySnapshot ||
    (await policyGovernanceService.resolveActivePolicySnapshot(referenceNow));

  const policyProvenance = {
    policyVersion: policySnapshot.policyVersion,
    policyFingerprint: policySnapshot.policyFingerprint,
    policySource: policySnapshot.source,
  };

  // 1. Goal & Active Plan Resolution
  let selectedGoal = null;
  let selectedActivePlan = null;

  if (explicitGoalProvided) {
    selectedGoal = goal;
    selectedActivePlan = await StudyPlan.findOne({
      userId,
      goalId: selectedGoal._id,
      status: 'active',
    })
      .sort({ startDate: -1, _id: 1 })
      .lean();
  } else {
    selectedActivePlan = await StudyPlan.findOne({
      userId,
      status: 'active',
    })
      .sort({ startDate: -1, _id: 1 })
      .lean();

    if (selectedActivePlan && selectedActivePlan.goalId) {
      selectedGoal = await Goal.findById(selectedActivePlan.goalId).lean();
    }
  }

  const { todayStartUtc, tomorrowStartUtc } = getLogicalDayBoundaries(referenceNow);

  // 2. Batch load progress and daily objective
  let activeDailyObjective = null;
  if (selectedActivePlan) {
    activeDailyObjective = await DailyObjective.findOne({
      userId,
      planId: selectedActivePlan._id,
      date: { $gte: todayStartUtc, $lt: tomorrowStartUtc },
      status: { $in: ['pending', 'in_progress'] },
    }).lean();
  }

  const studentProgressDocs = await StudentProgress.find({ userId }).lean();
  const progressMap = new Map();
  for (const sp of studentProgressDocs) {
    progressMap.set(`${sp.topic}:::${sp.pattern}`, sp.mastery);
  }

  const planTargetKeySet = new Set();
  if (selectedActivePlan && Array.isArray(selectedActivePlan.targets)) {
    for (const t of selectedActivePlan.targets) {
      if (t && t.topic && t.pattern) {
        planTargetKeySet.add(`${t.topic}:::${t.pattern}`);
      }
    }
  }

  const interventions = [];

  // 3. Category 1: PREREQUISITE_BOTTLENECK
  if (selectedGoal && selectedGoal.status === 'active') {
    const readinessResult = await readinessService.getGoalReadiness(
      userId,
      selectedGoal._id,
      referenceNow
    );

    const bottlenecks = readinessResult.criticalPrerequisiteBottlenecks || [];
    for (const b of bottlenecks) {
      const targetTopic = patternRegistryService.getTopicForPattern(b.targetPattern);
      if (
        planTargetKeySet.has(`${targetTopic}:::${b.targetPattern}`) &&
        b.prerequisiteMastery < 0.70
      ) {
        const prereqTopic = patternRegistryService.getTopicForPattern(b.unmasteredPrerequisite);

        // Derive severity strictly from corresponding action's priorityTier
        const { priorityTier } = calculateUrgencyScore({
          actionType: ACTION_TYPES.PREREQUISITE_REMEDIATION,
          actionSubtype: ACTION_SUBTYPES.BLOCKING_PREREQUISITE,
          storedMastery: b.prerequisiteMastery,
          isPlanAligned: true,
          deadlineProximityBonus: 0.0,
          daysOverdue: 0,
          policySnapshot,
        });

        const interventionId = buildInterventionId({
          category: INTERVENTION_CATEGORIES.PREREQUISITE_BOTTLENECK,
          topic: prereqTopic,
          pattern: b.unmasteredPrerequisite,
          blockedTargetPattern: b.targetPattern,
        });

        interventions.push({
          interventionId,
          category: INTERVENTION_CATEGORIES.PREREQUISITE_BOTTLENECK,
          severity: priorityTier,
          topic: prereqTopic,
          pattern: b.unmasteredPrerequisite,
          blockedTarget: {
            topic: targetTopic,
            pattern: b.targetPattern,
          },
          rationale: `Prerequisite "${b.unmasteredPrerequisite}" (${Math.round(b.prerequisiteMastery * 100)}% mastery) blocks curriculum target "${b.targetPattern}".`,
        });
      }
    }
  }

  // 4. Category 2: RUSHING_CALIBRATION
  const speedResult = await speedAccuracyMatrixService.getSpeedAccuracyMatrix(
    userId,
    30,
    null,
    referenceNow
  );
  const rushingRisk = speedResult?.speedAccuracyMatrix?.rushingRiskScore;

  if (rushingRisk !== null && rushingRisk !== undefined && rushingRisk >= 0.60) {
    const pacingTargetTopic = resolvePacingTargetTopic({
      activeDailyObjective,
      progressMap,
      selectedActivePlan,
    });

    if (pacingTargetTopic) {
      // Calculate topic average mastery
      const topicMasteries = [];
      for (const [key, val] of progressMap.entries()) {
        if (key.startsWith(`${pacingTargetTopic}:::`)) {
          topicMasteries.push(val);
        }
      }

      const hasProgressEvidence = topicMasteries.length > 0;
      const topicMastery = hasProgressEvidence
        ? topicMasteries.reduce((a, b) => a + b, 0) / topicMasteries.length
        : null;

      const isTopicPlanAligned = Array.isArray(selectedActivePlan?.targets)
        ? selectedActivePlan.targets.some((t) => t.topic === pacingTargetTopic)
        : false;

      // Derive severity strictly from corresponding action's priorityTier
      const { priorityTier } = calculateUrgencyScore({
        actionType: ACTION_TYPES.PACING_CALIBRATION,
        actionSubtype: ACTION_SUBTYPES.RUSHING_REMEDIATION,
        storedMastery: topicMastery,
        hasProgressEvidence,
        isPlanAligned: isTopicPlanAligned,
        deadlineProximityBonus: 0.0,
        daysOverdue: 0,
        policySnapshot,
      });

      const interventionId = buildInterventionId({
        category: INTERVENTION_CATEGORIES.RUSHING_CALIBRATION,
        topic: pacingTargetTopic,
      });

      interventions.push({
        interventionId,
        category: INTERVENTION_CATEGORIES.RUSHING_CALIBRATION,
        severity: priorityTier,
        topic: pacingTargetTopic,
        pattern: null,
        blockedTarget: null,
        rationale: `Overall rushing risk is high: ${(rushingRisk * 100).toFixed(1)}% of classified errors were fast rushing errors. Complete a deliberate 5-question pacing drill on the current focus topic: ${pacingTargetTopic}.`,
      });
    }
  }

  return {
    status: 'calculated',
    interventions,
    policyProvenance,
  };
};

module.exports = {
  getInterventions,
};
