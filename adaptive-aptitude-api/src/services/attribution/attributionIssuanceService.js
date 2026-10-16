'use strict';

/**
 * Attribution Issuance Service — Phase 10: PAOA
 *
 * Implements authoritative prescription issuance, execution intent preservation,
 * idempotency fingerprinting, single non-terminal slot leasing, transactional supersession,
 * and dual snapshot capture.
 */

const mongoose = require('mongoose');
const User = require('../../models/userModel');
const Goal = require('../../models/goalModel');
const StudyPlan = require('../../models/studyPlanModel');
const DailyObjective = require('../../models/dailyObjectiveModel');
const Attempt = require('../../models/attemptModel');
const StudentProgress = require('../../models/studentProgressModel');
const RevisionItem = require('../../models/revisionItemModel');
const PrescriptionExecutionRecord = require('../../models/prescriptionExecutionRecordModel');

const attributionConfig = require('../../config/attributionConfig');
const { ORCHESTRATION_ALGORITHM_VERSION } = require('../../config/orchestrationConfig');
const { computeIssuanceFingerprint } = require('../../utils/attributionFingerprint');
const { assertNoFinalizationInProgress } = require('../../middlewares/attributionGuard');
const AppError = require('../../utils/AppError');

const nextActionArbiter = require('../orchestration/nextActionArbiter');
const dailyAgendaAssembler = require('../orchestration/dailyAgendaAssembler');
const speedAccuracyMatrixService = require('../analytics/speedAccuracyMatrixService');
const readinessService = require('../analytics/readinessService');
const analyticsMathUtils = require('../analytics/analyticsMathUtils');
const hierarchyService = require('../hierarchyService');

/**
 * Builds the canonical public Action DTO from the stored record or Phase 9 action.
 */
const buildPublicActionDTO = (record, action) => {
  const sourceAction = action || {};
  const issuanceSnapshot = record.issuanceSnapshot || {};
  const rationale = sourceAction.rationale || issuanceSnapshot.rationale || null;
  const executionIntent = sourceAction.executionIntent || issuanceSnapshot.executionIntent || null;

  const blockedTarget = (sourceAction.blockedTarget && sourceAction.blockedTarget.topic && sourceAction.blockedTarget.pattern)
    ? sourceAction.blockedTarget
    : (record.blockedTargetTopic && record.blockedTargetPattern
      ? { topic: record.blockedTargetTopic, pattern: record.blockedTargetPattern }
      : undefined);

  return {
    actionId: record.actionId,
    actionType: record.actionType,
    actionSubtype: record.actionSubtype,
    priorityTier: record.priorityTier,
    policyPriorityClass: record.policyPriorityClass,
    urgencyScore: record.urgencyScore,
    topic: record.topic,
    pattern: record.pattern,
    prescribedQuestions: record.prescribedQuestions,
    estimatedMinutes: record.estimatedMinutes,
    rationale,
    executionIntent,
    ...(blockedTarget ? { blockedTarget } : {}),
  };
};

/**
 * Formats the public issuance response payload.
 */
const formatIssuanceResponse = (record, action, effectiveStatus, isExpired) => {
  return {
    prescriptionId: record.prescriptionId,
    status: record.status,
    effectiveStatus: effectiveStatus || record.status,
    isExpired: Boolean(isExpired),
    originSurface: record.originSurface,
    action: buildPublicActionDTO(record, action),
    issuedAt: record.issuedAt,
    expiresAt: record.expiresAt,
    versions: {
      phase10AlgorithmVersion: record.phase10AlgorithmVersion,
      orchestrationAlgorithmVersion: record.orchestrationAlgorithmVersion,
    },
  };
};

/**
 * Issues a new prescription or returns an existing one via idempotent replay.
 */
const issuePrescription = async ({
  userId,
  originSurface,
  goalId,
  actionId,
  idempotencyKey,
  referenceNow,
  candidateAction: programmaticCandidateAction = null,
  policyProvenance: programmaticPolicyProvenance = null,
}) => {
  if (programmaticCandidateAction && !programmaticPolicyProvenance) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Programmatic candidateAction requires accompanying policyProvenance.'
    );
  }
  // 1. Idempotency-Key validation
  if (
    !idempotencyKey ||
    typeof idempotencyKey !== 'string' ||
    idempotencyKey.trim().length === 0 ||
    idempotencyKey.trim().length > 128
  ) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Idempotency-Key header is required and must be a non-empty string of at most 128 characters.'
    );
  }
  const trimmedKey = idempotencyKey.trim();
  const trimmedUserId = String(userId).trim();

  // 2. Validate originSurface
  if (!['next_action', 'daily_agenda'].includes(originSurface)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'originSurface must be either "next_action" or "daily_agenda".'
    );
  }

  // 3. Validate actionId for daily_agenda
  if (originSurface === 'daily_agenda') {
    if (!actionId || typeof actionId !== 'string' || actionId.trim().length === 0) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'actionId is required and must be a non-empty string when originSurface is "daily_agenda".'
      );
    }
  }
  const normalizedActionId = actionId ? String(actionId).trim() : null;

  // 4. Validate optional goalId
  let resolvedGoal = null;
  if (goalId !== undefined && goalId !== null) {
    if (typeof goalId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(goalId)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Invalid goalId format. Must be a 24-character hexadecimal string.'
      );
    }
    resolvedGoal = await Goal.findById(goalId).lean();
    if (!resolvedGoal) {
      throw new AppError(404, 'GOAL_NOT_FOUND', `Goal "${goalId}" not found.`);
    }
    if (resolvedGoal.userId !== trimmedUserId) {
      throw new AppError(403, 'FORBIDDEN', `Access denied: Goal does not belong to user "${trimmedUserId}".`);
    }
  }

  // 5. Compute deterministic request fingerprint
  const currentFingerprint = computeIssuanceFingerprint(
    trimmedUserId,
    originSurface,
    resolvedGoal ? String(resolvedGoal._id) : (goalId ? String(goalId) : null),
    normalizedActionId
  );

  // 6. Sequential existing-key check (MUST happen before expensive Phase 8/9 calls)
  const existingRecord = await PrescriptionExecutionRecord.findOne({
    userId: trimmedUserId,
    issuanceIdempotencyKey: trimmedKey,
  });

  if (existingRecord) {
    if (existingRecord.issuanceRequestFingerprint !== currentFingerprint) {
      throw new AppError(
        409,
        'IDEMPOTENCY_KEY_REUSE_MISMATCH',
        'Idempotency key was previously used with a different request payload.'
      );
    }

    const isExpired =
      ['issued', 'active'].includes(existingRecord.status) &&
      referenceNow.getTime() >= existingRecord.expiresAt.getTime();
    const effectiveStatus = isExpired ? 'expired' : existingRecord.status;

    return {
      statusCode: 200,
      data: formatIssuanceResponse(
        existingRecord,
        null,
        effectiveStatus,
        isExpired || existingRecord.status === 'expired'
      ),
    };
  }

  // 7. Finalization Barrier Assertion
  await assertNoFinalizationInProgress(trimmedUserId);

  // 8. Construct Phase 9 Orchestration Context
  const orchestrationContext = {
    userId: trimmedUserId,
    goal: resolvedGoal || null,
    goalId: resolvedGoal ? String(resolvedGoal._id) : null,
    explicitGoalProvided: Boolean(resolvedGoal),
    referenceNow,
  };

  // 9. Execute Phase 9 Action Extraction
  let candidateAction = null;
  let policyProvenance = null;

  if (programmaticCandidateAction) {
    candidateAction = programmaticCandidateAction;
    policyProvenance = programmaticPolicyProvenance;
  } else if (originSurface === 'next_action') {
    const result = await nextActionArbiter.getNextAction(orchestrationContext);
    candidateAction = result?.nextAction || null;
    policyProvenance = result?.policyProvenance || null;
    if (!candidateAction) {
      throw new AppError(
        409,
        'NO_ISSUABLE_PRESCRIPTION',
        'No actionable prescription available from next-best-action arbiter.'
      );
    }
  } else {
    const result = await dailyAgendaAssembler.getDailyAgenda(orchestrationContext);
    policyProvenance = result?.policyProvenance || null;
    const candidateActivities = [];
    for (const segment of result?.agenda?.segments || []) {
      for (const activity of segment.activities || []) {
        if (activity.actionId === normalizedActionId) {
          candidateActivities.push(activity);
        }
      }
    }

    if (candidateActivities.length === 0) {
      throw new AppError(
        409,
        'NO_ISSUABLE_PRESCRIPTION',
        `Prescription action "${normalizedActionId}" not found in current daily agenda.`
      );
    }
    if (candidateActivities.length > 1) {
      throw new AppError(
        500,
        'ATTRIBUTION_ISSUANCE_FAILED',
        'Ambiguous agenda match: multiple activities matched actionId.'
      );
    }
    candidateAction = candidateActivities[0];
  }

  // 10. Verify Phase 9 Public DTO Integrity
  if (candidateAction.actionType === 'PREREQUISITE_REMEDIATION') {
    if (
      !candidateAction.blockedTarget ||
      !candidateAction.blockedTarget.topic ||
      !candidateAction.blockedTarget.pattern
    ) {
      throw new AppError(
        500,
        'ATTRIBUTION_ISSUANCE_FAILED',
        'Prerequisite remediation action missing blockedTarget metadata.'
      );
    }
  }

  // 11. Dual Issuance Snapshot Capture
  let actionSpecificSnapshot = null;
  const actionType = candidateAction.actionType;

  if (actionType === 'PREREQUISITE_REMEDIATION') {
    const prereqDoc = await StudentProgress.findOne({
      userId: trimmedUserId,
      topic: candidateAction.topic,
      pattern: candidateAction.pattern,
    }).lean();
    const prereqMastery = prereqDoc ? prereqDoc.mastery : 0;

    const allPrereqNames = hierarchyService.getPrerequisites(candidateAction.blockedTarget.pattern) || [];
    const prereqDocs = await StudentProgress.find({
      userId: trimmedUserId,
      pattern: { $in: allPrereqNames },
    }).lean();
    const prereqMap = new Map();
    for (const doc of prereqDocs) {
      prereqMap.set(doc.pattern, doc.mastery);
    }
    const allPrerequisitesForTarget = allPrereqNames.map((pName) => ({
      pattern: pName,
      mastery: prereqMap.get(pName) ?? 0,
    }));

    actionSpecificSnapshot = {
      actionType: 'PREREQUISITE_REMEDIATION',
      prerequisitePattern: candidateAction.pattern,
      prerequisiteTopic: candidateAction.topic,
      prerequisiteMastery: prereqMastery,
      blockedTargetPattern: candidateAction.blockedTarget.pattern,
      blockedTargetTopic: candidateAction.blockedTarget.topic,
      allPrerequisitesForTarget,
    };
  } else if (actionType === 'RETENTION_RESCUE') {
    const revItemId = candidateAction.executionIntent?.revisionItemId;
    if (!revItemId) {
      throw new AppError(
        500,
        'ATTRIBUTION_ISSUANCE_FAILED',
        'Retention rescue action missing revisionItemId in execution intent.'
      );
    }
    const revItem = await RevisionItem.findById(revItemId).lean();
    if (!revItem) {
      throw new AppError(
        500,
        'ATTRIBUTION_ISSUANCE_FAILED',
        `RevisionItem "${revItemId}" not found.`
      );
    }
    actionSpecificSnapshot = {
      actionType: 'RETENTION_RESCUE',
      revisionItemId: String(revItem._id),
      topic: revItem.topic,
      pattern: revItem.pattern,
      stage: revItem.stage,
      intervalDays: revItem.intervalDays,
      nextReviewDate: revItem.nextReviewDate,
      status: revItem.status,
      lastOutcome: revItem.lastOutcome ?? null,
      lastProcessedAttemptId: revItem.lastProcessedAttemptId ? String(revItem.lastProcessedAttemptId) : null,
    };
  } else if (actionType === 'CURRICULUM_ADVANCEMENT') {
    const planId = candidateAction.executionIntent?.planId;
    if (!planId) {
      throw new AppError(
        500,
        'ATTRIBUTION_ISSUANCE_FAILED',
        'Curriculum advancement action missing planId in execution intent.'
      );
    }
    const { todayStartUtc, tomorrowStartUtc } = analyticsMathUtils.getLogicalDayBoundaries(referenceNow);
    const dailyObj = await DailyObjective.findOne({
      userId: trimmedUserId,
      planId,
      date: { $gte: todayStartUtc, $lt: tomorrowStartUtc },
      status: { $in: ['pending', 'in_progress'] },
    }).lean();

    if (!dailyObj || !Array.isArray(dailyObj.patterns)) {
      throw new AppError(
        500,
        'ATTRIBUTION_ISSUANCE_FAILED',
        'Matching active DailyObjective not found for curriculum advancement.'
      );
    }
    const patEntry = dailyObj.patterns.find((p) => p.pattern === candidateAction.pattern);
    if (!patEntry) {
      throw new AppError(
        500,
        'ATTRIBUTION_ISSUANCE_FAILED',
        `Pattern "${candidateAction.pattern}" not found in active DailyObjective.`
      );
    }
    const sp = await StudentProgress.findOne({
      userId: trimmedUserId,
      topic: candidateAction.topic,
      pattern: candidateAction.pattern,
    }).lean();
    const storedMastery = sp ? sp.mastery : 0;
    const patternTargetQuestions = patEntry.targetQuestions || 0;
    const patternCompletedQuestions = patEntry.completedQuestions || 0;
    const patternRemainingQuestions = Math.max(0, patternTargetQuestions - patternCompletedQuestions);

    actionSpecificSnapshot = {
      actionType: 'CURRICULUM_ADVANCEMENT',
      topic: candidateAction.topic,
      pattern: candidateAction.pattern,
      planId: String(planId),
      dailyObjectiveId: String(dailyObj._id),
      patternTargetQuestions,
      patternCompletedQuestions,
      patternRemainingQuestions,
      storedMastery,
    };
  } else if (actionType === 'PACING_CALIBRATION') {
    const speedResult = await speedAccuracyMatrixService.getSpeedAccuracyMatrix(
      trimmedUserId,
      30,
      null,
      referenceNow
    );
    const overallRushingRiskScore = speedResult?.speedAccuracyMatrix?.rushingRiskScore ?? null;

    actionSpecificSnapshot = {
      actionType: 'PACING_CALIBRATION',
      topic: candidateAction.topic,
      overallRushingRiskScore,
      rushingRiskWindowDays: 30,
    };
  } else if (actionType === 'EXAM_BENCHMARK') {
    const examGoalId = candidateAction.executionIntent?.goalId;
    if (!examGoalId) {
      throw new AppError(
        500,
        'ATTRIBUTION_ISSUANCE_FAILED',
        'Exam benchmark action missing goalId in execution intent.'
      );
    }
    const activePlan = await StudyPlan.findOne({
      userId: trimmedUserId,
      goalId: examGoalId,
      status: 'active',
    })
      .sort({ startDate: -1, _id: 1 })
      .lean();

    const readiness = await readinessService.getGoalReadiness(
      trimmedUserId,
      examGoalId,
      referenceNow
    );

    actionSpecificSnapshot = {
      actionType: 'EXAM_BENCHMARK',
      goalId: String(examGoalId),
      planId: activePlan ? String(activePlan._id) : null,
      planTargetPatternsSnapshot: activePlan && Array.isArray(activePlan.targets)
        ? activePlan.targets.map((t) => ({ topic: t.topic, pattern: t.pattern }))
        : [],
      readinessStatus: readiness?.status ?? 'not_ready',
      eligibleMocksCount: readiness?.eligibleMocksCount ?? null,
    };
  } else if (actionType === 'DIAGNOSTIC_ASSESSMENT') {
    const diagSp = await StudentProgress.findOne({
      userId: trimmedUserId,
      topic: candidateAction.topic,
      pattern: candidateAction.pattern,
    }).lean();
    const storedMastery = diagSp ? diagSp.mastery : 0;
    const existingAttemptCount = await Attempt.countDocuments({
      userId: trimmedUserId,
      topic: candidateAction.topic,
      pattern: candidateAction.pattern,
    });

    actionSpecificSnapshot = {
      actionType: 'DIAGNOSTIC_ASSESSMENT',
      actionSubtype: candidateAction.actionSubtype,
      topic: candidateAction.topic,
      pattern: candidateAction.pattern,
      storedMastery,
      existingAttemptCount,
    };
  } else {
    throw new AppError(
      500,
      'ATTRIBUTION_ISSUANCE_FAILED',
      `Unknown action type: ${actionType}`
    );
  }

  // Preserve full execution intent and rationale in audit snapshot
  const fullIssuanceSnapshot = {
    ...actionSpecificSnapshot,
    rationale: candidateAction.rationale,
    executionIntent: candidateAction.executionIntent,
  };

  // 12. Transactional Supersession & Active Slot Management (Max 1 Retry)
  const newPrescriptionId = `rx_${new mongoose.Types.ObjectId().toString()}`;
  const ttlMs = attributionConfig.PRESCRIPTION_TTL_HOURS * 3600 * 1000;
  const expiresAt = new Date(referenceNow.getTime() + ttlMs);

  let attempt = 0;
  while (attempt < 2) {
    attempt++;
    const session = await mongoose.startSession();
    try {
      let createdRecord = null;
      await session.withTransaction(async () => {
        // 12.1 Resolve existing non-terminal predecessor
        const predecessor = await PrescriptionExecutionRecord.findOne({
          userId: trimmedUserId,
          status: { $in: ['issued', 'active'] },
        }).session(session);

        if (predecessor) {
          if (referenceNow.getTime() >= predecessor.expiresAt.getTime()) {
            predecessor.status = 'expired';
            predecessor.nonTerminalSlotKey = null;
            predecessor.supersededAt = null;
            predecessor.supersededByPrescriptionId = null;
            predecessor.lastActivityAt = referenceNow;
            await predecessor.save({ session });
          } else {
            predecessor.status = 'superseded';
            predecessor.supersededAt = referenceNow;
            predecessor.supersededByPrescriptionId = newPrescriptionId;
            predecessor.nonTerminalSlotKey = null;
            predecessor.lastActivityAt = referenceNow;
            await predecessor.save({ session });
          }
        }

        // 12.2 Create new PrescriptionExecutionRecord
        createdRecord = new PrescriptionExecutionRecord({
          prescriptionId: newPrescriptionId,
          userId: trimmedUserId,
          issuanceIdempotencyKey: trimmedKey,
          issuanceRequestFingerprint: currentFingerprint,
          nonTerminalSlotKey: trimmedUserId,
          phase10AlgorithmVersion: attributionConfig.ALGORITHM_VERSION,
          orchestrationAlgorithmVersion: ORCHESTRATION_ALGORITHM_VERSION,
          policyVersion: policyProvenance?.policyVersion ?? null,
          policyFingerprint: policyProvenance?.policyFingerprint ?? null,
          policySource: policyProvenance?.policySource ?? null,
          originSurface,
          actionId: candidateAction.actionId,
          actionType: candidateAction.actionType,
          actionSubtype: candidateAction.actionSubtype,
          policyPriorityClass: candidateAction.policyPriorityClass ?? null,
          urgencyScore: candidateAction.urgencyScore ?? null,
          priorityTier: candidateAction.priorityTier,
          topic: candidateAction.topic ?? null,
          pattern: candidateAction.pattern ?? null,
          prescribedQuestions: candidateAction.prescribedQuestions,
          estimatedMinutes: candidateAction.estimatedMinutes ?? null,
          blockedTargetTopic: candidateAction.blockedTarget?.topic ?? null,
          blockedTargetPattern: candidateAction.blockedTarget?.pattern ?? null,
          revisionItemId: candidateAction.executionIntent?.revisionItemId ?? null,
          goalId: candidateAction.executionIntent?.goalId ?? (resolvedGoal ? resolvedGoal._id : null),
          planId: candidateAction.executionIntent?.planId ?? null,
          mockSessionId: null,
          issuanceSnapshot: fullIssuanceSnapshot,
          activationBaselineSnapshot: null,
          status: 'issued',
          issuedAt: referenceNow,
          expiresAt,
          lastActivityAt: referenceNow,
          executionRequirementMet: null,
          targetMilestoneMet: null,
          outcomeSnapshot: null,
        });

        await createdRecord.save({ session });
      });

      await session.endSession();

      return {
        statusCode: 201,
        data: formatIssuanceResponse(createdRecord, candidateAction, 'issued', false),
      };
    } catch (err) {
      await session.endSession();

      // Classify duplicate key error
      if (err.code === 11000) {
        const isKeyCollision =
          Boolean(err.keyPattern?.issuanceIdempotencyKey) ||
          String(err.message).includes('issuanceIdempotencyKey');

        if (isKeyCollision) {
          const winner = await PrescriptionExecutionRecord.findOne({
            userId: trimmedUserId,
            issuanceIdempotencyKey: trimmedKey,
          });

          if (winner) {
            if (winner.issuanceRequestFingerprint === currentFingerprint) {
              const isExpired =
                ['issued', 'active'].includes(winner.status) &&
                referenceNow.getTime() >= winner.expiresAt.getTime();
              const effectiveStatus = isExpired ? 'expired' : winner.status;
              return {
                statusCode: 200,
                data: formatIssuanceResponse(
                  winner,
                  candidateAction,
                  effectiveStatus,
                  isExpired || winner.status === 'expired'
                ),
              };
            } else {
              throw new AppError(
                409,
                'IDEMPOTENCY_KEY_REUSE_MISMATCH',
                'Idempotency key was previously used with a different request payload.'
              );
            }
          }
        }

        // Slot collision: retry once if attempt === 1
        if (attempt < 2) {
          continue;
        }
        throw new AppError(
          409,
          'PRESCRIPTION_ISSUANCE_CONFLICT',
          'Concurrent prescription issuance conflict on active slot.'
        );
      }

      // Check transient transaction error
      const isTransient =
        err.hasErrorLabel &&
        (err.hasErrorLabel('TransientTransactionError') ||
          err.hasErrorLabel('UnknownTransactionCommitResult'));

      if (isTransient && attempt < 2) {
        continue;
      }

      if (err instanceof AppError) {
        throw err;
      }

      throw new AppError(
        500,
        'ATTRIBUTION_ISSUANCE_FAILED',
        err.message || 'Prescription issuance failed.'
      );
    }
  }

  throw new AppError(
    409,
    'PRESCRIPTION_ISSUANCE_CONFLICT',
    'Prescription issuance conflict could not be resolved.'
  );
};

module.exports = {
  issuePrescription,
  buildPublicActionDTO,
  formatIssuanceResponse,
};
