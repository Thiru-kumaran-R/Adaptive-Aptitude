'use strict';

/**
 * Attribution Summary Service — Phase 10: PAOA
 *
 * Implements bounded, strictly read-only longitudinal attribution summary analytics,
 * probe vs. evaluated limits (501 / 500), in-memory effective expiry resolution,
 * and observational association adherence/milestone metrics.
 */

const PrescriptionExecutionRecord = require('../../models/prescriptionExecutionRecordModel');
const attributionConfig = require('../../config/attributionConfig');
const AppError = require('../../utils/AppError');

const CANONICAL_ACTION_TYPES = Object.freeze([
  'PREREQUISITE_REMEDIATION',
  'RETENTION_RESCUE',
  'CURRICULUM_ADVANCEMENT',
  'PACING_CALIBRATION',
  'EXAM_BENCHMARK',
  'DIAGNOSTIC_ASSESSMENT',
]);

const ATTRIBUTION_NOTICE =
  'Observational pre/post association recorded. Causal lift is not claimed.';

/**
 * Resolves effective status for an uncompleted prescription record in memory.
 */
const resolveEffectiveStatus = (record, referenceNow) => {
  if (
    ['issued', 'active'].includes(record.status) &&
    referenceNow.getTime() >= record.expiresAt.getTime()
  ) {
    return { effectiveStatus: 'expired', isExpired: true };
  }
  return { effectiveStatus: record.status, isExpired: record.status === 'expired' };
};

/**
 * Aggregates attribution summary metrics for a student.
 */
const getAttributionSummary = async ({
  userId,
  windowDays = attributionConfig.SUMMARY_DEFAULT_WINDOW_DAYS,
  actionType = null,
  referenceNow,
}) => {
  const trimmedUserId = String(userId).trim();

  // 1. Validate windowDays
  let parsedWindowDays = attributionConfig.SUMMARY_DEFAULT_WINDOW_DAYS;
  if (windowDays !== undefined && windowDays !== null) {
    const num = Number(windowDays);
    if (!Number.isInteger(num) || num < 1 || num > attributionConfig.SUMMARY_MAX_WINDOW_DAYS) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        `windowDays must be an integer between 1 and ${attributionConfig.SUMMARY_MAX_WINDOW_DAYS}.`
      );
    }
    parsedWindowDays = num;
  }

  // 2. Validate optional actionType
  if (actionType !== undefined && actionType !== null && actionType !== '') {
    if (!CANONICAL_ACTION_TYPES.includes(actionType)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        `actionType must be one of: ${CANONICAL_ACTION_TYPES.join(', ')}.`
      );
    }
  } else {
    actionType = null;
  }

  // 3. Compute Bounded Window Start
  const windowDurationMs = parsedWindowDays * 24 * 60 * 60 * 1000;
  const windowStart = new Date(referenceNow.getTime() - windowDurationMs);

  // 4. Query probe records (limit 501, sort issuedAt DESC, _id ASC)
  const filter = {
    userId: trimmedUserId,
    issuedAt: { $gte: windowStart, $lte: referenceNow },
    ...(actionType ? { actionType } : {}),
  };

  const probeRecords = await PrescriptionExecutionRecord.find(filter)
    .sort({ issuedAt: -1, _id: 1 })
    .limit(attributionConfig.SUMMARY_PROBE_LIMIT)
    .lean();

  // 5. Separate probe sentinel vs evaluated slice
  const isTruncated = probeRecords.length > attributionConfig.SUMMARY_EVALUATED_LIMIT;
  const isExhaustive = !isTruncated;
  const evaluatedRecords = isTruncated
    ? probeRecords.slice(0, attributionConfig.SUMMARY_EVALUATED_LIMIT)
    : probeRecords;

  // 6. In-Memory Effective Status Tally
  const statusCounts = {
    issued: 0,
    active: 0,
    completed: 0,
    abandoned: 0,
    superseded: 0,
    expired: 0,
  };

  for (const record of evaluatedRecords) {
    const { effectiveStatus } = resolveEffectiveStatus(record, referenceNow);
    statusCounts[effectiveStatus] = (statusCounts[effectiveStatus] || 0) + 1;
  }

  // 7. Execution Adherence Metrics
  const resolvedCount =
    statusCounts.completed +
    statusCounts.abandoned +
    statusCounts.superseded +
    statusCounts.expired;

  const executionAdherenceRate =
    resolvedCount > 0 ? Number((statusCounts.completed / resolvedCount).toFixed(4)) : null;

  // 8. Learning Outcome Milestone Metrics
  let milestonesMet = 0;
  let milestonesEvaluated = 0;
  let milestonesInsufficientEvidence = 0;

  for (const record of evaluatedRecords) {
    if (record.status === 'completed') {
      if (record.targetMilestoneMet === true) {
        milestonesMet++;
        milestonesEvaluated++;
      } else if (record.targetMilestoneMet === false) {
        milestonesEvaluated++;
      } else if (record.targetMilestoneMet === null) {
        milestonesInsufficientEvidence++;
      }
    }
  }

  const milestoneSuccessRate =
    milestonesEvaluated > 0 ? Number((milestonesMet / milestonesEvaluated).toFixed(4)) : null;

  // 9. Projected Recent Prescriptions History
  const recentPrescriptions = evaluatedRecords.map((record) => {
    const { effectiveStatus } = resolveEffectiveStatus(record, referenceNow);
    return {
      prescriptionId: record.prescriptionId,
      actionType: record.actionType,
      actionSubtype: record.actionSubtype,
      status: record.status,
      effectiveStatus,
      issuedAt: record.issuedAt,
      completedAt: record.completedAt || record.abandonedAt || null,
      executionRequirementMet: record.executionRequirementMet,
      targetMilestoneMet: record.targetMilestoneMet,
    };
  });

  return {
    userId: trimmedUserId,
    windowDays: parsedWindowDays,
    actionTypeFilter: actionType,
    evaluatedPrescriptionCount: evaluatedRecords.length,
    resolvedPrescriptionCount: resolvedCount,
    isTruncated,
    isExhaustive,
    statusCounts,
    adherence: {
      executionAdherenceRate,
      completedPrescriptions: statusCounts.completed,
      resolvedPrescriptions: resolvedCount,
    },
    learningOutcomes: {
      milestoneSuccessRate,
      milestonesEvaluated,
      milestonesMet,
      milestonesInsufficientEvidence,
    },
    recentPrescriptions,
    attributionNotice: ATTRIBUTION_NOTICE,
  };
};

module.exports = {
  getAttributionSummary,
  resolveEffectiveStatus,
};
