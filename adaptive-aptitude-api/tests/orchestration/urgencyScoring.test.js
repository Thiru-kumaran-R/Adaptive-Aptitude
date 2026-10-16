'use strict';

/**
 * Suite 2: tests/orchestration/urgencyScoring.test.js
 *
 * Unit tests for Urgency Scoring Model and 7-Tier Deterministic Comparator:
 *   - Base type weights W_type
 *   - Mastery deficit formulas S_deficit across all action types
 *   - Continuous goal deadline formula and boundary clamps
 *   - Temporal factor T_temporal (EXAM_BENCHMARK = 0 strictly)
 *   - Priority tier boundaries (critical, urgent, high, normal, low, never 'medium')
 *   - Strict 7-tier comparator rules:
 *       Class 0 beats Class 1 beats Class 2
 *       urgencyScore descending
 *       baseWeight descending
 *       storedMastery ascending
 *       canonical topic index ascending
 *       canonical pattern index ascending (patternless +Infinity)
 *       lexical fallbacks
 */

const {
  BASE_WEIGHTS,
  ACTION_TYPES,
  ACTION_SUBTYPES,
  POLICY_CLASSES,
} = require('../../src/config/orchestrationConfig');
const {
  getBaseWeight,
  getPolicyPriorityClass,
  calculateUrgencyScore,
  compareCandidates,
  getTopicRegistryIndex,
} = require('../../src/services/orchestration/urgencyScoringService');
const {
  calculateDeadlineProximityBonus,
  getPriorityTier,
} = require('../../src/services/orchestration/orchestrationUtils');
const patternRegistryService = require('../../src/services/patternRegistryService');

describe('Suite 2: Phase 9 Urgency Scoring & Ranking Comparator Tests', () => {
  describe('1. Base Type Weights & Policy Classes', () => {
    it('enforces exact W_type base weights', () => {
      expect(getBaseWeight(ACTION_TYPES.PREREQUISITE_REMEDIATION, ACTION_SUBTYPES.BLOCKING_PREREQUISITE)).toBe(50.0);
      expect(getBaseWeight(ACTION_TYPES.RETENTION_RESCUE, ACTION_SUBTYPES.OVERDUE_REVISION)).toBe(45.0);
      expect(getBaseWeight(ACTION_TYPES.RETENTION_RESCUE, ACTION_SUBTYPES.DUE_TODAY_REVISION)).toBe(35.0);
      expect(getBaseWeight(ACTION_TYPES.CURRICULUM_ADVANCEMENT, ACTION_SUBTYPES.DAILY_OBJECTIVE_TARGET)).toBe(30.0);
      expect(getBaseWeight(ACTION_TYPES.EXAM_BENCHMARK, ACTION_SUBTYPES.GOAL_BENCHMARK_MOCK)).toBe(25.0);
      expect(getBaseWeight(ACTION_TYPES.PACING_CALIBRATION, ACTION_SUBTYPES.RUSHING_REMEDIATION)).toBe(20.0);
      expect(getBaseWeight(ACTION_TYPES.DIAGNOSTIC_ASSESSMENT, ACTION_SUBTYPES.FOUNDATIONAL_DIAGNOSTIC)).toBe(0.0);
    });

    it('enforces exact policy priority classes', () => {
      expect(getPolicyPriorityClass(ACTION_TYPES.PREREQUISITE_REMEDIATION, ACTION_SUBTYPES.BLOCKING_PREREQUISITE)).toBe(POLICY_CLASSES.CLASS_0);
      expect(getPolicyPriorityClass(ACTION_TYPES.RETENTION_RESCUE, ACTION_SUBTYPES.OVERDUE_REVISION)).toBe(POLICY_CLASSES.CLASS_0);
      expect(getPolicyPriorityClass(ACTION_TYPES.RETENTION_RESCUE, ACTION_SUBTYPES.DUE_TODAY_REVISION)).toBe(POLICY_CLASSES.CLASS_1);
      expect(getPolicyPriorityClass(ACTION_TYPES.CURRICULUM_ADVANCEMENT, ACTION_SUBTYPES.DAILY_OBJECTIVE_TARGET)).toBe(POLICY_CLASSES.CLASS_2);
      expect(getPolicyPriorityClass(ACTION_TYPES.EXAM_BENCHMARK, ACTION_SUBTYPES.GOAL_BENCHMARK_MOCK)).toBe(POLICY_CLASSES.CLASS_2);
      expect(getPolicyPriorityClass(ACTION_TYPES.PACING_CALIBRATION, ACTION_SUBTYPES.RUSHING_REMEDIATION)).toBe(POLICY_CLASSES.CLASS_2);
      expect(getPolicyPriorityClass(ACTION_TYPES.DIAGNOSTIC_ASSESSMENT, ACTION_SUBTYPES.FOUNDATIONAL_DIAGNOSTIC)).toBeNull();
    });
  });

  describe('2. Mastery Deficit Semantics (S_deficit)', () => {
    it('calculates S_deficit for PREREQUISITE_REMEDIATION: max(0, 1 - M) * 25', () => {
      const res = calculateUrgencyScore({
        actionType: ACTION_TYPES.PREREQUISITE_REMEDIATION,
        actionSubtype: ACTION_SUBTYPES.BLOCKING_PREREQUISITE,
        storedMastery: 0.40,
        isPlanAligned: true,
      });
      expect(res.masteryDeficit).toBeCloseTo((1 - 0.40) * 25, 4); // 15.0
    });

    it('calculates S_deficit for RETENTION_RESCUE with missing progress as M = 0.0', () => {
      const res = calculateUrgencyScore({
        actionType: ACTION_TYPES.RETENTION_RESCUE,
        actionSubtype: ACTION_SUBTYPES.OVERDUE_REVISION,
        storedMastery: null,
        isPlanAligned: false,
      });
      expect(res.masteryDeficit).toBe(25.0);
    });

    it('calculates S_deficit for PACING_CALIBRATION: 0.0 when hasProgressEvidence is false', () => {
      const resNoEvidence = calculateUrgencyScore({
        actionType: ACTION_TYPES.PACING_CALIBRATION,
        actionSubtype: ACTION_SUBTYPES.RUSHING_REMEDIATION,
        storedMastery: null,
        hasProgressEvidence: false,
      });
      expect(resNoEvidence.masteryDeficit).toBe(0.0);

      const resWithEvidence = calculateUrgencyScore({
        actionType: ACTION_TYPES.PACING_CALIBRATION,
        actionSubtype: ACTION_SUBTYPES.RUSHING_REMEDIATION,
        storedMastery: 0.60,
        hasProgressEvidence: true,
      });
      expect(resWithEvidence.masteryDeficit).toBeCloseTo((1 - 0.60) * 25, 4); // 10.0
    });

    it('calculates S_deficit for EXAM_BENCHMARK as strictly 0.0', () => {
      const res = calculateUrgencyScore({
        actionType: ACTION_TYPES.EXAM_BENCHMARK,
        actionSubtype: ACTION_SUBTYPES.GOAL_BENCHMARK_MOCK,
        storedMastery: 0.20, // even if passed, must be 0
      });
      expect(res.masteryDeficit).toBe(0.0);
    });
  });

  describe('3. Goal Deadline Bonus & Continuous Proximity Formula', () => {
    const refNow = new Date('2026-10-06T12:00:00.000Z');

    it('calculates continuous proximity bonus when daysToDeadline < 30', () => {
      const goal = {
        status: 'active',
        targetDate: new Date('2026-10-21T12:00:00.000Z'), // 15 days
      };
      const { daysToDeadline, deadlineProximityBonus } = calculateDeadlineProximityBonus(goal, refNow);
      expect(daysToDeadline).toBe(15);
      expect(deadlineProximityBonus).toBeCloseTo(((30 - 15) / 30) * 5.0, 4); // 2.5
    });

    it('clamps deadlineProximityBonus to 5.0 for past target dates (rawDays <= 0)', () => {
      const pastGoal = {
        status: 'active',
        targetDate: new Date('2026-10-01T12:00:00.000Z'),
      };
      const { daysToDeadline, deadlineProximityBonus } = calculateDeadlineProximityBonus(pastGoal, refNow);
      expect(daysToDeadline).toBe(0);
      expect(deadlineProximityBonus).toBe(5.0);
    });

    it('yields 0.0 bonus when daysToDeadline >= 30', () => {
      const futureGoal = {
        status: 'active',
        targetDate: new Date('2026-12-01T12:00:00.000Z'), // > 30 days
      };
      const { deadlineProximityBonus } = calculateDeadlineProximityBonus(futureGoal, refNow);
      expect(deadlineProximityBonus).toBe(0.0);
    });

    it('yields null daysToDeadline and 0.0 bonus when goal is missing or inactive', () => {
      expect(calculateDeadlineProximityBonus(null, refNow)).toEqual({ daysToDeadline: null, deadlineProximityBonus: 0.0 });
      expect(calculateDeadlineProximityBonus({ status: 'completed' }, refNow)).toEqual({ daysToDeadline: null, deadlineProximityBonus: 0.0 });
    });

    it('preserves raw unrounded IEEE-754 precision for deadlineProximityBonus and internal scoring (e.g., daysToDeadline = 29)', () => {
      // 29 days remaining -> (30 - 29) / 30 * 5 = 5 / 30 = 1 / 6 = 0.16666666666666666...
      const goal29Days = {
        status: 'active',
        targetDate: new Date('2026-11-04T12:00:00.000Z'), // exactly 29 days from 2026-10-06T12:00:00.000Z
      };
      const { daysToDeadline, deadlineProximityBonus } = calculateDeadlineProximityBonus(goal29Days, refNow);
      expect(daysToDeadline).toBe(29);
      expect(deadlineProximityBonus).toBeCloseTo(0.16666666666666666, 12);
      expect(deadlineProximityBonus).not.toBe(0.17); // strictly unrounded internally

      // Verify urgency scoring consumes the exact raw value
      const scoreResult = calculateUrgencyScore({
        actionType: ACTION_TYPES.CURRICULUM_ADVANCEMENT,
        actionSubtype: ACTION_SUBTYPES.DAILY_OBJECTIVE_TARGET,
        storedMastery: 1.0, // deficit = 0
        isPlanAligned: true, // baseAlignment = 10
        deadlineProximityBonus,
      });
      // goalImpact = min(15, 10 + 0.16666666666666666) = 10.166666666666666
      expect(scoreResult.goalImpact).toBeCloseTo(10.166666666666666, 12);
      // urgencyScore = 30 (W_type) + 0 (deficit) + 10.166666666666666 (goalImpact) + 0 = 40.166666666666664
      expect(scoreResult.urgencyScore).toBeCloseTo(40.166666666666664, 12);

      // Verify near-tie comparator: raw precision decides ranking, preventing presentation-rounding distortion
      const candidateRawHigher = {
        policyPriorityClass: 2,
        urgencyScore: 40.166666666667,
        baseWeight: 30.0,
        actionId: 'nba_raw_higher',
      };
      const candidateRawLower = {
        policyPriorityClass: 2,
        urgencyScore: 40.166666666660,
        baseWeight: 30.0,
        actionId: 'nba_raw_lower',
      };
      // Both round to 40.17 in a 2-decimal DTO, but raw comparison ranks candidateRawHigher ahead
      expect(compareCandidates(candidateRawHigher, candidateRawLower)).toBeLessThan(0);
      expect(compareCandidates(candidateRawLower, candidateRawHigher)).toBeGreaterThan(0);
    });
  });

  describe('4. Temporal Urgency (T_temporal)', () => {
    it('calculates overdue revision temporal urgency: min(10, daysOverdue * 2)', () => {
      const res3Days = calculateUrgencyScore({
        actionType: ACTION_TYPES.RETENTION_RESCUE,
        actionSubtype: ACTION_SUBTYPES.OVERDUE_REVISION,
        daysOverdue: 3,
      });
      expect(res3Days.temporalUrgency).toBe(6.0);

      const res10Days = calculateUrgencyScore({
        actionType: ACTION_TYPES.RETENTION_RESCUE,
        actionSubtype: ACTION_SUBTYPES.OVERDUE_REVISION,
        daysOverdue: 10,
      });
      expect(res10Days.temporalUrgency).toBe(10.0); // capped at 10.0
    });

    it('strictly enforces T_temporal = 0.0 for EXAM_BENCHMARK (no double counting)', () => {
      const res = calculateUrgencyScore({
        actionType: ACTION_TYPES.EXAM_BENCHMARK,
        actionSubtype: ACTION_SUBTYPES.GOAL_BENCHMARK_MOCK,
        daysOverdue: 5,
        deadlineProximityBonus: 3.0,
      });
      expect(res.temporalUrgency).toBe(0.0);
      expect(res.goalImpact).toBe(13.0); // 10 base + 3 bonus
    });

    it('enforces T_temporal = 0.0 for DUE_TODAY_REVISION, CURRICULUM, and PACING', () => {
      expect(calculateUrgencyScore({ actionType: ACTION_TYPES.RETENTION_RESCUE, actionSubtype: ACTION_SUBTYPES.DUE_TODAY_REVISION }).temporalUrgency).toBe(0.0);
      expect(calculateUrgencyScore({ actionType: ACTION_TYPES.CURRICULUM_ADVANCEMENT, actionSubtype: ACTION_SUBTYPES.DAILY_OBJECTIVE_TARGET }).temporalUrgency).toBe(0.0);
      expect(calculateUrgencyScore({ actionType: ACTION_TYPES.PACING_CALIBRATION, actionSubtype: ACTION_SUBTYPES.RUSHING_REMEDIATION }).temporalUrgency).toBe(0.0);
    });
  });

  describe('5. Priority Tier Boundaries', () => {
    it('maps urgency scores to discrete tiers without ever emitting "medium"', () => {
      expect(getPriorityTier(85.0)).toBe('critical');
      expect(getPriorityTier(80.0)).toBe('critical');
      expect(getPriorityTier(79.99)).toBe('urgent');
      expect(getPriorityTier(65.0)).toBe('urgent');
      expect(getPriorityTier(64.99)).toBe('high');
      expect(getPriorityTier(50.0)).toBe('high');
      expect(getPriorityTier(49.99)).toBe('normal');
      expect(getPriorityTier(35.0)).toBe('normal');
      expect(getPriorityTier(34.99)).toBe('low');
      expect(getPriorityTier(10.0)).toBe('low');
      expect(getPriorityTier(null)).toBe('normal');
    });
  });

  describe('6. 7-Tier Deterministic Ranking Comparator', () => {
    it('enforces Rule 1: Class 0 always beats Class 1 and Class 2 regardless of urgencyScore', () => {
      const class0 = { policyPriorityClass: 0, urgencyScore: 50.0, actionId: 'a1' };
      const class1 = { policyPriorityClass: 1, urgencyScore: 80.0, actionId: 'a2' };
      const class2 = { policyPriorityClass: 2, urgencyScore: 95.0, actionId: 'a3' };

      expect(compareCandidates(class0, class1)).toBeLessThan(0);
      expect(compareCandidates(class0, class2)).toBeLessThan(0);
      expect(compareCandidates(class1, class2)).toBeLessThan(0);
    });

    it('enforces Rule 2: urgencyScore descending within the same policy class', () => {
      const highUrgency = { policyPriorityClass: 2, urgencyScore: 65.0, actionId: 'a1' };
      const lowUrgency = { policyPriorityClass: 2, urgencyScore: 45.0, actionId: 'a2' };
      expect(compareCandidates(highUrgency, lowUrgency)).toBeLessThan(0);
    });

    it('enforces Rule 3: baseWeight descending when urgencyScores are tied', () => {
      const higherBase = { policyPriorityClass: 2, urgencyScore: 50.0, baseWeight: 30.0, actionId: 'a1' };
      const lowerBase = { policyPriorityClass: 2, urgencyScore: 50.0, baseWeight: 20.0, actionId: 'a2' };
      expect(compareCandidates(higherBase, lowerBase)).toBeLessThan(0);
    });

    it('enforces Rule 4: storedMastery ascending (weaker mastery wins)', () => {
      const weaker = { policyPriorityClass: 2, urgencyScore: 50.0, baseWeight: 30.0, storedMastery: 0.30, actionId: 'a1' };
      const stronger = { policyPriorityClass: 2, urgencyScore: 50.0, baseWeight: 30.0, storedMastery: 0.70, actionId: 'a2' };
      expect(compareCandidates(weaker, stronger)).toBeLessThan(0);
    });

    it('enforces Rule 5: canonical topic registry index ascending', () => {
      const topicAlgebra = { policyPriorityClass: 2, urgencyScore: 50.0, baseWeight: 30.0, storedMastery: 0.5, topicIndex: getTopicRegistryIndex('Algebra'), actionId: 'a1' };
      const topicRatio = { policyPriorityClass: 2, urgencyScore: 50.0, baseWeight: 30.0, storedMastery: 0.5, topicIndex: getTopicRegistryIndex('Ratio and Proportion'), actionId: 'a2' };
      expect(compareCandidates(topicAlgebra, topicRatio)).toBeLessThan(0);
    });

    it('enforces Rule 6: patternless actions use +Infinity pattern registry index', () => {
      const withPattern = {
        policyPriorityClass: 2,
        urgencyScore: 50.0,
        baseWeight: 30.0,
        storedMastery: 0.5,
        topicIndex: 0,
        pattern: 'Linear Equations & Systems of Equations',
        patternIndex: 0,
        actionId: 'a1',
      };
      const patternless = {
        policyPriorityClass: 2,
        urgencyScore: 50.0,
        baseWeight: 30.0,
        storedMastery: 0.5,
        topicIndex: 0,
        pattern: null,
        patternIndex: Infinity,
        actionId: 'a2',
      };
      expect(compareCandidates(withPattern, patternless)).toBeLessThan(0);
    });

    it('enforces Rule 7: lexical deterministic fallback on pattern and actionId', () => {
      const itemA = { policyPriorityClass: 2, urgencyScore: 50.0, baseWeight: 30.0, storedMastery: 0.5, topicIndex: 0, pattern: 'Alpha', patternIndex: 10, actionId: 'nba_1' };
      const itemB = { policyPriorityClass: 2, urgencyScore: 50.0, baseWeight: 30.0, storedMastery: 0.5, topicIndex: 0, pattern: 'Beta', patternIndex: 10, actionId: 'nba_2' };
      expect(compareCandidates(itemA, itemB)).toBeLessThan(0);
    });
  });
});
