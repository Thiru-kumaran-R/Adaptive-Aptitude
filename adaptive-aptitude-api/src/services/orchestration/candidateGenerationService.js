'use strict';

/**
 * Candidate Generation Service — Phase 9
 *
 * Implements candidate generation for all canonical action types:
 *   - PREREQUISITE_REMEDIATION (Class 0)
 *   - RETENTION_RESCUE (OVERDUE_REVISION Class 0, DUE_TODAY_REVISION Class 1)
 *   - CURRICULUM_ADVANCEMENT (Class 2)
 *   - PACING_CALIBRATION (Class 2)
 *   - EXAM_BENCHMARK (Class 2)
 *   - DIAGNOSTIC_ASSESSMENT (Fallbacks: NEW_USER_NO_HISTORY, NO_ACTIVE_STUDY_PLAN)
 */

const Goal = require('../../models/goalModel');
const StudyPlan = require('../../models/studyPlanModel');
const DailyObjective = require('../../models/dailyObjectiveModel');
const StudentProgress = require('../../models/studentProgressModel');
const RevisionItem = require('../../models/revisionItemModel');
const Attempt = require('../../models/attemptModel');

const patternRegistryService = require('../patternRegistryService');
const hierarchyService = require('../hierarchyService');
const readinessService = require('../analytics/readinessService');
const speedAccuracyMatrixService = require('../analytics/speedAccuracyMatrixService');

const {
  DEFAULT_DAILY_QUESTION_BUDGET,
  MIN_DAILY_QUESTION_BUDGET,
  MAX_DAILY_QUESTION_BUDGET,
  REVISION_BUDGET_RATIO,
  FALLBACK_SECONDS_PER_QUESTION,
  ACTION_TYPES,
  ACTION_SUBTYPES,
  POLICY_CLASSES,
} = require('../../config/orchestrationConfig');

const {
  roundTo,
  getLogicalDayBoundaries,
  calculateDeadlineProximityBonus,
  buildActionId,
} = require('./orchestrationUtils');

const {
  getTopicRegistryIndex,
  calculateUrgencyScore,
  compareCandidates,
} = require('./urgencyScoringService');

const {
  buildAdaptivePracticeIntent,
  buildRevisionPracticeIntent,
  buildMockAssessmentIntent,
  buildDiagnosticAssessmentIntent,
} = require('./executionIntentBuilder');

/**
 * Calculates estimated minutes for an activity based on median correct speed.
 *
 * @param {number} prescribedQuestions
 * @param {Object|null} speedTiming
 * @returns {number|null}
 */
const calculateDurationMinutes = (prescribedQuestions, speedTiming) => {
  if (prescribedQuestions === 0) return null;
  let secondsPerQuestion = FALLBACK_SECONDS_PER_QUESTION; // 90
  if (
    speedTiming &&
    Number.isFinite(speedTiming.medianTimeCorrectSeconds) &&
    speedTiming.medianTimeCorrectSeconds > 0
  ) {
    secondsPerQuestion = speedTiming.medianTimeCorrectSeconds;
  }
  return Math.ceil((prescribedQuestions * secondsPerQuestion) / 60);
};

/**
 * Resolves the pacingTargetTopic according to Priority A / B / C hierarchy.
 *
 * @param {Object} params
 * @param {Object|null} params.activeDailyObjective
 * @param {Map<string, number>} params.progressMap
 * @param {Object|null} params.selectedActivePlan
 * @returns {string|null}
 */
const resolvePacingTargetTopic = ({
  activeDailyObjective,
  progressMap,
  selectedActivePlan,
}) => {
  // Priority A: Remaining daily objective target patterns
  if (activeDailyObjective && Array.isArray(activeDailyObjective.patterns)) {
    const candidatePatterns = activeDailyObjective.patterns
      .map((p) => {
        const remaining = Math.max(0, (p.targetQuestions || 0) - (p.completedQuestions || 0));
        return {
          pattern: p.pattern,
          topic: activeDailyObjective.topic,
          remainingTargetQuestions: remaining,
        };
      })
      .filter((p) => p.remainingTargetQuestions > 0);

    if (candidatePatterns.length > 0) {
      candidatePatterns.sort((a, b) => {
        const masteryA = progressMap.get(`${a.topic}:::${a.pattern}`) ?? 0.0;
        const masteryB = progressMap.get(`${b.topic}:::${b.pattern}`) ?? 0.0;
        if (masteryA !== masteryB) return masteryA - masteryB;

        if (a.remainingTargetQuestions !== b.remainingTargetQuestions) {
          return b.remainingTargetQuestions - a.remainingTargetQuestions;
        }

        const topicIdxA = getTopicRegistryIndex(a.topic);
        const topicIdxB = getTopicRegistryIndex(b.topic);
        if (topicIdxA !== topicIdxB) return topicIdxA - topicIdxB;

        const patIdxA = patternRegistryService.getPatternRegistryIndex(a.pattern);
        const patIdxB = patternRegistryService.getPatternRegistryIndex(b.pattern);
        if (patIdxA !== patIdxB) return patIdxA - patIdxB;

        return a.pattern.localeCompare(b.pattern);
      });

      return candidatePatterns[0].topic;
    }
  }

  // Priority B: Deduplicate topics in selectedActivePlan.targets in registry order
  if (selectedActivePlan && Array.isArray(selectedActivePlan.targets) && selectedActivePlan.targets.length > 0) {
    const topicSet = new Set();
    for (const t of selectedActivePlan.targets) {
      if (t && t.topic) {
        topicSet.add(t.topic);
      }
    }
    const topics = Array.from(topicSet);
    if (topics.length > 0) {
      topics.sort((a, b) => getTopicRegistryIndex(a) - getTopicRegistryIndex(b));
      return topics[0];
    }
  }

  // Priority C: Suppressed
  return null;
};

/**
 * Generates all candidate orchestration actions and context for a student.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {Object|null} params.goal
 * @param {boolean} params.explicitGoalProvided
 * @param {Date} params.referenceNow
 * @param {Object|null} [params.policySnapshot=null]
 * @returns {Promise<Object>}
 */
const generateCandidates = async ({
  userId,
  goal,
  explicitGoalProvided,
  referenceNow,
  policySnapshot = null,
}) => {
  // ── Step 1: Goal & StudyPlan Resolution ──────────────────────────────────
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

  // ── Step 2: Deadline Proximity & Day Boundaries ──────────────────────────
  const { daysToDeadline, deadlineProximityBonus } = calculateDeadlineProximityBonus(
    selectedGoal,
    referenceNow
  );
  const { todayStartUtc, tomorrowStartUtc } = getLogicalDayBoundaries(referenceNow);

  // ── Step 3: DailyObjective Resolution ────────────────────────────────────
  let activeDailyObjective = null;
  if (selectedActivePlan) {
    activeDailyObjective = await DailyObjective.findOne({
      userId,
      planId: selectedActivePlan._id,
      date: { $gte: todayStartUtc, $lt: tomorrowStartUtc },
      status: { $in: ['pending', 'in_progress'] },
    }).lean();
  }

  // ── Step 4: Daily Question Budget ────────────────────────────────────────
  let dailyQuestionBudget = DEFAULT_DAILY_QUESTION_BUDGET; // 30
  if (activeDailyObjective && Array.isArray(activeDailyObjective.patterns)) {
    const remainingTargetQuestions = activeDailyObjective.patterns.reduce(
      (sum, p) => sum + Math.max(0, (p.targetQuestions || 0) - (p.completedQuestions || 0)),
      0
    );
    if (remainingTargetQuestions > 0) {
      dailyQuestionBudget = Math.max(
        MIN_DAILY_QUESTION_BUDGET,
        Math.min(MAX_DAILY_QUESTION_BUDGET, remainingTargetQuestions)
      );
    }
  }

  // ── Step 5: Batch Load Supporting History & Progress ─────────────────────
  const [attemptCount, studentProgressDocs] = await Promise.all([
    Attempt.countDocuments({ userId }),
    StudentProgress.find({ userId }).lean(),
  ]);

  const progressCount = studentProgressDocs.length;
  const progressMap = new Map();
  for (const sp of studentProgressDocs) {
    progressMap.set(`${sp.topic}:::${sp.pattern}`, sp.mastery);
  }

  // Build planTargetKeySet for O(1) alignment checks
  const planTargetKeySet = new Set();
  if (selectedActivePlan && Array.isArray(selectedActivePlan.targets)) {
    for (const t of selectedActivePlan.targets) {
      if (t && t.topic && t.pattern) {
        planTargetKeySet.add(`${t.topic}:::${t.pattern}`);
      }
    }
  }

  // Batch query speed-accuracy matrix once per request
  const speedResult = await speedAccuracyMatrixService.getSpeedAccuracyMatrix(
    userId,
    30,
    null,
    referenceNow
  );
  const speedTiming = speedResult.speedAccuracyMatrix;

  // ── Step 6: Diagnostic Fallback Checks ───────────────────────────────────
  // 6.1 Brand-New Student Fallback
  if (attemptCount === 0 && progressCount === 0) {
    // Select first foundational pattern in canonical registry order: Algebra / Linear Equations & Systems of Equations
    const topic = 'Algebra';
    const pattern = 'Linear Equations & Systems of Equations';
    const prescribedQuestions = 10;
    const estimatedMinutes = calculateDurationMinutes(prescribedQuestions, speedTiming);

    const fallbackAction = {
      actionId: buildActionId({
        actionType: ACTION_TYPES.DIAGNOSTIC_ASSESSMENT,
        actionSubtype: ACTION_SUBTYPES.FOUNDATIONAL_DIAGNOSTIC,
        topic,
        pattern,
      }),
      actionType: ACTION_TYPES.DIAGNOSTIC_ASSESSMENT,
      actionSubtype: ACTION_SUBTYPES.FOUNDATIONAL_DIAGNOSTIC,
      policyPriorityClass: null,
      urgencyScore: null,
      priorityTier: 'normal',
      topic,
      pattern,
      prescribedQuestions,
      estimatedMinutes,
      rationale: {
        reasonCode: 'NEW_STUDENT_BASELINE',
        description: `Initial diagnostic assessment on foundational pattern "${pattern}".`,
      },
      executionIntent: buildDiagnosticAssessmentIntent({
        userId,
        topic,
        pattern,
      }),
    };

    return {
      status: 'insufficient_data',
      reason: 'NEW_USER_NO_HISTORY',
      fallbackAction,
      candidates: [],
      dailyQuestionBudget: 10,
      selectedGoal,
      selectedActivePlan,
      activeDailyObjective,
      speedTiming,
      referenceNow,
      policySnapshot,
    };
  }

  // 6.2 No Active Plan Fallback
  if (!selectedActivePlan) {
    // Sort all foundational patterns
    const allCanonical = patternRegistryService.getAllCanonicalPatterns();
    const foundational = allCanonical.filter((p) => {
      const prereqs = hierarchyService.getPrerequisites(p.pattern);
      return !prereqs || prereqs.length === 0;
    });

    foundational.sort((a, b) => {
      const masteryA = progressMap.get(`${a.topic}:::${a.pattern}`) ?? 0.0;
      const masteryB = progressMap.get(`${b.topic}:::${b.pattern}`) ?? 0.0;
      if (masteryA !== masteryB) return masteryA - masteryB;

      const topIdxA = getTopicRegistryIndex(a.topic);
      const topIdxB = getTopicRegistryIndex(b.topic);
      if (topIdxA !== topIdxB) return topIdxA - topIdxB;

      const patIdxA = patternRegistryService.getPatternRegistryIndex(a.pattern);
      const patIdxB = patternRegistryService.getPatternRegistryIndex(b.pattern);
      if (patIdxA !== patIdxB) return patIdxA - patIdxB;

      return a.pattern.localeCompare(b.pattern);
    });

    const chosen = foundational[0] || {
      topic: 'Algebra',
      pattern: 'Linear Equations & Systems of Equations',
    };
    const storedMastery = progressMap.get(`${chosen.topic}:::${chosen.pattern}`) ?? 0.0;
    const prescribedQuestions = 10;
    const estimatedMinutes = calculateDurationMinutes(prescribedQuestions, speedTiming);

    const fallbackAction = {
      actionId: buildActionId({
        actionType: ACTION_TYPES.DIAGNOSTIC_ASSESSMENT,
        actionSubtype: ACTION_SUBTYPES.FOUNDATIONAL_REINFORCEMENT,
        topic: chosen.topic,
        pattern: chosen.pattern,
      }),
      actionType: ACTION_TYPES.DIAGNOSTIC_ASSESSMENT,
      actionSubtype: ACTION_SUBTYPES.FOUNDATIONAL_REINFORCEMENT,
      policyPriorityClass: null,
      urgencyScore: null,
      priorityTier: 'normal',
      topic: chosen.topic,
      pattern: chosen.pattern,
      prescribedQuestions,
      estimatedMinutes,
      rationale: {
        reasonCode: 'FOUNDATIONAL_MASTERY_BUILDING',
        description: `Foundational skill reinforcement on "${chosen.pattern}" (${(storedMastery * 100).toFixed(1)}% mastery).`,
      },
      executionIntent: buildDiagnosticAssessmentIntent({
        userId,
        topic: chosen.topic,
        pattern: chosen.pattern,
      }),
    };

    return {
      status: 'partial_data',
      reason: 'NO_ACTIVE_STUDY_PLAN',
      fallbackAction,
      candidates: [],
      dailyQuestionBudget: 10,
      selectedGoal,
      selectedActivePlan: null,
      activeDailyObjective: null,
      speedTiming,
      referenceNow,
      policySnapshot,
    };
  }

  // ── Step 7: Competitive Candidate Generation ─────────────────────────────
  const candidates = [];
  const revisionBudget = Math.floor(dailyQuestionBudget * REVISION_BUDGET_RATIO);

  // 7.1 Retention Rescue (Global User Debt)
  const candidateRevisions = await RevisionItem.find({
    userId,
    status: 'scheduled',
    nextReviewDate: { $lt: tomorrowStartUtc },
  }).lean();

  for (const item of candidateRevisions) {
    const nextReviewTime = new Date(item.nextReviewDate).getTime();
    const isOverdue = nextReviewTime < todayStartUtc.getTime();
    const daysOverdue = isOverdue
      ? Math.max(0, Math.floor((todayStartUtc.getTime() - nextReviewTime) / 86400000))
      : 0;

    const actionSubtype = isOverdue
      ? ACTION_SUBTYPES.OVERDUE_REVISION
      : ACTION_SUBTYPES.DUE_TODAY_REVISION;
    const policyPriorityClass = isOverdue ? POLICY_CLASSES.CLASS_0 : POLICY_CLASSES.CLASS_1;

    const key = `${item.topic}:::${item.pattern}`;
    const storedMastery = progressMap.has(key) ? progressMap.get(key) : 0.0;
    const isPlanAligned = planTargetKeySet.has(key);

    const { urgencyScore, priorityTier, baseWeight } = calculateUrgencyScore({
      actionType: ACTION_TYPES.RETENTION_RESCUE,
      actionSubtype,
      storedMastery,
      isPlanAligned,
      deadlineProximityBonus: 0.0,
      daysOverdue,
      policySnapshot,
    });

    const rawRetentionQuestions = Math.min(10, revisionBudget);
    const prescribedQuestions = rawRetentionQuestions >= 1 ? rawRetentionQuestions : 0;
    const estimatedMinutes = calculateDurationMinutes(prescribedQuestions, speedTiming);

    const description = isOverdue
      ? `Spaced revision for "${item.pattern}" is overdue by ${daysOverdue} days. Immediate review required to prevent memory loss.`
      : `Scheduled revision for "${item.pattern}" is due today.`;

    const reasonCode = isOverdue
      ? 'SPACED_MEMORY_DECAY_OVERDUE'
      : 'SPACED_RETENTION_DUE';

    candidates.push({
      actionId: buildActionId({
        actionType: ACTION_TYPES.RETENTION_RESCUE,
        actionSubtype,
        topic: item.topic,
        pattern: item.pattern,
        revisionItemId: String(item._id),
      }),
      actionType: ACTION_TYPES.RETENTION_RESCUE,
      actionSubtype,
      policyPriorityClass,
      urgencyScore,
      priorityTier,
      baseWeight,
      storedMastery,
      topicIndex: getTopicRegistryIndex(item.topic),
      patternIndex: patternRegistryService.getPatternRegistryIndex(item.pattern),
      topic: item.topic,
      pattern: item.pattern,
      revisionItemId: String(item._id),
      prescribedQuestions,
      rawActionQuestions: rawRetentionQuestions,
      estimatedMinutes,
      rationale: {
        reasonCode,
        description,
      },
      executionIntent: buildRevisionPracticeIntent({
        userId,
        revisionItemId: String(item._id),
        topic: item.topic,
        pattern: item.pattern,
      }),
    });
  }

  // 7.2 Prerequisite Remediation
  let readinessResult = null;
  if (selectedGoal && selectedGoal.status === 'active') {
    readinessResult = await readinessService.getGoalReadiness(
      userId,
      selectedGoal._id,
      referenceNow
    );

    const bottlenecks = readinessResult.criticalPrerequisiteBottlenecks || [];
    for (const b of bottlenecks) {
      if (
        planTargetKeySet.has(`${patternRegistryService.getTopicForPattern(b.targetPattern)}:::${b.targetPattern}`) &&
        b.prerequisiteMastery < 0.70
      ) {
        const prereqTopic = patternRegistryService.getTopicForPattern(b.unmasteredPrerequisite);
        const { urgencyScore, priorityTier, baseWeight } = calculateUrgencyScore({
          actionType: ACTION_TYPES.PREREQUISITE_REMEDIATION,
          actionSubtype: ACTION_SUBTYPES.BLOCKING_PREREQUISITE,
          storedMastery: b.prerequisiteMastery,
          isPlanAligned: true,
          deadlineProximityBonus: 0.0,
          daysOverdue: 0,
          policySnapshot,
        });

        const rawQuestions = 5 + Math.floor((1.0 - b.prerequisiteMastery) * 5);
        const prescribedQuestions = Math.min(10, Math.max(5, rawQuestions));
        const estimatedMinutes = calculateDurationMinutes(prescribedQuestions, speedTiming);

        candidates.push({
          actionId: buildActionId({
            actionType: ACTION_TYPES.PREREQUISITE_REMEDIATION,
            actionSubtype: ACTION_SUBTYPES.BLOCKING_PREREQUISITE,
            topic: prereqTopic,
            pattern: b.unmasteredPrerequisite,
            blockedTargetPattern: b.targetPattern,
          }),
          actionType: ACTION_TYPES.PREREQUISITE_REMEDIATION,
          actionSubtype: ACTION_SUBTYPES.BLOCKING_PREREQUISITE,
          policyPriorityClass: POLICY_CLASSES.CLASS_0,
          urgencyScore,
          priorityTier,
          baseWeight,
          storedMastery: b.prerequisiteMastery,
          topicIndex: getTopicRegistryIndex(prereqTopic),
          patternIndex: patternRegistryService.getPatternRegistryIndex(b.unmasteredPrerequisite),
          topic: prereqTopic,
          pattern: b.unmasteredPrerequisite,
          blockedTarget: {
            topic: patternRegistryService.getTopicForPattern(b.targetPattern),
            pattern: b.targetPattern,
          },
          prescribedQuestions,
          rawActionQuestions: prescribedQuestions,
          estimatedMinutes,
          rationale: {
            reasonCode: 'UNMET_PREREQUISITE_BLOCK',
            description: `Prerequisite "${b.unmasteredPrerequisite}" (${Math.round(b.prerequisiteMastery * 100)}% mastery) blocks curriculum target "${b.targetPattern}".`,
          },
          executionIntent: buildAdaptivePracticeIntent({
            userId,
            topic: prereqTopic,
            pattern: b.unmasteredPrerequisite,
            planId: String(selectedActivePlan._id),
          }),
        });
      }
    }
  }

  // 7.3 Curriculum Advancement
  if (activeDailyObjective && Array.isArray(activeDailyObjective.patterns)) {
    for (const p of activeDailyObjective.patterns) {
      const remaining = Math.max(0, (p.targetQuestions || 0) - (p.completedQuestions || 0));
      if (remaining > 0) {
        const topic = activeDailyObjective.topic;
        const pattern = p.pattern;
        const key = `${topic}:::${pattern}`;
        const storedMastery = progressMap.has(key) ? progressMap.get(key) : 0.0;

        const { urgencyScore, priorityTier, baseWeight } = calculateUrgencyScore({
          actionType: ACTION_TYPES.CURRICULUM_ADVANCEMENT,
          actionSubtype: ACTION_SUBTYPES.DAILY_OBJECTIVE_TARGET,
          storedMastery,
          isPlanAligned: true,
          deadlineProximityBonus,
          daysOverdue: 0,
          policySnapshot,
        });

        const rawQuestions = Math.min(15, remaining);
        const prescribedQuestions = rawQuestions;
        const estimatedMinutes = calculateDurationMinutes(prescribedQuestions, speedTiming);

        candidates.push({
          actionId: buildActionId({
            actionType: ACTION_TYPES.CURRICULUM_ADVANCEMENT,
            actionSubtype: ACTION_SUBTYPES.DAILY_OBJECTIVE_TARGET,
            topic,
            pattern,
          }),
          actionType: ACTION_TYPES.CURRICULUM_ADVANCEMENT,
          actionSubtype: ACTION_SUBTYPES.DAILY_OBJECTIVE_TARGET,
          policyPriorityClass: POLICY_CLASSES.CLASS_2,
          urgencyScore,
          priorityTier,
          baseWeight,
          storedMastery,
          topicIndex: getTopicRegistryIndex(topic),
          patternIndex: patternRegistryService.getPatternRegistryIndex(pattern),
          topic,
          pattern,
          prescribedQuestions,
          rawActionQuestions: rawQuestions,
          estimatedMinutes,
          rationale: {
            reasonCode: 'DAILY_CURRICULUM_QUOTA',
            description: `Daily study plan target for "${pattern}". ${remaining} questions remaining to complete objective.`,
          },
          executionIntent: buildAdaptivePracticeIntent({
            userId,
            topic,
            pattern,
            planId: String(selectedActivePlan._id),
          }),
        });
      }
    }
  }

  // 7.4 Exam Benchmark
  if (
    selectedGoal &&
    selectedGoal.status === 'active' &&
    daysToDeadline !== null &&
    daysToDeadline >= 0 &&
    daysToDeadline < 14 &&
    readinessResult &&
    readinessResult.readinessStatus !== 'insufficient_data' &&
    readinessResult.components?.eligibleMockPerformance?.eligibleMocksCount === 0
  ) {
    const { urgencyScore, priorityTier, baseWeight } = calculateUrgencyScore({
      actionType: ACTION_TYPES.EXAM_BENCHMARK,
      actionSubtype: ACTION_SUBTYPES.GOAL_BENCHMARK_MOCK,
      storedMastery: null,
      isPlanAligned: true,
      deadlineProximityBonus,
      daysOverdue: 0,
      policySnapshot,
    });

    candidates.push({
      actionId: buildActionId({
        actionType: ACTION_TYPES.EXAM_BENCHMARK,
        actionSubtype: ACTION_SUBTYPES.GOAL_BENCHMARK_MOCK,
        goalId: String(selectedGoal._id),
      }),
      actionType: ACTION_TYPES.EXAM_BENCHMARK,
      actionSubtype: ACTION_SUBTYPES.GOAL_BENCHMARK_MOCK,
      policyPriorityClass: POLICY_CLASSES.CLASS_2,
      urgencyScore,
      priorityTier,
      baseWeight,
      storedMastery: null,
      topicIndex: 999999,
      patternIndex: Infinity,
      topic: null,
      pattern: null,
      goalId: String(selectedGoal._id),
      prescribedQuestions: 0,
      rawActionQuestions: 0,
      estimatedMinutes: null,
      rationale: {
        reasonCode: 'DEADLINE_MOCK_EVIDENCE_NEEDED',
        description: `Goal deadline is in ${daysToDeadline} days with no eligible goal-aligned mock evidence on record.`,
      },
      executionIntent: buildMockAssessmentIntent({
        goalId: String(selectedGoal._id),
      }),
    });
  }

  // 7.5 Pacing Calibration
  const rushingRisk = speedTiming?.rushingRiskScore;
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

      const { urgencyScore, priorityTier, baseWeight } = calculateUrgencyScore({
        actionType: ACTION_TYPES.PACING_CALIBRATION,
        actionSubtype: ACTION_SUBTYPES.RUSHING_REMEDIATION,
        storedMastery: topicMastery,
        hasProgressEvidence,
        isPlanAligned: isTopicPlanAligned,
        deadlineProximityBonus: 0.0,
        daysOverdue: 0,
        policySnapshot,
      });

      const prescribedQuestions = 5;
      const estimatedMinutes = calculateDurationMinutes(prescribedQuestions, speedTiming);

      candidates.push({
        actionId: buildActionId({
          actionType: ACTION_TYPES.PACING_CALIBRATION,
          actionSubtype: ACTION_SUBTYPES.RUSHING_REMEDIATION,
          topic: pacingTargetTopic,
        }),
        actionType: ACTION_TYPES.PACING_CALIBRATION,
        actionSubtype: ACTION_SUBTYPES.RUSHING_REMEDIATION,
        policyPriorityClass: POLICY_CLASSES.CLASS_2,
        urgencyScore,
        priorityTier,
        baseWeight,
        storedMastery: topicMastery,
        topicIndex: getTopicRegistryIndex(pacingTargetTopic),
        patternIndex: Infinity,
        topic: pacingTargetTopic,
        pattern: null,
        prescribedQuestions,
        rawActionQuestions: prescribedQuestions,
        estimatedMinutes,
        rationale: {
          reasonCode: 'HIGH_RUSHING_RISK_DETECTED',
          description: `Overall rushing risk is high: ${(rushingRisk * 100).toFixed(1)}% of classified errors were fast rushing errors. Complete a deliberate 5-question pacing drill on the current focus topic: ${pacingTargetTopic}.`,
        },
        executionIntent: buildAdaptivePracticeIntent({
          userId,
          topic: pacingTargetTopic,
          pattern: null,
          planId: selectedActivePlan ? String(selectedActivePlan._id) : null,
        }),
      });
    }
  }

  // ── Step 8: Sort Candidates by 7-Tier Comparator ─────────────────────────
  candidates.sort(compareCandidates);

  return {
    status: 'calculated',
    reason: candidates.length > 0 ? 'NEXT_ACTION_RESOLVED' : 'NO_ELIGIBLE_ACTION',
    fallbackAction: null,
    candidates,
    dailyQuestionBudget,
    selectedGoal,
    selectedActivePlan,
    activeDailyObjective,
    speedTiming,
    referenceNow,
    policySnapshot,
  };
};

module.exports = {
  calculateDurationMinutes,
  resolvePacingTargetTopic,
  generateCandidates,
};
