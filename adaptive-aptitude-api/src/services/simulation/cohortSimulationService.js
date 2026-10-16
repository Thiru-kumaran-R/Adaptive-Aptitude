'use strict';

/**
 * Phase 11: Cohort Simulation Service
 *
 * Implements bounded, read-only querying of PrescriptionExecutionRecord with
 * user-ID normalization, +1 sentinel probing, and deterministic cross-user merging.
 */

const PrescriptionExecutionRecord = require('../../models/prescriptionExecutionRecordModel');
const { SIMULATION_BOUNDS } = require('../../config/simulationConfig');

const createDatasetLimitError = (reason, message) => {
  const err = new Error(`DATASET_LIMIT_EXCEEDED: ${reason}${message ? ` - ${message}` : ''}`);
  err.name = 'DatasetLimitExceededError';
  err.code = 'DATASET_LIMIT_EXCEEDED';
  err.reason = reason;
  err.reasonCode = reason;
  return err;
};

/**
 * Normalizes user IDs exactly once at the input boundary.
 * Trims strings, removes empties, deduplicates, and sorts lexicographically ASC.
 *
 * @param {Array<string>} userIds
 * @returns {Array<string>}
 */
const normalizeUserIds = (userIds) =>
  [...new Set(
    (userIds || [])
      .map((userId) => String(userId).trim())
      .filter((userId) => userId.length > 0)
  )].sort((a, b) => a.localeCompare(b));

/**
 * Loads bounded historical records for a normalized user cohort within a time window.
 *
 * @param {{
 *   userIds: Array<string>,
 *   windowDays?: number,
 *   referenceNow: Date,
 *   startTimeNs?: bigint
 * }} params
 * @returns {Promise<{ records: Array, isTruncated: boolean, isExhaustive: boolean }>}
 */
const loadHistoricalCohortRecords = async ({
  userIds,
  windowDays = SIMULATION_BOUNDS.DEFAULT_WINDOW_DAYS,
  referenceNow,
  startTimeNs = process.hrtime.bigint(),
}) => {
  if (!referenceNow || !(referenceNow instanceof Date) || isNaN(referenceNow.getTime())) {
    throw createDatasetLimitError('MISSING_REFERENCE_NOW', 'Valid referenceNow Date is required');
  }

  const effectiveWindowDays = windowDays !== undefined && windowDays !== null
    ? windowDays
    : SIMULATION_BOUNDS.DEFAULT_WINDOW_DAYS;

  if (
    !Number.isInteger(effectiveWindowDays) ||
    effectiveWindowDays < 1 ||
    effectiveWindowDays > SIMULATION_BOUNDS.MAX_WINDOW_DAYS
  ) {
    throw createDatasetLimitError('INVALID_WINDOW_DAYS', `windowDays must be an integer between 1 and ${SIMULATION_BOUNDS.MAX_WINDOW_DAYS}`);
  }

  const normalizedUserIds = normalizeUserIds(userIds);

  if (normalizedUserIds.length === 0) {
    throw createDatasetLimitError('EMPTY_USER_LIST', 'Cohort user ID list cannot be empty for historical mode');
  }

  if (normalizedUserIds.length > SIMULATION_BOUNDS.MAX_USERS_PER_RUN) {
    throw createDatasetLimitError(
      'TOO_MANY_USERS',
      `Cohort size (${normalizedUserIds.length}) exceeds maximum limit of ${SIMULATION_BOUNDS.MAX_USERS_PER_RUN}`
    );
  }

  const windowStartUtc = new Date(referenceNow.getTime() - effectiveWindowDays * 86400000);

  const perUserLimit = Math.min(
    SIMULATION_BOUNDS.MAX_SAMPLE_RECORDS,
    Math.ceil(SIMULATION_BOUNDS.MAX_SAMPLE_RECORDS / normalizedUserIds.length)
  );
  const perUserProbeLimit = perUserLimit + 1; // +1 sentinel probe

  let anyUserHasMore = false;
  const mergedSelected = [];

  for (let i = 0; i < normalizedUserIds.length; i++) {
    // Monotonic cooperative circuit breaker check per user
    const elapsedMs = Number(process.hrtime.bigint() - startTimeNs) / 1e6;
    if (elapsedMs > SIMULATION_BOUNDS.MAX_EXECUTION_TIME_MS) {
      const err = new Error('SIMULATION_EXECUTION_FAILED: CIRCUIT_BREAKER_TRIGGERED - CPU budget exceeded');
      err.name = 'SimulationExecutionError';
      err.code = 'SIMULATION_EXECUTION_FAILED';
      err.reason = 'CIRCUIT_BREAKER_TRIGGERED';
      err.reasonCode = 'CIRCUIT_BREAKER_TRIGGERED';
      throw err;
    }

    const userId = normalizedUserIds[i];

    const probe = await PrescriptionExecutionRecord.find({
      userId,
      issuedAt: {
        $gte: windowStartUtc,
        $lte: referenceNow,
      },
    })
      .sort({ issuedAt: -1, _id: 1 })
      .limit(perUserProbeLimit)
      .lean();

    const userHasMore = probe.length > perUserLimit;
    if (userHasMore) {
      anyUserHasMore = true;
    }

    const selected = probe.slice(0, perUserLimit);
    mergedSelected.push(...selected);
  }

  // Deterministic Merge Order: issuedAt DESC => userId ASC => _id ASC
  mergedSelected.sort((a, b) => {
    const timeA = new Date(a.issuedAt).getTime();
    const timeB = new Date(b.issuedAt).getTime();
    if (timeA !== timeB) {
      return timeB - timeA; // DESC
    }

    const userComp = String(a.userId).localeCompare(String(b.userId)); // ASC
    if (userComp !== 0) {
      return userComp;
    }

    return String(a._id).localeCompare(String(b._id)); // ASC
  });

  const isTruncated = anyUserHasMore || mergedSelected.length > SIMULATION_BOUNDS.MAX_SAMPLE_RECORDS;
  const isExhaustive = !isTruncated;

  const records = mergedSelected.slice(0, SIMULATION_BOUNDS.MAX_SAMPLE_RECORDS);

  return {
    records,
    isTruncated,
    isExhaustive,
  };
};

module.exports = {
  loadHistoricalCohortRecords,
  normalizeUserIds,
};
