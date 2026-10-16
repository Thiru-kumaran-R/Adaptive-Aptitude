'use strict';

const mongoose = require('mongoose');
const request = require('supertest');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const Question = require('../../src/models/questionModel');
const Attempt = require('../../src/models/attemptModel');
const StudentProgress = require('../../src/models/studentProgressModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const RevisionItem = require('../../src/models/revisionItemModel');
const RevisionProcessingRecord = require('../../src/models/revisionProcessingRecordModel');
const MockBlueprint = require('../../src/models/mockBlueprintModel');
const MockSession = require('../../src/models/mockSessionModel');
const MockResponse = require('../../src/models/mockResponseModel');
const MockAttemptFinalizationRecord = require('../../src/models/mockAttemptFinalizationRecordModel');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');
const User = require('../../src/models/userModel');
const { normalizeLogicalDate } = require('../../src/utils/dateUtils');
const { resetRateLimits } = require('../../src/utils/learning/rateLimiter');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Phase 7: Cross-Phase Read-Only Isolation & Model Count Verification', () => {
  let app;
  const originalEnv = { ...process.env };
  const userId = 'iso_student_1';
  let sampleQuestion;
  let sampleAttempt;
  let samplePlan;
  let sampleMockSession;
  const targetDateStr = '2026-10-15';

  beforeAll(async () => {
    await connectTestDB();
    app = createApp();
  });

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearAllTestCollections();
    resetRateLimits();
    process.env = { ...originalEnv };
    process.env.LEARNING_LLM_PROVIDER = 'fake';

    await User.create({ userId, name: 'Iso Student' });

    sampleQuestion = await Question.create({
      question: 'A price increases by 20% and then decreases by 20%. What is the net change?',
      answer: '4% decrease',
      options: ['No change', '4% decrease', '4% increase', '2% decrease'],
      explanation: 'Net change = 20 - 20 - (20×20)/100 = -4%. So 4% decrease.',
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      difficulty: 5,
    });

    sampleAttempt = await Attempt.create({
      userId,
      questionId: sampleQuestion._id,
      topic: sampleQuestion.topic,
      pattern: sampleQuestion.pattern,
      difficulty: sampleQuestion.difficulty,
      selectedAnswer: '4% decrease',
      correctAnswer: sampleQuestion.answer,
      isCorrect: true,
      timeTaken: 30,
      source: 'practice',
      attemptedAt: new Date(),
    });

    await StudentProgress.create({
      userId,
      topic: sampleQuestion.topic,
      pattern: sampleQuestion.pattern,
      attempts: 5,
      correct: 4,
      incorrect: 1,
      accuracy: 80,
      totalTimeSpent: 150,
      averageTime: 30,
      consecutiveCorrect: 2,
      consecutiveIncorrect: 0,
      mastery: 0.75,
      lastAttemptAt: new Date(),
    });

    const goal = await Goal.create({
      userId,
      title: 'Target Exam',
      type: 'entrance',
      targetDate: new Date('2026-12-31'),
    });

    samplePlan = await StudyPlan.create({
      userId,
      goalId: goal._id,
      name: 'Isolation Test Plan',
      status: 'active',
    });

    await DailyObjective.create({
      userId,
      goalId: goal._id,
      planId: samplePlan._id,
      topic: sampleQuestion.topic,
      date: normalizeLogicalDate(targetDateStr),
      patterns: [
        {
          pattern: sampleQuestion.pattern,
          targetQuestions: 5,
          completedQuestions: 2,
        },
      ],
    });

    sampleMockSession = await MockSession.create({
      userId,
      blueprintId: new mongoose.Types.ObjectId(),
      blueprintSnapshot: { title: 'Test Mock Blueprint' },
      blueprintFingerprint: 'dummy-fingerprint',
      mode: 'standard',
      navigationPolicy: 'free',
      effectiveExcludeRecentQuestions: false,
      questionSequence: [],
      sectionStates: [
        {
          sectionId: 'sec-1',
          order: 1,
          status: 'completed',
          questionCount: 1,
        },
      ],
      totalQuestions: 1,
      durationMinutes: 30,
      generationSeed: 'seed-123',
      algorithmVersion: 'v1',
      status: 'submitted',
      finalizationState: 'completed',
      resultSummary: {
        score: 1,
        maxScore: 1,
        totalQuestions: 1,
        attemptedCount: 1,
        correctCount: 1,
        incorrectCount: 0,
        unattemptedCount: 0,
        accuracy: 100,
        timeTakenSeconds: 30,
        sectionSummaries: [],
      },
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('verifies exactly 16 Mongoose models exist and zero new models are registered', () => {
    const registeredModels = mongoose.modelNames();
    expect(registeredModels.length).toBe(16);

    // Explicitly verify expected 16 models
    const expectedModels = [
      'Question',
      'User',
      'Goal',
      'StudyPlan',
      'DailyObjective',
      'Attempt',
      'StudentProgress',
      'RevisionItem',
      'RevisionProcessingRecord',
      'MockBlueprint',
      'MockSession',
      'MockResponse',
      'MockAttemptFinalizationRecord',
      'PrescriptionExecutionRecord',
      'OrchestrationPolicyVersion',
      'AuthSession',
    ];
    for (const exp of expectedModels) {
      expect(registeredModels).toContain(exp);
    }
  });

  test('executes all 6 Phase 7 endpoints with zero mutations across all 14 collections', async () => {
    // Record baseline counts across all models
    const baselineCounts = {
      questions: await Question.countDocuments(),
      attempts: await Attempt.countDocuments(),
      progress: await StudentProgress.countDocuments(),
      goals: await Goal.countDocuments(),
      plans: await StudyPlan.countDocuments(),
      objectives: await DailyObjective.countDocuments(),
      revisions: await RevisionItem.countDocuments(),
      revisionRecords: await RevisionProcessingRecord.countDocuments(),
      mockBlueprints: await MockBlueprint.countDocuments(),
      mockSessions: await MockSession.countDocuments(),
      mockResponses: await MockResponse.countDocuments(),
      finalizationRecords: await MockAttemptFinalizationRecord.countDocuments(),
      prescriptionExecutionRecords: await PrescriptionExecutionRecord.countDocuments(),
      users: await User.countDocuments(),
    };

    // 1. Concept Tutor
    const resTutor = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });
    expect(resTutor.status).toBe(200);

    // 2. Hint
    const resHint = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: sampleQuestion._id.toString(),
        hintLevel: 2,
      });
    expect(resHint.status).toBe(200);

    // 3. Explain Attempt
    const resAttempt = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: sampleAttempt._id.toString(),
      });
    expect(resAttempt.status).toBe(200);

    // 4. Explain Progress
    const resProgress = await request(app)
      .post('/api/v1/learning/explain-progress')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });
    expect(resProgress.status).toBe(200);

    // 5. Explain Plan
    const resPlan = await request(app)
      .post('/api/v1/learning/explain-plan')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        planId: samplePlan._id.toString(),
        targetDate: targetDateStr,
      });
    expect(resPlan.status).toBe(200);

    // 6. Mock Review
    const resMock = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        sessionId: sampleMockSession._id.toString(),
      });
    expect(resMock.status).toBe(200);

    // Verify post-execution counts are STRICTLY identical
    expect(await Question.countDocuments()).toBe(baselineCounts.questions);
    expect(await Attempt.countDocuments()).toBe(baselineCounts.attempts);
    expect(await StudentProgress.countDocuments()).toBe(baselineCounts.progress);
    expect(await Goal.countDocuments()).toBe(baselineCounts.goals);
    expect(await StudyPlan.countDocuments()).toBe(baselineCounts.plans);
    expect(await DailyObjective.countDocuments()).toBe(baselineCounts.objectives);
    expect(await RevisionItem.countDocuments()).toBe(baselineCounts.revisions);
    expect(await RevisionProcessingRecord.countDocuments()).toBe(baselineCounts.revisionRecords);
    expect(await MockBlueprint.countDocuments()).toBe(baselineCounts.mockBlueprints);
    expect(await MockSession.countDocuments()).toBe(baselineCounts.mockSessions);
    expect(await MockResponse.countDocuments()).toBe(baselineCounts.mockResponses);
    expect(await MockAttemptFinalizationRecord.countDocuments()).toBe(baselineCounts.finalizationRecords);
    expect(await PrescriptionExecutionRecord.countDocuments()).toBe(baselineCounts.prescriptionExecutionRecords);
    expect(await User.countDocuments()).toBe(baselineCounts.users);
  });
});
