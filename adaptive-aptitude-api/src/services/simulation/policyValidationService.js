'use strict';

/**
 * Phase 11: Policy Validation Service
 *
 * Implements deterministic candidate policy schema validation, reason precedence,
 * 13-dimension diff computation, and dimension relevance resolution.
 */

const { BASELINE_POLICY } = require('../../config/simulationConfig');

const CANONICAL_DIMENSIONS = Object.freeze([
  'baseWeights.PREREQUISITE_REMEDIATION',
  'baseWeights.OVERDUE_REVISION',
  'baseWeights.DUE_TODAY_REVISION',
  'baseWeights.CURRICULUM_ADVANCEMENT',
  'baseWeights.EXAM_BENCHMARK',
  'baseWeights.PACING_CALIBRATION',
  'maxMasteryDeficitWeight',
  'maxGoalImpactWeight',
  'maxTemporalWeight',
  'priorityThresholds.critical',
  'priorityThresholds.urgent',
  'priorityThresholds.high',
  'priorityThresholds.normal',
]);

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  'simulationOnly',
  'baseWeights',
  'maxMasteryDeficitWeight',
  'maxGoalImpactWeight',
  'maxTemporalWeight',
  'priorityThresholds',
]);

const ALLOWED_BASE_WEIGHT_KEYS = new Set([
  'PREREQUISITE_REMEDIATION',
  'OVERDUE_REVISION',
  'DUE_TODAY_REVISION',
  'CURRICULUM_ADVANCEMENT',
  'EXAM_BENCHMARK',
  'PACING_CALIBRATION',
]);

const ALLOWED_THRESHOLD_KEYS = new Set([
  'critical',
  'urgent',
  'high',
  'normal',
]);

const PROHIBITED_KEYS = new Set([
  'prerequisiteGatingThreshold',
  'rushingRiskThreshold',
  'overdueTemporalPointsPerDay',
  'actionTaxonomy',
  'eligibilityFilter',
  'gatingRules',
]);

const createPolicyError = (reason, detail) => {
  const err = new Error(`INVALID_POLICY_DEFINITION: ${reason}${detail ? ` - ${detail}` : ''}`);
  err.name = 'PolicyValidationError';
  err.code = 'INVALID_POLICY_DEFINITION';
  err.reason = reason;
  err.reasonCode = reason;
  return err;
};

/**
 * Validates a candidate policy object according to Section 10 strict reason precedence.
 *
 * @param {*} candidatePolicy
 * @returns {Object} Deep-frozen normalized candidate policy
 */
const validateCandidatePolicy = (candidatePolicy) => {
  // 1. Confirm Plain Object
  if (
    candidatePolicy === null ||
    typeof candidatePolicy !== 'object' ||
    Array.isArray(candidatePolicy) ||
    candidatePolicy.constructor !== Object
  ) {
    throw createPolicyError('INVALID_OBJECT_SHAPE', 'Candidate policy must be a plain object');
  }

  // 2. Detect Explicitly Prohibited Mutation Keys
  for (const key of Object.keys(candidatePolicy)) {
    if (PROHIBITED_KEYS.has(key)) {
      throw createPolicyError('PROHIBITED_ELIGIBILITY_MUTATION', `Prohibited key "${key}" detected`);
    }
  }
  if (candidatePolicy.baseWeights && typeof candidatePolicy.baseWeights === 'object') {
    for (const key of Object.keys(candidatePolicy.baseWeights)) {
      if (PROHIBITED_KEYS.has(key)) {
        throw createPolicyError('PROHIBITED_ELIGIBILITY_MUTATION', `Prohibited key "${key}" detected in baseWeights`);
      }
    }
  }

  // 3. Detect Other Unknown Keys
  for (const key of Object.keys(candidatePolicy)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      throw createPolicyError('UNKNOWN_PROPERTY', `Unknown top-level property "${key}"`);
    }
  }
  if (candidatePolicy.baseWeights && typeof candidatePolicy.baseWeights === 'object') {
    for (const key of Object.keys(candidatePolicy.baseWeights)) {
      if (!ALLOWED_BASE_WEIGHT_KEYS.has(key)) {
        throw createPolicyError('UNKNOWN_PROPERTY', `Unknown property "${key}" in baseWeights`);
      }
    }
  }
  if (candidatePolicy.priorityThresholds && typeof candidatePolicy.priorityThresholds === 'object') {
    for (const key of Object.keys(candidatePolicy.priorityThresholds)) {
      if (!ALLOWED_THRESHOLD_KEYS.has(key)) {
        throw createPolicyError('UNKNOWN_PROPERTY', `Unknown property "${key}" in priorityThresholds`);
      }
    }
  }

  // 4. Validate Required Keys
  if (candidatePolicy.simulationOnly !== true) {
    throw createPolicyError('INVALID_SIMULATION_FLAG', 'simulationOnly must be strictly true');
  }

  for (const key of ALLOWED_TOP_LEVEL_KEYS) {
    if (!(key in candidatePolicy)) {
      throw createPolicyError('MISSING_REQUIRED_KEY', `Missing required top-level property "${key}"`);
    }
  }

  if (
    !candidatePolicy.baseWeights ||
    typeof candidatePolicy.baseWeights !== 'object' ||
    Array.isArray(candidatePolicy.baseWeights)
  ) {
    throw createPolicyError('INVALID_OBJECT_SHAPE', 'baseWeights must be an object');
  }

  for (const bwKey of ALLOWED_BASE_WEIGHT_KEYS) {
    if (!(bwKey in candidatePolicy.baseWeights)) {
      throw createPolicyError('MISSING_REQUIRED_KEY', `Missing required baseWeight "${bwKey}"`);
    }
  }

  if (
    !candidatePolicy.priorityThresholds ||
    typeof candidatePolicy.priorityThresholds !== 'object' ||
    Array.isArray(candidatePolicy.priorityThresholds)
  ) {
    throw createPolicyError('INVALID_OBJECT_SHAPE', 'priorityThresholds must be an object');
  }

  for (const ptKey of ALLOWED_THRESHOLD_KEYS) {
    if (!(ptKey in candidatePolicy.priorityThresholds)) {
      throw createPolicyError('MISSING_REQUIRED_KEY', `Missing required priorityThreshold "${ptKey}"`);
    }
  }

  // 5. Validate Numeric Values & Bounds
  const checkFiniteNumber = (val, name) => {
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw createPolicyError('NON_NUMERIC_VALUE', `Property "${name}" must be a finite number`);
    }
  };

  const checkBounds = (val, min, max, name) => {
    if (val < min || val > max) {
      throw createPolicyError('VALUE_OUT_OF_BOUNDS', `Property "${name}" with value ${val} must be in [${min}, ${max}]`);
    }
  };

  // baseWeights bounds: [0.0, 100.0]
  for (const bwKey of ALLOWED_BASE_WEIGHT_KEYS) {
    const val = candidatePolicy.baseWeights[bwKey];
    checkFiniteNumber(val, `baseWeights.${bwKey}`);
    checkBounds(val, 0.0, 100.0, `baseWeights.${bwKey}`);
  }

  // maxMasteryDeficitWeight bounds: [0.0, 50.0]
  checkFiniteNumber(candidatePolicy.maxMasteryDeficitWeight, 'maxMasteryDeficitWeight');
  checkBounds(candidatePolicy.maxMasteryDeficitWeight, 0.0, 50.0, 'maxMasteryDeficitWeight');

  // maxGoalImpactWeight bounds: [0.0, 30.0]
  checkFiniteNumber(candidatePolicy.maxGoalImpactWeight, 'maxGoalImpactWeight');
  checkBounds(candidatePolicy.maxGoalImpactWeight, 0.0, 30.0, 'maxGoalImpactWeight');

  // maxTemporalWeight bounds: [0.0, 20.0]
  checkFiniteNumber(candidatePolicy.maxTemporalWeight, 'maxTemporalWeight');
  checkBounds(candidatePolicy.maxTemporalWeight, 0.0, 20.0, 'maxTemporalWeight');

  // priorityThresholds bounds: [0.0, 100.0]
  for (const ptKey of ALLOWED_THRESHOLD_KEYS) {
    const val = candidatePolicy.priorityThresholds[ptKey];
    checkFiniteNumber(val, `priorityThresholds.${ptKey}`);
    checkBounds(val, 0.0, 100.0, `priorityThresholds.${ptKey}`);
  }

  // 6. Validate Threshold Order Invariant (critical > urgent > high > normal)
  const { critical, urgent, high, normal } = candidatePolicy.priorityThresholds;
  if (!(critical > urgent && urgent > high && high > normal)) {
    throw createPolicyError('THRESHOLD_ORDER_VIOLATION', 'Priority thresholds must satisfy critical > urgent > high > normal');
  }

  // 7. Detect Baseline Duplicate
  const diff = diffPolicy(BASELINE_POLICY, candidatePolicy);
  if (diff.changedDimensions.length === 0) {
    throw createPolicyError('CANDIDATE_POLICY_MATCHES_BASELINE', 'Candidate policy is identical to baseline policy across all 13 dimensions');
  }

  // Deep-freeze normalized policy
  return Object.freeze({
    simulationOnly: true,
    baseWeights: Object.freeze({
      PREREQUISITE_REMEDIATION: candidatePolicy.baseWeights.PREREQUISITE_REMEDIATION,
      OVERDUE_REVISION: candidatePolicy.baseWeights.OVERDUE_REVISION,
      DUE_TODAY_REVISION: candidatePolicy.baseWeights.DUE_TODAY_REVISION,
      CURRICULUM_ADVANCEMENT: candidatePolicy.baseWeights.CURRICULUM_ADVANCEMENT,
      EXAM_BENCHMARK: candidatePolicy.baseWeights.EXAM_BENCHMARK,
      PACING_CALIBRATION: candidatePolicy.baseWeights.PACING_CALIBRATION,
    }),
    maxMasteryDeficitWeight: candidatePolicy.maxMasteryDeficitWeight,
    maxGoalImpactWeight: candidatePolicy.maxGoalImpactWeight,
    maxTemporalWeight: candidatePolicy.maxTemporalWeight,
    priorityThresholds: Object.freeze({
      critical: candidatePolicy.priorityThresholds.critical,
      urgent: candidatePolicy.priorityThresholds.urgent,
      high: candidatePolicy.priorityThresholds.high,
      normal: candidatePolicy.priorityThresholds.normal,
    }),
  });
};

/**
 * Resolves dimension value from a policy.
 *
 * @param {Object} policy
 * @param {string} dimension
 * @returns {number}
 */
const getDimensionValue = (policy, dimension) => {
  if (dimension.startsWith('baseWeights.')) {
    const key = dimension.slice('baseWeights.'.length);
    return policy.baseWeights[key];
  }
  if (dimension.startsWith('priorityThresholds.')) {
    const key = dimension.slice('priorityThresholds.'.length);
    return policy.priorityThresholds[key];
  }
  return policy[dimension];
};

/**
 * Computes exact 13-dimension policy delta between baseline and candidate.
 *
 * @param {Object} baselinePolicy
 * @param {Object} candidatePolicy
 * @returns {{ changedDimensions: string[], deltas: Record<string, number> }}
 */
const diffPolicy = (baselinePolicy, candidatePolicy) => {
  const changedDimensions = [];
  const deltas = {};

  for (const dim of CANONICAL_DIMENSIONS) {
    const baseVal = getDimensionValue(baselinePolicy, dim);
    const candVal = getDimensionValue(candidatePolicy, dim);

    if (baseVal !== candVal) {
      changedDimensions.push(dim);
      deltas[dim] = candVal - baseVal;
    }
  }

  return { changedDimensions, deltas };
};

/**
 * Returns whether a given changed dimension mathematically affects an action.
 *
 * @param {string} actionType
 * @param {string|null} actionSubtype
 * @param {string} dimension
 * @returns {boolean}
 */
const dimensionAffects = (actionType, actionSubtype, dimension) => {
  if (actionType === 'DIAGNOSTIC_ASSESSMENT') {
    return false;
  }

  switch (dimension) {
    case 'baseWeights.PREREQUISITE_REMEDIATION':
      return actionType === 'PREREQUISITE_REMEDIATION';

    case 'baseWeights.OVERDUE_REVISION':
      return actionType === 'RETENTION_RESCUE' && actionSubtype === 'OVERDUE_REVISION';

    case 'baseWeights.DUE_TODAY_REVISION':
      return actionType === 'RETENTION_RESCUE' && actionSubtype === 'DUE_TODAY_REVISION';

    case 'baseWeights.CURRICULUM_ADVANCEMENT':
      return actionType === 'CURRICULUM_ADVANCEMENT';

    case 'baseWeights.EXAM_BENCHMARK':
      return actionType === 'EXAM_BENCHMARK';

    case 'baseWeights.PACING_CALIBRATION':
      return actionType === 'PACING_CALIBRATION';

    case 'maxMasteryDeficitWeight':
      // Affects all scored actions EXCEPT EXAM_BENCHMARK (S=0 invariant)
      return (
        actionType === 'PREREQUISITE_REMEDIATION' ||
        actionType === 'RETENTION_RESCUE' ||
        actionType === 'CURRICULUM_ADVANCEMENT' ||
        actionType === 'PACING_CALIBRATION'
      );

    case 'maxTemporalWeight':
      // Affects ONLY RETENTION_RESCUE with OVERDUE_REVISION
      return actionType === 'RETENTION_RESCUE' && actionSubtype === 'OVERDUE_REVISION';

    case 'maxGoalImpactWeight':
      // Affects all competitive scored actions
      return (
        actionType === 'PREREQUISITE_REMEDIATION' ||
        actionType === 'RETENTION_RESCUE' ||
        actionType === 'CURRICULUM_ADVANCEMENT' ||
        actionType === 'EXAM_BENCHMARK' ||
        actionType === 'PACING_CALIBRATION'
      );

    default:
      if (dimension.startsWith('priorityThresholds.')) {
        return (
          actionType === 'PREREQUISITE_REMEDIATION' ||
          actionType === 'RETENTION_RESCUE' ||
          actionType === 'CURRICULUM_ADVANCEMENT' ||
          actionType === 'EXAM_BENCHMARK' ||
          actionType === 'PACING_CALIBRATION'
        );
      }
      return false;
  }
};

module.exports = {
  validateCandidatePolicy,
  diffPolicy,
  dimensionAffects,
  CANONICAL_DIMENSIONS,
};
