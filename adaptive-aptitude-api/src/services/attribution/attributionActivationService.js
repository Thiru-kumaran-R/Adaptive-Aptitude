'use strict';

/**
 * Attribution Activation Service — Phase 10: PAOA
 *
 * Implements atomic compare-and-swap (CAS) activation from 'issued' to 'active',
 * captures the immediate pre-execution activationBaselineSnapshot, enforces the
 * finalization barrier for pacing/benchmark actions, and validates exact lease boundaries.
 */

const StudentProgress = require('../../models/studentProgressModel');
const RevisionItem = require('../../models/revisionItemModel');
const DailyObjective = require('../../models/dailyObjectiveModel');
const Attempt = require('../../models/attemptModel');
const PrescriptionExecutionRecord = require('../../models/prescriptionExecutionRecordModel');

const AppError = require('../../utils/AppError');
const { assertNoFinalizationInProgress } = require('../../middlewares/attributionGuard');
const speedAccuracyMatrixService = require('../analytics/speedAccuracyMatrixService');
const readinessService = require('../analytics/readinessService');
const analyticsMathUtils = require('../analytics/analyticsMathUtils');
const hierarchyService = require('../hierarchyService');

/**
 * Constructs execution guidance metadata for active prescription.
 */
const buildExecutionGuidance = (record) => {
  if (record.actionType === 'EXAM_BENCHMARK') {
    return {
      targetMode: 'standard',
      instructions:
        'Complete a standard mock exam covering plan target patterns. Mock session will be linked upon completion.',
    };
  }

  const targetSource = record.actionType === 'RETENTION_RESCUE' ? 'revision' : 'practice';
  return {
    sessionId: record.prescriptionId,
    targetSource,
    instructions: `Submit all ${targetSource} attempts with sessionId set to this prescriptionId.`,
  };
};

/**
 * Formats the public activation response DTO.
 */
const formatActivationResponse = (record) => {
  return {
    prescriptionId: record.prescriptionId,
    status: record.status,
    effectiveStatus: record.status,
    isExpired: false,
    actionType: record.actionType,
    topic: record.topic,
    pattern: record.pattern,
    prescribedQuestions: record.prescribedQuestions,
    activatedAt: record.activatedAt,
    expiresAt: record.expiresAt,
    executionGuidance: buildExecutionGuidance(record),
  };
};

/**
 * Activates an issued prescription atomically with an immediate baseline snapshot.
 */
const activatePrescription = async ({ prescriptionId, userId, referenceNow }) => {
  const trimmedUserId = String(userId).trim();

  // 1. Validate prescriptionId syntax
  if (!prescriptionId || typeof prescriptionId !== 'string' || !/^rx_[a-f0-9]{24}$/.test(prescriptionId)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid prescriptionId format.');
  }

  // 2. Retrieve existing prescription
  const prescription = await PrescriptionExecutionRecord.findOne({ prescriptionId });
  if (!prescription) {
    throw new AppError(404, 'PRESCRIPTION_NOT_FOUND', `Prescription "${prescriptionId}" not found.`);
  }

  // 3. Ownership Verification
  if (prescription.userId !== trimmedUserId) {
    throw new AppError(
      403,
      'OWNERSHIP_VIOLATION',
      'Access denied: caller does not own this resource.'
    );
  }

  // 4. State checks
  if (['completed', 'abandoned', 'superseded', 'expired'].includes(prescription.status)) {
    throw new AppError(
      409,
      'PRESCRIPTION_STATE_CONFLICT',
      `Cannot activate prescription in terminal status "${prescription.status}".`
    );
  }

  // 5. Already active idempotent check
  if (prescription.status === 'active') {
    if (referenceNow.getTime() >= prescription.expiresAt.getTime()) {
      // Materialize expiry
      await PrescriptionExecutionRecord.findOneAndUpdate(
        { prescriptionId, status: 'active', expiresAt: { $lte: referenceNow } },
        {
          $set: {
            status: 'expired',
            nonTerminalSlotKey: null,
            lastActivityAt: referenceNow,
          },
        }
      );
      throw new AppError(409, 'PRESCRIPTION_STATE_CONFLICT', 'Prescription lease has expired.');
    }
    return {
      statusCode: 200,
      data: formatActivationResponse(prescription),
    };
  }

  // 6. Issued but expired check
  if (prescription.status === 'issued') {
    if (referenceNow.getTime() >= prescription.expiresAt.getTime()) {
      await PrescriptionExecutionRecord.findOneAndUpdate(
        { prescriptionId, status: 'issued', expiresAt: { $lte: referenceNow } },
        {
          $set: {
            status: 'expired',
            nonTerminalSlotKey: null,
            lastActivityAt: referenceNow,
          },
        }
      );
      throw new AppError(409, 'PRESCRIPTION_STATE_CONFLICT', 'Prescription lease has expired.');
    }
  }

  // 7. Finalization Barrier for PACING_CALIBRATION and EXAM_BENCHMARK
  if (['PACING_CALIBRATION', 'EXAM_BENCHMARK'].includes(prescription.actionType)) {
    await assertNoFinalizationInProgress(trimmedUserId);
  }

  // 8. Capture Action-Specific Activation Baseline Snapshot
  let baselineSnapshot = null;
  const actionType = prescription.actionType;

  if (actionType === 'PREREQUISITE_REMEDIATION') {
    const prereqDoc = await StudentProgress.findOne({
      userId: trimmedUserId,
      topic: prescription.topic,
      pattern: prescription.pattern,
    }).lean();
    const prereqMastery = prereqDoc ? prereqDoc.mastery : 0;

    const allPrereqNames = hierarchyService.getPrerequisites(prescription.blockedTargetPattern) || [];
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

    baselineSnapshot = {
      actionType: 'PREREQUISITE_REMEDIATION',
      prerequisitePattern: prescription.pattern,
      prerequisiteTopic: prescription.topic,
      prerequisiteMastery: prereqMastery,
      blockedTargetPattern: prescription.blockedTargetPattern,
      blockedTargetTopic: prescription.blockedTargetTopic,
      allPrerequisitesForTarget,
    };
  } else if (actionType === 'RETENTION_RESCUE') {
    const revItem = await RevisionItem.findById(prescription.revisionItemId).lean();
    if (!revItem) {
      throw new AppError(
        500,
        'ATTRIBUTION_CALCULATION_FAILED',
        `RevisionItem "${prescription.revisionItemId}" not found at activation.`
      );
    }
    baselineSnapshot = {
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
    const { todayStartUtc, tomorrowStartUtc } = analyticsMathUtils.getLogicalDayBoundaries(referenceNow);
    const dailyObj = await DailyObjective.findOne({
      userId: trimmedUserId,
      planId: prescription.planId,
      date: { $gte: todayStartUtc, $lt: tomorrowStartUtc },
      status: { $in: ['pending', 'in_progress'] },
    }).lean();

    const patEntry = dailyObj?.patterns?.find((p) => p.pattern === prescription.pattern);
    const sp = await StudentProgress.findOne({
      userId: trimmedUserId,
      topic: prescription.topic,
      pattern: prescription.pattern,
    }).lean();
    const storedMastery = sp ? sp.mastery : 0;
    const patternTargetQuestions = patEntry ? patEntry.targetQuestions || 0 : 0;
    const patternCompletedQuestions = patEntry ? patEntry.completedQuestions || 0 : 0;
    const patternRemainingQuestions = Math.max(0, patternTargetQuestions - patternCompletedQuestions);

    baselineSnapshot = {
      actionType: 'CURRICULUM_ADVANCEMENT',
      topic: prescription.topic,
      pattern: prescription.pattern,
      planId: String(prescription.planId),
      dailyObjectiveId: dailyObj ? String(dailyObj._id) : null,
      patternTargetQuestions,
      patternCompletedQuestions,
      patternRemainingQuestions,
      storedMastery,
    };
  } else if (actionType === 'PACING_CALIBRATION') {
    const speedResult = await speedAccuracyMatrixService.getSpeedAccuracyMatrix(
      trimmedUserId,
      30,
      prescription.topic,
      referenceNow
    );
    const topicRushingRiskScore = speedResult?.speedAccuracyMatrix?.rushingRiskScore ?? null;

    baselineSnapshot = {
      actionType: 'PACING_CALIBRATION',
      topic: prescription.topic,
      topicRushingRiskScore,
      rushingRiskWindowDays: 30,
    };
  } else if (actionType === 'EXAM_BENCHMARK') {
    const readiness = await readinessService.getGoalReadiness(
      trimmedUserId,
      prescription.goalId,
      referenceNow
    );
    baselineSnapshot = {
      actionType: 'EXAM_BENCHMARK',
      goalId: String(prescription.goalId),
      planId: prescription.planId ? String(prescription.planId) : null,
      readinessStatus: readiness?.status ?? 'not_ready',
      eligibleMocksCount: readiness?.eligibleMocksCount ?? null,
    };
  } else if (actionType === 'DIAGNOSTIC_ASSESSMENT') {
    const diagSp = await StudentProgress.findOne({
      userId: trimmedUserId,
      topic: prescription.topic,
      pattern: prescription.pattern,
    }).lean();
    const storedMastery = diagSp ? diagSp.mastery : 0;
    const existingAttemptCount = await Attempt.countDocuments({
      userId: trimmedUserId,
      topic: prescription.topic,
      pattern: prescription.pattern,
    });

    baselineSnapshot = {
      actionType: 'DIAGNOSTIC_ASSESSMENT',
      actionSubtype: prescription.actionSubtype,
      topic: prescription.topic,
      pattern: prescription.pattern,
      storedMastery,
      existingAttemptCount,
    };
  }

  // 9. Atomic Compare-And-Swap (CAS)
  const updatedRecord = await PrescriptionExecutionRecord.findOneAndUpdate(
    {
      prescriptionId,
      userId: trimmedUserId,
      status: 'issued',
      expiresAt: { $gt: referenceNow },
    },
    {
      $set: {
        status: 'active',
        activatedAt: referenceNow,
        lastActivityAt: referenceNow,
        activationBaselineSnapshot: baselineSnapshot,
      },
    },
    { new: true }
  );

  if (updatedRecord) {
    return {
      statusCode: 200,
      data: formatActivationResponse(updatedRecord),
    };
  }

  // 10. CAS failed: Re-read to classify race or expiry
  const reRead = await PrescriptionExecutionRecord.findOne({ prescriptionId });
  if (!reRead) {
    throw new AppError(404, 'PRESCRIPTION_NOT_FOUND', 'Prescription not found.');
  }

  if (reRead.status === 'active' && referenceNow.getTime() < reRead.expiresAt.getTime()) {
    return {
      statusCode: 200,
      data: formatActivationResponse(reRead),
    };
  }

  if (referenceNow.getTime() >= reRead.expiresAt.getTime()) {
    await PrescriptionExecutionRecord.findOneAndUpdate(
      {
        prescriptionId,
        status: { $in: ['issued', 'active'] },
        expiresAt: { $lte: referenceNow },
      },
      {
        $set: {
          status: 'expired',
          nonTerminalSlotKey: null,
          lastActivityAt: referenceNow,
        },
      }
    );
    throw new AppError(409, 'PRESCRIPTION_STATE_CONFLICT', 'Prescription lease has expired.');
  }

  throw new AppError(
    409,
    'PRESCRIPTION_STATE_CONFLICT',
    `Cannot activate prescription in status "${reRead.status}".`
  );
};

module.exports = {
  activatePrescription,
  buildExecutionGuidance,
  formatActivationResponse,
};
