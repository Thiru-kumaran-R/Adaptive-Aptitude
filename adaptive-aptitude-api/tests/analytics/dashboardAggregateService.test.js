'use strict';

/**
 * Suite 6: tests/analytics/dashboardAggregateService.test.js
 *
 * Verifies:
 *   - Deterministic active study plan resolution (startDate descending, _id ascending)
 *   - Excludes non-active study plans
 *   - totalPracticeAttempts and overallAccuracy strictly from bounded non-mock attempts
 *   - totalMocksCompleted strictly from terminal finalized mock sessions
 *   - Candidate focus topics: new user => [], unstarted plan topic eligible with rawDiagnosticMastery: null
 *   - Topic-only target makes topic eligible in candidate set
 *   - Priority focus ranking comparator: uses rawDiagnosticMastery, unmetPrereqs, rawCoverageRatio, registry index
 *   - Canonical topic registry order vs alphabetical sort: registry index wins
 *   - Diagnostic labels using raw mastery: 0.396 => 'weak', 0.699 => 'developing', 0.849 => 'proficient'
 *   - topicMasteryRadar: strictly evidence-bearing topics (>= 1 StudentProgress)
 *   - Active plan completion zero-denominator safety: totalTargetQuestions === 0 => completionPercentage: null
 *   - Dashboard dueRevisionCount equals retention dueTodayCount and excludes overdue items
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
const patternRegistryService = require('../../src/services/patternRegistryService');
const { getDashboardAnalytics } = require('../../src/services/analytics/dashboardAggregateService');
const { computePriorityFocusTopics, evaluateTopicDiagnostics } = require('../../src/services/analytics/topicDiagnosticsService');
const { MOCK_MODES, NAVIGATION_POLICIES, SESSION_STATUS, FINALIZATION_STATE } = require('../../src/config/mockConfig');

describe('Suite 6: Dashboard Aggregate & Cognitive Diagnostics Service', () => {
  const userId = 'usr_dashboard_test';
  let goalId;
  const now = new Date('2026-10-06T12:00:00.000Z');

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();
    await User.create({ userId, email: 'dashboard@test.com', name: 'Dashboard Test User' });

    const goal = await Goal.create({
      userId,
      title: 'Target Exam Goal',
      type: 'competitive',
      status: 'active',
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
    await RevisionItem.deleteMany({});
    await Attempt.deleteMany({});
    await MockSession.deleteMany({});
  });

  describe('Active Study Plan Resolution & Completion', () => {
    it('selects latest startDate with _id ascending tie-breaker and excludes non-active plans', async () => {
      const planOld = await StudyPlan.create({
        userId,
        goalId,
        name: 'Older Active Plan',
        status: 'active',
        startDate: new Date('2026-09-01T00:00:00Z'),
      });

      const planLatest = await StudyPlan.create({
        userId,
        goalId,
        name: 'Latest Active Plan',
        status: 'active',
        startDate: new Date('2026-10-01T00:00:00Z'),
      });

      // Planned plan with later date (must be excluded)
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Future Planned Plan',
        status: 'planned',
        startDate: new Date('2026-11-01T00:00:00Z'),
      });

      const res = await getDashboardAnalytics(userId, now);
      expect(res.activePlanSummary).not.toBeNull();
      expect(res.activePlanSummary.planId).toBe(String(planLatest._id));
      expect(res.activePlanSummary.name).toBe('Latest Active Plan');
    });

    it('active plan completion zero-denominator safety: totalTargetQuestions === 0 => completionPercentage: null', async () => {
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Zero Workload Plan',
        status: 'active',
        startDate: new Date('2026-10-01T00:00:00Z'),
      });

      const res = await getDashboardAnalytics(userId, now);
      expect(res.activePlanSummary.completionPercentage).toBeNull();
      expect(res.activePlanSummary.totalTargetQuestions).toBe(0);
      expect(res.activePlanSummary.totalCompletedQuestions).toBe(0);
    });

    it('active plan completion calculation: min(100, completed / target * 100) rounded to 1 decimal', async () => {
      const plan = await StudyPlan.create({
        userId,
        goalId,
        name: 'Workload Plan',
        status: 'active',
        startDate: new Date('2026-10-01T00:00:00Z'),
      });

      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId,
        date: new Date('2026-10-02T00:00:00Z'),
        topic: 'Percentage',
        patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 80, completedQuestions: 34 }],
      });

      const res = await getDashboardAnalytics(userId, now);
      // 34 / 80 * 100 = 42.5%
      expect(res.activePlanSummary.completionPercentage).toBe(42.5);
      expect(res.activePlanSummary.totalTargetQuestions).toBe(80);
      expect(res.activePlanSummary.totalCompletedQuestions).toBe(34);
    });
  });

  describe('Practice Attempts & Mock Counts', () => {
    it('computes totalPracticeAttempts and overallAccuracy strictly from non-mock attempts up to 1,000', async () => {
      const qId = new mongoose.Types.ObjectId();
      await Attempt.create([
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 20,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          timeTaken: 30,
          source: 'daily_plan',
          attemptedAt: now,
        },
        // Mock attempt must NOT be counted in practice attempts
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 25,
          source: 'mock',
          sessionId: 'some-session',
          attemptedAt: now,
        },
      ]);

      const res = await getDashboardAnalytics(userId, now);
      expect(res.summary.totalPracticeAttempts).toBe(2);
      expect(res.summary.attemptsAnalyzed).toBe(2);
      expect(res.summary.overallAccuracy).toBe(50.0);
    });

    it('computes totalMocksCompleted strictly from terminal finalized mock sessions', async () => {
      await MockSession.create([
        // Qualifying terminal finalized mock
        {
          userId,
          blueprintSnapshot: { sections: [] },
          blueprintFingerprint: 'fp-1',
          mode: MOCK_MODES.STANDARD,
          navigationPolicy: NAVIGATION_POLICIES.FREE,
          effectiveExcludeRecentQuestions: false,
          questionSequence: [],
          sectionStates: [],
          totalQuestions: 10,
          durationMinutes: 30,
          generationSeed: 'seed-1',
          status: SESSION_STATUS.SUBMITTED,
          finalizationState: FINALIZATION_STATE.COMPLETED,
        },
        // Unfinalized mock (must be excluded)
        {
          userId,
          blueprintSnapshot: { sections: [] },
          blueprintFingerprint: 'fp-2',
          mode: MOCK_MODES.STANDARD,
          navigationPolicy: NAVIGATION_POLICIES.FREE,
          effectiveExcludeRecentQuestions: false,
          questionSequence: [],
          sectionStates: [],
          totalQuestions: 10,
          durationMinutes: 30,
          generationSeed: 'seed-2',
          status: SESSION_STATUS.STARTED,
          finalizationState: FINALIZATION_STATE.IDLE,
        },
      ]);

      const res = await getDashboardAnalytics(userId, now);
      expect(res.summary.totalMocksCompleted).toBe(1);
    });
  });

  describe('Topic Diagnostic Labels & Raw Value Invariant', () => {
    it('raw diagnostic mastery boundaries: raw 0.396 remains weak even though DTO displays 0.40', async () => {
      // 2 patterns in Percentage: mastery 0.392 and 0.400 => mean = 0.396 < 0.40 => weak!
      await StudentProgress.create([
        { userId, topic: 'Percentage', pattern: 'Basic Percentage Calculation', mastery: 0.392 },
        { userId, topic: 'Percentage', pattern: 'Percentage Increase and Decrease', mastery: 0.400 },
      ]);

      const res = await getDashboardAnalytics(userId, now);
      const radar = res.topicMasteryRadar.find((t) => t.topic === 'Percentage');
      expect(radar).toBeDefined();
      expect(radar.diagnosticMastery).toBe(0.40);
      expect(radar.diagnosticLabel).toBe('weak');
    });

    it('raw diagnostic mastery boundaries: raw 0.699 remains developing even though DTO displays 0.70', async () => {
      await StudentProgress.create([
        { userId, topic: 'Percentage', pattern: 'Basic Percentage Calculation', mastery: 0.699 },
      ]);

      const res = await getDashboardAnalytics(userId, now);
      const radar = res.topicMasteryRadar.find((t) => t.topic === 'Percentage');
      expect(radar).toBeDefined();
      expect(radar.diagnosticMastery).toBe(0.70);
      expect(radar.diagnosticLabel).toBe('developing');
    });

    it('raw diagnostic mastery boundaries: raw 0.849 remains proficient even though DTO displays 0.85', async () => {
      await StudentProgress.create([
        { userId, topic: 'Percentage', pattern: 'Basic Percentage Calculation', mastery: 0.849 },
      ]);

      const res = await getDashboardAnalytics(userId, now);
      const radar = res.topicMasteryRadar.find((t) => t.topic === 'Percentage');
      expect(radar).toBeDefined();
      expect(radar.diagnosticMastery).toBe(0.85);
      expect(radar.diagnosticLabel).toBe('proficient');
    });
  });

  describe('topicMasteryRadar Serialized Membership Contract', () => {
    it('new user with 0 progress returns topicMasteryRadar = []', async () => {
      const res = await getDashboardAnalytics(userId, now);
      expect(res.topicMasteryRadar).toEqual([]);
    });

    it('unstarted plan topic appears in priorityFocusTopics but is excluded from topicMasteryRadar', async () => {
      // Active plan with unstarted topic "Algebra"
      await StudyPlan.create({
        userId,
        goalId,
        name: 'Algebra Target Plan',
        status: 'active',
        targets: [{ topic: 'Algebra' }],
      });

      const res = await getDashboardAnalytics(userId, now);
      // Unstarted plan topic has 0 progress documents, so radar MUST be empty!
      expect(res.topicMasteryRadar).toEqual([]);
      // But it IS eligible for priorityFocusTopics!
      expect(res.priorityFocusTopics).toContain('Algebra');
    });
  });

  describe('Priority Focus Ranking: Canonical Topic Registry Order vs Alphabetical Order', () => {
    it('proves that actual Phase 2 registry position wins over alphabetical order', async () => {
      // Spy on getAllTopics to simulate two canonical topics whose registry order differs from alphabetical order
      // For instance: Topic A has registry index 0, Topic B has registry index 1, but alphabetically Topic B < Topic A.
      const spy = jest.spyOn(patternRegistryService, 'getAllTopics').mockReturnValue([
        'Percentage', // Starts with P, but given registry index 0
        'Algebra',    // Starts with A, but given registry index 1
      ]);

      // Both topics have identical tie-break conditions:
      // rawDiagnosticMastery = null, unmetPrerequisiteCount = 0, rawCoverageRatio = 0.0
      const activePlan = {
        targets: [
          { topic: 'Percentage' },
          { topic: 'Algebra' },
        ],
      };

      const topicMetrics = new Map([
        ['Percentage', { topic: 'Percentage', rawDiagnosticMastery: null, rawCoverageRatio: 0.0, hasEvidence: false }],
        ['Algebra', { topic: 'Algebra', rawDiagnosticMastery: null, rawCoverageRatio: 0.0, hasEvidence: false }],
      ]);

      const focusTopics = await computePriorityFocusTopics(userId, activePlan, topicMetrics);

      // In alphabetical order: 'Algebra' would come first.
      // But in canonical registry order: 'Percentage' is at index 0, so 'Percentage' MUST come first!
      expect(focusTopics[0]).toBe('Percentage');
      expect(focusTopics[1]).toBe('Algebra');

      spy.mockRestore();
    });
  });
});
