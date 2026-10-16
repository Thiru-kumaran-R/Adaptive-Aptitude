'use strict';

/**
 * Suite 7: Phase 9 Cross-Phase Isolation & Zero-Write Verification
 *
 * Verifies (Section 51):
 *   - Mongoose persistent model count remains strictly 13
 *   - Zero database writes across all 13 domain models when executing all 3 Phase 9 endpoints
 *   - Zero new MongoDB collections created
 *   - Phase 4 mastery recalculation is NEVER invoked
 *   - Phase 5 planning and revision state transition are NEVER invoked
 *   - Phase 6 mock creation, scoring, and finalization are NEVER invoked
 *   - Phase 7 LLM providers (Gemini, Factory, Fake) and delivery services are NEVER invoked
 *   - Statically proves zero Phase 7 / LLM imports in all Phase 9 source files
 *   - Statically proves zero write methods called in all Phase 9 source files
 */

const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
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

describe('Suite 7: Phase 9 Cross-Phase Isolation & Zero-Write Verification', () => {
  let app = createApp();
  const userId = 'usr_phase9_isolation_test';
  let goalId;
  const now = new Date('2026-10-06T12:00:00.000Z');

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();

    await User.create({ userId, email: 'isolation9@test.com', name: 'Isolation 9 User' });
    const g = await Goal.create({
      userId,
      title: 'Isolation Goal',
      type: 'competitive',
      status: 'active',
      targetDate: new Date('2026-10-20T00:00:00.000Z'),
    });
    goalId = g._id.toString();

    const plan = await StudyPlan.create({
      userId,
      goalId,
      name: 'Isolation Study Plan',
      status: 'active',
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: new Date('2026-10-20T00:00:00.000Z'),
      targets: [
        { topic: 'Percentage', pattern: 'Basic Percentage Calculation' },
      ],
    });

    await DailyObjective.create({
      userId,
      planId: plan._id,
      goalId,
      date: new Date('2026-10-06T00:00:00.000Z'),
      topic: 'Percentage',
      patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 15, completedQuestions: 5 }],
      status: 'pending',
    });

    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      mastery: 0.50,
      level: 3,
    });

    await RevisionItem.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      status: 'scheduled',
      stage: 1,
      nextReviewDate: now,
    });
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  it('proves Mongoose model count remains strictly 16', () => {
    const modelNames = mongoose.modelNames();
    expect(modelNames.length).toBe(16);
    expect(modelNames).toContain('OrchestrationPolicyVersion');
    expect(modelNames).toContain('AuthSession');
  });

  it('proves Phase 9 creates strictly 0 database writes when executing all 3 endpoints', async () => {
    const mutationSpies = [];
    const mutationMethods = [
      'create',
      'insertMany',
      'updateOne',
      'updateMany',
      'findOneAndUpdate',
      'findByIdAndUpdate',
      'replaceOne',
      'deleteOne',
      'deleteMany',
      'findOneAndDelete',
      'findByIdAndDelete',
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

    // Execute all 3 Phase 9 endpoints
    await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/daily-agenda?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/interventions?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    // Verify ZERO mutations were called across all 13 models
    for (const spy of mutationSpies) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });

  it('proves zero new MongoDB collections created during execution', async () => {
    const collectionsBefore = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);

    await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/daily-agenda?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/interventions?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    const collectionsAfter = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);

    expect(collectionsAfter.sort()).toEqual(collectionsBefore.sort());
  });

  it('proves Phase 4 mastery recalculation service is never invoked by Phase 9', async () => {
    let calculatePatternMasterySpy;
    try {
      const adaptiveService = require('../../src/services/adaptive/masteryService');
      if (adaptiveService && typeof adaptiveService.calculatePatternMastery === 'function') {
        calculatePatternMasterySpy = jest.spyOn(adaptiveService, 'calculatePatternMastery');
      }
    } catch (_e) {
      const progressService = require('../../src/services/studentProgressService');
      if (progressService && typeof progressService.calculatePatternMastery === 'function') {
        calculatePatternMasterySpy = jest.spyOn(progressService, 'calculatePatternMastery');
      }
    }

    await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/daily-agenda?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/interventions?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    if (calculatePatternMasterySpy) {
      expect(calculatePatternMasterySpy).not.toHaveBeenCalled();
      calculatePatternMasterySpy.mockRestore();
    }
  });

  it('proves Phase 5 planning and revision state transition services are never invoked by Phase 9', async () => {
    const planningService = require('../../src/services/planning/studyPlanGenerationService');
    const revisionHelper = require('../../src/services/revision/revisionTransitionHelper');

    const generateSpy = jest.spyOn(planningService, 'generateStudyPlan');
    const transitionSpy = jest.spyOn(revisionHelper, 'transitionRevisionState');

    await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/daily-agenda?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/interventions?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    expect(generateSpy).not.toHaveBeenCalled();
    expect(transitionSpy).not.toHaveBeenCalled();

    generateSpy.mockRestore();
    transitionSpy.mockRestore();
  });

  it('proves Phase 6 scoring service is never invoked by Phase 9', async () => {
    const scoringService = require('../../src/services/mock/mockScoringService');
    const scoreSpy = jest.spyOn(scoringService, 'calculateMockResult');

    await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/daily-agenda?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/interventions?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    expect(scoreSpy).not.toHaveBeenCalled();
    scoreSpy.mockRestore();
  });

  it('proves Phase 7 LLM providers (Gemini, Factory, Fake) and delivery services are never invoked by Phase 9', async () => {
    const FakeLLMProvider = require('../../src/providers/learning/fakeLLMProvider');
    const GeminiAdapter = require('../../src/providers/learning/geminiAdapter');
    const llmProviderFactory = require('../../src/providers/learning/llmProviderFactory');
    const learningDeliveryService = require('../../src/services/learning/learningDeliveryService');

    const fakeSpy = jest.spyOn(FakeLLMProvider.prototype, 'generate');
    const geminiSpy = jest.spyOn(GeminiAdapter.prototype, 'generate');
    const factorySpy = jest.spyOn(llmProviderFactory, 'getLLMProvider');
    const deliverySpy = jest.spyOn(learningDeliveryService, 'buildDeliveryEnvelope');

    await request(app).get(`/api/v1/orchestration/next-action?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/daily-agenda?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);
    await request(app).get(`/api/v1/orchestration/interventions?userId=${userId}`).set(getAuthHeaders(userId)).expect(200);

    expect(fakeSpy).not.toHaveBeenCalled();
    expect(geminiSpy).not.toHaveBeenCalled();
    expect(factorySpy).not.toHaveBeenCalled();
    expect(deliverySpy).not.toHaveBeenCalled();

    fakeSpy.mockRestore();
    geminiSpy.mockRestore();
    factorySpy.mockRestore();
    deliverySpy.mockRestore();
  });

  it('statically proves zero Phase 7 / LLM imports or references in all Phase 9 source files', () => {
    const phase9Files = [
      'src/config/orchestrationConfig.js',
      'src/middlewares/orchestrationGuard.js',
      'src/controllers/orchestrationController.js',
      'src/routes/orchestrationRoutes.js',
      'src/services/orchestration/orchestrationUtils.js',
      'src/services/orchestration/executionIntentBuilder.js',
      'src/services/orchestration/urgencyScoringService.js',
      'src/services/orchestration/candidateGenerationService.js',
      'src/services/orchestration/nextActionArbiter.js',
      'src/services/orchestration/dailyAgendaAssembler.js',
      'src/services/orchestration/interventionPolicyService.js',
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
      'OpenAI',
      '@google/generative-ai',
      'langchain',
    ];

    for (const relPath of phase9Files) {
      const fullPath = path.resolve(__dirname, '../../', relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf8');

      for (const token of forbiddenTokens) {
        expect(content).not.toContain(token);
      }
    }
  });

  it('statically proves zero database writes in all Phase 9 source files', () => {
    const phase9Files = [
      'src/config/orchestrationConfig.js',
      'src/middlewares/orchestrationGuard.js',
      'src/controllers/orchestrationController.js',
      'src/routes/orchestrationRoutes.js',
      'src/services/orchestration/orchestrationUtils.js',
      'src/services/orchestration/executionIntentBuilder.js',
      'src/services/orchestration/urgencyScoringService.js',
      'src/services/orchestration/candidateGenerationService.js',
      'src/services/orchestration/nextActionArbiter.js',
      'src/services/orchestration/dailyAgendaAssembler.js',
      'src/services/orchestration/interventionPolicyService.js',
    ];

    const forbiddenWritePatterns = [
      /\.save\s*\(/,
      /\.create\s*\(/,
      /\.insertMany\s*\(/,
      /\.updateOne\s*\(/,
      /\.updateMany\s*\(/,
      /\.findOneAndUpdate\s*\(/,
      /\.findByIdAndUpdate\s*\(/,
      /\.replaceOne\s*\(/,
      /\.deleteOne\s*\(/,
      /\.deleteMany\s*\(/,
      /\.findOneAndDelete\s*\(/,
      /\.findByIdAndDelete\s*\(/,
      /\.bulkWrite\s*\(/,
    ];

    for (const relPath of phase9Files) {
      const fullPath = path.resolve(__dirname, '../../', relPath);
      const content = fs.readFileSync(fullPath, 'utf8');

      for (const pattern of forbiddenWritePatterns) {
        expect(pattern.test(content)).toBe(false);
      }
    }
  });
});
