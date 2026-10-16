'use strict';

/**
 * Phase 9: Orchestration Utility Functions
 *
 * Provides shared date math, rounding, ID templating, and priority tier mapping.
 */

const patternRegistryService = require('../patternRegistryService');
const { PRIORITY_THRESHOLDS } = require('../../config/orchestrationConfig');

/**
 * Rounds a number to a fixed number of decimal places.
 *
 * @param {number|null} value
 * @param {number} decimals
 * @returns {number|null}
 */
const roundTo = (value, decimals = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

/**
 * Derives UTC logical day boundaries from a request-level referenceNow clock.
 *
 * @param {Date} referenceNow
 * @returns {{ todayStartUtc: Date, tomorrowStartUtc: Date }}
 */
const getLogicalDayBoundaries = (referenceNow) => {
  const d = new Date(referenceNow);
  const todayStartUtc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const tomorrowStartUtc = new Date(todayStartUtc.getTime() + 86400000);
  return { todayStartUtc, tomorrowStartUtc };
};

/**
 * Calculates daysToDeadline and continuous deadlineProximityBonus for an active goal.
 *
 * @param {Object|null} goal
 * @param {Date} referenceNow
 * @returns {{ daysToDeadline: number|null, deadlineProximityBonus: number }}
 */
const calculateDeadlineProximityBonus = (goal, referenceNow) => {
  if (!goal || goal.status !== 'active' || !goal.targetDate) {
    return { daysToDeadline: null, deadlineProximityBonus: 0.0 };
  }

  const targetDate = new Date(goal.targetDate);
  if (isNaN(targetDate.getTime())) {
    return { daysToDeadline: null, deadlineProximityBonus: 0.0 };
  }

  const rawDays = Math.floor((targetDate.getTime() - referenceNow.getTime()) / 86400000);
  const daysToDeadline = Math.max(0, rawDays);

  let deadlineProximityBonus = 0.0;
  if (daysToDeadline < 30) {
    deadlineProximityBonus = Math.min(5.0, Math.max(0.0, (30 - daysToDeadline) / 30.0) * 5.0);
  }

  return { daysToDeadline, deadlineProximityBonus };
};

const DEFAULT_PRIORITY_THRESHOLDS = Object.freeze({
  critical: PRIORITY_THRESHOLDS.CRITICAL,
  urgent: PRIORITY_THRESHOLDS.URGENT,
  high: PRIORITY_THRESHOLDS.HIGH,
  normal: PRIORITY_THRESHOLDS.NORMAL,
});

/**
 * Normalizes priority thresholds, handling uppercase legacy or lowercase governed formats.
 *
 * @param {Object|null} raw
 * @returns {Readonly<{ critical: number, urgent: number, high: number, normal: number }>}
 */
const normalizePriorityThresholds = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_PRIORITY_THRESHOLDS;
  }

  return Object.freeze({
    critical:
      raw.critical ??
      raw.CRITICAL ??
      DEFAULT_PRIORITY_THRESHOLDS.critical,

    urgent:
      raw.urgent ??
      raw.URGENT ??
      DEFAULT_PRIORITY_THRESHOLDS.urgent,

    high:
      raw.high ??
      raw.HIGH ??
      DEFAULT_PRIORITY_THRESHOLDS.high,

    normal:
      raw.normal ??
      raw.NORMAL ??
      DEFAULT_PRIORITY_THRESHOLDS.normal,
  });
};

/**
 * Maps an urgency score to its discrete priority tier.
 *
 * @param {number|null} urgencyScore
 * @param {Object} [priorityThresholds=DEFAULT_PRIORITY_THRESHOLDS]
 * @returns {'critical'|'urgent'|'high'|'normal'|'low'}
 */
const getPriorityTier = (
  urgencyScore,
  priorityThresholds = DEFAULT_PRIORITY_THRESHOLDS
) => {
  if (urgencyScore === null || urgencyScore === undefined || !Number.isFinite(urgencyScore)) {
    return 'normal';
  }

  const thresholds = normalizePriorityThresholds(priorityThresholds);

  if (urgencyScore >= thresholds.critical) return 'critical';
  if (urgencyScore >= thresholds.urgent) return 'urgent';
  if (urgencyScore >= thresholds.high) return 'high';
  if (urgencyScore >= thresholds.normal) return 'normal';
  return 'low';
};

/**
 * Builds deterministic actionId according to Section 31.2 templates.
 */
const buildActionId = ({
  actionType,
  actionSubtype,
  topic,
  pattern,
  blockedTargetPattern,
  revisionItemId,
  goalId,
}) => {
  const topicSlug = topic ? patternRegistryService.buildSlug(topic) : '';
  const patternSlug = pattern ? patternRegistryService.buildSlug(pattern) : '';

  switch (actionSubtype) {
    case 'BLOCKING_PREREQUISITE': {
      const blockedSlug = blockedTargetPattern ? patternRegistryService.buildSlug(blockedTargetPattern) : '';
      return `nba_prerequisite_remediation_${topicSlug}_${patternSlug}_blocks_${blockedSlug}`;
    }
    case 'OVERDUE_REVISION':
    case 'DUE_TODAY_REVISION': {
      return `nba_retention_rescue_${topicSlug}_${patternSlug}_${revisionItemId}`;
    }
    case 'DAILY_OBJECTIVE_TARGET': {
      return `nba_curriculum_advancement_${topicSlug}_${patternSlug}`;
    }
    case 'RUSHING_REMEDIATION': {
      return `nba_pacing_calibration_${topicSlug}_all`;
    }
    case 'GOAL_BENCHMARK_MOCK': {
      return `nba_exam_benchmark_${goalId}`;
    }
    case 'FOUNDATIONAL_DIAGNOSTIC': {
      return `nba_diagnostic_assessment_foundational_diagnostic_${topicSlug}_${patternSlug}`;
    }
    case 'FOUNDATIONAL_REINFORCEMENT': {
      return `nba_diagnostic_assessment_foundational_reinforcement_${topicSlug}_${patternSlug}`;
    }
    default:
      throw new Error(`Unsupported actionSubtype for actionId: ${actionSubtype}`);
  }
};

/**
 * Builds deterministic interventionId according to Section 31.3 templates.
 */
const buildInterventionId = ({
  category,
  topic,
  pattern,
  blockedTargetPattern,
}) => {
  const topicSlug = topic ? patternRegistryService.buildSlug(topic) : '';
  const patternSlug = pattern ? patternRegistryService.buildSlug(pattern) : '';

  switch (category) {
    case 'PREREQUISITE_BOTTLENECK': {
      const blockedSlug = blockedTargetPattern ? patternRegistryService.buildSlug(blockedTargetPattern) : '';
      return `intv_prerequisite_bottleneck_${topicSlug}_${patternSlug}_blocks_${blockedSlug}`;
    }
    case 'RUSHING_CALIBRATION': {
      return `intv_rushing_calibration_${topicSlug}_all`;
    }
    default:
      throw new Error(`Unsupported category for interventionId: ${category}`);
  }
};

module.exports = {
  roundTo,
  getLogicalDayBoundaries,
  calculateDeadlineProximityBonus,
  getPriorityTier,
  DEFAULT_PRIORITY_THRESHOLDS,
  normalizePriorityThresholds,
  buildActionId,
  buildInterventionId,
};
