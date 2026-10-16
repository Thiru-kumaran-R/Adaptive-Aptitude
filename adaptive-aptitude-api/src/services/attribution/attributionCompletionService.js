'use strict';

/**
 * Attribution Completion Service — Phase 10: PAOA
 *
 * Implements authoritative completion evaluation, attempt attribution,
 * explicit abandonment flow, type-specific learning outcome calculations,
 * and atomic completion CAS.
 */

const StudentProgress = require('../../models/studentProgressModel');
const RevisionItem = require('../../models/revisionItemModel');
const RevisionProcessingRecord = require('../../models/revisionProcessingRecordModel');
const Attempt = require('../../models/attemptModel');
const MockSession = require('../../models/mockSessionModel');
const PrescriptionExecutionRecord = require('../../models/prescriptionExecutionRecordModel');

const AppError = require('../../utils/AppError');
const { assertNoFinalizationInProgress } = require('../../middlewares/attributionGuard');
const speedAccuracyMatrixService = require('../analytics/speedAccuracyMatrixService');
const readinessService = require('../analytics/readinessService');

const ATTRIBUTION_NOTICE =
  'Observational pre/post association recorded. Causal lift is not claimed.';

/**
 * Formats the public completion response DTO.
 */
const formatCompletionResponse = (record) => {
  return {
    prescriptionId: record.prescriptionId,
    status: record.status,
    effectiveStatus: record.status,
    completedAt: record.completedAt || record.abandonedAt,
    executionRequirementMet: record.executionRequirementMet,
    targetMilestoneMet: record.targetMilestoneMet,
    outcomeSnapshot: record.outcomeSnapshot,
    mockSessionId: record.mockSessionId ? String(record.mockSessionId) : null,
    attributionNotice: ATTRIBUTION_NOTICE,
  };
};

/**
 * Completes or abandons an active prescription.
 */
const completePrescription = async ({
  prescriptionId,
  userId,
  abandon = false,
  mockSessionId = null,
  referenceNow,
}) => {
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
      'FORBIDDEN',
      'Access denied: caller does not own this resource.'
    );
  }

  // 4. Terminal Replay Checks
  if (prescription.status === 'completed') {
    return {
      statusCode: 200,
      data: formatCompletionResponse(prescription),
    };
  }

  if (prescription.status === 'abandoned') {
    if (abandon === true) {
      return {
        statusCode: 200,
        data: formatCompletionResponse(prescription),
      };
    }
    throw new AppError(
      409,
      'PRESCRIPTION_STATE_CONFLICT',
      'Prescription has already been abandoned.'
    );
  }

  if (['superseded', 'expired'].includes(prescription.status)) {
    throw new AppError(
      409,
      'PRESCRIPTION_STATE_CONFLICT',
      `Cannot complete prescription in terminal status "${prescription.status}".`
    );
  }

  if (prescription.status === 'issued') {
    throw new AppError(
      409,
      'PRESCRIPTION_STATE_CONFLICT',
      'Prescription must be activated before completion.'
    );
  }

  // 5. Expiry Check for active prescriptions
  if (prescription.status === 'active' && referenceNow.getTime() >= prescription.expiresAt.getTime()) {
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

  // ── PATH A: Explicit Abandonment Flow ───────────────────────────────────────
  if (abandon === true) {
    const abandonedRecord = await PrescriptionExecutionRecord.findOneAndUpdate(
      {
        prescriptionId,
        userId: trimmedUserId,
        status: 'active',
        expiresAt: { $gt: referenceNow },
      },
      {
        $set: {
          status: 'abandoned',
          abandonedAt: referenceNow,
          lastActivityAt: referenceNow,
          nonTerminalSlotKey: null,
          executionRequirementMet: false,
          targetMilestoneMet: null,
          outcomeSnapshot: {
            abandoned: true,
            abandonedAt: referenceNow,
            reason: 'USER_ABANDONED',
          },
        },
      },
      { new: true }
    );

    if (abandonedRecord) {
      return {
        statusCode: 200,
        data: formatCompletionResponse(abandonedRecord),
      };
    }

    const reRead = await PrescriptionExecutionRecord.findOne({ prescriptionId });
    if (reRead && reRead.status === 'abandoned') {
      return {
        statusCode: 200,
        data: formatCompletionResponse(reRead),
      };
    }
    throw new AppError(
      409,
      'PRESCRIPTION_STATE_CONFLICT',
      'Failed to abandon prescription due to state conflict.'
    );
  }

  // ── PATH B: Normal Completion Flow ──────────────────────────────────────────
  let evaluatedMilestone = null;
  let evaluatedOutcomeSnapshot = null;
  let verifiedMockId = null;

  if (prescription.actionType === 'EXAM_BENCHMARK') {
    // Exam Benchmark Mock Attribution
    if (!mockSessionId || typeof mockSessionId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(mockSessionId)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'mockSessionId is required and must be a 24-character hexadecimal string for benchmark completion.'
      );
    }

    const mockSession = await MockSession.findById(mockSessionId).lean();
    if (!mockSession) {
      throw new AppError(
        404,
        'MOCK_SESSION_NOT_FOUND',
        `MockSession "${mockSessionId}" not found.`
      );
    }

    if (mockSession.userId !== trimmedUserId) {
      throw new AppError(
        403,
        'FORBIDDEN',
        `Access denied: MockSession does not belong to user "${trimmedUserId}".`
      );
    }

    const isTerminalStatus = ['submitted', 'expired'].includes(mockSession.status);
    const isCompletedFinalization = mockSession.finalizationState === 'completed';
    const isStandardMode = mockSession.mode === 'standard';
    const isStartedAfterActivation =
      mockSession.startedAt &&
      new Date(mockSession.startedAt).getTime() >= new Date(prescription.activatedAt).getTime();

    if (!isTerminalStatus || !isCompletedFinalization || !isStandardMode || !isStartedAfterActivation) {
      throw new AppError(
        409,
        'PRESCRIPTION_EXECUTION_INCOMPLETE',
        'Mock session does not satisfy execution requirements (must be completed standard mode started after activation).'
      );
    }

    // Reconstruct and verify blueprint scope subset alignment
    const mockScopePatterns = readinessService.reconstructMockScopePatterns(mockSession.blueprintSnapshot);
    const planTargetPatterns = prescription.issuanceSnapshot?.planTargetPatternsSnapshot || [];

    const isScopeValid =
      Array.isArray(mockScopePatterns) &&
      mockScopePatterns.length > 0 &&
      Array.isArray(planTargetPatterns) &&
      planTargetPatterns.length > 0 &&
      mockScopePatterns.every((mp) =>
        planTargetPatterns.some((tp) => tp.topic === mp.topic && tp.pattern === mp.pattern)
      );

    if (!isScopeValid) {
      throw new AppError(
        409,
        'PRESCRIPTION_EXECUTION_INCOMPLETE',
        'Mock session blueprint scope does not align as a valid non-empty subset of plan target patterns.'
      );
    }

    verifiedMockId = mockSession._id;
    evaluatedMilestone = true;
    evaluatedOutcomeSnapshot = {
      actionType: 'EXAM_BENCHMARK',
      benchmarkCompletionVerified: true,
      mockSessionId: String(mockSession._id),
      executionRequirementMet: true,
      targetMilestoneMet: true,
    };
  } else {
    // Non-Mock Attributed Attempts
    const expectedSource = prescription.actionType === 'RETENTION_RESCUE' ? 'revision' : 'practice';

    const attributedAttempts = await Attempt.find({
      userId: trimmedUserId,
      sessionId: prescriptionId,
      source: expectedSource,
      topic: prescription.topic,
      ...(prescription.pattern ? { pattern: prescription.pattern } : {}),
      attemptedAt: {
        $gte: prescription.activatedAt,
        $lte: referenceNow,
      },
    })
      .sort({ attemptedAt: 1, _id: 1 })
      .lean();

    if (attributedAttempts.length < prescription.prescribedQuestions) {
      throw new AppError(
        409,
        'PRESCRIPTION_EXECUTION_INCOMPLETE',
        `Prescription execution incomplete: ${attributedAttempts.length}/${prescription.prescribedQuestions} required questions attempted.`
      );
    }

    // Outcome Evaluation by Action Type
    if (prescription.actionType === 'PREREQUISITE_REMEDIATION') {
      const currentProgress = await StudentProgress.findOne({
        userId: trimmedUserId,
        topic: prescription.topic,
        pattern: prescription.pattern,
      }).lean();

      const finalMastery = currentProgress ? currentProgress.mastery : 0;
      const baselineMastery = prescription.activationBaselineSnapshot?.prerequisiteMastery ?? 0;
      const masteryDelta = Number((finalMastery - baselineMastery).toFixed(4));
      const prerequisiteThresholdMet = finalMastery >= 0.70;
      const targetMilestoneMet = prerequisiteThresholdMet;

      const allPrereqs = prescription.activationBaselineSnapshot?.allPrerequisitesForTarget || [];
      const otherPrereqNames = allPrereqs
        .map((p) => p.pattern)
        .filter((p) => p !== prescription.pattern);

      const otherProgressDocs = await StudentProgress.find({
        userId: trimmedUserId,
        pattern: { $in: otherPrereqNames },
      }).lean();
      const otherMap = new Map();
      for (const doc of otherProgressDocs) {
        otherMap.set(doc.pattern, doc.mastery);
      }

      let blockedTargetFullyUnlocked = finalMastery >= 0.70;
      for (const pName of otherPrereqNames) {
        if ((otherMap.get(pName) ?? 0) < 0.70) {
          blockedTargetFullyUnlocked = false;
          break;
        }
      }

      evaluatedMilestone = targetMilestoneMet;
      evaluatedOutcomeSnapshot = {
        actionType: 'PREREQUISITE_REMEDIATION',
        attributedAttemptCount: attributedAttempts.length,
        prescribedQuestions: prescription.prescribedQuestions,
        executionRequirementMet: true,
        baselinePrerequisiteMastery: baselineMastery,
        finalPrerequisiteMastery: finalMastery,
        masteryDelta,
        prerequisiteThresholdMet,
        blockedTargetFullyUnlocked,
        targetMilestoneMet,
      };
    } else if (prescription.actionType === 'RETENTION_RESCUE') {
      const finalAttempt = attributedAttempts[attributedAttempts.length - 1];

      const isProcessed = await RevisionProcessingRecord.exists({ attemptId: finalAttempt._id });
      if (!isProcessed) {
        throw new AppError(
          409,
          'REVISION_PROCESSING_PENDING',
          'Phase 5 revision processing has not yet completed for attributed attempts.'
        );
      }

      const revisionItem = await RevisionItem.findById(prescription.revisionItemId);
      if (!revisionItem || String(revisionItem.lastProcessedAttemptId) !== String(finalAttempt._id)) {
        throw new AppError(
          409,
          'REVISION_PROCESSING_PENDING',
          'RevisionItem state does not reflect final attributed attempt.'
        );
      }

      const baselineStage = prescription.activationBaselineSnapshot?.stage ?? 0;
      const isCorrect = revisionItem.lastOutcome === 'correct';
      const stageAdvanced = revisionItem.stage > baselineStage;
      const isCompleted = revisionItem.status === 'completed';
      const isStage4Extended =
        revisionItem.stage === 4 &&
        baselineStage === 4 &&
        revisionItem.intervalDays === 30 &&
        revisionItem.status === 'scheduled';

      const retentionRescued = isCorrect && (stageAdvanced || isCompleted || isStage4Extended);
      const targetMilestoneMet = Boolean(retentionRescued);

      evaluatedMilestone = targetMilestoneMet;
      evaluatedOutcomeSnapshot = {
        actionType: 'RETENTION_RESCUE',
        attributedAttemptCount: attributedAttempts.length,
        prescribedQuestions: prescription.prescribedQuestions,
        executionRequirementMet: true,
        baselineStage,
        finalStage: revisionItem.stage,
        finalStatus: revisionItem.status,
        lastOutcome: revisionItem.lastOutcome,
        retentionRescued,
        targetMilestoneMet,
      };
    } else if (prescription.actionType === 'CURRICULUM_ADVANCEMENT') {
      const currentProgress = await StudentProgress.findOne({
        userId: trimmedUserId,
        topic: prescription.topic,
        pattern: prescription.pattern,
      }).lean();

      const finalMastery = currentProgress ? currentProgress.mastery : 0;
      const baselineMastery = prescription.activationBaselineSnapshot?.storedMastery ?? 0;
      const masteryDelta = Number((finalMastery - baselineMastery).toFixed(4));
      const targetMilestoneMet = masteryDelta > 0 || finalMastery >= 0.85;

      evaluatedMilestone = targetMilestoneMet;
      evaluatedOutcomeSnapshot = {
        actionType: 'CURRICULUM_ADVANCEMENT',
        attributedAttemptCount: attributedAttempts.length,
        prescribedQuestions: prescription.prescribedQuestions,
        executionRequirementMet: true,
        baselineMastery,
        finalMastery,
        masteryDelta,
        curriculumMilestoneMet: targetMilestoneMet,
        targetMilestoneMet,
      };
    } else if (prescription.actionType === 'PACING_CALIBRATION') {
      await assertNoFinalizationInProgress(trimmedUserId);

      const windowDays = prescription.activationBaselineSnapshot?.rushingRiskWindowDays || 30;
      const speedResult = await speedAccuracyMatrixService.getSpeedAccuracyMatrix(
        trimmedUserId,
        windowDays,
        prescription.topic,
        referenceNow
      );

      const postRisk = speedResult?.speedAccuracyMatrix?.rushingRiskScore ?? null;
      const baselineRisk = prescription.activationBaselineSnapshot?.topicRushingRiskScore ?? null;

      let targetMilestoneMet = null;
      let outcomeEvidenceStatus = 'SUFFICIENT_EVIDENCE';
      let riskImproved = null;
      let riskResolvedBelowThreshold = null;

      if (postRisk === null) {
        targetMilestoneMet = null;
        outcomeEvidenceStatus = 'INSUFFICIENT_POST_EVIDENCE';
      } else {
        targetMilestoneMet = postRisk < 0.60;
        riskResolvedBelowThreshold = postRisk < 0.60;
        if (baselineRisk !== null) {
          riskImproved = postRisk < baselineRisk;
        }
      }

      evaluatedMilestone = targetMilestoneMet;
      evaluatedOutcomeSnapshot = {
        actionType: 'PACING_CALIBRATION',
        attributedAttemptCount: attributedAttempts.length,
        prescribedQuestions: prescription.prescribedQuestions,
        executionRequirementMet: true,
        baselineTopicRushingRisk: baselineRisk,
        finalTopicRushingRisk: postRisk,
        riskImproved,
        riskResolvedBelowThreshold,
        outcomeEvidenceStatus,
        targetMilestoneMet,
      };
    } else if (prescription.actionType === 'DIAGNOSTIC_ASSESSMENT') {
      const currentProgress = await StudentProgress.findOne({
        userId: trimmedUserId,
        topic: prescription.topic,
        pattern: prescription.pattern,
      }).lean();

      const finalMastery = currentProgress ? currentProgress.mastery : 0;
      let targetMilestoneMet = false;

      if (prescription.actionSubtype === 'FOUNDATIONAL_DIAGNOSTIC') {
        const baselineEvidenceCreated = finalMastery > 0 || attributedAttempts.length > 0;
        targetMilestoneMet = Boolean(baselineEvidenceCreated);
      } else {
        targetMilestoneMet = true;
      }

      evaluatedMilestone = targetMilestoneMet;
      evaluatedOutcomeSnapshot = {
        actionType: 'DIAGNOSTIC_ASSESSMENT',
        actionSubtype: prescription.actionSubtype,
        attributedAttemptCount: attributedAttempts.length,
        prescribedQuestions: prescription.prescribedQuestions,
        executionRequirementMet: true,
        finalMastery,
        targetMilestoneMet,
      };
    }
  }

  // 6. Terminal Completion CAS
  const completedRecord = await PrescriptionExecutionRecord.findOneAndUpdate(
    {
      prescriptionId,
      userId: trimmedUserId,
      status: 'active',
      expiresAt: { $gt: referenceNow },
    },
    {
      $set: {
        status: 'completed',
        completedAt: referenceNow,
        lastActivityAt: referenceNow,
        nonTerminalSlotKey: null,
        executionRequirementMet: true,
        targetMilestoneMet: evaluatedMilestone,
        outcomeSnapshot: evaluatedOutcomeSnapshot,
        ...(verifiedMockId ? { mockSessionId: verifiedMockId } : {}),
      },
    },
    { new: true }
  );

  if (completedRecord) {
    return {
      statusCode: 200,
      data: formatCompletionResponse(completedRecord),
    };
  }

  // CAS lost: re-read to verify concurrent winner
  const reRead = await PrescriptionExecutionRecord.findOne({ prescriptionId });
  if (reRead && reRead.status === 'completed') {
    return {
      statusCode: 200,
      data: formatCompletionResponse(reRead),
    };
  }

  throw new AppError(
    409,
    'PRESCRIPTION_STATE_CONFLICT',
    'Completion failed due to concurrent prescription state modification.'
  );
};

module.exports = {
  completePrescription,
  formatCompletionResponse,
};
