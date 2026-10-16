'use strict';

/**
 * Suite 6: Orchestration REST API Integration Tests — Phase 9
 *
 * Verifies (Section 50):
 *   - Supertest all 3 endpoints:
 *       GET /api/v1/orchestration/next-action
 *       GET /api/v1/orchestration/daily-agenda
 *       GET /api/v1/orchestration/interventions
 *   - Success envelope: { success: true, data, meta: { referenceNow } }
 *   - Query validation & error contracts (400, 403, 404, 409)
 *   - Fallback states:
 *       New user -> DIAGNOSTIC_ASSESSMENT / FOUNDATIONAL_DIAGNOSTIC
 *       No active plan -> FOUNDATIONAL_REINFORCEMENT
 *   - Active mock session state on all 3 endpoints
 *   - Execution intent shapes (AdaptivePracticeIntent, RevisionPracticeIntent, MockAssessmentIntent, DiagnosticAssessmentIntent)
 *   - Checkpoint DTO shape
 *   - Field nullability & exact enums
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

const readinessService = require('../../src/services/analytics/readinessService');
const speedAccuracyMatrixService = require('../../src/services/analytics/speedAccuracyMatrixService');
const staminaAnalyticsService = require('../../src/services/analytics/staminaAnalyticsService');
const nextActionArbiter = require('../../src/services/orchestration/nextActionArbiter');
const dailyAgendaAssembler = require('../../src/services/orchestration/dailyAgendaAssembler');
const interventionPolicyService = require('../../src/services/orchestration/interventionPolicyService');

const {
  ACTION_TYPES,
  ACTION_SUBTYPES,
  POLICY_CLASSES,
  PRIORITY_TIERS,
  ORCHESTRATION_ERROR_CODES,
} = require('../../src/config/orchestrationConfig');
const {
  MOCK_MODES,
  NAVIGATION_POLICIES,
  SESSION_STATUS,
  FINALIZATION_STATE,
} = require('../../src/config/mockConfig');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Suite 6: Orchestration REST API Integration Tests', () => {
  let app;
  const userId = 'usr_orchestration_api_test';
  const otherUserId = 'usr_other_test';

  beforeAll(async () => {
    app = createApp();
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearAllTestCollections();
    await User.create({ userId, name: 'Orchestration API User' });
    await User.create({ userId: otherUserId, name: 'Other User' });
    jest.restoreAllMocks();
  });

  describe('1. Query Validation & Error Contracts Across All 3 Endpoints', () => {
    const endpoints = [
      '/api/v1/orchestration/next-action',
      '/api/v1/orchestration/daily-agenda',
      '/api/v1/orchestration/interventions',
    ];

    test.each(endpoints)('%s returns 400 when userId is missing or blank', async (endpoint) => {
      const resMissing = await request(app).get(endpoint).set(getAuthHeaders(userId));
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.error.code).toBe('VALIDATION_ERROR');

      const resBlank = await request(app).get(`${endpoint}?userId=   `).set(getAuthHeaders(userId));
      expect(resBlank.status).toBe(400);
      expect(resBlank.body.error.code).toBe('VALIDATION_ERROR');
    });

    test.each(endpoints)('%s returns 404 when userId is not found', async (endpoint) => {
      const res = await request(app).get(`${endpoint}?userId=non_existent_user`).set(getAuthHeaders('non_existent_user'));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    test.each(endpoints)('%s returns 400 for malformed goalId', async (endpoint) => {
      const res = await request(app).get(`${endpoint}?userId=${userId}&goalId=not-a-valid-objectid`).set(getAuthHeaders(userId));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test.each(endpoints)('%s returns 404 when goalId does not exist', async (endpoint) => {
      const nonExistentGoalId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`${endpoint}?userId=${userId}&goalId=${nonExistentGoalId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('GOAL_NOT_FOUND');
    });

    test.each(endpoints)('%s returns 403 when goalId belongs to another user', async (endpoint) => {
      const foreignGoal = await Goal.create({
        userId: otherUserId,
        title: 'Foreign Goal',
        type: 'competitive',
        targetDate: new Date('2026-12-01T00:00:00Z'),
        status: 'active',
      });

      const res = await request(app).get(`${endpoint}?userId=${userId}&goalId=${foreignGoal._id}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(403);
      expect(['FORBIDDEN', 'OWNERSHIP_VIOLATION']).toContain(res.body.error.code);
    });

    test.each(endpoints)('%s returns 409 when mock finalization is in progress', async (endpoint) => {
      await MockSession.create({
        userId,
        mode: MOCK_MODES.STANDARD,
        status: SESSION_STATUS.SUBMITTED,
        finalizationState: FINALIZATION_STATE.IN_PROGRESS,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        generationSeed: 'seed_finalizing',
        blueprintFingerprint: 'bp_fp_finalizing',
        totalQuestions: 10,
        durationMinutes: 30,
        blueprintSnapshot: { sections: [] },
        sectionStates: [],
        questionSequence: [
          {
            questionId: new mongoose.Types.ObjectId(),
            sectionId: 's1',
            order: 1,
            topic: 'Algebra',
            pattern: 'Linear Equations & Systems of Equations',
            difficulty: 1,
          },
        ],
      });

      const res = await request(app).get(`${endpoint}?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');
    });
  });

  describe('2. Success Envelope & Single ReferenceNow Verification', () => {
    it('returns standard success envelope with meta.referenceNow on next-action', async () => {
      const res = await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(new Date(res.body.meta.referenceNow).toISOString()).toBe(res.body.meta.referenceNow);
    });

    it('returns standard success envelope on daily-agenda and interventions', async () => {
      const resAgenda = await request(app).get(`/api/v1/orchestration/daily-agenda?userId=${userId}`).set(getAuthHeaders(userId));
      expect(resAgenda.status).toBe(200);
      expect(resAgenda.body.success).toBe(true);
      expect(resAgenda.body.data.agenda).toBeDefined();
      expect(resAgenda.body.data.agenda.segments).toBeInstanceOf(Array);
      expect(resAgenda.body.data.agenda.checkpoints).toBeInstanceOf(Array);

      const resIntv = await request(app).get(`/api/v1/orchestration/interventions?userId=${userId}`).set(getAuthHeaders(userId));
      expect(resIntv.status).toBe(200);
      expect(resIntv.body.success).toBe(true);
      expect(resIntv.body.data.interventions).toBeInstanceOf(Array);
    });
  });

  describe('3. Diagnostic Fallbacks (New User & No Active Plan)', () => {
    it('returns brand new student fallback (Algebra foundational diagnostic)', async () => {
      const res = await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.status).toBe('insufficient_data');
      expect(data.reason).toBe('NEW_USER_NO_HISTORY');
      expect(data.nextAction).not.toBeNull();
      expect(data.nextAction.actionType).toBe(ACTION_TYPES.DIAGNOSTIC_ASSESSMENT);
      expect(data.nextAction.actionSubtype).toBe(ACTION_SUBTYPES.FOUNDATIONAL_DIAGNOSTIC);
      expect(data.nextAction.topic).toBe('Algebra');
      expect(data.nextAction.pattern).toBe('Linear Equations & Systems of Equations');
      expect(data.nextAction.urgencyScore).toBeNull();
      expect(data.nextAction.policyPriorityClass).toBeNull();
      expect(data.nextAction.priorityTier).toBe(PRIORITY_TIERS.NORMAL);

      // Verify executionIntent for DiagnosticAssessmentIntent
      const intent = data.nextAction.executionIntent;
      expect(intent.capability).toBe('DIAGNOSTIC_ASSESSMENT');
      expect(intent.deliveryMode).toBe('SEQUENTIAL_ADAPTIVE');
      expect(intent.questionDelivery.endpoint).toBe('/api/v1/adaptive/next-question');
      expect(intent.attemptSubmissionContext.endpoint).toBe('/api/v1/attempts');
      expect(intent.prescribedQuestionCount).toBe(10);
    });

    it('returns no-active-plan fallback when student has attempts but no study plan', async () => {
      // Seed an attempt so student is not "brand new"
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        source: 'practice',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        difficulty: 1,
        isCorrect: true,
        correctAnswer: 'A',
        selectedAnswer: 'A',
        timeTaken: 45,
        attemptedAt: new Date(),
      });

      const res = await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.status).toBe('partial_data');
      expect(data.reason).toBe('NO_ACTIVE_STUDY_PLAN');
      expect(data.nextAction.actionType).toBe(ACTION_TYPES.DIAGNOSTIC_ASSESSMENT);
      expect(data.nextAction.actionSubtype).toBe(ACTION_SUBTYPES.FOUNDATIONAL_REINFORCEMENT);
      expect(data.nextAction.urgencyScore).toBeNull();
      expect(data.nextAction.policyPriorityClass).toBeNull();
    });
  });

  describe('4. Active Mock Session Lockdown', () => {
    beforeEach(async () => {
      await MockSession.create({
        userId,
        mode: MOCK_MODES.STANDARD,
        status: SESSION_STATUS.STARTED,
        finalizationState: FINALIZATION_STATE.IDLE,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        generationSeed: 'seed_lockdown',
        blueprintFingerprint: 'bp_fp_lockdown',
        totalQuestions: 10,
        durationMinutes: 30,
        blueprintSnapshot: { sections: [] },
        sectionStates: [],
        questionSequence: [
          {
            questionId: new mongoose.Types.ObjectId(),
            sectionId: 's1',
            order: 1,
            topic: 'Algebra',
            pattern: 'Linear Equations & Systems of Equations',
            difficulty: 1,
          },
        ],
      });
    });

    it('locks next-action returning active_mock_in_progress with null nextAction', async () => {
      const res = await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.status).toBe('active_mock_in_progress');
      expect(data.reason).toBe('ACTIVE_MOCK_SESSION_EXISTS');
      expect(data.activeMockSessionId).toBeDefined();
      expect(data.nextAction).toBeNull();
    });

    it('locks daily-agenda returning zero budget and empty arrays', async () => {
      const res = await request(app).get(`/api/v1/orchestration/daily-agenda?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.status).toBe('active_mock_in_progress');
      expect(data.agenda.dailyQuestionBudget).toBe(0);
      expect(data.agenda.totalPrescribedQuestions).toBe(0);
      expect(data.agenda.totalEstimatedMinutes).toBe(0);
      expect(data.agenda.segments).toEqual([]);
      expect(data.agenda.checkpoints).toEqual([]);
    });

    it('keeps interventions observable during active mock session', async () => {
      const res = await request(app).get(`/api/v1/orchestration/interventions?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('calculated');
      expect(res.body.data.interventions).toBeInstanceOf(Array);
    });
  });

  describe('5. Normal Operating State: NBA and Daily Agenda Execution Intents', () => {
    it('returns CURRICULUM_ADVANCEMENT next-action with AdaptivePracticeIntent', async () => {
      // Seed prior progress so student is not brand new
      await StudentProgress.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.40,
        level: 2,
      });

      const goal = await Goal.create({
        userId,
        title: 'Gate 2026',
        type: 'competitive',
        targetDate: new Date('2026-11-20T00:00:00Z'),
        status: 'active',
      });

      const plan = await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-11-20T00:00:00Z'),
        status: 'active',
        targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
      });

      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId: goal._id,
        date: new Date(),
        topic: 'Percentage',
        patterns: [
          { pattern: 'Basic Percentage Calculation', targetQuestions: 15, completedQuestions: 0 },
        ],
        status: 'pending',
      });

      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [],
      });
      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.1, medianTimeCorrectSeconds: 60 },
      });
      jest.spyOn(staminaAnalyticsService, 'getStaminaCurve').mockResolvedValue({
        staminaCurve: null,
      });

      const res = await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.status).toBe('calculated');
      expect(data.nextAction.actionType).toBe(ACTION_TYPES.CURRICULUM_ADVANCEMENT);
      expect(data.nextAction.actionSubtype).toBe(ACTION_SUBTYPES.DAILY_OBJECTIVE_TARGET);
      expect(data.nextAction.policyPriorityClass).toBe(POLICY_CLASSES.CLASS_2);
      expect(typeof data.nextAction.urgencyScore).toBe('number');

      // Verify AdaptivePracticeIntent shape
      const intent = data.nextAction.executionIntent;
      expect(intent.capability).toBe('ADAPTIVE_PRACTICE');
      expect(intent.questionDelivery.endpoint).toBe('/api/v1/adaptive/next-question');
      expect(intent.attemptSubmissionContext.endpoint).toBe('/api/v1/attempts');
      expect(intent.questionDelivery.params.topic).toBe('Percentage');
      expect(intent.questionDelivery.params.pattern).toBe('Basic Percentage Calculation');
    });

    it('returns RETENTION_RESCUE with RevisionPracticeIntent preserving source and revisionItemId', async () => {
      // Seed prior progress
      await StudentProgress.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.50,
        level: 3,
      });

      const goal = await Goal.create({
        userId,
        title: 'Target Goal',
        type: 'competitive',
        targetDate: new Date('2026-11-20T00:00:00Z'),
        status: 'active',
      });

      await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-11-20T00:00:00Z'),
        status: 'active',
        targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
      });

      const revItem = await RevisionItem.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        currentStage: 1,
        status: 'scheduled',
        nextReviewDate: new Date('2026-10-01T00:00:00Z'), // overdue
      });

      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [],
      });
      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.1 },
      });

      const res = await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.nextAction.actionType).toBe(ACTION_TYPES.RETENTION_RESCUE);
      expect(data.nextAction.actionSubtype).toBe(ACTION_SUBTYPES.OVERDUE_REVISION);
      expect(data.nextAction.policyPriorityClass).toBe(POLICY_CLASSES.CLASS_0);

      // Verify RevisionPracticeIntent shape
      const intent = data.nextAction.executionIntent;
      expect(intent.capability).toBe('REVISION_PRACTICE');
      expect(intent.source || intent.attemptSubmissionContext.source).toBe('revision');
      expect(intent.revisionItemId).toBe(revItem._id.toString());
      expect(intent.questionDelivery.endpoint).toBe('/api/v1/adaptive/next-question');
      expect(intent.attemptSubmissionContext.endpoint).toBe('/api/v1/attempts');
    });

    it('returns EXAM_BENCHMARK with MockAssessmentIntent requiring blueprint selection', async () => {
      // Seed prior progress
      await StudentProgress.create({
        userId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.85,
        level: 5,
      });

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7); // 7 days away (< 14 days)

      const goal = await Goal.create({
        userId,
        title: 'Target Exam Mock',
        type: 'competitive',
        targetDate,
        status: 'active',
      });

      await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: targetDate,
        status: 'active',
        targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
      });

      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        readinessStatus: 'calibrated',
        criticalPrerequisiteBottlenecks: [],
        components: {
          eligibleMockPerformance: {
            eligibleMocksCount: 0,
          },
        },
      });
      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.1 },
      });

      const res = await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.nextAction.actionType).toBe(ACTION_TYPES.EXAM_BENCHMARK);
      expect(data.nextAction.actionSubtype).toBe(ACTION_SUBTYPES.GOAL_BENCHMARK_MOCK);

      // Verify MockAssessmentIntent
      const intent = data.nextAction.executionIntent;
      expect(intent.capability).toBe('MOCK_ASSESSMENT');
      expect(intent.goalId).toBe(goal._id.toString());
      expect(intent.requiresBlueprintSelection).toBe(true);
      expect(intent.targetEndpoint).toBeNull();
      expect(intent.estimatedDurationMinutes).toBeNull();
    });
  });

  describe('6. Internal Calculation Failures (500 ORCHESTRATION_CALCULATION_FAILED)', () => {
    it('GET /api/v1/orchestration/next-action returns 500 ORCHESTRATION_CALCULATION_FAILED on internal error', async () => {
      jest.spyOn(nextActionArbiter, 'getNextAction').mockRejectedValueOnce(new Error('Unexpected calculation crash'));

      const res = await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe(ORCHESTRATION_ERROR_CODES.ORCHESTRATION_CALCULATION_FAILED);
    });

    it('GET /api/v1/orchestration/daily-agenda returns 500 ORCHESTRATION_CALCULATION_FAILED on internal error', async () => {
      jest.spyOn(dailyAgendaAssembler, 'getDailyAgenda').mockRejectedValueOnce(new Error('Unexpected agenda crash'));

      const res = await request(app).get(`/api/v1/orchestration/daily-agenda?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe(ORCHESTRATION_ERROR_CODES.ORCHESTRATION_CALCULATION_FAILED);
    });

    it('GET /api/v1/orchestration/interventions returns 500 ORCHESTRATION_CALCULATION_FAILED on internal error', async () => {
      jest.spyOn(interventionPolicyService, 'getInterventions').mockRejectedValueOnce(new Error('Unexpected intervention crash'));

      const res = await request(app).get(`/api/v1/orchestration/interventions?userId=${userId}`).set(getAuthHeaders(userId));
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe(ORCHESTRATION_ERROR_CODES.ORCHESTRATION_CALCULATION_FAILED);
    });
  });
});
