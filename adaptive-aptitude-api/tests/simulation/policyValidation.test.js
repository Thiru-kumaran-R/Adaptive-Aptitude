'use strict';

/**
 * Phase 11 Suite 1: Policy Validation & Schema Tests
 *
 * Verifies candidate policy schema validation, reason precedence, 13-dimension diffing,
 * dimension relevance, and fingerprint calculation.
 */

const { BASELINE_POLICY } = require('../../src/config/simulationConfig');
const {
  validateCandidatePolicy,
  diffPolicy,
  dimensionAffects,
  CANONICAL_DIMENSIONS,
} = require('../../src/services/simulation/policyValidationService');
const { generatePolicyFingerprint } = require('../../src/utils/simulationFingerprint');

describe('Suite 1: Policy Validation & Delta Engine Tests', () => {
  const createValidCandidate = (overrides = {}) => {
    const { baseWeights: bwOverrides, priorityThresholds: ptOverrides, ...restOverrides } = overrides;
    return {
      simulationOnly: true,
      baseWeights: {
        PREREQUISITE_REMEDIATION: 55.0, // Baseline: 50.0
        OVERDUE_REVISION: 45.0,
        DUE_TODAY_REVISION: 35.0,
        CURRICULUM_ADVANCEMENT: 30.0,
        EXAM_BENCHMARK: 25.0,
        PACING_CALIBRATION: 20.0,
        ...bwOverrides,
      },
      maxMasteryDeficitWeight: 25.0,
      maxGoalImpactWeight: 15.0,
      maxTemporalWeight: 10.0,
      priorityThresholds: {
        critical: 80.0,
        urgent: 65.0,
        high: 50.0,
        normal: 35.0,
        ...ptOverrides,
      },
      ...restOverrides,
    };
  };

  describe('1. Plain Object and Shape Validation', () => {
    it('rejects null candidate with INVALID_OBJECT_SHAPE', () => {
      expect(() => validateCandidatePolicy(null)).toThrow(/INVALID_OBJECT_SHAPE/);
    });

    it('rejects array candidate with INVALID_OBJECT_SHAPE', () => {
      expect(() => validateCandidatePolicy([])).toThrow(/INVALID_OBJECT_SHAPE/);
    });

    it('rejects string candidate with INVALID_OBJECT_SHAPE', () => {
      expect(() => validateCandidatePolicy('not-an-object')).toThrow(/INVALID_OBJECT_SHAPE/);
    });
  });

  describe('2. Reason Precedence & Prohibited Mutations', () => {
    it('rejects prohibited prerequisiteGatingThreshold with PROHIBITED_ELIGIBILITY_MUTATION', () => {
      const candidate = createValidCandidate({ prerequisiteGatingThreshold: 0.70 });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/PROHIBITED_ELIGIBILITY_MUTATION/);
    });

    it('rejects prohibited rushingRiskThreshold with PROHIBITED_ELIGIBILITY_MUTATION', () => {
      const candidate = createValidCandidate({ rushingRiskThreshold: 0.85 });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/PROHIBITED_ELIGIBILITY_MUTATION/);
    });

    it('rejects prohibited overdueTemporalPointsPerDay with PROHIBITED_ELIGIBILITY_MUTATION', () => {
      const candidate = createValidCandidate({ overdueTemporalPointsPerDay: 3.0 });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/PROHIBITED_ELIGIBILITY_MUTATION/);
    });

    it('rejects unknown top-level key with UNKNOWN_PROPERTY', () => {
      const candidate = createValidCandidate({ unknownBonusWeight: 10.0 });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/UNKNOWN_PROPERTY/);
    });

    it('rejects unknown key in baseWeights with UNKNOWN_PROPERTY', () => {
      const candidate = createValidCandidate();
      candidate.baseWeights.CUSTOM_ACTION = 15.0;
      expect(() => validateCandidatePolicy(candidate)).toThrow(/UNKNOWN_PROPERTY/);
    });
  });

  describe('3. Required Keys & Flags', () => {
    it('rejects missing or false simulationOnly with INVALID_SIMULATION_FLAG', () => {
      const candidate = createValidCandidate({ simulationOnly: false });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/INVALID_SIMULATION_FLAG/);
    });

    it('rejects missing required top-level key with MISSING_REQUIRED_KEY', () => {
      const candidate = createValidCandidate();
      delete candidate.maxGoalImpactWeight;
      expect(() => validateCandidatePolicy(candidate)).toThrow(/MISSING_REQUIRED_KEY/);
    });

    it('rejects missing key in baseWeights with MISSING_REQUIRED_KEY', () => {
      const candidate = createValidCandidate();
      delete candidate.baseWeights.PREREQUISITE_REMEDIATION;
      expect(() => validateCandidatePolicy(candidate)).toThrow(/MISSING_REQUIRED_KEY/);
    });

    it('rejects missing key in priorityThresholds with MISSING_REQUIRED_KEY', () => {
      const candidate = createValidCandidate();
      delete candidate.priorityThresholds.critical;
      expect(() => validateCandidatePolicy(candidate)).toThrow(/MISSING_REQUIRED_KEY/);
    });
  });

  describe('4. Numeric Validation & Bounds', () => {
    it('rejects NaN value with NON_NUMERIC_VALUE', () => {
      const candidate = createValidCandidate({ maxMasteryDeficitWeight: NaN });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/NON_NUMERIC_VALUE/);
    });

    it('rejects Infinity value with NON_NUMERIC_VALUE', () => {
      const candidate = createValidCandidate({ maxTemporalWeight: Infinity });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/NON_NUMERIC_VALUE/);
    });

    it('rejects string numeric value with NON_NUMERIC_VALUE', () => {
      const candidate = createValidCandidate({ maxGoalImpactWeight: '25.0' });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/NON_NUMERIC_VALUE/);
    });

    it('rejects baseWeight out of bounds (< 0) with VALUE_OUT_OF_BOUNDS', () => {
      const candidate = createValidCandidate({
        baseWeights: { PREREQUISITE_REMEDIATION: -5.0 },
      });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/VALUE_OUT_OF_BOUNDS/);
    });

    it('rejects baseWeight out of bounds (> 100) with VALUE_OUT_OF_BOUNDS', () => {
      const candidate = createValidCandidate({
        baseWeights: { PREREQUISITE_REMEDIATION: 105.0 },
      });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/VALUE_OUT_OF_BOUNDS/);
    });

    it('rejects maxMasteryDeficitWeight out of bounds (> 50) with VALUE_OUT_OF_BOUNDS', () => {
      const candidate = createValidCandidate({ maxMasteryDeficitWeight: 55.0 });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/VALUE_OUT_OF_BOUNDS/);
    });

    it('rejects maxGoalImpactWeight out of bounds (> 30) with VALUE_OUT_OF_BOUNDS', () => {
      const candidate = createValidCandidate({ maxGoalImpactWeight: 35.0 });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/VALUE_OUT_OF_BOUNDS/);
    });

    it('rejects maxTemporalWeight out of bounds (> 20) with VALUE_OUT_OF_BOUNDS', () => {
      const candidate = createValidCandidate({ maxTemporalWeight: 25.0 });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/VALUE_OUT_OF_BOUNDS/);
    });
  });

  describe('5. Priority Threshold Invariant', () => {
    it('rejects thresholds where critical <= urgent with THRESHOLD_ORDER_VIOLATION', () => {
      const candidate = createValidCandidate({
        priorityThresholds: { critical: 60.0, urgent: 65.0, high: 50.0, normal: 35.0 },
      });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/THRESHOLD_ORDER_VIOLATION/);
    });

    it('rejects thresholds where urgent <= high with THRESHOLD_ORDER_VIOLATION', () => {
      const candidate = createValidCandidate({
        priorityThresholds: { critical: 80.0, urgent: 50.0, high: 50.0, normal: 35.0 },
      });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/THRESHOLD_ORDER_VIOLATION/);
    });

    it('rejects thresholds where high <= normal with THRESHOLD_ORDER_VIOLATION', () => {
      const candidate = createValidCandidate({
        priorityThresholds: { critical: 80.0, urgent: 65.0, high: 35.0, normal: 35.0 },
      });
      expect(() => validateCandidatePolicy(candidate)).toThrow(/THRESHOLD_ORDER_VIOLATION/);
    });
  });

  describe('6. Baseline Duplicate Rejection', () => {
    it('rejects a candidate policy identical to baseline with CANDIDATE_POLICY_MATCHES_BASELINE', () => {
      const candidate = {
        simulationOnly: true,
        baseWeights: { ...BASELINE_POLICY.baseWeights },
        maxMasteryDeficitWeight: BASELINE_POLICY.maxMasteryDeficitWeight,
        maxGoalImpactWeight: BASELINE_POLICY.maxGoalImpactWeight,
        maxTemporalWeight: BASELINE_POLICY.maxTemporalWeight,
        priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
      };
      expect(() => validateCandidatePolicy(candidate)).toThrow(/CANDIDATE_POLICY_MATCHES_BASELINE/);
    });

    it('successfully validates a valid candidate with at least one changed parameter', () => {
      const candidate = createValidCandidate();
      const validated = validateCandidatePolicy(candidate);
      expect(validated.simulationOnly).toBe(true);
      expect(Object.isFrozen(validated)).toBe(true);
      expect(Object.isFrozen(validated.baseWeights)).toBe(true);
      expect(Object.isFrozen(validated.priorityThresholds)).toBe(true);
    });
  });

  describe('7. Policy Delta Contract (diffPolicy)', () => {
    it('compares all 13 canonical dimensions in deterministic order', () => {
      const candidate = createValidCandidate({
        baseWeights: {
          PREREQUISITE_REMEDIATION: 55.0, // +5.0
          CURRICULUM_ADVANCEMENT: 35.0,  // +5.0
        },
        maxTemporalWeight: 15.0, // +5.0
      });

      const { changedDimensions, deltas } = diffPolicy(BASELINE_POLICY, candidate);

      expect(changedDimensions).toEqual([
        'baseWeights.PREREQUISITE_REMEDIATION',
        'baseWeights.CURRICULUM_ADVANCEMENT',
        'maxTemporalWeight',
      ]);
      expect(deltas['baseWeights.PREREQUISITE_REMEDIATION']).toBe(5.0);
      expect(deltas['baseWeights.CURRICULUM_ADVANCEMENT']).toBe(5.0);
      expect(deltas['maxTemporalWeight']).toBe(5.0);
    });

    it('returns empty array when comparing baseline against identical baseline values', () => {
      const identical = {
        simulationOnly: true,
        baseWeights: { ...BASELINE_POLICY.baseWeights },
        maxMasteryDeficitWeight: BASELINE_POLICY.maxMasteryDeficitWeight,
        maxGoalImpactWeight: BASELINE_POLICY.maxGoalImpactWeight,
        maxTemporalWeight: BASELINE_POLICY.maxTemporalWeight,
        priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
      };
      const { changedDimensions, deltas } = diffPolicy(BASELINE_POLICY, identical);
      expect(changedDimensions).toEqual([]);
      expect(deltas).toEqual({});
    });
  });

  describe('8. Dimension Relevance Contract (dimensionAffects)', () => {
    it('returns false for DIAGNOSTIC_ASSESSMENT on all dimensions', () => {
      for (const dim of CANONICAL_DIMENSIONS) {
        expect(dimensionAffects('DIAGNOSTIC_ASSESSMENT', null, dim)).toBe(false);
      }
    });

    it('correctly maps base weight dimensions to action types', () => {
      expect(dimensionAffects('PREREQUISITE_REMEDIATION', null, 'baseWeights.PREREQUISITE_REMEDIATION')).toBe(true);
      expect(dimensionAffects('CURRICULUM_ADVANCEMENT', null, 'baseWeights.PREREQUISITE_REMEDIATION')).toBe(false);

      expect(dimensionAffects('RETENTION_RESCUE', 'OVERDUE_REVISION', 'baseWeights.OVERDUE_REVISION')).toBe(true);
      expect(dimensionAffects('RETENTION_RESCUE', 'DUE_TODAY_REVISION', 'baseWeights.OVERDUE_REVISION')).toBe(false);

      expect(dimensionAffects('RETENTION_RESCUE', 'DUE_TODAY_REVISION', 'baseWeights.DUE_TODAY_REVISION')).toBe(true);
      expect(dimensionAffects('CURRICULUM_ADVANCEMENT', null, 'baseWeights.CURRICULUM_ADVANCEMENT')).toBe(true);
      expect(dimensionAffects('EXAM_BENCHMARK', null, 'baseWeights.EXAM_BENCHMARK')).toBe(true);
      expect(dimensionAffects('PACING_CALIBRATION', null, 'baseWeights.PACING_CALIBRATION')).toBe(true);
    });

    it('verifies maxMasteryDeficitWeight affects all scored actions except EXAM_BENCHMARK', () => {
      expect(dimensionAffects('PREREQUISITE_REMEDIATION', null, 'maxMasteryDeficitWeight')).toBe(true);
      expect(dimensionAffects('RETENTION_RESCUE', 'OVERDUE_REVISION', 'maxMasteryDeficitWeight')).toBe(true);
      expect(dimensionAffects('CURRICULUM_ADVANCEMENT', null, 'maxMasteryDeficitWeight')).toBe(true);
      expect(dimensionAffects('PACING_CALIBRATION', null, 'maxMasteryDeficitWeight')).toBe(true);
      expect(dimensionAffects('EXAM_BENCHMARK', null, 'maxMasteryDeficitWeight')).toBe(false);
    });

    it('verifies maxTemporalWeight affects ONLY RETENTION_RESCUE with OVERDUE_REVISION', () => {
      expect(dimensionAffects('RETENTION_RESCUE', 'OVERDUE_REVISION', 'maxTemporalWeight')).toBe(true);
      expect(dimensionAffects('RETENTION_RESCUE', 'DUE_TODAY_REVISION', 'maxTemporalWeight')).toBe(false);
      expect(dimensionAffects('PREREQUISITE_REMEDIATION', null, 'maxTemporalWeight')).toBe(false);
      expect(dimensionAffects('CURRICULUM_ADVANCEMENT', null, 'maxTemporalWeight')).toBe(false);
    });

    it('verifies maxGoalImpactWeight affects all competitive scored actions', () => {
      expect(dimensionAffects('PREREQUISITE_REMEDIATION', null, 'maxGoalImpactWeight')).toBe(true);
      expect(dimensionAffects('RETENTION_RESCUE', 'OVERDUE_REVISION', 'maxGoalImpactWeight')).toBe(true);
      expect(dimensionAffects('CURRICULUM_ADVANCEMENT', null, 'maxGoalImpactWeight')).toBe(true);
      expect(dimensionAffects('EXAM_BENCHMARK', null, 'maxGoalImpactWeight')).toBe(true);
      expect(dimensionAffects('PACING_CALIBRATION', null, 'maxGoalImpactWeight')).toBe(true);
    });
  });

  describe('9. Fingerprint Stability & Canonicalization', () => {
    it('produces bit-for-bit identical policy fingerprints for equivalent policies', () => {
      const p1 = createValidCandidate();
      const p2 = createValidCandidate();
      expect(generatePolicyFingerprint(p1)).toBe(generatePolicyFingerprint(p2));
    });

    it('produces different fingerprints for policies with different parameters', () => {
      const p1 = createValidCandidate({ maxTemporalWeight: 12.0 });
      const p2 = createValidCandidate({ maxTemporalWeight: 14.0 });
      expect(generatePolicyFingerprint(p1)).not.toBe(generatePolicyFingerprint(p2));
    });
  });
});
