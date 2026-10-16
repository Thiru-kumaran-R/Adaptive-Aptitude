'use strict';

/**
 * Urgency Scoring Service & 7-Tier Ranking Comparator — Phase 9
 *
 * Implements Section 13, 14, 15:
 *   - Base weights W_type
 *   - Action-specific mastery deficit formulas S_deficit
 *   - Continuous goal impact and deadline proximity bonus I_goal
 *   - Temporal urgency T_temporal
 *   - Raw IEEE-754 score computation: U = W_type + S_deficit + I_goal + T_temporal
 *   - Priority tier mapping (critical, urgent, high, normal, low)
 *   - Strict 7-tier deterministic ranking comparator
 */

const {
  BASE_WEIGHTS,
  ACTION_TYPES,
  ACTION_SUBTYPES,
  POLICY_CLASSES,
} = require('../../config/orchestrationConfig');
const patternRegistryService = require('../patternRegistryService');
const { getPriorityTier } = require('./orchestrationUtils');

// Precompute topic registry index lookup
const topicIndexMap = new Map();
patternRegistryService.getAllTopics().forEach((topic, idx) => {
  topicIndexMap.set(topic, idx);
});

/**
 * Returns the 0-based index of a canonical topic in registry order (0 to 23), or 999999.
 *
 * @param {string|null} topic
 * @returns {number}
 */
const getTopicRegistryIndex = (topic) => {
  if (!topic || typeof topic !== 'string') return 999999;
  return topicIndexMap.has(topic) ? topicIndexMap.get(topic) : 999999;
};

/**
 * Computes base weight for an action type / subtype.
 *
 * @param {string} actionType
 * @param {string} actionSubtype
 * @param {Object|null} [customBaseWeights=null]
 * @returns {number}
 */
const getBaseWeight = (actionType, actionSubtype, customBaseWeights = null) => {
  if (customBaseWeights && typeof customBaseWeights === 'object') {
    if (actionSubtype === ACTION_SUBTYPES.OVERDUE_REVISION) {
      return customBaseWeights.OVERDUE_REVISION ?? BASE_WEIGHTS.OVERDUE_REVISION;
    }
    if (actionSubtype === ACTION_SUBTYPES.DUE_TODAY_REVISION) {
      return customBaseWeights.DUE_TODAY_REVISION ?? BASE_WEIGHTS.DUE_TODAY_REVISION;
    }
    if (customBaseWeights[actionType] !== undefined) {
      return customBaseWeights[actionType];
    }
  }

  if (actionSubtype === ACTION_SUBTYPES.OVERDUE_REVISION) {
    return BASE_WEIGHTS.OVERDUE_REVISION;
  }
  if (actionSubtype === ACTION_SUBTYPES.DUE_TODAY_REVISION) {
    return BASE_WEIGHTS.DUE_TODAY_REVISION;
  }
  if (BASE_WEIGHTS[actionType] !== undefined) {
    return BASE_WEIGHTS[actionType];
  }
  return 0.0;
};

/**
 * Computes policy priority class for an action.
 *
 * @param {string} actionType
 * @param {string} actionSubtype
 * @returns {number|null}
 */
const getPolicyPriorityClass = (actionType, actionSubtype) => {
  if (
    actionType === ACTION_TYPES.PREREQUISITE_REMEDIATION ||
    actionSubtype === ACTION_SUBTYPES.OVERDUE_REVISION
  ) {
    return POLICY_CLASSES.CLASS_0;
  }
  if (actionSubtype === ACTION_SUBTYPES.DUE_TODAY_REVISION) {
    return POLICY_CLASSES.CLASS_1;
  }
  if (
    actionType === ACTION_TYPES.CURRICULUM_ADVANCEMENT ||
    actionType === ACTION_TYPES.EXAM_BENCHMARK ||
    actionType === ACTION_TYPES.PACING_CALIBRATION
  ) {
    return POLICY_CLASSES.CLASS_2;
  }
  return null; // Diagnostic fallbacks have null policyPriorityClass
};

/**
 * Computes the raw unrounded composite urgency score and priority tier for a candidate action.
 *
 * @param {Object} params
 * @param {string} params.actionType
 * @param {string} params.actionSubtype
 * @param {number|null} [params.storedMastery=null]
 * @param {boolean} [params.hasProgressEvidence=true] For pacing calibration
 * @param {boolean} [params.isPlanAligned=false]
 * @param {number} [params.deadlineProximityBonus=0.0]
 * @param {number} [params.daysOverdue=0]
 * @param {Object|null} [params.policySnapshot=null]
 * @returns {{ urgencyScore: number|null, priorityTier: string, baseWeight: number, masteryDeficit: number, goalImpact: number, temporalUrgency: number }}
 */
const calculateUrgencyScore = ({
  actionType,
  actionSubtype,
  storedMastery = null,
  hasProgressEvidence = true,
  isPlanAligned = false,
  deadlineProximityBonus = 0.0,
  daysOverdue = 0,
  policySnapshot = null,
}) => {
  const policy = policySnapshot?.policyDefinition || policySnapshot || null;
  const maxMasteryDeficitWeight = policy?.maxMasteryDeficitWeight ?? 25.0;
  const maxGoalImpactWeight = policy?.maxGoalImpactWeight ?? 15.0;
  const maxTemporalWeight = policy?.maxTemporalWeight ?? 10.0;
  const priorityThresholds = policy?.priorityThresholds;

  // Diagnostic assessments have null urgencyScore
  if (actionType === ACTION_TYPES.DIAGNOSTIC_ASSESSMENT) {
    return {
      urgencyScore: null,
      priorityTier: 'normal',
      baseWeight: 0.0,
      masteryDeficit: 0.0,
      goalImpact: 0.0,
      temporalUrgency: 0.0,
    };
  }

  // 1. Base Type Weight W_type
  const baseWeight = getBaseWeight(actionType, actionSubtype, policy?.baseWeights);

  // 2. Mastery Deficit S_deficit
  let masteryDeficit = 0.0;
  if (actionType === ACTION_TYPES.EXAM_BENCHMARK) {
    masteryDeficit = 0.0;
  } else if (actionType === ACTION_TYPES.PACING_CALIBRATION) {
    if (!hasProgressEvidence || storedMastery === null) {
      masteryDeficit = 0.0; // Zero evidence -> S_deficit = 0.0 strictly
    } else {
      masteryDeficit = Math.max(0.0, 1.0 - storedMastery) * maxMasteryDeficitWeight;
    }
  } else {
    const effectiveMastery = storedMastery !== null ? storedMastery : 0.0;
    masteryDeficit = Math.max(0.0, 1.0 - effectiveMastery) * maxMasteryDeficitWeight;
  }

  // 3. Goal Impact I_goal
  let baseAlignment = 0.0;
  if (actionType === ACTION_TYPES.EXAM_BENCHMARK) {
    baseAlignment = 10.0; // Goal-aligned by definition
  } else if (isPlanAligned) {
    baseAlignment = 10.0;
  }

  const goalImpact = Math.min(maxGoalImpactWeight, baseAlignment + deadlineProximityBonus);

  // 4. Temporal Urgency T_temporal
  let temporalUrgency = 0.0;
  if (actionSubtype === ACTION_SUBTYPES.OVERDUE_REVISION) {
    temporalUrgency = Math.min(maxTemporalWeight, Math.max(0, daysOverdue) * 2.0);
  } else {
    // All other actions, including EXAM_BENCHMARK, have strictly 0.0
    temporalUrgency = 0.0;
  }

  // Composite raw urgency score
  const urgencyScore = baseWeight + masteryDeficit + goalImpact + temporalUrgency;
  const priorityTier = getPriorityTier(urgencyScore, priorityThresholds);

  return {
    urgencyScore,
    priorityTier,
    baseWeight,
    masteryDeficit,
    goalImpact,
    temporalUrgency,
  };
};

/**
 * Strict 7-Tier Deterministic Ranking Comparator
 *
 * Order:
 * 1. policyPriorityClass ascending (Class 0 < Class 1 < Class 2)
 * 2. urgencyScore descending (higher urgency wins)
 * 3. W_type base weight descending
 * 4. Raw stored mastery ascending (weaker mastery wins)
 * 5. Canonical topic registry index ascending (0 to 23)
 * 6. Canonical pattern registry index ascending (0 to 277, patternless uses +Infinity)
 * 7. Lexical deterministic fallback
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
const compareCandidates = (a, b) => {
  // 1. policyPriorityClass ascending (Class 0 < Class 1 < Class 2)
  if (a.policyPriorityClass !== b.policyPriorityClass) {
    if (a.policyPriorityClass === null) return 1;
    if (b.policyPriorityClass === null) return -1;
    return a.policyPriorityClass - b.policyPriorityClass;
  }

  // 2. urgencyScore descending (higher urgency wins)
  if (a.urgencyScore !== b.urgencyScore) {
    if (a.urgencyScore === null) return 1;
    if (b.urgencyScore === null) return -1;
    return b.urgencyScore - a.urgencyScore;
  }

  // 3. W_type base weight descending
  if (a.baseWeight !== b.baseWeight) {
    return b.baseWeight - a.baseWeight;
  }

  // 4. Raw stored mastery ascending (weaker mastery wins)
  const masteryA = a.storedMastery ?? 0.0;
  const masteryB = b.storedMastery ?? 0.0;
  if (masteryA !== masteryB) {
    return masteryA - masteryB;
  }

  // 5. Canonical topic registry index ascending (0 to 23)
  const topicIdxA = a.topicIndex ?? 999999;
  const topicIdxB = b.topicIndex ?? 999999;
  if (topicIdxA !== topicIdxB) {
    return topicIdxA - topicIdxB;
  }

  // 6. Canonical pattern registry index ascending (0 to 277)
  // Patternless actions explicitly assign +Infinity
  const patternIdxA = a.pattern ? (a.patternIndex ?? patternRegistryService.getPatternRegistryIndex(a.pattern)) : Infinity;
  const patternIdxB = b.pattern ? (b.patternIndex ?? patternRegistryService.getPatternRegistryIndex(b.pattern)) : Infinity;
  if (patternIdxA !== patternIdxB) {
    return patternIdxA - patternIdxB;
  }

  // 7. Lexical deterministic fallback
  const patternNameA = a.pattern || '';
  const patternNameB = b.pattern || '';
  const patternComp = patternNameA.localeCompare(patternNameB);
  if (patternComp !== 0) return patternComp;

  return (a.actionId || '').localeCompare(b.actionId || '');
};

module.exports = {
  getTopicRegistryIndex,
  getBaseWeight,
  getPolicyPriorityClass,
  calculateUrgencyScore,
  compareCandidates,
};
