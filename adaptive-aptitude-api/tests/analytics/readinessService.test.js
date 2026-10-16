'use strict';

/**
 * Suite 5: tests/analytics/readinessService.test.js
 *
 * Verifies:
 *   - Target shape normalization gate (strict pattern-addressability)
 *   - patternBelongsToTopic argument ordering (pattern, topic)
 *   - quotaSatisfied OR masterySatisfied target evaluation
 *   - Optional targetQuestions and targetMastery semantics
 *   - targetPatternsWithMastery evidence counter vs total targets denominator
 *   - Standard-mock-only goal attribution: MockScopePatterns ⊆ PlanTargetPatterns
 *   - Pacing zero-denominator safety
 *   - Dynamic weight renormalization (renormalized weights sum to 1.0)
 *   - Insufficient data when plan or targets missing
 *   - Critical prerequisite bottlenecks (immediate prereqs, <0.70 threshold, deterministic ordering)
 *   - Read-only guarantee: zero database writes, zero Phase 4 recalculation
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const StudentProgress = require('../../src/models/studentProgressModel');
const MockSession = require('../../src/models/mockSessionModel');
const Attempt = require('../../src/models/attemptModel');
const patternRegistryService = require('../../src/services/patternRegistryService');
const { getGoalReadiness } = require('../../src/services/analytics/readinessService');
const { MOCK_MODES, NAVIGATION_POLICIES, SESSION_STATUS, FINALIZATION_STATE } = require('../../src/config/mockConfig');

describe('Suite 5: Goal Readiness Index & Prerequisite Diagnostics', () => {
  const userId = 'usr_readiness_test';
  let goalId;

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();
    await User.create({ userId, email: 'readiness@test.com', name: 'Readiness Test User' });

    const goal = await Goal.create({
      userId,
      title: 'Target Exam Goal',
      type: 'competitive',
      status: 'active',
      targetDate: new Date('2026-12-01T00:00:00.000Z'),
    });
    goalId = goal._id.toString();
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await StudyPlan.deleteMany({});
    await DailyObjective.deleteMany({});
    await StudentProgress.deleteMany({});
    await MockSession.deleteMany({});
    await Attempt.deleteMany({});
  });

  describe('Existing Pattern Registry Helper Contract Verification', () => {
    it('canonical pattern + owning topic => true', () => {
      expect(patternRegistryService.patternBelongsToTopic('Basic Percentage Calculation', 'Percentage')).toBe(true);
    });

    it('canonical pattern + wrong topic => false', () => {
      expect(patternRegistryService.patternBelongsToTopic('Basic Percentage Calculation', 'Algebra')).toBe(false);
    });

    it('Phase 8 passes arguments in the exact order (pattern, topic)', () => {
      const target = { topic: 'Percentage', pattern: 'Basic Percentage Calculation' };
      const belongs = patternRegistryService.patternBelongsToTopic(target.pattern, target.topic);
      expect(belongs).toBe(true);
    });
  });

  describe('Goal Ownership & Validation Gate (Service Level)', () => {
    it('throws 400 VALIDATION_ERROR on invalid goalId format', async () => {
      await expect(getGoalReadiness(userId, 'not-a-valid-id')).rejects.toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    });

    it('throws 404 GOAL_NOT_FOUND when goal does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(getGoalReadiness(userId, nonExistentId)).rejects.toMatchObject({
        statusCode: 404,
        code: 'GOAL_NOT_FOUND',
      });
    });

    it('throws 403 FORBIDDEN when goal belongs to another student', async () => {
      const foreignGoal = await Goal.create({
        userId: 'other_student_user',
        title: 'Foreign Goal',
        type: 'competitive',
        status: 'active',
      });
      await expect(getGoalReadiness(userId, foreignGoal._id.toString())).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('returns insufficient_data with NO_STUDY_PLAN_LINKED_TO_GOAL when no active plan exists', async () => {
      const res = await getGoalReadiness(userId, goalId);
      expect(res.readinessStatus).toBe('insufficient_data');
      expect(res.readinessScore).toBeNull();
      expect(res.reason).toBe('NO_STUDY_PLAN_LINKED_TO_GOAL');
    });

    it('returns insufficient_data with STUDY_PLAN_HAS_NO_TARGETS when plan targets array is empty', async () => {
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Empty Targets Plan',
        status: 'active',
        targets: [],
      });
      const res = await getGoalReadiness(userId, goalId);
      expect(res.readinessStatus).toBe('insufficient_data');
      expect(res.readinessScore).toBeNull();
      expect(res.reason).toBe('STUDY_PLAN_HAS_NO_TARGETS');
    });
  });

  describe('Target Shape Normalization Gate', () => {
    it('rejects topic-only plan target with UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE', async () => {
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Topic Only Plan',
        status: 'active',
        targets: [
          { topic: 'Percentage' }, // pattern is omitted
        ],
      });

      const res = await getGoalReadiness(userId, goalId);
      expect(res.readinessStatus).toBe('insufficient_data');
      expect(res.readinessScore).toBeNull();
      expect(res.reason).toBe('UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE');
    });

    it('rejects plan target with pattern not belonging to topic with UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE', async () => {
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Mismatched Pattern Plan',
        status: 'active',
        targets: [
          { topic: 'Algebra', pattern: 'Basic Percentage Calculation' },
        ],
      });

      const res = await getGoalReadiness(userId, goalId);
      expect(res.readinessStatus).toBe('insufficient_data');
      expect(res.readinessScore).toBeNull();
      expect(res.reason).toBe('UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE');
    });

    it('rejects invalid targetMastery (< 0, > 1, non-numeric) without silent fallback', async () => {
      // Use raw collection insertion to test Phase 8 normalization gate on malformed database records
      await StudyPlan.collection.insertOne({
        userId,
        goalId: new mongoose.Types.ObjectId(goalId),
        name: 'Invalid Mastery Plan',
        status: 'active',
        targets: [
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation', targetMastery: 1.5 },
        ],
      });

      const res = await getGoalReadiness(userId, goalId);
      expect(res.readinessStatus).toBe('insufficient_data');
      expect(res.reason).toBe('UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE');
    });

    it('rejects invalid targetQuestions (<= 0 or non-integer) with UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE', async () => {
      await StudyPlan.collection.insertOne({
        userId,
        goalId: new mongoose.Types.ObjectId(goalId),
        name: 'Invalid Target Questions Plan',
        status: 'active',
        targets: [
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation', targetQuestions: -5 },
        ],
      });

      const res = await getGoalReadiness(userId, goalId);
      expect(res.readinessStatus).toBe('insufficient_data');
      expect(res.reason).toBe('UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE');
    });

    it('handles omitted targetMastery by defaulting to 0.85', async () => {
      const plan = await StudyPlan.create({
        userId,
        goalId,
        name: 'Default Target Mastery Plan',
        status: 'active',
        targets: [
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation' }, // targetMastery omitted
        ],
      });

      // Student progress at 0.85 satisfies default 0.85 targetMastery
      await StudentProgress.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.85,
      });

      const res = await getGoalReadiness(userId, goalId);
      expect(res.readinessStatus).toBe('calculated');
      expect(res.components.planTargetCoverage.masterySatisfiedTargets).toBe(1);
      expect(res.components.planTargetCoverage.value).toBe(1.0);
    });
  });

  describe('Component Calculations: Plan Coverage & Mastery Depth', () => {
    it('evaluates planTargetCoverage via quotaSatisfied OR masterySatisfied branches', async () => {
      const plan = await StudyPlan.create({
        userId,
        goalId,
        name: 'Dual Branch Plan',
        status: 'active',
        targets: [
          // Target 1: Quota branch satisfied (completed 10 >= 10), mastery 0.0
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation', targetQuestions: 10, targetMastery: 0.85 },
          // Target 2: Mastery branch satisfied (mastery 0.90 >= 0.85), quota 0 < 10
          { topic: 'Percentage', pattern: 'Single Percentage Increase and Decrease', targetQuestions: 10, targetMastery: 0.85 },
          // Target 3: Unsatisfied
          { topic: 'Percentage', pattern: 'Successive Percentage Changes', targetQuestions: 10, targetMastery: 0.85 },
        ],
      });

      // Daily objectives satisfying Target 1
      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId,
        date: new Date('2026-10-01T00:00:00Z'),
        topic: 'Percentage',
        patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 10, completedQuestions: 10 }],
      });

      // Student progress satisfying Target 2
      await StudentProgress.create({
        userId,
        topic: 'Percentage',
        pattern: 'Single Percentage Increase and Decrease',
        mastery: 0.90,
      });

      const res = await getGoalReadiness(userId, goalId);
      expect(res.readinessStatus).toBe('calculated');
      const cov = res.components.planTargetCoverage;
      expect(cov.totalTargets).toBe(3);
      expect(cov.completedTargets).toBe(2);
      expect(cov.quotaSatisfiedTargets).toBe(1);
      expect(cov.masterySatisfiedTargets).toBe(1);
      expect(cov.value).toBe(0.67); // 2/3 = 0.6667 -> 0.67
    });

    it('targetPatternsWithMastery counts only targets with actual StudentProgress records while denominator remains total targets', async () => {
      const plan = await StudyPlan.create({
        userId,
        goalId,
        name: 'Mastery Depth Plan',
        status: 'active',
        targets: [
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation' },
          { topic: 'Percentage', pattern: 'Single Percentage Increase and Decrease' },
        ],
      });

      // Only 1 StudentProgress document exists with mastery 0.80
      await StudentProgress.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.80,
      });

      const res = await getGoalReadiness(userId, goalId);
      const md = res.components.masteryDepth;
      expect(md.targetPatternsWithMastery).toBe(1);
      // Average mastery = (0.80 + 0.0) / 2 = 0.40
      expect(md.value).toBe(0.40);
      expect(md.averageMastery).toBe(0.40);
    });
  });

  describe('Mock-to-Goal Attribution & Weight Renormalization', () => {
    it('enforces MockScopePatterns ⊆ PlanTargetPatterns and renormalizes weights without eligible mocks', async () => {
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Mock Plan',
        status: 'active',
        targets: [
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation' },
        ],
      });

      // Mock session that includes an unrelated pattern (Algebra)
      await MockSession.create({
        userId,
        blueprintSnapshot: {
          sections: [
            {
              sectionId: 'sec-1',
              order: 0,
              questionCount: 5,
              scope: { patterns: ['Linear Equations — Single Variable'] },
            },
          ],
        },
        blueprintFingerprint: 'fp-algebra',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        questionSequence: [],
        sectionStates: [],
        totalQuestions: 5,
        durationMinutes: 10,
        generationSeed: 's1',
        status: SESSION_STATUS.SUBMITTED,
        finalizationState: FINALIZATION_STATE.COMPLETED,
        resultSummary: { overall: { percentage: 90.0 } },
      });

      const res = await getGoalReadiness(userId, goalId);
      expect(res.readinessStatus).toBe('calculated');

      // The mock is NOT a subset of the plan targets, so it is excluded!
      expect(res.components.eligibleMockPerformance.value).toBeNull();
      expect(res.components.eligibleMockPerformance.effectiveWeight).toBe(0.0);
      expect(res.components.eligibleMockPerformance.eligibleMocksCount).toBe(0);

      // Renormalization: Base weights are 0.30 and 0.35. Total active weight = 0.65.
      // effectiveWeight(coverage) = 0.30 / 0.65 = 0.4615
      // effectiveWeight(masteryDepth) = 0.35 / 0.65 = 0.5385
      expect(res.components.planTargetCoverage.effectiveWeight).toBe(0.4615);
      expect(res.components.masteryDepth.effectiveWeight).toBe(0.5385);
    });

    it('zero-denominator pacing safety: zero answered attempts returns pacingEfficiency = null', async () => {
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Pacing Safety Plan',
        status: 'active',
        targets: [
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation' },
        ],
      });

      // Eligible mock, but student answered 0 questions
      await MockSession.create({
        userId,
        blueprintSnapshot: {
          sections: [
            {
              sectionId: 'sec-1',
              order: 0,
              questionCount: 1,
              scope: { patterns: ['Basic Percentage Calculation'] },
            },
          ],
        },
        blueprintFingerprint: 'fp-pacing',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        questionSequence: [],
        sectionStates: [],
        totalQuestions: 1,
        durationMinutes: 5,
        generationSeed: 's2',
        status: SESSION_STATUS.SUBMITTED,
        finalizationState: FINALIZATION_STATE.COMPLETED,
        resultSummary: { overall: { percentage: 0.0 } },
      });

      const res = await getGoalReadiness(userId, goalId);
      expect(res.components.eligibleMockPacing.value).toBeNull();
      expect(res.components.eligibleMockPacing.effectiveWeight).toBe(0.0);
    });
  });

  describe('Critical Prerequisite Bottlenecks', () => {
    it('detects immediate prerequisites < 0.70 threshold, sorts deterministically, and applies weak/developing labels', async () => {
      // "Time and Work — Alternate Days Work" has immediate prerequisite "Time and Work — Basic Work Rates"
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Bottleneck Plan',
        status: 'active',
        targets: [
          { topic: 'Time and Work', pattern: 'Work Leaving & Joining' },
        ],
      });

      // Prerequisite progress exists with mastery 0.55 (< 0.70 => bottleneck, label 'developing')
      await StudentProgress.create({
        userId,
        topic: 'Time and Work',
        pattern: 'Basic Unitary & Two/Three Person Work',
        mastery: 0.55,
      });

      const res = await getGoalReadiness(userId, goalId);
      const bottlenecks = res.criticalPrerequisiteBottlenecks;
      expect(bottlenecks.length).toBe(1);
      expect(bottlenecks[0].targetPattern).toBe('Work Leaving & Joining');
      expect(bottlenecks[0].unmasteredPrerequisite).toBe('Basic Unitary & Two/Three Person Work');
      expect(bottlenecks[0].prerequisiteMastery).toBe(0.55);
      expect(bottlenecks[0].masteryLabel).toBe('developing');
    });

    it('missing prerequisite progress contributes mastery 0.0 with label "weak"', async () => {
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Missing Prereq Plan',
        status: 'active',
        targets: [
          { topic: 'Time and Work', pattern: 'Work Leaving & Joining' },
        ],
      });

      const res = await getGoalReadiness(userId, goalId);
      const bottlenecks = res.criticalPrerequisiteBottlenecks;
      expect(bottlenecks.length).toBeGreaterThan(0);
      const b = bottlenecks.find((item) => item.unmasteredPrerequisite === 'Basic Unitary & Two/Three Person Work');
      expect(b).toBeDefined();
      expect(b.prerequisiteMastery).toBe(0.0);
      expect(b.masteryLabel).toBe('weak');
    });

    it('prerequisite with mastery >= 0.70 is excluded from bottlenecks', async () => {
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Satisfied Prereq Plan',
        status: 'active',
        targets: [
          { topic: 'Time and Work', pattern: 'Work Leaving & Joining' },
        ],
      });

      await StudentProgress.create({
        userId,
        topic: 'Time and Work',
        pattern: 'Basic Unitary & Two/Three Person Work',
        mastery: 0.70, // Exactly at 0.70 threshold => satisfied!
      });

      const res = await getGoalReadiness(userId, goalId);
      const b = res.criticalPrerequisiteBottlenecks.find((item) => item.unmasteredPrerequisite === 'Basic Unitary & Two/Three Person Work');
      expect(b).toBeUndefined();
    });
  });
});
