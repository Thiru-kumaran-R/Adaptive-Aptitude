'use strict';

const mongoose = require('mongoose');
const request = require('supertest');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const MockSession = require('../../src/models/mockSessionModel');
const User = require('../../src/models/userModel');
const { resetRateLimits } = require('../../src/utils/learning/rateLimiter');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Phase 7: Mock Review Integration (POST /api/v1/learning/mock-review)', () => {
  let app;
  const originalEnv = { ...process.env };
  const userId = 'mock_student_1';
  const otherUserId = 'mock_student_2';

  const createTestMockSession = (overrides = {}) => {
    return MockSession.create({
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
          questionCount: 5,
        },
      ],
      totalQuestions: 5,
      durationMinutes: 30,
      generationSeed: 'seed-123',
      algorithmVersion: 'v1',
      status: 'submitted',
      finalizationState: 'completed',
      resultSummary: {
        score: 15,
        maxScore: 20,
        totalQuestions: 5,
        attemptedCount: 5,
        correctCount: 4,
        incorrectCount: 1,
        unattemptedCount: 0,
        accuracy: 80,
        timeTakenSeconds: 900,
        sectionSummaries: [
          {
            sectionId: 'sec-1',
            score: 15,
            maxScore: 20,
            attemptedCount: 5,
            correctCount: 4,
            incorrectCount: 1,
            accuracy: 80,
            timeSpentSeconds: 900,
          },
        ],
      },
      ...overrides,
    });
  };

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
    process.env.LEARNING_LLM_PROVIDER = 'disabled';

    await User.create({ userId, name: 'Mock Student 1' });
    await User.create({ userId: otherUserId, name: 'Mock Student 2' });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('validates missing sessionId with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({ userId });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 MOCK_SESSION_NOT_FOUND when sessionId does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        sessionId: fakeId.toString(),
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('MOCK_SESSION_NOT_FOUND');
  });

  test('strict ownership: returns 403 FORBIDDEN when mock session belongs to another user', async () => {
    const foreignMock = await createTestMockSession({ userId: otherUserId });

    const res = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        sessionId: foreignMock._id.toString(),
      });

    expect(res.status).toBe(403);
    expect(['FORBIDDEN', 'OWNERSHIP_VIOLATION']).toContain(res.body.error.code);
  });

  test('abandoned mock review returns 400 MOCK_SESSION_ABANDONED', async () => {
    const abandonedMock = await createTestMockSession({
      status: 'abandoned',
      finalizationState: 'idle',
    });

    const res = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        sessionId: abandonedMock._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MOCK_SESSION_ABANDONED');
  });

  test('active mock returns 409 MOCK_SESSION_NOT_TERMINAL', async () => {
    const activeMock = await createTestMockSession({
      status: 'started',
      finalizationState: 'idle',
    });

    const res = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        sessionId: activeMock._id.toString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('MOCK_SESSION_NOT_TERMINAL');
  });

  test('finalization in progress returns 409 FINALIZATION_IN_PROGRESS', async () => {
    const finalizingMock = await createTestMockSession({
      status: 'submitted',
      finalizationState: 'in_progress',
    });

    const res = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        sessionId: finalizingMock._id.toString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');
  });

  test('non-completed finalization returns 409 MOCK_SESSION_NOT_TERMINAL', async () => {
    const incompleteMock = await createTestMockSession({
      status: 'submitted',
      finalizationState: 'idle',
    });

    const res = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        sessionId: incompleteMock._id.toString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('MOCK_SESSION_NOT_TERMINAL');
  });

  test('completed terminal mock review succeeds in disabled fallback mode', async () => {
    const completedMock = await createTestMockSession();

    const res = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        sessionId: completedMock._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('mock_review');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBeNull();
    expect(res.body.data.overallScoreInterpretation).toBeDefined();
    expect(res.body.data.sectionDiagnostics).toBeDefined();
    expect(res.body.data.pacingObservations).toBeDefined();
    expect(res.body.metadata.isDegraded).toBe(true);
    expect(res.body.metadata.provider).toBe('disabled');
  });

  test('completed terminal mock review succeeds in fake provider mode', async () => {
    process.env.LEARNING_LLM_PROVIDER = 'fake';
    const completedMock = await createTestMockSession();

    const res = await request(app)
      .post('/api/v1/learning/mock-review')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        sessionId: completedMock._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('mock_review');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBe('v1.0.0');
    expect(res.body.data.overallScoreInterpretation).toBeDefined();
    expect(res.body.metadata.isDegraded).toBe(false);
    expect(res.body.metadata.provider).toBe('fake');
    expect(res.body.metadata.model).toBe('fake-llm-v1');
  });
});
