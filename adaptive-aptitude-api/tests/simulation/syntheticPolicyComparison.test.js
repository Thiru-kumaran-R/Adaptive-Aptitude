'use strict';

/**
 * Phase 11 Suite 3: Synthetic Policy Comparison Tests (Mode B)
 *
 * Verifies Mode B pure scoring against Phase 9 raw scoring logic, 7-tier comparator parity,
 * all six static archetypes, and analytical floating point score precision (no implicit rounding).
 */

const { BASELINE_POLICY } = require('../../src/config/simulationConfig');
const { SIMULATION_ARCHETYPES } = require('../../src/config/simulationArchetypes');
const {
  calculatePureUrgencyScore,
  simulateArchetype,
  compareSyntheticArchetypes,
  compareCandidates,
} = require('../../src/services/simulation/syntheticPolicyComparisonService');
const { validateCandidatePolicy } = require('../../src/services/simulation/policyValidationService');

describe('Suite 3: Synthetic Policy Comparison Tests (Mode B)', () => {
  const candidatePolicy = validateCandidatePolicy({
    simulationOnly: true,
    baseWeights: {
      PREREQUISITE_REMEDIATION: 48.0,
      OVERDUE_REVISION: 50.0,
      DUE_TODAY_REVISION: 38.0,
      CURRICULUM_ADVANCEMENT: 35.0,
      EXAM_BENCHMARK: 28.0,
      PACING_CALIBRATION: 22.0,
    },
    maxMasteryDeficitWeight: 28.0,
    maxGoalImpactWeight: 18.0,
    maxTemporalWeight: 12.0,
    priorityThresholds: {
      critical: 82.0,
      urgent: 66.0,
      high: 52.0,
      normal: 36.0,
    },
  });

  describe('1. Pure Scoring Parity & Component Calculations', () => {
    it('calculates exact pure urgency score for curriculum advancement', () => {
      const action = {
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'DAILY_OBJECTIVE_TARGET',
        storedMastery: 0.40,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 3.5,
        daysOverdue: 0,
      };

      const result = calculatePureUrgencyScore(action, BASELINE_POLICY);

      // W = 30.0
      // S = (1 - 0.40) * 25.0 = 15.0
      // I = min(15.0, 10.0 + 3.5) = 13.5
      // T = 0.0
      // U = 30.0 + 15.0 + 13.5 + 0.0 = 58.5
      expect(result.baseWeight).toBe(30.0);
      expect(result.masteryDeficit).toBe(15.0);
      expect(result.goalImpact).toBe(13.5);
      expect(result.temporalUrgency).toBe(0.0);
      expect(result.urgencyScore).toBe(58.5);
      expect(result.priorityTier).toBe('high'); // 58.5 >= 50.0
    });

    it('calculates exact pure urgency score for overdue revision with temporal capping', () => {
      const action = {
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'OVERDUE_REVISION',
        storedMastery: 0.50,
        hasProgressEvidence: true,
        isPlanAligned: false,
        deadlineProximityBonus: 0.0,
        daysOverdue: 6, // 6 * 2.0 = 12.0 capped at maxTemporalWeight (10.0 in baseline)
      };

      const result = calculatePureUrgencyScore(action, BASELINE_POLICY);

      // W = 45.0
      // S = (1 - 0.50) * 25.0 = 12.5
      // I = min(15.0, 0.0) = 0.0
      // T = min(10.0, 6 * 2.0) = 10.0
      // U = 45.0 + 12.5 + 0.0 + 10.0 = 67.5
      expect(result.baseWeight).toBe(45.0);
      expect(result.masteryDeficit).toBe(12.5);
      expect(result.goalImpact).toBe(0.0);
      expect(result.temporalUrgency).toBe(10.0);
      expect(result.urgencyScore).toBe(67.5);
      expect(result.priorityTier).toBe('urgent'); // 67.5 >= 65.0
    });

    it('returns null score and normal tier for diagnostic assessment fallback', () => {
      const action = {
        actionType: 'DIAGNOSTIC_ASSESSMENT',
        actionSubtype: 'FOUNDATIONAL_DIAGNOSTIC',
        storedMastery: 0.0,
      };

      const result = calculatePureUrgencyScore(action, BASELINE_POLICY);
      expect(result.urgencyScore).toBeNull();
      expect(result.priorityTier).toBe('normal');
      expect(result.baseWeight).toBe(0.0);
    });
  });

  describe('2. Floating Point Precision & No Implicit Rounding', () => {
    it('preserves full IEEE-754 precision without implicit 2-decimal rounding', () => {
      const policyWithFractionalDeficit = validateCandidatePolicy({
        simulationOnly: true,
        baseWeights: { ...BASELINE_POLICY.baseWeights, CURRICULUM_ADVANCEMENT: 33.33333333333333 },
        maxMasteryDeficitWeight: 25.0,
        maxGoalImpactWeight: 15.0,
        maxTemporalWeight: 10.0,
        priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
      });

      const action = {
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'DAILY_OBJECTIVE_TARGET',
        storedMastery: 0.3333333333333333,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 1.1111111111111112,
        daysOverdue: 0,
      };

      const result = calculatePureUrgencyScore(action, policyWithFractionalDeficit);

      // Verify that the score retains decimal places and is NOT rounded to 2 decimals
      const scoreStr = result.urgencyScore.toString();
      expect(scoreStr.includes('.')).toBe(true);
      const decimalPlaces = scoreStr.split('.')[1].length;
      expect(decimalPlaces).toBeGreaterThan(4);
    });
  });

  describe('3. Authoritative 7-Tier Comparator Parity', () => {
    it('ranks Class 0 ahead of Class 1 and Class 2 regardless of score', () => {
      const actionA = { policyPriorityClass: 0, urgencyScore: 50.0, actionId: 'a' };
      const actionB = { policyPriorityClass: 1, urgencyScore: 90.0, actionId: 'b' };
      expect(compareCandidates(actionA, actionB, BASELINE_POLICY)).toBeLessThan(0);
    });

    it('ranks higher urgency score ahead within same priority class', () => {
      const actionA = { policyPriorityClass: 2, urgencyScore: 75.0, actionId: 'a' };
      const actionB = { policyPriorityClass: 2, urgencyScore: 60.0, actionId: 'b' };
      expect(compareCandidates(actionA, actionB, BASELINE_POLICY)).toBeLessThan(0);
    });

    it('derives patternless actions with patternIndex: null as Infinity (sorting last)', () => {
      const patternedAction = {
        policyPriorityClass: 2,
        urgencyScore: 50.0,
        actionType: 'CURRICULUM_ADVANCEMENT',
        storedMastery: 0.5,
        topicIndex: 0,
        patternIndex: 10,
        pattern: 'Some Pattern',
        actionId: 'pat_action',
      };

      const patternlessAction = {
        policyPriorityClass: 2,
        urgencyScore: 50.0,
        actionType: 'PACING_CALIBRATION',
        storedMastery: 0.5,
        topicIndex: 0,
        patternIndex: null, // patternless
        pattern: null,
        actionId: 'pacing_action',
      };

      // Tier 1 equal (2), Tier 2 equal (50.0)
      // Tier 3 candidate base weights:
      // CURRICULUM_ADVANCEMENT = 30.0, PACING_CALIBRATION = 20.0
      // To test Tier 6, match base weights using candidate with equal weights
      const equalWeightPolicy = validateCandidatePolicy({
        simulationOnly: true,
        baseWeights: {
          PREREQUISITE_REMEDIATION: 50.0,
          OVERDUE_REVISION: 45.0,
          DUE_TODAY_REVISION: 35.0,
          CURRICULUM_ADVANCEMENT: 25.0,
          EXAM_BENCHMARK: 25.0,
          PACING_CALIBRATION: 25.0, // equal to curriculum
        },
        maxMasteryDeficitWeight: 25.0,
        maxGoalImpactWeight: 15.0,
        maxTemporalWeight: 10.0,
        priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
      });

      // Now Tier 3 is equal (25.0 vs 25.0), Tier 4 equal (0.5), Tier 5 equal (0)
      // Tier 6: patternedAction (10) vs patternlessAction (Infinity)
      expect(compareCandidates(patternedAction, patternlessAction, equalWeightPolicy)).toBeLessThan(0);
    });

    it('performs Tier 7 lexical fallback: pattern name ASC -> actionId ASC', () => {
      const actionA = {
        policyPriorityClass: 2,
        urgencyScore: 50.0,
        actionType: 'EXAM_BENCHMARK',
        storedMastery: 0.5,
        topicIndex: 999999,
        patternIndex: null,
        pattern: null,
        actionId: 'nba_action_alpha',
      };

      const actionB = {
        policyPriorityClass: 2,
        urgencyScore: 50.0,
        actionType: 'EXAM_BENCHMARK',
        storedMastery: 0.5,
        topicIndex: 999999,
        patternIndex: null,
        pattern: null,
        actionId: 'nba_action_beta',
      };

      expect(compareCandidates(actionA, actionB, BASELINE_POLICY)).toBeLessThan(0);
    });
  });

  describe('4. Six Canonical Archetype Evaluations', () => {
    it('contains exactly six static archetypes with exact frozen IDs and names in canonical order', () => {
      expect(SIMULATION_ARCHETYPES.length).toBe(6);
      expect(SIMULATION_ARCHETYPES.map((a) => a.archetypeId)).toEqual([
        'arch_foundational_prerequisite_bottleneck',
        'arch_overdue_spaced_revision_debt',
        'arch_due_today_revision_pressure',
        'arch_core_curriculum_progression',
        'arch_rushing_pacing_calibration_risk',
        'arch_goal_benchmark_deadline_proximity',
      ]);
      expect(SIMULATION_ARCHETYPES.map((a) => a.name)).toEqual([
        'Foundational Prerequisite Bottleneck',
        'Overdue Spaced Revision Debt',
        'Due-Today Revision Pressure',
        'Core Curriculum Progression',
        'Rushing / Pacing Calibration Risk',
        'Goal Benchmark Deadline Proximity',
      ]);

      for (const archetype of SIMULATION_ARCHETYPES) {
        expect(archetype.candidates.length).toBeGreaterThan(0);
        for (const candidate of archetype.candidates) {
          expect(typeof candidate.actionId).toBe('string');
          expect(typeof candidate.actionType).toBe('string');
          expect(typeof candidate.actionSubtype).toBe('string');
          expect(candidate.policyPriorityClass === null || typeof candidate.policyPriorityClass === 'number').toBe(true);
          expect(candidate.storedMastery === null || typeof candidate.storedMastery === 'number').toBe(true);
          expect(typeof candidate.hasProgressEvidence).toBe('boolean');
          expect(typeof candidate.isPlanAligned).toBe('boolean');
          expect(typeof candidate.deadlineProximityBonus).toBe('number');
          expect(typeof candidate.daysOverdue).toBe('number');
          expect(candidate.topic === null || typeof candidate.topic === 'string').toBe(true);
          expect(typeof candidate.topicIndex).toBe('number');
          if (candidate.patternIndex === null) {
            expect(candidate.pattern).toBeNull();
          } else {
            expect(typeof candidate.pattern).toBe('string');
            expect(typeof candidate.patternIndex).toBe('number');
          }
        }
      }
    });

    it('evaluates all 6 static archetypes with 0 runtime database or registry dependencies', () => {
      expect(SIMULATION_ARCHETYPES.length).toBe(6);

      const comparisonResults = compareSyntheticArchetypes({
        archetypes: SIMULATION_ARCHETYPES,
        candidatePolicies: [candidatePolicy],
      });

      expect(comparisonResults.length).toBe(6);

      for (const result of comparisonResults) {
        expect(result.archetypeId).toBeDefined();
        expect(result.baselinePolicyResult.winnerActionId).toBeDefined();
        expect(result.candidatePolicyResults.length).toBe(1);

        const candResult = result.candidatePolicyResults[0];
        expect(candResult.winnerActionId).toBeDefined();
        expect(typeof candResult.actionDisagreement).toBe('boolean');
        expect(typeof candResult.winnerRankDelta).toBe('number');
        expect(Array.isArray(candResult.ranking)).toBe(true);
        expect(Array.isArray(candResult.tierMigrations)).toBe(true);
      }
    });

    it('preserves baseline results immutably across multiple candidate comparisons', () => {
      const candidateA = candidatePolicy;
      const candidateB = validateCandidatePolicy({
        simulationOnly: true,
        baseWeights: { ...BASELINE_POLICY.baseWeights, OVERDUE_REVISION: 60.0 },
        maxMasteryDeficitWeight: 25.0,
        maxGoalImpactWeight: 15.0,
        maxTemporalWeight: 10.0,
        priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
      });

      const resA = compareSyntheticArchetypes({
        archetypes: [SIMULATION_ARCHETYPES[0]],
        candidatePolicies: [candidateA],
      });

      const resBoth = compareSyntheticArchetypes({
        archetypes: [SIMULATION_ARCHETYPES[0]],
        candidatePolicies: [candidateA, candidateB],
      });

      expect(resBoth[0].baselinePolicyResult).toEqual(resA[0].baselinePolicyResult);
      expect(resBoth[0].candidatePolicyResults.length).toBe(2);
      expect(resBoth[0].candidatePolicyResults[0].winnerActionId).toBe(resA[0].candidatePolicyResults[0].winnerActionId);
    });
  });
});
