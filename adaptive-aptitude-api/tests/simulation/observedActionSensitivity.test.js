'use strict';

/**
 * Phase 11 Suite 2: Observed Action Sensitivity Tests (Mode A)
 *
 * Verifies Mode A sensitivity evaluation over historical records, support precedence,
 * precision intervals, and strict nullability.
 */

const {
  BASELINE_POLICY,
  SUPPORT_LEVELS,
  SCORE_SOURCES,
  SCORE_PRECISIONS,
} = require('../../src/config/simulationConfig');
const {
  evaluateRecordSensitivity,
  evaluateObservedActionSensitivity,
  reconstructHistoricalDaysOverdue,
} = require('../../src/services/simulation/observedActionSensitivityService');
const { validateCandidatePolicy } = require('../../src/services/simulation/policyValidationService');

describe('Suite 2: Observed Action Sensitivity Tests (Mode A)', () => {
  const candidatePolicy = validateCandidatePolicy({
    simulationOnly: true,
    baseWeights: {
      PREREQUISITE_REMEDIATION: 55.0, // +5.0
      OVERDUE_REVISION: 50.0,         // +5.0
      DUE_TODAY_REVISION: 40.0,       // +5.0
      CURRICULUM_ADVANCEMENT: 35.0,   // +5.0
      EXAM_BENCHMARK: 25.0,
      PACING_CALIBRATION: 20.0,
    },
    maxMasteryDeficitWeight: 25.0,    // unchanged so retention rescue has PARTIAL support
    maxGoalImpactWeight: 15.0,
    maxTemporalWeight: 15.0,          // +5.0
    priorityThresholds: {
      critical: 82.0,
      urgent: 68.0,
      high: 52.0,
      normal: 36.0,
    },
  });

  describe('1. Prerequisite Remediation (EXACT Support)', () => {
    it('reconstructs raw score and evaluates EXACT support from raw snapshot mastery', () => {
      const record = {
        prescriptionId: 'presc_prereq_001',
        actionType: 'PREREQUISITE_REMEDIATION',
        actionSubtype: 'BLOCKING_PREREQUISITE',
        urgencyScore: 72.5,
        priorityTier: 'urgent',
        issuedAt: new Date('2026-09-15T10:00:00Z'),
        issuanceSnapshot: {
          prerequisiteMastery: 0.30,
          blockedTargetPattern: 'Linear Equations',
          blockedTargetTopic: 'Algebra',
        },
      };

      const result = evaluateRecordSensitivity({ record, candidatePolicy });

      expect(result.overallSupport).toBe(SUPPORT_LEVELS.EXACT);
      expect(result.scoreSource).toBe(SCORE_SOURCES.RECONSTRUCTED_RAW);
      expect(result.candidateUrgencyScorePrecision).toBe(SCORE_PRECISIONS.RAW_EXACT);

      // Baseline raw: 50.0 + (1 - 0.30)*25.0 + 10.0 = 50 + 17.5 + 10 = 77.5
      expect(result.reconstructedRawUrgencyScore).toBe(77.5);
      // Candidate: 55.0 + (1 - 0.30)*25.0 + min(15, 10) = 55 + 17.5 + 10 = 82.5
      expect(result.estimatedCandidateUrgencyScore).toBe(82.5);
      expect(result.candidatePriorityTier).toBe('critical'); // 82.5 >= 82.0
      expect(result.tierShiftDetected).toBe(true);
      expect(result.thresholdBoundaryAmbiguous).toBe(false);
    });
  });

  describe('2. Historical Days Overdue Reconstruction', () => {
    it('reconstructs daysOverdue strictly using record.issuedAt, not referenceNow', () => {
      const record = {
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'OVERDUE_REVISION',
        issuedAt: new Date('2026-09-20T12:00:00.000Z'),
        issuanceSnapshot: {
          nextReviewDate: '2026-09-15T00:00:00.000Z', // 5 days overdue relative to 2026-09-20
        },
      };

      const daysOverdue = reconstructHistoricalDaysOverdue(record);
      expect(daysOverdue).toBe(5);
    });

    it('returns 0 for non-overdue records or future nextReviewDate', () => {
      const record = {
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'OVERDUE_REVISION',
        issuedAt: new Date('2026-09-20T12:00:00.000Z'),
        issuanceSnapshot: {
          nextReviewDate: '2026-09-22T00:00:00.000Z',
        },
      };
      expect(reconstructHistoricalDaysOverdue(record)).toBe(0);
    });
  });

  describe('3. Multi-Parameter Aggregation & Support Precedence', () => {
    it('applies UNSUPPORTED > PARTIAL > EXACT precedence when an effective dimension is unsupported', () => {
      // Modifying maxGoalImpactWeight makes RETENTION_RESCUE UNSUPPORTED because plan alignment is missing
      const candidateModifyingGoalImpact = validateCandidatePolicy({
        simulationOnly: true,
        baseWeights: {
          PREREQUISITE_REMEDIATION: 50.0,
          OVERDUE_REVISION: 50.0, // +5.0 (PARTIAL)
          DUE_TODAY_REVISION: 35.0,
          CURRICULUM_ADVANCEMENT: 30.0,
          EXAM_BENCHMARK: 25.0,
          PACING_CALIBRATION: 20.0,
        },
        maxMasteryDeficitWeight: 25.0,
        maxGoalImpactWeight: 20.0, // +5.0 (UNSUPPORTED for retention rescue)
        maxTemporalWeight: 10.0,
        priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
      });

      const record = {
        prescriptionId: 'presc_rev_001',
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'OVERDUE_REVISION',
        urgencyScore: 60.0,
        priorityTier: 'high',
        issuedAt: new Date('2026-09-10T00:00:00Z'),
        issuanceSnapshot: {
          nextReviewDate: '2026-09-05T00:00:00Z',
        },
      };

      const result = evaluateRecordSensitivity({
        record,
        candidatePolicy: candidateModifyingGoalImpact,
      });

      expect(result.overallSupport).toBe(SUPPORT_LEVELS.UNSUPPORTED);
      expect(result.scoreSource).toBe(SCORE_SOURCES.NOT_AVAILABLE);
      expect(result.candidateUrgencyScorePrecision).toBe(SCORE_PRECISIONS.UNAVAILABLE);
      expect(result.estimatedCandidateUrgencyScore).toBeNull();
      expect(result.candidatePriorityTier).toBeNull();
      expect(result.tierShiftDetected).toBeNull();
      expect(result.thresholdBoundaryAmbiguous).toBeNull();
      expect(result.unsupportedDimensions).toContain('maxGoalImpactWeight');
    });

    it('returns PARTIAL when only baseWeights change for retention rescue', () => {
      const candidateOnlyBaseWeight = validateCandidatePolicy({
        simulationOnly: true,
        baseWeights: {
          PREREQUISITE_REMEDIATION: 50.0,
          OVERDUE_REVISION: 52.0, // +7.0
          DUE_TODAY_REVISION: 35.0,
          CURRICULUM_ADVANCEMENT: 30.0,
          EXAM_BENCHMARK: 25.0,
          PACING_CALIBRATION: 20.0,
        },
        maxMasteryDeficitWeight: 25.0,
        maxGoalImpactWeight: 15.0,
        maxTemporalWeight: 10.0,
        priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
      });

      const record = {
        prescriptionId: 'presc_rev_002',
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'OVERDUE_REVISION',
        urgencyScore: 61.25,
        priorityTier: 'high',
        issuedAt: new Date('2026-09-10T00:00:00Z'),
        issuanceSnapshot: {
          nextReviewDate: '2026-09-05T00:00:00Z',
        },
      };

      const result = evaluateRecordSensitivity({
        record,
        candidatePolicy: candidateOnlyBaseWeight,
      });

      expect(result.overallSupport).toBe(SUPPORT_LEVELS.PARTIAL);
      expect(result.scoreSource).toBe(SCORE_SOURCES.PERSISTED_ROUNDED_DTO);
      expect(result.candidateUrgencyScorePrecision).toBe(SCORE_PRECISIONS.DTO_ROUNDED_PARTIAL);
      expect(result.estimatedCandidateUrgencyScore).toBe(61.25 + 7.0);
      expect(result.candidatePriorityTier).toBe('urgent'); // 68.25 >= 65.0
    });
  });

  describe('4. Rounding Interval Propagation & Ambiguity Audit', () => {
    it('detects thresholdBoundaryAmbiguous = true when a candidate threshold falls in shifted interval', () => {
      // Baseline critical is 80.0. If candidate critical is 80.0,
      // and estimatedCandidateUrgencyScore is exactly 80.00 (from 75.00 + 5.0),
      // interval is [79.995, 80.005), which strictly contains 80.0!
      const candidate = validateCandidatePolicy({
        simulationOnly: true,
        baseWeights: {
          PREREQUISITE_REMEDIATION: 50.0,
          OVERDUE_REVISION: 50.0, // +5.0
          DUE_TODAY_REVISION: 35.0,
          CURRICULUM_ADVANCEMENT: 30.0,
          EXAM_BENCHMARK: 25.0,
          PACING_CALIBRATION: 20.0,
        },
        maxMasteryDeficitWeight: 25.0,
        maxGoalImpactWeight: 15.0,
        maxTemporalWeight: 10.0,
        priorityThresholds: {
          critical: 80.0,
          urgent: 65.0,
          high: 50.0,
          normal: 35.0,
        },
      });

      const record = {
        prescriptionId: 'presc_rev_boundary',
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'OVERDUE_REVISION',
        urgencyScore: 75.0,
        priorityTier: 'urgent',
        issuedAt: new Date('2026-09-10T00:00:00Z'),
        issuanceSnapshot: { nextReviewDate: '2026-09-08T00:00:00Z' },
      };

      const result = evaluateRecordSensitivity({ record, candidatePolicy: candidate });

      expect(result.estimatedCandidateUrgencyScore).toBe(80.0);
      expect(result.thresholdBoundaryAmbiguous).toBe(true);
    });

    it('sets thresholdBoundaryAmbiguous = false when candidate thresholds lie strictly outside interval', () => {
      const candidate = validateCandidatePolicy({
        simulationOnly: true,
        baseWeights: {
          PREREQUISITE_REMEDIATION: 50.0,
          OVERDUE_REVISION: 50.0, // +5.0
          DUE_TODAY_REVISION: 35.0,
          CURRICULUM_ADVANCEMENT: 30.0,
          EXAM_BENCHMARK: 25.0,
          PACING_CALIBRATION: 20.0,
        },
        maxMasteryDeficitWeight: 25.0,
        maxGoalImpactWeight: 15.0,
        maxTemporalWeight: 10.0,
        priorityThresholds: {
          critical: 85.0, // far from 77.0
          urgent: 65.0,
          high: 50.0,
          normal: 35.0,
        },
      });

      const record = {
        prescriptionId: 'presc_rev_clear',
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'OVERDUE_REVISION',
        urgencyScore: 72.0,
        priorityTier: 'urgent',
        issuedAt: new Date('2026-09-10T00:00:00Z'),
        issuanceSnapshot: { nextReviewDate: '2026-09-08T00:00:00Z' },
      };

      const result = evaluateRecordSensitivity({ record, candidatePolicy: candidate });

      expect(result.estimatedCandidateUrgencyScore).toBe(77.0);
      expect(result.thresholdBoundaryAmbiguous).toBe(false);
    });
  });

  describe('5. Batch Sensitivity Aggregation (evaluateObservedActionSensitivity)', () => {
    it('aggregates support percentages and tier migration matrix truthfully', () => {
      const records = [
        {
          prescriptionId: 'p1',
          actionType: 'PREREQUISITE_REMEDIATION',
          actionSubtype: 'BLOCKING_PREREQUISITE',
          urgencyScore: 70.0,
          priorityTier: 'urgent',
          issuedAt: new Date('2026-09-10T00:00:00Z'),
          issuanceSnapshot: { prerequisiteMastery: 0.5 },
        },
        {
          prescriptionId: 'p2',
          actionType: 'RETENTION_RESCUE',
          actionSubtype: 'OVERDUE_REVISION',
          urgencyScore: 60.0,
          priorityTier: 'high',
          issuedAt: new Date('2026-09-10T00:00:00Z'),
          issuanceSnapshot: { nextReviewDate: '2026-09-05T00:00:00Z' },
        },
      ];

      const { historicalSensitivityAnalysis, traceRecords } = evaluateObservedActionSensitivity({
        records,
        candidatePolicies: [candidatePolicy],
        includeTrace: true,
      });

      expect(historicalSensitivityAnalysis.policies.length).toBe(1);
      const policySummary = historicalSensitivityAnalysis.policies[0];
      expect(policySummary.totalEvaluatedRecords).toBe(2);
      expect(policySummary.supportCounts.EXACT).toBe(1);
      expect(policySummary.supportCounts.PARTIAL).toBe(1);
      expect(traceRecords.length).toBe(2);
      // Privacy invariant: traceRecords must not contain student PII
      expect(traceRecords[0].userId).toBeUndefined();
      expect(traceRecords[0].prescriptionId).toBe('p1');
    });
  });
});
