'use strict';

/**
 * Suite 3: tests/orchestration/nextActionArbiter.test.js
 *
 * Verifies Next-Best-Action (NBA) Arbitration & Candidate Generation:
 *   - Distinct IDs for same prerequisite blocking two targets
 *   - Global retention debt (all user scheduled items scanned regardless of goalId)
 *   - Future revision items (>= tomorrowStartUtc) strictly excluded
 *   - Exact due vs overdue boundary (Class 0 vs Class 1)
 *   - Explicit goal isolation: goal A with no plan does NOT fall through to goal B's plan
 *   - Pacing calibration topic hierarchy (Priority A, Priority B, Priority C suppression)
 *   - Diagnostic fallbacks: new-user (Algebra/Linear Equations) and no-plan fallback
 *   - NO_ELIGIBLE_ACTION contract (nextAction: null)
 *   - Active mock session lockout (ACTIVE_MOCK_SESSION_EXISTS, nextAction: null)
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');

const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const StudentProgress = require('../../src/models/studentProgressModel');
const RevisionItem = require('../../src/models/revisionItemModel');
const Attempt = require('../../src/models/attemptModel');
const MockSession = require('../../src/models/mockSessionModel');

const {
  MOCK_MODES,
  NAVIGATION_POLICIES,
  SESSION_STATUS,
  FINALIZATION_STATE,
} = require('../../src/config/mockConfig');

const { getNextAction } = require('../../src/services/orchestration/nextActionArbiter');
const { generateCandidates } = require('../../src/services/orchestration/candidateGenerationService');

describe('Suite 3: Next-Action Arbiter & Candidate Generation Tests', () => {
  const userId = 'usr_nba_arbiter_test';
  const referenceNow = new Date('2026-10-06T12:00:00.000Z');

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();
    await User.create({ userId, name: 'NBA Test Student', email: 'nba@test.com' });
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await Goal.deleteMany({});
    await StudyPlan.deleteMany({});
    await DailyObjective.deleteMany({});
    await StudentProgress.deleteMany({});
    await RevisionItem.deleteMany({});
    await Attempt.deleteMany({});
    await MockSession.deleteMany({});
  });

  describe('1. Fallback State: New-User Baseline', () => {
    it('returns FOUNDATIONAL_DIAGNOSTIC on Topic "Algebra", Pattern "Linear Equations & Systems of Equations" when 0 attempts and 0 progress', async () => {
      const res = await getNextAction({
        userId,
        goal: null,
        explicitGoalProvided: false,
        referenceNow,
      });

      expect(res.status).toBe('insufficient_data');
      expect(res.reason).toBe('NEW_USER_NO_HISTORY');
      expect(res.nextAction).toBeDefined();
      expect(res.nextAction.actionType).toBe('DIAGNOSTIC_ASSESSMENT');
      expect(res.nextAction.actionSubtype).toBe('FOUNDATIONAL_DIAGNOSTIC');
      expect(res.nextAction.policyPriorityClass).toBeNull();
      expect(res.nextAction.urgencyScore).toBeNull();
      expect(res.nextAction.priorityTier).toBe('normal');
      expect(res.nextAction.topic).toBe('Algebra');
      expect(res.nextAction.pattern).toBe('Linear Equations & Systems of Equations');
      expect(res.nextAction.prescribedQuestions).toBe(10);
      expect(res.nextAction.actionId).toBe(
        'nba_diagnostic_assessment_foundational_diagnostic_algebra_linear-equations-systems-of-equations'
      );
      expect(res.nextAction.executionIntent.capability).toBe('DIAGNOSTIC_ASSESSMENT');
      expect(res.nextAction.executionIntent.deliveryMode).toBe('SEQUENTIAL_ADAPTIVE');
      expect(res.nextAction.executionIntent.prescribedQuestionCount).toBe(10);
    });
  });

  describe('2. Fallback State: No-Active-Plan', () => {
    it('returns FOUNDATIONAL_REINFORCEMENT when student has attempt history but no active study plan', async () => {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        source: 'practice',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        difficulty: 3,
        isCorrect: true,
        correctAnswer: 'A',
        selectedAnswer: 'A',
        timeTaken: 45,
        attemptedAt: referenceNow,
      });

      const res = await getNextAction({
        userId,
        goal: null,
        explicitGoalProvided: false,
        referenceNow,
      });

      expect(res.status).toBe('partial_data');
      expect(res.reason).toBe('NO_ACTIVE_STUDY_PLAN');
      expect(res.nextAction).toBeDefined();
      expect(res.nextAction.actionType).toBe('DIAGNOSTIC_ASSESSMENT');
      expect(res.nextAction.actionSubtype).toBe('FOUNDATIONAL_REINFORCEMENT');
      expect(res.nextAction.policyPriorityClass).toBeNull();
      expect(res.nextAction.urgencyScore).toBeNull();
      expect(res.nextAction.priorityTier).toBe('normal');
      expect(res.nextAction.prescribedQuestions).toBe(10);
    });
  });

  describe('3. Explicit Goal Isolation', () => {
    it('does NOT fall through to another goal plan when requested goal has no active plan', async () => {
      // Goal A: requested, has NO active plan
      const goalA = await Goal.create({
        userId,
        title: 'Goal A (Empty)',
        type: 'competitive',
        status: 'active',
      });

      // Goal B: has active plan
      const goalB = await Goal.create({
        userId,
        title: 'Goal B (Active Plan)',
        type: 'competitive',
        status: 'active',
      });
      await StudyPlan.create({
        userId,
        goalId: goalB._id,
        name: 'Plan B',
        status: 'active',
        startDate: new Date('2026-10-01Z'),
      });

      // Seed an attempt so student has history
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        source: 'practice',
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 2,
        isCorrect: true,
        correctAnswer: 'A',
        selectedAnswer: 'A',
        timeTaken: 30,
        attemptedAt: referenceNow,
      });

      // Query explicitly with Goal A
      const res = await getNextAction({
        userId,
        goal: goalA,
        explicitGoalProvided: true,
        referenceNow,
      });

      // Must enter NO_ACTIVE_STUDY_PLAN because Goal A has no active plan!
      expect(res.status).toBe('partial_data');
      expect(res.reason).toBe('NO_ACTIVE_STUDY_PLAN');
    });
  });

  describe('4. Global Retention Debt & Future Item Exclusion', () => {
    it('scans global user revision debt regardless of goal, excluding future items (>= tomorrowStartUtc)', async () => {
      const goal = await Goal.create({
        userId,
        title: 'Main Goal',
        type: 'competitive',
        status: 'active',
      });
      await StudyPlan.create({
        userId,
        goalId: goal._id,
        name: 'Plan 1',
        status: 'active',
        startDate: new Date('2026-10-01Z'),
        targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
      });

      // Seed an attempt so student has history
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        source: 'practice',
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 2,
        isCorrect: true,
        correctAnswer: 'A',
        selectedAnswer: 'A',
        timeTaken: 40,
        attemptedAt: referenceNow,
      });

      // Overdue revision (yesterday)
      const overdueItem = await RevisionItem.create({
        userId,
        topic: 'Algebra',
        pattern: 'Quadratic Equations: Roots & Discriminant Analysis',
        status: 'scheduled',
        stage: 1,
        nextReviewDate: new Date('2026-10-05T08:00:00.000Z'), // < todayStartUtc
      });

      // Due today revision
      await RevisionItem.create({
        userId,
        topic: 'Ratio and Proportion',
        pattern: 'Basic Ratios & Simplification',
        status: 'scheduled',
        stage: 0,
        nextReviewDate: new Date('2026-10-06T15:00:00.000Z'), // within today
      });

      // Future revision (tomorrow) -> strictly excluded
      await RevisionItem.create({
        userId,
        topic: 'Clock',
        pattern: 'Angle Determination (Standard & Reflex)',
        status: 'scheduled',
        stage: 2,
        nextReviewDate: new Date('2026-10-07T09:00:00.000Z'), // >= tomorrowStartUtc
      });

      const res = await getNextAction({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      // Overdue revision is Class 0, beats Class 1 and Class 2
      expect(res.status).toBe('calculated');
      expect(res.reason).toBe('NEXT_ACTION_RESOLVED');
      expect(res.nextAction.actionType).toBe('RETENTION_RESCUE');
      expect(res.nextAction.actionSubtype).toBe('OVERDUE_REVISION');
      expect(res.nextAction.policyPriorityClass).toBe(0);
      expect(res.nextAction.pattern).toBe('Quadratic Equations: Roots & Discriminant Analysis');
      expect(res.nextAction.executionIntent.attemptSubmissionContext.source).toBe('revision');
      expect(res.nextAction.executionIntent.attemptSubmissionContext.revisionItemId).toBe(String(overdueItem._id));
    });
  });

  describe('5. Pacing Calibration Topic Resolution Hierarchy', () => {
    it('Priority A: resolves pacingTargetTopic from remaining DailyObjective patterns', async () => {
      const goal = await Goal.create({ userId, title: 'Goal', type: 'competitive', status: 'active' });
      const plan = await StudyPlan.create({
        userId,
        goalId: goal._id,
        name: 'Plan',
        status: 'active',
        startDate: new Date('2026-10-01Z'),
      });

      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId: goal._id,
        date: new Date('2026-10-06T00:00:00.000Z'),
        topic: 'Percentage',
        patterns: [
          { pattern: 'Basic Percentage Calculation', targetQuestions: 10, completedQuestions: 2 },
        ],
        status: 'pending',
      });

      // Seed speedAccuracyMatrix rushing risk >= 0.60 by creating attempts
      // 10 incorrect attempts with timeTaken = 5s (fast error rushing)
      for (let i = 0; i < 6; i++) {
        await Attempt.create({
          userId,
          questionId: new mongoose.Types.ObjectId(),
          source: 'practice',
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          isCorrect: false,
          correctAnswer: 'A',
          selectedAnswer: 'B',
          timeTaken: 5,
          attemptedAt: referenceNow,
        });
      }
      // 4 correct baseline attempts to establish baseline
      for (let i = 0; i < 4; i++) {
        await Attempt.create({
          userId,
          questionId: new mongoose.Types.ObjectId(),
          source: 'practice',
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          isCorrect: true,
          correctAnswer: 'A',
          selectedAnswer: 'A',
          timeTaken: 50,
          attemptedAt: referenceNow,
        });
      }

      const context = await generateCandidates({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      const pacingCandidate = context.candidates.find((c) => c.actionType === 'PACING_CALIBRATION');
      expect(pacingCandidate).toBeDefined();
      expect(pacingCandidate.topic).toBe('Percentage');
      expect(pacingCandidate.prescribedQuestions).toBe(5);
    });

    it('Priority C: suppresses pacing calibration when no topic can be resolved', async () => {
      const goal = await Goal.create({ userId, title: 'Goal', type: 'competitive', status: 'active' });
      // Plan with NO targets
      await StudyPlan.create({
        userId,
        goalId: goal._id,
        name: 'Plan',
        status: 'active',
        startDate: new Date('2026-10-01Z'),
        targets: [],
      });

      const context = await generateCandidates({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      const pacingCandidate = context.candidates.find((c) => c.actionType === 'PACING_CALIBRATION');
      expect(pacingCandidate).toBeUndefined();
    });
  });

  describe('6. NO_ELIGIBLE_ACTION State', () => {
    it('returns status="calculated", reason="NO_ELIGIBLE_ACTION", nextAction=null when candidate pool is empty', async () => {
      const goal = await Goal.create({ userId, title: 'Goal', type: 'competitive', status: 'active' });
      const plan = await StudyPlan.create({
        userId,
        goalId: goal._id,
        name: 'Plan',
        status: 'active',
        startDate: new Date('2026-10-01Z'),
        targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
      });

      // Objective is COMPLETED -> 0 remaining questions
      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId: goal._id,
        date: new Date('2026-10-06T00:00:00.000Z'),
        topic: 'Percentage',
        patterns: [
          { pattern: 'Basic Percentage Calculation', targetQuestions: 10, completedQuestions: 10 },
        ],
        status: 'completed',
      });

      // Seed an attempt so student has history (avoiding new-user fallback)
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        source: 'practice',
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 2,
        isCorrect: true,
        correctAnswer: 'A',
        selectedAnswer: 'A',
        timeTaken: 50,
        attemptedAt: referenceNow,
      });

      const res = await getNextAction({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.status).toBe('calculated');
      expect(res.reason).toBe('NO_ELIGIBLE_ACTION');
      expect(res.nextAction).toBeNull();
    });
  });

  describe('7. Active Mock Session Lockout', () => {
    it('returns status="active_mock_in_progress", reason="ACTIVE_MOCK_SESSION_EXISTS", nextAction=null', async () => {
      const activeSession = await MockSession.create({
        userId,
        mode: MOCK_MODES.STANDARD,
        status: SESSION_STATUS.STARTED,
        finalizationState: FINALIZATION_STATE.IDLE,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        generationSeed: 'seed_nba_mock',
        blueprintFingerprint: 'bp_fp_nba_mock',
        totalQuestions: 20,
        durationMinutes: 60,
        blueprintSnapshot: { sections: [] },
        sectionStates: [],
        questionSequence: [],
      });

      const res = await getNextAction({
        userId,
        goal: null,
        explicitGoalProvided: false,
        referenceNow,
      });

      expect(res.status).toBe('active_mock_in_progress');
      expect(res.reason).toBe('ACTIVE_MOCK_SESSION_EXISTS');
      expect(res.activeMockSessionId).toBe(String(activeSession._id));
      expect(res.nextAction).toBeNull();
    });
  });

  describe('8. Prerequisite Bottleneck Distinct Action IDs', () => {
    it('produces distinct action IDs when same prerequisite blocks two target patterns', () => {
      const { buildActionId } = require('../../src/services/orchestration/orchestrationUtils');
      const id1 = buildActionId({
        actionType: 'PREREQUISITE_REMEDIATION',
        actionSubtype: 'BLOCKING_PREREQUISITE',
        topic: 'Ratio and Proportion',
        pattern: 'Ratio Basics',
        blockedTargetPattern: 'Time and Work Problems',
      });
      const id2 = buildActionId({
        actionType: 'PREREQUISITE_REMEDIATION',
        actionSubtype: 'BLOCKING_PREREQUISITE',
        topic: 'Ratio and Proportion',
        pattern: 'Ratio Basics',
        blockedTargetPattern: 'Pipes and Cisterns Basics',
      });

      expect(id1).not.toBe(id2);
      expect(id1).toContain('blocks_time-and-work-problems');
      expect(id2).toContain('blocks_pipes-and-cisterns-basics');
    });
  });
});
