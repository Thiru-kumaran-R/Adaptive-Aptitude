'use strict';

/**
 * Phase 11: Adherence & Outcome Aggregation Service
 *
 * Implements descriptive historical adherence outcome aggregation with in-memory
 * effective expiry resolution. Zero persistence mutations. Zero candidate policy attribution.
 */

/**
 * Resolves effective status for a prescription execution record using referenceNow.
 * Both non-terminal states ('issued' and 'active') resolve to 'expired' if referenceNow >= expiresAt.
 * Terminal states ('completed', 'abandoned', 'superseded', 'expired') are immutable.
 *
 * @param {Object} record
 * @param {Date} referenceNow
 * @returns {'issued'|'active'|'completed'|'abandoned'|'superseded'|'expired'}
 */
const resolveEffectiveStatus = (record, referenceNow) => {
  if (
    (record.status === 'issued' || record.status === 'active') &&
    record.expiresAt &&
    referenceNow >= new Date(record.expiresAt)
  ) {
    return 'expired';
  }
  return record.status;
};

/**
 * Aggregates descriptive historical adherence and milestone outcomes across records.
 *
 * @param {{ records: Array, referenceNow: Date }} params
 * @returns {Object} adherenceOutcomeSummary
 */
const aggregateAdherenceOutcomes = ({ records, referenceNow }) => {
  let issuedCount = 0;
  let activeCount = 0;
  let completedCount = 0;
  let abandonedCount = 0;
  let supersededCount = 0;
  let expiredCount = 0;

  let milestoneEvaluatedCount = 0;
  let milestoneMetCount = 0;

  const actionTypeCounts = {};

  for (const record of records) {
    const effectiveStatus = resolveEffectiveStatus(record, referenceNow);

    switch (effectiveStatus) {
      case 'issued':
        issuedCount++;
        break;
      case 'active':
        activeCount++;
        break;
      case 'completed':
        completedCount++;
        if (
          record.outcomeSnapshot &&
          record.outcomeSnapshot.targetMilestoneMet !== null &&
          record.outcomeSnapshot.targetMilestoneMet !== undefined
        ) {
          milestoneEvaluatedCount++;
          if (record.outcomeSnapshot.targetMilestoneMet === true) {
            milestoneMetCount++;
          }
        }
        break;
      case 'abandoned':
        abandonedCount++;
        break;
      case 'superseded':
        supersededCount++;
        break;
      case 'expired':
        expiredCount++;
        break;
      default:
        break;
    }

    if (record.actionType) {
      actionTypeCounts[record.actionType] = (actionTypeCounts[record.actionType] || 0) + 1;
    }
  }

  const resolvedCount = completedCount + abandonedCount + supersededCount + expiredCount;
  const executionAdherenceRate = resolvedCount > 0 ? completedCount / resolvedCount : null;
  const milestoneSuccessRate = milestoneEvaluatedCount > 0 ? milestoneMetCount / milestoneEvaluatedCount : null;

  return {
    totalRecords: records.length,
    resolvedCount,
    unresolvedCount: records.length - resolvedCount,
    statusCounts: {
      issued: issuedCount,
      active: activeCount,
      completed: completedCount,
      abandoned: abandonedCount,
      superseded: supersededCount,
      expired: expiredCount,
    },
    executionAdherenceRate,
    milestoneEvaluatedCount,
    milestoneMetCount,
    milestoneSuccessRate,
    actionTypeCounts,
  };
};

module.exports = {
  resolveEffectiveStatus,
  aggregateAdherenceOutcomes,
};
