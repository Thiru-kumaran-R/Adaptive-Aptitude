'use strict';

/**
 * Phase 11: Synthetic Policy Comparison Service (Mode B)
 *
 * Implements pure Phase 11 scoring, authoritative 7-tier comparator ranking,
 * and archetype comparison without database dependencies.
 */

const {
  BASELINE_POLICY,
  SIMULATION_BOUNDS,
} = require('../../config/simulationConfig');
const { generatePolicyFingerprint } = require('../../utils/simulationFingerprint');

const getBaseWeight = (action, policy) => {
  if (action.actionSubtype === 'OVERDUE_REVISION') {
    return policy.baseWeights.OVERDUE_REVISION;
  }
  if (action.actionSubtype === 'DUE_TODAY_REVISION') {
    return policy.baseWeights.DUE_TODAY_REVISION;
  }
  if (policy.baseWeights[action.actionType] !== undefined) {
    return policy.baseWeights[action.actionType];
  }
  return 0.0;
};

/**
 * Calculates raw IEEE-754 urgency score and component values.
 *
 * @param {Object} action
 * @param {Object} candidatePolicy
 * @returns {{
 *   urgencyScore: number|null,
 *   priorityTier: string,
 *   baseWeight: number,
 *   masteryDeficit: number,
 *   goalImpact: number,
 *   temporalUrgency: number
 * }}
 */
const calculatePureUrgencyScore = (action, candidatePolicy) => {
  if (action.actionType === 'DIAGNOSTIC_ASSESSMENT') {
    return {
      urgencyScore: null,
      priorityTier: 'normal',
      baseWeight: 0.0,
      masteryDeficit: 0.0,
      goalImpact: 0.0,
      temporalUrgency: 0.0,
    };
  }

  // 1. Base Weight (W)
  const baseWeight = getBaseWeight(action, candidatePolicy);

  // 2. Mastery Deficit (S)
  let masteryDeficit = 0.0;
  if (action.actionType === 'EXAM_BENCHMARK') {
    masteryDeficit = 0.0;
  } else if (action.actionType === 'PACING_CALIBRATION') {
    if (action.hasProgressEvidence === false || action.storedMastery === null || action.storedMastery === undefined) {
      masteryDeficit = 0.0;
    } else {
      masteryDeficit = Math.max(0.0, 1.0 - action.storedMastery) * candidatePolicy.maxMasteryDeficitWeight;
    }
  } else {
    const effectiveMastery = (action.storedMastery !== null && action.storedMastery !== undefined)
      ? action.storedMastery
      : 0.0;
    masteryDeficit = Math.max(0.0, 1.0 - effectiveMastery) * candidatePolicy.maxMasteryDeficitWeight;
  }

  // 3. Goal Impact (I)
  const baseAlignment = (action.actionType === 'EXAM_BENCHMARK' || action.isPlanAligned === true) ? 10.0 : 0.0;
  const deadlineBonus = (action.actionType === 'CURRICULUM_ADVANCEMENT' || action.actionType === 'EXAM_BENCHMARK')
    ? (action.deadlineProximityBonus || 0.0)
    : 0.0;
  const goalImpact = Math.min(candidatePolicy.maxGoalImpactWeight, baseAlignment + deadlineBonus);

  // 4. Temporal Urgency (T)
  let temporalUrgency = 0.0;
  if (action.actionSubtype === 'OVERDUE_REVISION') {
    const rawDays = Math.max(0, action.daysOverdue || 0);
    temporalUrgency = Math.min(candidatePolicy.maxTemporalWeight, rawDays * 2.0);
  }

  // Full IEEE-754 precision sum
  const urgencyScore = baseWeight + masteryDeficit + goalImpact + temporalUrgency;

  // Priority tier derived from candidate thresholds
  const { critical, urgent, high, normal } = candidatePolicy.priorityThresholds;
  let priorityTier = 'low';
  if (urgencyScore >= critical) {
    priorityTier = 'critical';
  } else if (urgencyScore >= urgent) {
    priorityTier = 'urgent';
  } else if (urgencyScore >= high) {
    priorityTier = 'high';
  } else if (urgencyScore >= normal) {
    priorityTier = 'normal';
  }

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
 * Compares two candidates using Phase 9 authoritative 7-tier comparator.
 *
 * @param {Object} a
 * @param {Object} b
 * @param {Object} candidatePolicy
 * @returns {number}
 */
const compareCandidates = (a, b, candidatePolicy) => {
  // Tier 1: Policy Priority Class (ASC). Diagnostic (null) sorts last.
  const classA = a.policyPriorityClass !== null && a.policyPriorityClass !== undefined ? a.policyPriorityClass : 999999;
  const classB = b.policyPriorityClass !== null && b.policyPriorityClass !== undefined ? b.policyPriorityClass : 999999;
  if (classA !== classB) {
    return classA - classB;
  }

  // Tier 2: Urgency Score (DESC). Null sorts last.
  const scoreA = a.urgencyScore !== null && a.urgencyScore !== undefined ? a.urgencyScore : -Infinity;
  const scoreB = b.urgencyScore !== null && b.urgencyScore !== undefined ? b.urgencyScore : -Infinity;
  if (scoreA !== scoreB) {
    return scoreB - scoreA;
  }

  // Tier 3: Candidate Base Weight (DESC)
  const bwA = getBaseWeight(a, candidatePolicy);
  const bwB = getBaseWeight(b, candidatePolicy);
  if (bwA !== bwB) {
    return bwB - bwA;
  }

  // Tier 4: Stored Mastery (ASC). Missing mastery defaults to 0.0.
  const masteryA = a.storedMastery !== null && a.storedMastery !== undefined ? a.storedMastery : 0.0;
  const masteryB = b.storedMastery !== null && b.storedMastery !== undefined ? b.storedMastery : 0.0;
  if (masteryA !== masteryB) {
    return masteryA - masteryB;
  }

  // Tier 5: Canonical Topic Registry Index (ASC). Non-topic actions use 999999.
  const topicIdxA = a.topicIndex !== null && a.topicIndex !== undefined ? a.topicIndex : 999999;
  const topicIdxB = b.topicIndex !== null && b.topicIndex !== undefined ? b.topicIndex : 999999;
  if (topicIdxA !== topicIdxB) {
    return topicIdxA - topicIdxB;
  }

  // Tier 6: Canonical Pattern Registry Index (ASC). Patternless actions sort last (+Infinity).
  const patIdxA = a.pattern == null ? Infinity : (a.patternIndex !== null && a.patternIndex !== undefined ? a.patternIndex : Infinity);
  const patIdxB = b.pattern == null ? Infinity : (b.patternIndex !== null && b.patternIndex !== undefined ? b.patternIndex : Infinity);
  if (patIdxA !== patIdxB) {
    return patIdxA - patIdxB;
  }

  // Tier 7: Lexical Fallback: pattern name localeCompare -> actionId localeCompare
  const patternNameA = a.pattern || '';
  const patternNameB = b.pattern || '';
  const patternComp = patternNameA.localeCompare(patternNameB);
  if (patternComp !== 0) {
    return patternComp;
  }
  return (a.actionId || '').localeCompare(b.actionId || '');
};

/**
 * Simulates a single archetype vector under a given policy.
 *
 * @param {{ archetype: Object, candidatePolicy: Object }} params
 * @returns {Object}
 */
const simulateArchetype = ({ archetype, candidatePolicy }) => {
  const scoredCandidates = archetype.candidates.map((cand) => {
    const scoreResult = calculatePureUrgencyScore(cand, candidatePolicy);
    return {
      ...cand,
      ...scoreResult,
    };
  });

  scoredCandidates.sort((a, b) => compareCandidates(a, b, candidatePolicy));

  const winner = scoredCandidates[0];

  const ranking = scoredCandidates.map((item, index) => ({
    rank: index + 1,
    actionId: item.actionId,
    actionType: item.actionType,
    urgencyScore: item.urgencyScore,
    priorityTier: item.priorityTier,
  }));

  return {
    winnerActionId: winner.actionId,
    winnerActionType: winner.actionType,
    winnerUrgencyScore: winner.urgencyScore,
    winnerPriorityTier: winner.priorityTier,
    ranking,
  };
};

/**
 * Runs Mode B comparison across all synthetic student archetypes.
 *
 * @param {{
 *   archetypes: Array,
 *   candidatePolicies: Array,
 *   startTimeNs?: bigint
 * }} params
 * @returns {Array} List of archetype comparison analysis objects
 */
const compareSyntheticArchetypes = ({
  archetypes,
  candidatePolicies,
  startTimeNs = process.hrtime.bigint(),
}) => {
  const results = [];

  for (const archetype of archetypes) {
    // Monotonic cooperative circuit breaker check
    const elapsedMs = Number(process.hrtime.bigint() - startTimeNs) / 1e6;
    if (elapsedMs > SIMULATION_BOUNDS.MAX_EXECUTION_TIME_MS) {
      const err = new Error('SIMULATION_EXECUTION_FAILED: CIRCUIT_BREAKER_TRIGGERED - CPU budget exceeded');
      err.name = 'SimulationExecutionError';
      err.code = 'SIMULATION_EXECUTION_FAILED';
      err.reason = 'CIRCUIT_BREAKER_TRIGGERED';
      err.reasonCode = 'CIRCUIT_BREAKER_TRIGGERED';
      throw err;
    }

    const baselineResult = simulateArchetype({
      archetype,
      candidatePolicy: BASELINE_POLICY,
    });

    const baselineRankMap = new Map();
    const baselineTierMap = new Map();
    for (const item of baselineResult.ranking) {
      baselineRankMap.set(item.actionId, item.rank);
      baselineTierMap.set(item.actionId, item.priorityTier);
    }

    const candidatePolicyResults = candidatePolicies.map((candidatePolicy) => {
      const candResult = simulateArchetype({
        archetype,
        candidatePolicy,
      });

      const policyFingerprint = generatePolicyFingerprint(candidatePolicy);
      const actionDisagreement = candResult.winnerActionId !== baselineResult.winnerActionId;
      const baselineRankOfCandWinner = baselineRankMap.get(candResult.winnerActionId) || 1;
      const winnerRankDelta = baselineRankOfCandWinner - 1;

      const rankingWithDelta = candResult.ranking.map((item) => {
        const baseRank = baselineRankMap.get(item.actionId) || item.rank;
        return {
          rank: item.rank,
          actionId: item.actionId,
          actionType: item.actionType,
          urgencyScore: item.urgencyScore,
          priorityTier: item.priorityTier,
          rankDeltaFromBaseline: item.rank - baseRank,
        };
      });

      const tierMigrations = archetype.candidates.map((cand) => {
        const baselineTier = baselineTierMap.get(cand.actionId) || 'normal';
        const candItem = candResult.ranking.find((r) => r.actionId === cand.actionId);
        const candidateTier = candItem ? candItem.priorityTier : 'normal';
        return {
          actionId: cand.actionId,
          baselineTier,
          candidateTier,
          tierShifted: baselineTier !== candidateTier,
        };
      });

      return {
        policyFingerprint,
        winnerActionId: candResult.winnerActionId,
        winnerActionType: candResult.winnerActionType,
        winnerUrgencyScore: candResult.winnerUrgencyScore,
        winnerPriorityTier: candResult.winnerPriorityTier,
        actionDisagreement,
        winnerRankDelta,
        ranking: rankingWithDelta,
        tierMigrations,
      };
    });

    results.push({
      archetypeId: archetype.archetypeId,
      archetypeName: archetype.name,
      baselinePolicyResult: baselineResult,
      candidatePolicyResults,
    });
  }

  return results;
};

module.exports = {
  calculatePureUrgencyScore,
  simulateArchetype,
  compareSyntheticArchetypes,
  compareCandidates,
};
