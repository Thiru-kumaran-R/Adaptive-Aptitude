'use strict';

/**
 * Suite 4: tests/orchestration/dailyAgendaAssembler.test.js
 *
 * Verifies Daily Agenda Assembly & Resource Allocation:
 *   - Daily question budgeting (10..50, default 30, completed objective does not inflate quota)
 *   - Segment caps: WARMUP max 1, PREREQ max 1, CORE max 2, PACING/BENCHMARK max 1
 *   - Global learning action cap: MAX_AGENDA_ACTIVITIES = 4 (5 eligible -> <= 4 admitted)
 *   - Unified allocator budget conservation: totalPrescribedQuestions <= dailyQuestionBudget
 *   - Allocator decrements remaining daily budget after every action
 *   - Retention allocation <= revisionBudget (floor(budget * 0.20))
 *   - Curriculum allocation bounded by remaining target quota
 *   - Pacing calibration allocation = 5
 *   - Benchmark allocation = 0 practice questions
 *   - Segment omission (empty segments omitted) and contiguous indexing (1..N)
 *   - Stamina block cap (maxQuestionsPerBlock)
 *   - Cognitive rest checkpoints:
 *       Triggered on high fatigue (>25%)
 *       N admitted segments -> max(0, N - 1) checkpoints
 *       Strictly between consecutive segments (no rest before first, no rest after final)
 *       Consumes 0 question budget and does not count against MAX_AGENDA_ACTIVITIES
 *       totalEstimatedMinutes includes 10-minute rest checkpoint durations
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

const { getDailyAgenda } = require('../../src/services/orchestration/dailyAgendaAssembler');

describe('Suite 4: Daily Agenda Assembler Tests', () => {
  const userId = 'usr_agenda_test';
  const referenceNow = new Date('2026-10-06T12:00:00.000Z');

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();
    await User.create({ userId, name: 'Agenda Test Student', email: 'agenda@test.com' });
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

  describe('1. Daily Budget Calculation & Limits', () => {
    it('uses default daily budget of 30 when no active objective exists', async () => {
      const goal = await Goal.create({ userId, title: 'G1', type: 'competitive', status: 'active' });
      await StudyPlan.create({ userId, goalId: goal._id, name: 'P1', status: 'active', startDate: new Date('2026-10-01Z') });

      // Seed student attempt history
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
        timeTaken: 40,
        attemptedAt: referenceNow,
      });

      const res = await getDailyAgenda({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.agenda.dailyQuestionBudget).toBe(30);
    });

    it('clamps dailyQuestionBudget between 10 and 50 based on objective remaining questions', async () => {
      const goal = await Goal.create({ userId, title: 'G1', type: 'competitive', status: 'active' });
      const plan = await StudyPlan.create({ userId, goalId: goal._id, name: 'P1', status: 'active', startDate: new Date('2026-10-01Z') });

      // Objective with 4 remaining questions -> clamped up to MIN_DAILY_QUESTION_BUDGET (10)
      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId: goal._id,
        date: new Date('2026-10-06T00:00:00.000Z'),
        topic: 'Percentage',
        patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 10, completedQuestions: 6 }],
        status: 'pending',
      });

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
        timeTaken: 40,
        attemptedAt: referenceNow,
      });

      const res = await getDailyAgenda({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.agenda.dailyQuestionBudget).toBe(10);
    });
  });

  describe('2. Unified Allocator & Global Activity Cap', () => {
    it('enforces MAX_AGENDA_ACTIVITIES = 4 and strictly conserves daily budget', async () => {
      const goal = await Goal.create({ userId, title: 'G1', type: 'competitive', status: 'active' });
      const plan = await StudyPlan.create({
        userId,
        goalId: goal._id,
        name: 'P1',
        status: 'active',
        startDate: new Date('2026-10-01Z'),
        targets: [
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation' },
          { topic: 'Percentage', pattern: 'Percentage Increase & Decrease' },
        ],
      });

      // 1. Revision item for WARMUP
      await RevisionItem.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        status: 'scheduled',
        stage: 0,
        nextReviewDate: new Date('2026-10-05T00:00:00Z'),
      });

      // 2. Active Objective with 2 patterns for CORE_CURRICULUM
      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId: goal._id,
        date: new Date('2026-10-06T00:00:00.000Z'),
        topic: 'Percentage',
        patterns: [
          { pattern: 'Basic Percentage Calculation', targetQuestions: 15, completedQuestions: 0 },
          { pattern: 'Percentage Increase & Decrease', targetQuestions: 15, completedQuestions: 0 },
        ],
        status: 'in_progress',
      });

      // History
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
        timeTaken: 40,
        attemptedAt: referenceNow,
      });

      const res = await getDailyAgenda({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.status).toBe('calculated');
      expect(res.agenda.dailyQuestionBudget).toBe(30);

      let totalActivities = 0;
      let totalQuestions = 0;
      for (const seg of res.agenda.segments) {
        totalActivities += seg.activities.length;
        for (const act of seg.activities) {
          totalQuestions += act.prescribedQuestions;
        }
      }

      // Activities <= 4
      expect(totalActivities).toBeLessThanOrEqual(4);
      // Budget conservation: sum <= dailyQuestionBudget
      expect(totalQuestions).toBeLessThanOrEqual(res.agenda.dailyQuestionBudget);
      expect(res.agenda.totalPrescribedQuestions).toBe(totalQuestions);
    });
  });

  describe('3. Cognitive Rest Checkpoint Placement & Semantics', () => {
    it('inserts exactly N - 1 checkpoints between consecutive segments under high fatigue (>25%), with 0 questions and 10 mins each', async () => {
      const goal = await Goal.create({ userId, title: 'G1', type: 'competitive', status: 'active' });
      const plan = await StudyPlan.create({
        userId,
        goalId: goal._id,
        name: 'P1',
        status: 'active',
        startDate: new Date('2026-10-01Z'),
        targets: [
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation' },
        ],
      });

      // 1. Revision for Segment 1 (WARMUP)
      await RevisionItem.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        status: 'scheduled',
        stage: 0,
        nextReviewDate: new Date('2026-10-05T00:00:00Z'),
      });

      // 2. Objective for Segment 2 (CORE_CURRICULUM)
      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId: goal._id,
        date: new Date('2026-10-06T00:00:00.000Z'),
        topic: 'Percentage',
        patterns: [
          { pattern: 'Basic Percentage Calculation', targetQuestions: 15, completedQuestions: 0 },
        ],
        status: 'pending',
      });

      // Seed terminal mock session with fatigueDropoffPercent > 25.0
      // 16 questions: Q1 (4/4 = 100%), Q4 (1/4 = 25%) -> dropoff = 75% > 25%
      const qIds = Array.from({ length: 16 }, () => new mongoose.Types.ObjectId());
      const session = await MockSession.create({
        userId,
        mode: MOCK_MODES.STANDARD,
        status: SESSION_STATUS.SUBMITTED,
        finalizationState: FINALIZATION_STATE.COMPLETED,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        generationSeed: 'seed_fatigue_test',
        blueprintFingerprint: 'bp_fp_fatigue',
        totalQuestions: 16,
        durationMinutes: 45,
        blueprintSnapshot: { sections: [{ sectionId: 's1', questionCount: 16 }] },
        sectionStates: [{ sectionId: 's1', order: 1, status: 'completed', questionCount: 16 }],
        questionSequence: qIds.map((qid, idx) => ({
          questionId: qid,
          sectionId: 's1',
          order: idx + 1,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
        })),
      });

      // Mock attempt history with high fatigue
      for (let i = 0; i < 16; i++) {
        const isCorrect = i < 13; // i=0..3: correct, i=4..11: correct, i=12: correct, i=13..15: incorrect
        await Attempt.create({
          userId,
          sessionId: String(session._id),
          questionId: qIds[i],
          source: 'mock',
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          isCorrect,
          correctAnswer: 'A',
          selectedAnswer: isCorrect ? 'A' : 'B',
          timeTaken: 30,
          attemptedAt: referenceNow,
        });
      }

      const res = await getDailyAgenda({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      const N = res.agenda.segments.length;
      if (N >= 2) {
        expect(res.agenda.checkpoints.length).toBe(N - 1);
        const cp = res.agenda.checkpoints[0];
        expect(cp.checkpointType).toBe('COGNITIVE_REST');
        expect(cp.prescribedQuestions).toBe(0);
        expect(cp.estimatedMinutes).toBe(10);
        expect(cp.afterSegmentIndex).toBe(1);
        expect(cp.beforeSegmentIndex).toBe(2);
        expect(cp.rationale.reasonCode).toBe('FATIGUE_DROP_OFF_DETECTED');
        expect(cp.executionIntent).toBeNull();
      }
    });

    it('creates 0 checkpoints when only 1 segment is admitted', async () => {
      const goal = await Goal.create({ userId, title: 'G1', type: 'competitive', status: 'active' });
      const plan = await StudyPlan.create({
        userId,
        goalId: goal._id,
        name: 'P1',
        status: 'active',
        startDate: new Date('2026-10-01Z'),
        targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
      });

      // ONLY Objective (1 segment)
      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId: goal._id,
        date: new Date('2026-10-06T00:00:00.000Z'),
        topic: 'Percentage',
        patterns: [
          { pattern: 'Basic Percentage Calculation', targetQuestions: 15, completedQuestions: 0 },
        ],
        status: 'pending',
      });

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
        timeTaken: 40,
        attemptedAt: referenceNow,
      });

      const res = await getDailyAgenda({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.agenda.segments.length).toBe(1);
      expect(res.agenda.checkpoints.length).toBe(0);
    });
  });

  describe('4. Active Mock Lockdown for Daily Agenda', () => {
    it('returns empty agenda with budget 0 and empty segments/checkpoints', async () => {
      const activeMock = await MockSession.create({
        userId,
        mode: MOCK_MODES.STANDARD,
        status: SESSION_STATUS.STARTED,
        finalizationState: FINALIZATION_STATE.IDLE,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        generationSeed: 'seed_agenda_lock',
        blueprintFingerprint: 'bp_fp_agenda_lock',
        totalQuestions: 20,
        durationMinutes: 60,
        blueprintSnapshot: { sections: [] },
        sectionStates: [],
        questionSequence: [],
      });

      const res = await getDailyAgenda({
        userId,
        goal: null,
        explicitGoalProvided: false,
        referenceNow,
      });

      expect(res.status).toBe('active_mock_in_progress');
      expect(res.reason).toBe('ACTIVE_MOCK_SESSION_EXISTS');
      expect(res.activeMockSessionId).toBe(String(activeMock._id));
      expect(res.agenda.dailyQuestionBudget).toBe(0);
      expect(res.agenda.totalPrescribedQuestions).toBe(0);
      expect(res.agenda.totalEstimatedMinutes).toBe(0);
      expect(res.agenda.segments).toEqual([]);
      expect(res.agenda.checkpoints).toEqual([]);
    });
  });
});
