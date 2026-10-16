'use strict';

/**
 * Daily Agenda Assembler — Phase 9
 *
 * Implements Section 25, 26, 27, 28, 33, 35.2:
 *   - Assembles the 4 operational segments:
 *       1. WARMUP_RETRIEVAL (RETENTION_RESCUE, max 1)
 *       2. PREREQUISITE_UNBLOCKING (PREREQUISITE_REMEDIATION, max 1)
 *       3. CORE_CURRICULUM (CURRICULUM_ADVANCEMENT, max 2)
 *       4. PACING_OR_BENCHMARK (PACING_CALIBRATION or EXAM_BENCHMARK, max 1)
 *   - Global activity cap MAX_AGENDA_ACTIVITIES = 4
 *   - Unified Question Allocator with strict budget conservation
 *   - Stamina block cap and cognitive rest checkpoints (N >= 2 -> N - 1 checkpoints)
 *   - Total estimated minutes aggregation (including 10-minute rest checkpoints)
 */

const MockSession = require('../../models/mockSessionModel');
const staminaAnalyticsService = require('../analytics/staminaAnalyticsService');
const {
  REVISION_BUDGET_RATIO,
  MAX_AGENDA_ACTIVITIES,
  ACTION_TYPES,
  AGENDA_SEGMENTS,
  CHECKPOINT_TYPE,
  CHECKPOINT_REASON_CODE,
  COGNITIVE_REST_MINUTES,
} = require('../../config/orchestrationConfig');

const {
  generateCandidates,
  calculateDurationMinutes,
} = require('./candidateGenerationService');
const { formatActionDTO } = require('./nextActionArbiter');
const policyGovernanceService = require('../governance/policyGovernanceService');

/**
 * Assembles the Daily Agenda for the specified user and context.
 *
 * @param {Object} orchestrationContext
 * @returns {Promise<Object>}
 */
const getDailyAgenda = async (orchestrationContext) => {
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
      agenda: {
        dailyQuestionBudget: 0,
        totalPrescribedQuestions: 0,
        totalEstimatedMinutes: 0,
        segments: [],
        checkpoints: [],
      },
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
    const formattedFallback = formatActionDTO(context.fallbackAction);
    return {
      status: context.status,
      reason: context.reason,
      agenda: {
        dailyQuestionBudget: 10,
        totalPrescribedQuestions: 10,
        totalEstimatedMinutes: context.fallbackAction.estimatedMinutes || 15,
        segments: [
          {
            segmentIndex: 1,
            segmentName: AGENDA_SEGMENTS.CORE_CURRICULUM,
            segmentBudget: 10,
            allocatedQuestions: 10,
            activities: [formattedFallback],
          },
        ],
        checkpoints: [],
      },
      policyProvenance,
    };
  }

  // 4. Empty Candidate State
  if (!context.candidates || context.candidates.length === 0) {
    return {
      status: 'calculated',
      reason: 'NO_ELIGIBLE_ACTION',
      agenda: {
        dailyQuestionBudget: context.dailyQuestionBudget,
        totalPrescribedQuestions: 0,
        totalEstimatedMinutes: 0,
        segments: [],
        checkpoints: [],
      },
      policyProvenance,
    };
  }

  // 5. Stamina Analysis & Max Questions Per Block
  let maxQuestionsPerBlock = 15;
  let hasHighFatigue = false;

  const staminaResult = await staminaAnalyticsService.getStaminaCurve(userId);
  const curve = staminaResult?.staminaCurve;

  if (
    curve &&
    typeof curve.fatigueDropoffPercent === 'number' &&
    curve.fatigueDropoffPercent > 25.0 &&
    curve.mockSessionsAnalyzed > 0 &&
    curve.totalQuestionsAnalyzed > 0 &&
    Number.isFinite(curve.mockSessionsAnalyzed) &&
    Number.isFinite(curve.totalQuestionsAnalyzed)
  ) {
    hasHighFatigue = true;
    const questionsPerQuartile = Math.floor(
      curve.totalQuestionsAnalyzed / (4 * curve.mockSessionsAnalyzed)
    );
    maxQuestionsPerBlock = Math.min(10, Math.max(5, questionsPerQuartile));
  }

  // 6. Segment Budgets & Allocation Execution
  const dailyQuestionBudget = context.dailyQuestionBudget;
  let remainingDailyBudget = dailyQuestionBudget;
  let globalLearningActionCount = 0;

  const admittedSegments = [];

  // Partition candidates by action type
  const retentionCandidates = context.candidates.filter(
    (c) => c.actionType === ACTION_TYPES.RETENTION_RESCUE
  );
  const prereqCandidates = context.candidates.filter(
    (c) => c.actionType === ACTION_TYPES.PREREQUISITE_REMEDIATION
  );
  const curriculumCandidates = context.candidates.filter(
    (c) => c.actionType === ACTION_TYPES.CURRICULUM_ADVANCEMENT
  );
  const pacingCandidates = context.candidates.filter(
    (c) => c.actionType === ACTION_TYPES.PACING_CALIBRATION
  );
  const benchmarkCandidates = context.candidates.filter(
    (c) => c.actionType === ACTION_TYPES.EXAM_BENCHMARK
  );

  // ── Segment 1: WARMUP_RETRIEVAL (max 1 action) ───────────────────────────
  let remainingRevisionBudget = Math.floor(dailyQuestionBudget * REVISION_BUDGET_RATIO);
  const segment1BudgetInitial = remainingRevisionBudget;
  const segment1Activities = [];

  if (retentionCandidates.length > 0 && remainingRevisionBudget >= 1 && globalLearningActionCount < MAX_AGENDA_ACTIVITIES) {
    const candidate = retentionCandidates[0];
    const rawQuestions = Math.min(10, remainingRevisionBudget);
    const allocated = Math.min(
      rawQuestions,
      remainingDailyBudget,
      remainingRevisionBudget,
      maxQuestionsPerBlock
    );

    if (allocated >= 1) {
      remainingDailyBudget -= allocated;
      remainingRevisionBudget -= allocated;
      globalLearningActionCount += 1;

      const actionDto = formatActionDTO({
        ...candidate,
        prescribedQuestions: allocated,
        estimatedMinutes: calculateDurationMinutes(allocated, context.speedTiming),
      });
      segment1Activities.push(actionDto);
    }
  }

  if (segment1Activities.length > 0) {
    const allocatedQuestions = segment1Activities.reduce((sum, a) => sum + a.prescribedQuestions, 0);
    admittedSegments.push({
      segmentName: AGENDA_SEGMENTS.WARMUP_RETRIEVAL,
      segmentBudget: segment1BudgetInitial,
      allocatedQuestions,
      activities: segment1Activities,
    });
  }

  // ── Segment 2: PREREQUISITE_UNBLOCKING (max 1 action) ────────────────────
  const segment2BudgetInitial = remainingDailyBudget;
  const segment2Activities = [];

  if (prereqCandidates.length > 0 && remainingDailyBudget >= 1 && globalLearningActionCount < MAX_AGENDA_ACTIVITIES) {
    const candidate = prereqCandidates[0];
    const allocated = Math.min(
      candidate.rawActionQuestions,
      remainingDailyBudget,
      maxQuestionsPerBlock
    );

    if (allocated >= 1) {
      remainingDailyBudget -= allocated;
      globalLearningActionCount += 1;

      const actionDto = formatActionDTO({
        ...candidate,
        prescribedQuestions: allocated,
        estimatedMinutes: calculateDurationMinutes(allocated, context.speedTiming),
      });
      segment2Activities.push(actionDto);
    }
  }

  if (segment2Activities.length > 0) {
    const allocatedQuestions = segment2Activities.reduce((sum, a) => sum + a.prescribedQuestions, 0);
    admittedSegments.push({
      segmentName: AGENDA_SEGMENTS.PREREQUISITE_UNBLOCKING,
      segmentBudget: segment2BudgetInitial,
      allocatedQuestions,
      activities: segment2Activities,
    });
  }

  // ── Segment 3: CORE_CURRICULUM (max 2 actions) ───────────────────────────
  const segment3BudgetInitial = remainingDailyBudget;
  const segment3Activities = [];

  for (const candidate of curriculumCandidates) {
    if (segment3Activities.length >= 2 || globalLearningActionCount >= MAX_AGENDA_ACTIVITIES) {
      break;
    }
    if (remainingDailyBudget < 1) {
      break;
    }

    const allocated = Math.min(
      candidate.rawActionQuestions,
      remainingDailyBudget,
      maxQuestionsPerBlock
    );

    if (allocated >= 1) {
      remainingDailyBudget -= allocated;
      globalLearningActionCount += 1;

      const actionDto = formatActionDTO({
        ...candidate,
        prescribedQuestions: allocated,
        estimatedMinutes: calculateDurationMinutes(allocated, context.speedTiming),
      });
      segment3Activities.push(actionDto);
    }
  }

  if (segment3Activities.length > 0) {
    const allocatedQuestions = segment3Activities.reduce((sum, a) => sum + a.prescribedQuestions, 0);
    admittedSegments.push({
      segmentName: AGENDA_SEGMENTS.CORE_CURRICULUM,
      segmentBudget: segment3BudgetInitial,
      allocatedQuestions,
      activities: segment3Activities,
    });
  }

  // ── Segment 4: PACING_OR_BENCHMARK (max 1 action) ────────────────────────
  const segment4BudgetInitial = remainingDailyBudget;
  const segment4Activities = [];

  // Pacing vs Benchmark Arbitration
  let segment4Winner = null;
  const hasBenchmark = benchmarkCandidates.length > 0;
  const hasPacing = pacingCandidates.length > 0;

  if (hasBenchmark && hasPacing) {
    const benchmark = benchmarkCandidates[0];
    const pacing = pacingCandidates[0];
    if (benchmark.urgencyScore !== pacing.urgencyScore) {
      segment4Winner = benchmark.urgencyScore > pacing.urgencyScore ? benchmark : pacing;
    } else {
      // Tied urgency score: EXAM_BENCHMARK wins due to higher base weight (25 vs 20)
      segment4Winner = benchmark;
    }
  } else if (hasBenchmark) {
    segment4Winner = benchmarkCandidates[0];
  } else if (hasPacing) {
    segment4Winner = pacingCandidates[0];
  }

  if (segment4Winner && globalLearningActionCount < MAX_AGENDA_ACTIVITIES) {
    if (segment4Winner.actionType === ACTION_TYPES.EXAM_BENCHMARK) {
      // 0 practice questions, does not consume dailyQuestionBudget
      globalLearningActionCount += 1;
      const actionDto = formatActionDTO(segment4Winner);
      segment4Activities.push(actionDto);
    } else if (segment4Winner.actionType === ACTION_TYPES.PACING_CALIBRATION) {
      const allocated = Math.min(
        segment4Winner.rawActionQuestions,
        remainingDailyBudget,
        maxQuestionsPerBlock
      );

      if (allocated >= 1) {
        remainingDailyBudget -= allocated;
        globalLearningActionCount += 1;

        const actionDto = formatActionDTO({
          ...segment4Winner,
          prescribedQuestions: allocated,
          estimatedMinutes: calculateDurationMinutes(allocated, context.speedTiming),
        });
        segment4Activities.push(actionDto);
      }
    }
  }

  if (segment4Activities.length > 0) {
    const allocatedQuestions = segment4Activities.reduce((sum, a) => sum + a.prescribedQuestions, 0);
    admittedSegments.push({
      segmentName: AGENDA_SEGMENTS.PACING_OR_BENCHMARK,
      segmentBudget: segment4BudgetInitial,
      allocatedQuestions,
      activities: segment4Activities,
    });
  }

  // 7. Re-index Admitted Segments Contiguously (1..N)
  const segments = admittedSegments.map((seg, idx) => ({
    segmentIndex: idx + 1,
    segmentName: seg.segmentName,
    segmentBudget: seg.segmentBudget,
    allocatedQuestions: seg.allocatedQuestions,
    activities: seg.activities,
  }));

  // 8. Cognitive Rest Checkpoint Insertion (Between Segments Only)
  const checkpoints = [];
  const N = segments.length;

  if (hasHighFatigue && N >= 2) {
    for (let i = 1; i < N; i++) {
      checkpoints.push({
        checkpointId: `rest_between_${i}_${i + 1}`,
        checkpointType: CHECKPOINT_TYPE,
        afterSegmentIndex: i,
        beforeSegmentIndex: i + 1,
        prescribedQuestions: 0,
        estimatedMinutes: COGNITIVE_REST_MINUTES,
        rationale: {
          reasonCode: CHECKPOINT_REASON_CODE,
          description:
            'Stamina analysis indicates greater than 25% fatigue drop-off. Take a 10-minute cognitive rest before the next learning segment.',
        },
        executionIntent: null,
      });
    }
  }

  // 9. Aggregation of Totals
  let totalPrescribedQuestions = 0;
  let totalEstimatedMinutes = 0;

  for (const seg of segments) {
    for (const act of seg.activities) {
      totalPrescribedQuestions += act.prescribedQuestions || 0;
      if (act.estimatedMinutes) {
        totalEstimatedMinutes += act.estimatedMinutes;
      }
    }
  }

  for (const cp of checkpoints) {
    totalEstimatedMinutes += cp.estimatedMinutes;
  }

  return {
    status: 'calculated',
    reason: 'DAILY_AGENDA_ASSEMBLED',
    agenda: {
      dailyQuestionBudget,
      totalPrescribedQuestions,
      totalEstimatedMinutes,
      segments,
      checkpoints,
    },
    policyProvenance,
  };
};

module.exports = {
  getDailyAgenda,
};
