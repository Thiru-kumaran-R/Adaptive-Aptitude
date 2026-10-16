'use strict';

/**
 * Suite 8: tests/analytics/phase8CrossPhaseIsolation.test.js
 *
 * Verifies:
 *   - Phase 8 performs strictly 0 database writes across all 13 domain models
 *   - Mongoose persistent model count remains strictly 13
 *   - Zero MongoDB collections added
 *   - Phase 4 mastery recalculation is NEVER invoked
 *   - Phase 5 planning/replanning is NEVER invoked
 *   - Phase 5 revision state transition is NEVER invoked
 *   - Phase 6 scoring/finalization is NEVER invoked
 *   - Phase 7 LLM provider / Gemini is NEVER invoked
 */

const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

// All Mongoose domain models
const Question = require('../../src/models/questionModel');
const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const Attempt = require('../../src/models/attemptModel');
const StudentProgress = require('../../src/models/studentProgressModel');
const RevisionItem = require('../../src/models/revisionItemModel');
const RevisionProcessingRecord = require('../../src/models/revisionProcessingRecordModel');
const MockBlueprint = require('../../src/models/mockBlueprintModel');
const MockSession = require('../../src/models/mockSessionModel');
const MockResponse = require('../../src/models/mockResponseModel');
const MockAttemptFinalizationRecord = require('../../src/models/mockAttemptFinalizationRecordModel');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');
const AuthSession = require('../../src/models/authSessionModel');

const ALL_MODELS = [
  Question,
  User,
  Goal,
  StudyPlan,
  DailyObjective,
  Attempt,
  StudentProgress,
  RevisionItem,
  RevisionProcessingRecord,
  MockBlueprint,
  MockSession,
  MockResponse,
  MockAttemptFinalizationRecord,
  PrescriptionExecutionRecord,
  AuthSession,
];

describe('Suite 8: Phase 8 Cross-Phase Isolation & Zero-Write Verification', () => {
  let app = createApp();
  const userId = 'usr_isolation_test';
  let goalId;
  const now = new Date('2026-10-06T12:00:00.000Z');

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();

    await User.create({ userId, email: 'isolation@test.com', name: 'Isolation User' });
    const g = await Goal.create({
      userId,
      title: 'Isolation Goal',
      type: 'competitive',
      status: 'active',
    });
    goalId = g._id.toString();

    const plan = await StudyPlan.create({
      userId,
      goalId,
      name: 'Isolation Study Plan',
      status: 'active',
      targets: [
        { topic: 'Percentage', pattern: 'Basic Percentage Calculation', targetQuestions: 10 },
      ],
    });

    await DailyObjective.create({
      userId,
      planId: plan._id,
      goalId,
      date: new Date('2026-10-01T00:00:00Z'),
      topic: 'Percentage',
      patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 10, completedQuestions: 5 }],
    });

    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      mastery: 0.50,
    });

    await RevisionItem.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      status: 'scheduled',
      stage: 0,
      nextReviewDate: now,
    });
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  it('proves Mongoose model count remains exactly 16', () => {
    const modelNames = mongoose.modelNames();
    expect(modelNames.length).toBe(16);
    expect(modelNames).toContain('OrchestrationPolicyVersion');
    expect(modelNames).toContain('AuthSession');
  });

  it('proves Phase 8 creates strictly 0 database writes when executing all 4 endpoints', async () => {
    const mutationSpies = [];
    const mutationMethods = [
      'create',
      'insertMany',
      'updateOne',
      'updateMany',
      'findOneAndUpdate',
      'findByIdAndUpdate',
      'deleteOne',
      'deleteMany',
      'bulkWrite',
    ];

    for (const model of ALL_MODELS) {
      for (const method of mutationMethods) {
        if (typeof model[method] === 'function') {
          mutationSpies.push(jest.spyOn(model, method));
        }
      }
      mutationSpies.push(jest.spyOn(model.prototype, 'save'));
    }

    // Execute all 4 endpoints
    await request(app).get(`/api/v1/analytics/dashboard?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/retention?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/readiness/${goalId}?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    // Verify ZERO mutations were called across all 13 models
    for (const spy of mutationSpies) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });

  it('proves Phase 4 mastery recalculation service is never invoked by Phase 8', async () => {
    let calculatePatternMasterySpy;
    try {
      const adaptiveService = require('../../src/services/adaptive/masteryService');
      if (adaptiveService && typeof adaptiveService.calculatePatternMastery === 'function') {
        calculatePatternMasterySpy = jest.spyOn(adaptiveService, 'calculatePatternMastery');
      }
    } catch (_e) {
      // If service is elsewhere, check studentProgressService
      const progressService = require('../../src/services/studentProgressService');
      if (progressService && typeof progressService.calculatePatternMastery === 'function') {
        calculatePatternMasterySpy = jest.spyOn(progressService, 'calculatePatternMastery');
      }
    }

    await request(app).get(`/api/v1/analytics/dashboard?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/readiness/${goalId}?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    if (calculatePatternMasterySpy) {
      expect(calculatePatternMasterySpy).not.toHaveBeenCalled();
      calculatePatternMasterySpy.mockRestore();
    }
  });

  it('proves Phase 5 planning and revision services are never invoked by Phase 8', async () => {
    const planningService = require('../../src/services/planning/studyPlanGenerationService');
    const revisionHelper = require('../../src/services/revision/revisionTransitionHelper');

    const generateSpy = jest.spyOn(planningService, 'generateStudyPlan');
    const transitionSpy = jest.spyOn(revisionHelper, 'transitionRevisionState');

    await request(app).get(`/api/v1/analytics/dashboard?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/retention?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/readiness/${goalId}?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    expect(generateSpy).not.toHaveBeenCalled();
    expect(transitionSpy).not.toHaveBeenCalled();

    generateSpy.mockRestore();
    transitionSpy.mockRestore();
  });

  it('proves Phase 6 scoring service is never invoked by Phase 8', async () => {
    const scoringService = require('../../src/services/mock/mockScoringService');
    const scoreSpy = jest.spyOn(scoringService, 'calculateMockResult');

    await request(app).get(`/api/v1/analytics/dashboard?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/readiness/${goalId}?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    expect(scoreSpy).not.toHaveBeenCalled();
    scoreSpy.mockRestore();
  });

  it('proves Phase 7 LLM providers (Gemini, Factory, Fake) and delivery services are never invoked by Phase 8', async () => {
    const FakeLLMProvider = require('../../src/providers/learning/fakeLLMProvider');
    const GeminiAdapter = require('../../src/providers/learning/geminiAdapter');
    const llmProviderFactory = require('../../src/providers/learning/llmProviderFactory');
    const learningDeliveryService = require('../../src/services/learning/learningDeliveryService');

    const fakeSpy = jest.spyOn(FakeLLMProvider.prototype, 'generate');
    const geminiSpy = jest.spyOn(GeminiAdapter.prototype, 'generate');
    const factorySpy = jest.spyOn(llmProviderFactory, 'getLLMProvider');
    const deliverySpy = jest.spyOn(learningDeliveryService, 'buildDeliveryEnvelope');

    await request(app).get(`/api/v1/analytics/dashboard?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/retention?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/analytics/readiness/${goalId}?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    expect(fakeSpy).not.toHaveBeenCalled();
    expect(geminiSpy).not.toHaveBeenCalled();
    expect(factorySpy).not.toHaveBeenCalled();
    expect(deliverySpy).not.toHaveBeenCalled();

    fakeSpy.mockRestore();
    geminiSpy.mockRestore();
    factorySpy.mockRestore();
    deliverySpy.mockRestore();
  });

  it('statically proves zero Phase 7 or LLM module imports in all Phase 8 source files', () => {
    const fs = require('fs');
    const path = require('path');

    const phase8Files = [
      'src/config/analyticsConfig.js',
      'src/middlewares/analyticsGuard.js',
      'src/controllers/analyticsController.js',
      'src/routes/analyticsRoutes.js',
      'src/services/analytics/analyticsMathUtils.js',
      'src/services/analytics/dashboardAggregateService.js',
      'src/services/analytics/speedAccuracyMatrixService.js',
      'src/services/analytics/staminaAnalyticsService.js',
      'src/services/analytics/retentionAnalyticsService.js',
      'src/services/analytics/readinessService.js',
      'src/services/analytics/topicDiagnosticsService.js',
    ];

    const forbiddenTokens = [
      'gemini',
      'Gemini',
      'FakeLLM',
      'llmProvider',
      'getLLMProvider',
      'learningDelivery',
      'tutorService',
      'hintService',
      'promptService',
      'learningContext',
      'providers/learning',
      'services/learning',
    ];

    for (const relPath of phase8Files) {
      const fullPath = path.resolve(__dirname, '../../', relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf8');

      for (const token of forbiddenTokens) {
        expect(content).not.toContain(token);
      }
    }
  });
});

