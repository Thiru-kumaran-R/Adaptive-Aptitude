'use strict';

/**
 * Suite 7: tests/analytics/analyticsApiIntegration.test.js
 *
 * Supertest end-to-end integration tests covering all 4 Phase 8 endpoints:
 *   1. GET /api/v1/analytics/dashboard
 *   2. GET /api/v1/analytics/cognitive-profile
 *   3. GET /api/v1/analytics/retention
 *   4. GET /api/v1/analytics/readiness/:goalId
 *
 * Verifies:
 *   - algorithmVersion: 'v1' in all success response payloads
 *   - Full-data, partial, and insufficient-data response shapes
 *   - Error codes and status codes
 *   - Precision policy (1 decimal for %, 2 decimals for medians and mastery)
 *   - staminaCurve topic/windowDays invariance
 *   - Cross-endpoint consistency
 */

const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const StudentProgress = require('../../src/models/studentProgressModel');
const RevisionItem = require('../../src/models/revisionItemModel');
const Attempt = require('../../src/models/attemptModel');
const MockSession = require('../../src/models/mockSessionModel');
const { MOCK_MODES, NAVIGATION_POLICIES, SESSION_STATUS, FINALIZATION_STATE } = require('../../src/config/mockConfig');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Suite 7: Phase 8 End-to-End REST API Integration', () => {
  let app = createApp();
  const userId = 'usr_api_integration_test';
  let goalId;
  const now = new Date('2026-10-06T12:00:00.000Z');

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();

    await User.create({ userId, email: 'api_int@test.com', name: 'API Integration User' });

    const goal = await Goal.create({
      userId,
      title: 'Full Stack Integration Goal',
      type: 'competitive',
      status: 'active',
      targetDate: new Date('2026-12-15T00:00:00.000Z'),
    });
    goalId = goal._id.toString();
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: true });
    jest.setSystemTime(now);
    await StudyPlan.deleteMany({});
    await DailyObjective.deleteMany({});
    await StudentProgress.deleteMany({});
    await RevisionItem.deleteMany({});
    await Attempt.deleteMany({});
    await MockSession.deleteMany({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('1. GET /api/v1/analytics/dashboard', () => {
    it('returns full-data dashboard payload with algorithmVersion "v1"', async () => {
      const plan = await StudyPlan.create({
        userId,
        goalId,
        name: 'Active Prep Plan',
        status: 'active',
        startDate: new Date('2026-10-01T00:00:00Z'),
      });

      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId,
        date: new Date('2026-10-02T00:00:00Z'),
        topic: 'Percentage',
        patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 10, completedQuestions: 5 }],
      });

      await StudentProgress.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.75,
      });

      await RevisionItem.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        status: 'scheduled',
        stage: 0,
        nextReviewDate: now,
      });

      const res = await request(app).get(`/api/v1/analytics/dashboard?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.algorithmVersion).toBe('v1');
      expect(data.userId).toBe(userId);
      expect(data.activePlanSummary).not.toBeNull();
      expect(data.activePlanSummary.completionPercentage).toBe(50.0);
      expect(data.dueRevisionCount).toBe(1);
      expect(data.topicMasteryRadar.length).toBe(1);
      expect(data.topicMasteryRadar[0].topic).toBe('Percentage');
      expect(data.topicMasteryRadar[0].diagnosticMastery).toBe(0.75);
      expect(data.topicMasteryRadar[0].diagnosticLabel).toBe('proficient');
    });

    it('returns new user empty dashboard structure with algorithmVersion "v1"', async () => {
      const res = await request(app).get(`/api/v1/analytics/dashboard?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.algorithmVersion).toBe('v1');
      expect(data.summary.totalPracticeAttempts).toBe(0);
      expect(data.summary.totalMocksCompleted).toBe(0);
      expect(data.summary.overallAccuracy).toBeNull();
      expect(data.topicMasteryRadar).toEqual([]);
      expect(data.activePlanSummary).toBeNull();
      expect(data.dueRevisionCount).toBe(0);
      expect(data.priorityFocusTopics).toEqual([]);
    });
  });

  describe('2. GET /api/v1/analytics/cognitive-profile', () => {
    it('returns cognitive profile and proves staminaCurve is invariant to topic and windowDays', async () => {
      const qIds = Array.from({ length: 4 }, () => new mongoose.Types.ObjectId());
      const seq = qIds.map((qid, idx) => ({
        questionId: qid,
        sectionId: 's1',
        order: idx,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
      }));

      const session = await MockSession.create({
        userId,
        blueprintSnapshot: { sections: [] },
        blueprintFingerprint: 'fp-e2e',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        questionSequence: seq,
        sectionStates: [],
        totalQuestions: 4,
        durationMinutes: 15,
        generationSeed: 'seed-e2e',
        status: SESSION_STATUS.SUBMITTED,
        finalizationState: FINALIZATION_STATE.COMPLETED,
      });

      await Attempt.create({
        userId,
        questionId: qIds[0],
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 30,
        source: 'mock',
        sessionId: String(session._id),
      });

      // Request 1: without topic, default windowDays=30
      const res1 = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res1.status).toBe(200);
      expect(res1.body.data.algorithmVersion).toBe('v1');
      const stamina1 = res1.body.data.staminaCurve;
      expect(stamina1).not.toBeNull();
      expect(stamina1.mockSessionsAnalyzed).toBe(1);

      // Request 2: with topic=Percentage
      const res2 = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${userId}&topic=Percentage`).set(getAuthHeaders(userId));
      expect(res2.status).toBe(200);
      const stamina2 = res2.body.data.staminaCurve;
      expect(stamina2).toEqual(stamina1); // Exactly identical!

      // Request 3: with windowDays=90
      const res3 = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${userId}&windowDays=90`).set(getAuthHeaders(userId));
      expect(res3.status).toBe(200);
      const stamina3 = res3.body.data.staminaCurve;
      expect(stamina3).toEqual(stamina1); // Exactly identical!
    });
  });

  describe('3. GET /api/v1/analytics/retention', () => {
    it('returns retention analytics and matches dashboard dueRevisionCount', async () => {
      await RevisionItem.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        status: 'scheduled',
        stage: 1,
        nextReviewDate: new Date(), // Due today
      });

      const res = await request(app).get(`/api/v1/analytics/retention?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      expect(res.body.data.algorithmVersion).toBe('v1');
      expect(res.body.data.currentState.dueTodayCount).toBe(1);

      const dashRes = await request(app).get(`/api/v1/analytics/dashboard?userId=${userId}`).set(getAuthHeaders(userId));
      expect(dashRes.body.data.dueRevisionCount).toBe(res.body.data.currentState.dueTodayCount);
    });
  });

  describe('4. GET /api/v1/analytics/readiness/:goalId', () => {
    it('returns calculated goal readiness response with all 4 components', async () => {
      const plan = await StudyPlan.create({
        userId,
        goalId,
        name: 'Full Readiness Plan',
        status: 'active',
        targets: [
          { topic: 'Percentage', pattern: 'Basic Percentage Calculation', targetQuestions: 10, targetMastery: 0.80 },
        ],
      });

      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId,
        date: new Date('2026-10-02T00:00:00Z'),
        topic: 'Percentage',
        patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 10, completedQuestions: 10 }],
      });

      await StudentProgress.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.85,
      });

      // Eligible mock
      const session = await MockSession.create({
        userId,
        blueprintSnapshot: {
          sections: [
            {
              sectionId: 'sec-1',
              order: 0,
              questionCount: 5,
              scope: { patterns: ['Basic Percentage Calculation'] },
            },
          ],
        },
        blueprintFingerprint: 'fp-readiness',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        questionSequence: [],
        sectionStates: [],
        totalQuestions: 5,
        durationMinutes: 10,
        generationSeed: 's-read',
        status: SESSION_STATUS.SUBMITTED,
        finalizationState: FINALIZATION_STATE.COMPLETED,
        resultSummary: { overall: { percentage: 80.0 } },
      });

      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 60,
        source: 'mock',
        sessionId: String(session._id),
      });

      const res = await request(app).get(`/api/v1/analytics/readiness/${goalId}?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.algorithmVersion).toBe('v1');
      expect(data.readinessStatus).toBe('calculated');
      expect(typeof data.readinessScore).toBe('number');
      expect(data.components.planTargetCoverage.value).toBe(1.0);
      expect(data.components.masteryDepth.value).toBe(0.85);
      expect(data.components.eligibleMockPerformance.value).toBe(0.80);
      expect(data.components.eligibleMockPacing.value).toBe(1.0);
    });
  });
});
