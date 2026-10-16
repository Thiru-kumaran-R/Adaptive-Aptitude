'use strict';

/**
 * Phase 11: Observed Action Sensitivity Service (Mode A)
 *
 * Implements historical observed action replay sensitivity analysis, support precedence,
 * precision interval propagation, and statistical aggregation.
 */

const {
  BASELINE_POLICY,
  SIMULATION_BOUNDS,
  SUPPORT_LEVELS,
  SCORE_SOURCES,
  SCORE_PRECISIONS,
} = require('../../config/simulationConfig');
const { diffPolicy, dimensionAffects } = require('./policyValidationService');
const { generatePolicyFingerprint } = require('../../utils/simulationFingerprint');

/**
 * Deterministically reconstructs historical daysOverdue using record.issuedAt.
 *
 * @param {Object} record
 * @returns {number}
 */
const reconstructHistoricalDaysOverdue = (record) => {
  if (record.actionSubtype !== 'OVERDUE_REVISION') return 0;
  if (!record.issuanceSnapshot || !record.issuanceSnapshot.nextReviewDate) return 0;

  const d = new Date(record.issuedAt);
  const todayStartUtc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const nextReviewDate = new Date(record.issuanceSnapshot.nextReviewDate);

  if (nextReviewDate >= todayStartUtc) return 0;

  return Math.max(0, Math.floor((todayStartUtc.getTime() - nextReviewDate.getTime()) / 86400000));
};

/**
 * Resolves single-dimension support and component delta for a historical record.
 *
 * @param {Object} record
 * @param {Object} candidatePolicy
 * @param {string} dimension
 * @returns {{ support: string, reasonCode: string, componentDelta: number|null }}
 */
const resolveDimensionSupportAndDelta = (record, candidatePolicy, dimension) => {
  const { actionType, actionSubtype, issuanceSnapshot } = record;

  if (actionType === 'DIAGNOSTIC_ASSESSMENT') {
    return {
      support: SUPPORT_LEVELS.NOT_APPLICABLE,
      reasonCode: 'INVARIANT_NOT_APPLICABLE',
      componentDelta: null,
    };
  }

  // Base Weights
  if (dimension.startsWith('baseWeights.')) {
    if (actionType === 'PREREQUISITE_REMEDIATION') {
      const delta = candidatePolicy.baseWeights.PREREQUISITE_REMEDIATION - BASELINE_POLICY.baseWeights.PREREQUISITE_REMEDIATION;
      return {
        support: SUPPORT_LEVELS.EXACT,
        reasonCode: 'RAW_EVIDENCE_AVAILABLE',
        componentDelta: delta,
      };
    }
    // All other scored actions
    let bwCand = 0.0;
    let bwBase = 0.0;
    if (actionSubtype === 'OVERDUE_REVISION') {
      bwCand = candidatePolicy.baseWeights.OVERDUE_REVISION;
      bwBase = BASELINE_POLICY.baseWeights.OVERDUE_REVISION;
    } else if (actionSubtype === 'DUE_TODAY_REVISION') {
      bwCand = candidatePolicy.baseWeights.DUE_TODAY_REVISION;
      bwBase = BASELINE_POLICY.baseWeights.DUE_TODAY_REVISION;
    } else if (candidatePolicy.baseWeights[actionType] !== undefined) {
      bwCand = candidatePolicy.baseWeights[actionType];
      bwBase = BASELINE_POLICY.baseWeights[actionType];
    }
    return {
      support: SUPPORT_LEVELS.PARTIAL,
      reasonCode: 'ROUNDED_DTO_BASELINE',
      componentDelta: bwCand - bwBase,
    };
  }

  // maxMasteryDeficitWeight
  if (dimension === 'maxMasteryDeficitWeight') {
    if (actionType === 'PREREQUISITE_REMEDIATION') {
      const mastery = (issuanceSnapshot && typeof issuanceSnapshot.prerequisiteMastery === 'number')
        ? issuanceSnapshot.prerequisiteMastery
        : 0.0;
      const deficit = Math.max(0.0, 1.0 - mastery);
      const delta = deficit * (candidatePolicy.maxMasteryDeficitWeight - BASELINE_POLICY.maxMasteryDeficitWeight);
      return {
        support: SUPPORT_LEVELS.EXACT,
        reasonCode: 'RAW_EVIDENCE_AVAILABLE',
        componentDelta: delta,
      };
    }
    if (actionType === 'EXAM_BENCHMARK') {
      return {
        support: SUPPORT_LEVELS.NOT_APPLICABLE,
        reasonCode: 'INVARIANT_NOT_APPLICABLE',
        componentDelta: 0.0,
      };
    }
    if (actionType === 'CURRICULUM_ADVANCEMENT') {
      if (issuanceSnapshot && typeof issuanceSnapshot.storedMastery === 'number') {
        const deficit = Math.max(0.0, 1.0 - issuanceSnapshot.storedMastery);
        const delta = deficit * (candidatePolicy.maxMasteryDeficitWeight - BASELINE_POLICY.maxMasteryDeficitWeight);
        return {
          support: SUPPORT_LEVELS.PARTIAL,
          reasonCode: 'RAW_MASTERY_FROZEN',
          componentDelta: delta,
        };
      }
      return {
        support: SUPPORT_LEVELS.UNSUPPORTED,
        reasonCode: 'HISTORICAL_MASTERY_UNAVAILABLE',
        componentDelta: null,
      };
    }
    // OVERDUE_REVISION, DUE_TODAY_REVISION, PACING_CALIBRATION
    return {
      support: SUPPORT_LEVELS.UNSUPPORTED,
      reasonCode: 'HISTORICAL_MASTERY_UNAVAILABLE',
      componentDelta: null,
    };
  }

  // maxTemporalWeight
  if (dimension === 'maxTemporalWeight') {
    if (actionSubtype === 'OVERDUE_REVISION') {
      const daysOverdue = reconstructHistoricalDaysOverdue(record);
      const rawTemporal = daysOverdue * 2.0;
      const baseT = Math.min(BASELINE_POLICY.maxTemporalWeight, rawTemporal);
      const candT = Math.min(candidatePolicy.maxTemporalWeight, rawTemporal);
      return {
        support: SUPPORT_LEVELS.PARTIAL,
        reasonCode: 'RAW_EVIDENCE_AVAILABLE',
        componentDelta: candT - baseT,
      };
    }
    return {
      support: SUPPORT_LEVELS.NOT_APPLICABLE,
      reasonCode: 'INVARIANT_NOT_APPLICABLE',
      componentDelta: 0.0,
    };
  }

  // maxGoalImpactWeight
  if (dimension === 'maxGoalImpactWeight') {
    if (actionType === 'PREREQUISITE_REMEDIATION') {
      // Baseline I = min(15, 10) = 10; Candidate I = min(W_I, 10)
      const candI = Math.min(candidatePolicy.maxGoalImpactWeight, 10.0);
      const delta = candI - 10.0;
      return {
        support: SUPPORT_LEVELS.EXACT,
        reasonCode: 'RAW_EVIDENCE_AVAILABLE',
        componentDelta: delta,
      };
    }
    if (actionSubtype === 'OVERDUE_REVISION' || actionSubtype === 'DUE_TODAY_REVISION' || actionType === 'PACING_CALIBRATION') {
      return {
        support: SUPPORT_LEVELS.UNSUPPORTED,
        reasonCode: 'PLAN_ALIGNMENT_UNAVAILABLE',
        componentDelta: null,
      };
    }
    if (actionType === 'CURRICULUM_ADVANCEMENT' || actionType === 'EXAM_BENCHMARK') {
      return {
        support: SUPPORT_LEVELS.UNSUPPORTED,
        reasonCode: 'DEADLINE_BONUS_UNAVAILABLE',
        componentDelta: null,
      };
    }
    return {
      support: SUPPORT_LEVELS.UNSUPPORTED,
      reasonCode: 'PLAN_ALIGNMENT_UNAVAILABLE',
      componentDelta: null,
    };
  }

  // priorityThresholds
  if (dimension.startsWith('priorityThresholds.')) {
    if (actionType === 'PREREQUISITE_REMEDIATION') {
      return {
        support: SUPPORT_LEVELS.EXACT,
        reasonCode: 'RAW_EVIDENCE_AVAILABLE',
        componentDelta: 0.0,
      };
    }
    return {
      support: SUPPORT_LEVELS.PARTIAL,
      reasonCode: 'ROUNDED_DTO_BASELINE',
      componentDelta: 0.0,
    };
  }

  return {
    support: SUPPORT_LEVELS.NOT_APPLICABLE,
    reasonCode: 'INVARIANT_NOT_APPLICABLE',
    componentDelta: null,
  };
};

/**
 * Evaluates sensitivity of a single historical record against a candidate policy.
 *
 * @param {{
 *   record: Object,
 *   candidatePolicy: Object,
 *   policyDelta?: Object
 * }} params
 * @returns {Object} Internal Mode A Record Result object
 */
const evaluateRecordSensitivity = ({ record, candidatePolicy, policyDelta }) => {
  const delta = policyDelta || diffPolicy(BASELINE_POLICY, candidatePolicy);
  const { changedDimensions, deltas } = delta;

  const effectiveDimensions = changedDimensions.filter((d) =>
    dimensionAffects(record.actionType, record.actionSubtype, d)
  );

  const parameterDiagnostics = [];
  const unsupportedDimensions = [];
  let hasPartial = false;
  let hasUnsupported = false;
  let totalDelta = 0.0;

  for (const dim of changedDimensions) {
    const isEffective = effectiveDimensions.includes(dim);
    const baselineValue = dim.startsWith('baseWeights.')
      ? BASELINE_POLICY.baseWeights[dim.slice('baseWeights.'.length)]
      : dim.startsWith('priorityThresholds.')
      ? BASELINE_POLICY.priorityThresholds[dim.slice('priorityThresholds.'.length)]
      : BASELINE_POLICY[dim];
    const candidateValue = dim.startsWith('baseWeights.')
      ? candidatePolicy.baseWeights[dim.slice('baseWeights.'.length)]
      : dim.startsWith('priorityThresholds.')
      ? candidatePolicy.priorityThresholds[dim.slice('priorityThresholds.'.length)]
      : candidatePolicy[dim];

    if (!isEffective) {
      parameterDiagnostics.push({
        dimension: dim,
        support: SUPPORT_LEVELS.NOT_APPLICABLE,
        reasonCode: 'IRRELEVANT_ACTION_DIMENSION',
        baselineValue,
        candidateValue,
        componentDelta: null,
      });
      continue;
    }

    const { support, reasonCode, componentDelta } = resolveDimensionSupportAndDelta(record, candidatePolicy, dim);

    parameterDiagnostics.push({
      dimension: dim,
      support,
      reasonCode,
      baselineValue,
      candidateValue,
      componentDelta,
    });

    if (support === SUPPORT_LEVELS.UNSUPPORTED) {
      hasUnsupported = true;
      unsupportedDimensions.push(dim);
    } else if (support === SUPPORT_LEVELS.PARTIAL) {
      hasPartial = true;
      if (componentDelta !== null) {
        totalDelta += componentDelta;
      }
    } else if (support === SUPPORT_LEVELS.EXACT) {
      if (componentDelta !== null) {
        totalDelta += componentDelta;
      }
    }
  }

  // Whole-Policy Support Precedence: UNSUPPORTED > PARTIAL > EXACT
  let overallSupport = SUPPORT_LEVELS.EXACT;
  if (record.actionType === 'DIAGNOSTIC_ASSESSMENT' || effectiveDimensions.length === 0) {
    overallSupport = SUPPORT_LEVELS.NOT_APPLICABLE;
  } else if (hasUnsupported) {
    overallSupport = SUPPORT_LEVELS.UNSUPPORTED;
  } else if (hasPartial) {
    overallSupport = SUPPORT_LEVELS.PARTIAL;
  } else {
    overallSupport = SUPPORT_LEVELS.EXACT;
  }

  const prescriptionId = record.prescriptionId || (record._id ? String(record._id) : 'unknown');
  const baselinePriorityTier = record.priorityTier || 'normal';
  const persistedDtoUrgencyScore = typeof record.urgencyScore === 'number' ? record.urgencyScore : null;

  if (overallSupport === SUPPORT_LEVELS.UNSUPPORTED || overallSupport === SUPPORT_LEVELS.NOT_APPLICABLE) {
    return {
      prescriptionId,
      actionType: record.actionType,
      actionSubtype: record.actionSubtype,

      overallSupport,
      scoreSource: SCORE_SOURCES.NOT_AVAILABLE,
      candidateUrgencyScorePrecision: SCORE_PRECISIONS.UNAVAILABLE,

      reconstructedRawUrgencyScore: null,
      persistedDtoUrgencyScore,
      estimatedCandidateUrgencyScore: null,

      baselinePriorityTier,
      candidatePriorityTier: null,
      tierShiftDetected: null,
      thresholdBoundaryAmbiguous: null,

      changedDimensions,
      effectiveDimensions,
      unsupportedDimensions,
      parameterDiagnostics,
    };
  }

  // EXACT Support (Prerequisite Remediation)
  if (overallSupport === SUPPORT_LEVELS.EXACT && record.actionType === 'PREREQUISITE_REMEDIATION') {
    const rawMastery = (record.issuanceSnapshot && typeof record.issuanceSnapshot.prerequisiteMastery === 'number')
      ? record.issuanceSnapshot.prerequisiteMastery
      : 0.0;
    const reconstructedRawUrgencyScore = 50.0 + Math.max(0.0, 1.0 - rawMastery) * 25.0 + 10.0;
    const estimatedCandidateUrgencyScore =
      candidatePolicy.baseWeights.PREREQUISITE_REMEDIATION +
      Math.max(0.0, 1.0 - rawMastery) * candidatePolicy.maxMasteryDeficitWeight +
      Math.min(candidatePolicy.maxGoalImpactWeight, 10.0);

    const { critical, urgent, high, normal } = candidatePolicy.priorityThresholds;
    let candidatePriorityTier = 'low';
    if (estimatedCandidateUrgencyScore >= critical) candidatePriorityTier = 'critical';
    else if (estimatedCandidateUrgencyScore >= urgent) candidatePriorityTier = 'urgent';
    else if (estimatedCandidateUrgencyScore >= high) candidatePriorityTier = 'high';
    else if (estimatedCandidateUrgencyScore >= normal) candidatePriorityTier = 'normal';

    return {
      prescriptionId,
      actionType: record.actionType,
      actionSubtype: record.actionSubtype,

      overallSupport: SUPPORT_LEVELS.EXACT,
      scoreSource: SCORE_SOURCES.RECONSTRUCTED_RAW,
      candidateUrgencyScorePrecision: SCORE_PRECISIONS.RAW_EXACT,

      reconstructedRawUrgencyScore,
      persistedDtoUrgencyScore,
      estimatedCandidateUrgencyScore,

      baselinePriorityTier,
      candidatePriorityTier,
      tierShiftDetected: candidatePriorityTier !== baselinePriorityTier,
      thresholdBoundaryAmbiguous: false,

      changedDimensions,
      effectiveDimensions,
      unsupportedDimensions,
      parameterDiagnostics,
    };
  }

  // PARTIAL Support (Rounded DTO + Deltas)
  const estimatedCandidateUrgencyScore = persistedDtoUrgencyScore !== null
    ? persistedDtoUrgencyScore + totalDelta
    : null;

  // Rounding Interval Propagation: [U_dto - 0.005 + delta, U_dto + 0.005 + delta)
  let thresholdBoundaryAmbiguous = false;
  let candidatePriorityTier = 'low';

  if (estimatedCandidateUrgencyScore !== null) {
    const { critical, urgent, high, normal } = candidatePolicy.priorityThresholds;
    const lowerInterval = (persistedDtoUrgencyScore - 0.005) + totalDelta;
    const upperInterval = (persistedDtoUrgencyScore + 0.005) + totalDelta;

    const thresholds = [critical, urgent, high, normal];
    for (const T of thresholds) {
      if (lowerInterval <= T && T < upperInterval) {
        thresholdBoundaryAmbiguous = true;
        break;
      }
    }

    if (estimatedCandidateUrgencyScore >= critical) candidatePriorityTier = 'critical';
    else if (estimatedCandidateUrgencyScore >= urgent) candidatePriorityTier = 'urgent';
    else if (estimatedCandidateUrgencyScore >= high) candidatePriorityTier = 'high';
    else if (estimatedCandidateUrgencyScore >= normal) candidatePriorityTier = 'normal';
  } else {
    candidatePriorityTier = null;
  }

  return {
    prescriptionId,
    actionType: record.actionType,
    actionSubtype: record.actionSubtype,

    overallSupport: SUPPORT_LEVELS.PARTIAL,
    scoreSource: SCORE_SOURCES.PERSISTED_ROUNDED_DTO,
    candidateUrgencyScorePrecision: SCORE_PRECISIONS.DTO_ROUNDED_PARTIAL,

    reconstructedRawUrgencyScore: null,
    persistedDtoUrgencyScore,
    estimatedCandidateUrgencyScore,

    baselinePriorityTier,
    candidatePriorityTier,
    tierShiftDetected: candidatePriorityTier !== null ? candidatePriorityTier !== baselinePriorityTier : null,
    thresholdBoundaryAmbiguous,

    changedDimensions,
    effectiveDimensions,
    unsupportedDimensions,
    parameterDiagnostics,
  };
};

/**
 * Evaluates observed action sensitivity across all historical records for all candidate policies.
 *
 * @param {{
 *   records: Array,
 *   candidatePolicies: Array,
 *   includeTrace?: boolean,
 *   startTimeNs?: bigint
 * }} params
 * @returns {{ historicalSensitivityAnalysis: Object, traceRecords?: Array }}
 */
const evaluateObservedActionSensitivity = ({
  records,
  candidatePolicies,
  includeTrace = false,
  startTimeNs = process.hrtime.bigint(),
}) => {
  const policyAnalyses = [];
  const traceRecords = [];

  for (const candidatePolicy of candidatePolicies) {
    const policyFingerprint = generatePolicyFingerprint(candidatePolicy);
    const policyDelta = diffPolicy(BASELINE_POLICY, candidatePolicy);

    const supportCounts = {
      EXACT: 0,
      PARTIAL: 0,
      UNSUPPORTED: 0,
      NOT_APPLICABLE: 0,
    };

    const tierMigrationMatrix = {};
    const scoreDeltas = [];

    for (let i = 0; i < records.length; i++) {
      // Monotonic cooperative circuit breaker check every 100 records
      if (i % 100 === 0) {
        const elapsedMs = Number(process.hrtime.bigint() - startTimeNs) / 1e6;
        if (elapsedMs > SIMULATION_BOUNDS.MAX_EXECUTION_TIME_MS) {
          const err = new Error('SIMULATION_EXECUTION_FAILED: CIRCUIT_BREAKER_TRIGGERED - CPU budget exceeded');
          err.name = 'SimulationExecutionError';
          err.code = 'SIMULATION_EXECUTION_FAILED';
          err.reason = 'CIRCUIT_BREAKER_TRIGGERED';
          err.reasonCode = 'CIRCUIT_BREAKER_TRIGGERED';
          throw err;
        }
      }

      const record = records[i];
      const result = evaluateRecordSensitivity({
        record,
        candidatePolicy,
        policyDelta,
      });

      supportCounts[result.overallSupport] = (supportCounts[result.overallSupport] || 0) + 1;

      if (result.candidatePriorityTier) {
        const transitionKey = `${result.baselinePriorityTier}->${result.candidatePriorityTier}`;
        tierMigrationMatrix[transitionKey] = (tierMigrationMatrix[transitionKey] || 0) + 1;
      }

      if (
        result.estimatedCandidateUrgencyScore !== null &&
        result.persistedDtoUrgencyScore !== null
      ) {
        scoreDeltas.push(result.estimatedCandidateUrgencyScore - result.persistedDtoUrgencyScore);
      }

      if (includeTrace) {
        traceRecords.push({
          policyFingerprint,
          prescriptionId: result.prescriptionId,
          actionType: result.actionType,
          actionSubtype: result.actionSubtype,
          overallSupport: result.overallSupport,
          scoreSource: result.scoreSource,
          candidateUrgencyScorePrecision: result.candidateUrgencyScorePrecision,
          estimatedCandidateUrgencyScore: result.estimatedCandidateUrgencyScore,
          baselinePriorityTier: result.baselinePriorityTier,
          candidatePriorityTier: result.candidatePriorityTier,
          tierShiftDetected: result.tierShiftDetected,
          thresholdBoundaryAmbiguous: result.thresholdBoundaryAmbiguous,
        });
      }
    }

    const totalRecords = records.length;
    const supportPercentages = {
      EXACT: totalRecords > 0 ? (supportCounts.EXACT / totalRecords) * 100 : 0,
      PARTIAL: totalRecords > 0 ? (supportCounts.PARTIAL / totalRecords) * 100 : 0,
      UNSUPPORTED: totalRecords > 0 ? (supportCounts.UNSUPPORTED / totalRecords) * 100 : 0,
      NOT_APPLICABLE: totalRecords > 0 ? (supportCounts.NOT_APPLICABLE / totalRecords) * 100 : 0,
    };

    let scoreShiftSummary = null;
    if (scoreDeltas.length > 0) {
      const sum = scoreDeltas.reduce((acc, v) => acc + v, 0);
      const mean = sum / scoreDeltas.length;
      const min = Math.min(...scoreDeltas);
      const max = Math.max(...scoreDeltas);
      scoreShiftSummary = {
        evaluatedCount: scoreDeltas.length,
        meanShift: mean,
        minShift: min,
        maxShift: max,
      };
    }

    policyAnalyses.push({
      policyFingerprint,
      totalEvaluatedRecords: totalRecords,
      supportCounts,
      supportPercentages,
      tierMigrationMatrix,
      scoreShiftSummary,
    });
  }

  return {
    historicalSensitivityAnalysis: {
      policies: policyAnalyses,
    },
    traceRecords: includeTrace ? traceRecords : null,
  };
};

module.exports = {
  evaluateRecordSensitivity,
  evaluateObservedActionSensitivity,
  reconstructHistoricalDaysOverdue,
};
