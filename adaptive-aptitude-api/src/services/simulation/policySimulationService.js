'use strict';

/**
 * Phase 11: Policy Simulation Service
 *
 * Orchestrates offline simulation runs across all modes (Mode A, Mode B,
 * Historical Aggregation, Combined) and assemblies canonical in-memory report objects.
 * Does NOT perform filesystem I/O.
 */

const {
  SIMULATION_ENGINE_VERSION,
  SIMULATION_BOUNDS,
  SIMULATION_MODES,
  BASELINE_POLICY,
} = require('../../config/simulationConfig');
const { SIMULATION_ARCHETYPES } = require('../../config/simulationArchetypes');
const {
  validateCandidatePolicy,
  diffPolicy,
} = require('./policyValidationService');
const { evaluateObservedActionSensitivity } = require('./observedActionSensitivityService');
const { compareSyntheticArchetypes } = require('./syntheticPolicyComparisonService');
const { aggregateAdherenceOutcomes } = require('./adherenceOutcomeAggregationService');
const {
  loadHistoricalCohortRecords,
  normalizeUserIds,
} = require('./cohortSimulationService');
const {
  generatePolicyFingerprint,
  generateDatasetFingerprint,
  generateSimulationFingerprint,
} = require('../../utils/simulationFingerprint');

const createDatasetLimitError = (reason, message) => {
  const err = new Error(`DATASET_LIMIT_EXCEEDED: ${reason}${message ? ` - ${message}` : ''}`);
  err.name = 'DatasetLimitExceededError';
  err.code = 'DATASET_LIMIT_EXCEEDED';
  err.reason = reason;
  err.reasonCode = reason;
  return err;
};

const createInsufficientDataError = (reason, message) => {
  const err = new Error(`INSUFFICIENT_HISTORICAL_DATA: ${reason}${message ? ` - ${message}` : ''}`);
  err.name = 'InsufficientHistoricalDataError';
  err.code = 'INSUFFICIENT_HISTORICAL_DATA';
  err.reason = reason;
  err.reasonCode = reason;
  return err;
};

/**
 * Runs offline policy simulation and returns the complete in-memory report object.
 *
 * @param {{
 *   mode: string,
 *   candidatePolicies?: Array,
 *   userIds?: Array<string>,
 *   windowDays?: number,
 *   referenceNow: Date,
 *   includeTrace?: boolean
 * }} params
 * @returns {Promise<Object>} In-memory simulation report object
 */
const runPolicySimulation = async ({
  mode,
  candidatePolicies = [],
  userIds = [],
  windowDays = SIMULATION_BOUNDS.DEFAULT_WINDOW_DAYS,
  referenceNow,
  includeTrace = false,
}) => {
  const startTimeNs = process.hrtime.bigint();

  // Validate referenceNow
  if (!referenceNow || !(referenceNow instanceof Date) || isNaN(referenceNow.getTime())) {
    throw createDatasetLimitError('MISSING_REFERENCE_NOW', 'Valid referenceNow Date instance is strictly required');
  }

  // Validate canonical mode
  const validModes = Object.values(SIMULATION_MODES);
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid canonical simulation mode: ${mode}`);
  }

  const isModeA = mode === SIMULATION_MODES.MODE_A;
  const isModeB = mode === SIMULATION_MODES.MODE_B;
  const isHistoricalAggregation = mode === SIMULATION_MODES.HISTORICAL_AGGREGATION;
  const isCombined = mode === SIMULATION_MODES.COMBINED;

  // Mode-Specific Input Normalization
  let normalizedUserIds = [];
  let effectiveWindowDays = null;

  if (isModeB) {
    // Mode B: userIds -> [], windowDays -> null
    normalizedUserIds = [];
    effectiveWindowDays = null;
  } else {
    // Historical modes: normalize user IDs
    normalizedUserIds = normalizeUserIds(userIds);
    if (normalizedUserIds.length === 0) {
      throw createDatasetLimitError('EMPTY_USER_LIST', 'Cohort user ID list cannot be empty for historical mode');
    }
    if (normalizedUserIds.length > SIMULATION_BOUNDS.MAX_USERS_PER_RUN) {
      throw createDatasetLimitError(
        'TOO_MANY_USERS',
        `Cohort size (${normalizedUserIds.length}) exceeds maximum limit of ${SIMULATION_BOUNDS.MAX_USERS_PER_RUN}`
      );
    }

    effectiveWindowDays = windowDays !== undefined && windowDays !== null
      ? windowDays
      : SIMULATION_BOUNDS.DEFAULT_WINDOW_DAYS;

    if (
      !Number.isInteger(effectiveWindowDays) ||
      effectiveWindowDays < 1 ||
      effectiveWindowDays > SIMULATION_BOUNDS.MAX_WINDOW_DAYS
    ) {
      throw createDatasetLimitError(
        'INVALID_WINDOW_DAYS',
        `windowDays must be an integer between 1 and ${SIMULATION_BOUNDS.MAX_WINDOW_DAYS}`
      );
    }
  }

  // Candidate Policy Normalization & Validation
  let validatedPolicies = [];
  if (isHistoricalAggregation) {
    // HISTORICAL_AGGREGATION: candidate policies normalized to []
    validatedPolicies = [];
  } else {
    // Modes requiring candidate policies
    if (!candidatePolicies || !Array.isArray(candidatePolicies) || candidatePolicies.length === 0) {
      throw createDatasetLimitError('EMPTY_CANDIDATE_POLICIES', 'At least one candidate policy is required');
    }
    if (candidatePolicies.length > SIMULATION_BOUNDS.MAX_CANDIDATE_POLICIES) {
      throw createDatasetLimitError(
        'TOO_MANY_CANDIDATE_POLICIES',
        `Exceeded maximum candidate policies limit of ${SIMULATION_BOUNDS.MAX_CANDIDATE_POLICIES}`
      );
    }

    for (const rawPolicy of candidatePolicies) {
      const validated = validateCandidatePolicy(rawPolicy);
      const fp = generatePolicyFingerprint(validated);
      const diff = diffPolicy(BASELINE_POLICY, validated);
      validatedPolicies.push({
        policy: validated,
        policyFingerprint: fp,
        changedDimensions: diff.changedDimensions,
      });
    }

    // Canonical Candidate Policy Order Invariance: sort ASC by policyFingerprint
    validatedPolicies.sort((a, b) => a.policyFingerprint.localeCompare(b.policyFingerprint));
  }

  const candidatePolicyFingerprints = validatedPolicies.map((p) => p.policyFingerprint);

  // Historical Dataset Loading (for historical modes)
  let historicalRecords = [];
  let datasetSummary = null;
  let isTruncated = false;
  let isExhaustive = true;

  if (!isModeB) {
    const cohortResult = await loadHistoricalCohortRecords({
      userIds: normalizedUserIds,
      windowDays: effectiveWindowDays,
      referenceNow,
      startTimeNs,
    });

    historicalRecords = cohortResult.records;
    isTruncated = cohortResult.isTruncated;
    isExhaustive = cohortResult.isExhaustive;

    // Minimum historical records gate (>= 5 records)
    if (historicalRecords.length < SIMULATION_BOUNDS.MIN_HISTORICAL_RECORDS) {
      throw createInsufficientDataError(
        'LESS_THAN_MINIMUM_RECORDS',
        `Historical evaluation requires at least ${SIMULATION_BOUNDS.MIN_HISTORICAL_RECORDS} records; found ${historicalRecords.length}`
      );
    }

    const windowStartUtc = new Date(referenceNow.getTime() - effectiveWindowDays * 86400000);
    datasetSummary = {
      userCount: normalizedUserIds.length,
      recordCount: historicalRecords.length,
      windowDays: effectiveWindowDays,
      windowStart: windowStartUtc.toISOString(),
      windowEnd: referenceNow.toISOString(),
      isTruncated,
      isExhaustive,
    };
  }

  // Dataset & Cohort Fingerprinting
  let datasetFingerprint = null;
  let userCohortFingerprint = null;

  if (isModeB) {
    datasetFingerprint = generateDatasetFingerprint(SIMULATION_ARCHETYPES);
    userCohortFingerprint = null;
  } else {
    datasetFingerprint = generateDatasetFingerprint(historicalRecords);
    userCohortFingerprint = generateDatasetFingerprint(normalizedUserIds);
  }

  // Simulation Metadata & Fingerprint
  const simulationMetadata = {
    engineVersion: SIMULATION_ENGINE_VERSION,
    mode, // Canonical SIMULATION_MODES value
    referenceNow: referenceNow.toISOString(),
    policyFingerprints: candidatePolicyFingerprints.slice().sort(), // Sorted ASC
    datasetFingerprint,
    windowDays: isModeB ? null : effectiveWindowDays,
    includeTrace: Boolean(includeTrace),
    historicalDatasetMode: isModeB ? 'NONE' : 'INDEXED_COHORT',
    userCohortFingerprint: isModeB ? null : userCohortFingerprint,
    archetypeFingerprint: (isModeA || isHistoricalAggregation)
      ? null
      : generateDatasetFingerprint(SIMULATION_ARCHETYPES),
  };

  const simulationFingerprint = generateSimulationFingerprint(simulationMetadata);

  // Execute Analytical Simulations by Mode
  let historicalSensitivityAnalysis = null;
  let syntheticArchetypeAnalysis = null;
  let adherenceOutcomeSummary = null;
  let trace = null;

  const candidatePolicyDefs = validatedPolicies.map((p) => p.policy);

  if (isModeA || isCombined) {
    const sensitivityResult = evaluateObservedActionSensitivity({
      records: historicalRecords,
      candidatePolicies: candidatePolicyDefs,
      includeTrace,
      startTimeNs,
    });
    historicalSensitivityAnalysis = sensitivityResult.historicalSensitivityAnalysis;
    if (includeTrace && sensitivityResult.traceRecords) {
      trace = {
        historicalSensitivityRecords: sensitivityResult.traceRecords,
      };
    }
  }

  if (isModeB || isCombined) {
    syntheticArchetypeAnalysis = {
      archetypes: compareSyntheticArchetypes({
        archetypes: SIMULATION_ARCHETYPES,
        candidatePolicies: candidatePolicyDefs,
        startTimeNs,
      }),
    };
  }

  if (isHistoricalAggregation || isCombined) {
    adherenceOutcomeSummary = aggregateAdherenceOutcomes({
      records: historicalRecords,
      referenceNow,
    });
  }

  // Assemble Final In-Memory Report Object
  const reportCandidatePolicies = isHistoricalAggregation
    ? []
    : validatedPolicies.map((p) => ({
        policyFingerprint: p.policyFingerprint,
        policyDefinition: p.policy,
        changedDimensions: p.changedDimensions,
      }));

  const report = {
    engineVersion: SIMULATION_ENGINE_VERSION,
    mode, // Canonical internal mode string
    referenceNow: referenceNow.toISOString(),

    simulationFingerprint,
    datasetFingerprint,

    baselinePolicy: BASELINE_POLICY,
    candidatePolicies: reportCandidatePolicies,

    datasetSummary,

    historicalSensitivityAnalysis,
    syntheticArchetypeAnalysis,
    adherenceOutcomeSummary,

    bounds: {
      maxUsers: SIMULATION_BOUNDS.MAX_USERS_PER_RUN,
      maxSampleRecords: SIMULATION_BOUNDS.MAX_SAMPLE_RECORDS,
      maxWindowDays: SIMULATION_BOUNDS.MAX_WINDOW_DAYS,
      maxExecutionTimeMs: SIMULATION_BOUNDS.MAX_EXECUTION_TIME_MS,
    },

    trace,
    warnings: [],
    nonCausalNotice:
      'Phase 10 records are observational. Candidate-policy simulations do not establish causal treatment effects or historical counterfactual student outcomes.',
  };

  return report;
};

module.exports = {
  runPolicySimulation,
};
