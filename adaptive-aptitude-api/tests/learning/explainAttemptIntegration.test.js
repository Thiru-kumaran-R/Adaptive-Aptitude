'use strict';

const mongoose = require('mongoose');
const request = require('supertest');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const Question = require('../../src/models/questionModel');
const Attempt = require('../../src/models/attemptModel');
const MockSession = require('../../src/models/mockSessionModel');
const User = require('../../src/models/userModel');
const { resetRateLimits } = require('../../src/utils/learning/rateLimiter');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Phase 7: Explain Attempt Integration (POST /api/v1/learning/explain-attempt)', () => {
  let app;
  const originalEnv = { ...process.env };
  const userId = 'attempt_student_1';
  const otherUserId = 'attempt_student_2';
  let sampleQuestion;

  const createTestMockSession = (overrides = {}) => {
    return MockSession.create({
      userId,
      blueprintId: new mongoose.Types.ObjectId(),
      blueprintSnapshot: { title: 'Test Mock' },
      blueprintFingerprint: 'dummy-fingerprint',
      mode: 'standard',
      navigationPolicy: 'free',
      effectiveExcludeRecentQuestions: false,
      questionSequence: [],
      sectionStates: [{ sectionId: 'sec-1', order: 1, status: 'completed', questionCount: 1 }],
      totalQuestions: 1,
      durationMinutes: 30,
      generationSeed: 'seed-123',
      algorithmVersion: 'v1',
      status: 'submitted',
      finalizationState: 'completed',
      ...overrides,
    });
  };

  const createTestAttempt = (overrides = {}) => {
    return Attempt.create({
      userId,
      questionId: sampleQuestion._id,
      topic: sampleQuestion.topic,
      pattern: sampleQuestion.pattern,
      difficulty: sampleQuestion.difficulty,
      selectedAnswer: 'No change',
      correctAnswer: sampleQuestion.answer,
      isCorrect: false,
      timeTaken: 45,
      source: 'practice',
      attemptedAt: new Date(),
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

    await User.create({ userId, name: 'Attempt Student 1' });
    await User.create({ userId: otherUserId, name: 'Attempt Student 2' });

    sampleQuestion = await Question.create({
      question: 'A price increases by 20% and then decreases by 20%. What is the net change?',
      answer: '4% decrease',
      options: ['No change', '4% decrease', '4% increase', '2% decrease'],
      explanation: 'Net change = 20 - 20 - (20×20)/100 = -4%. So 4% decrease.',
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      difficulty: 5,
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('validates missing attemptId with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({ userId });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 ATTEMPT_NOT_FOUND when attemptId does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: fakeId.toString(),
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ATTEMPT_NOT_FOUND');
  });

  test('enforces strict ownership: returns 403 FORBIDDEN when attempt belongs to another user', async () => {
    const foreignAttempt = await createTestAttempt({ userId: otherUserId });

    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: foreignAttempt._id.toString(),
      });

    expect(res.status).toBe(403);
    expect(['FORBIDDEN', 'OWNERSHIP_VIOLATION']).toContain(res.body.error.code);
  });

  test('global finalization blocks explain-attempt for all Attempt sources with 409 FINALIZATION_IN_PROGRESS', async () => {
    const attempt = await createTestAttempt({ userId, source: 'practice' });
    await createTestMockSession({ status: 'submitted', finalizationState: 'in_progress' });

    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: attempt._id.toString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');
  });

  test('allows explaining past practice attempt even when user has active mock session', async () => {
    const practiceAttempt = await createTestAttempt({ userId, source: 'practice' });
    await createTestMockSession({ status: 'started', finalizationState: 'idle' });

    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: practiceAttempt._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.data.mistakeExplanation).toBeDefined();
  });

  test('mock attempt from active mock session returns 403 ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED', async () => {
    const activeMock = await createTestMockSession({ status: 'started', finalizationState: 'idle' });
    const mockAttempt = await createTestAttempt({
      userId,
      source: 'mock',
      sessionId: activeMock._id.toString(),
    });

    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: mockAttempt._id.toString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED');
  });

  test('mock attempt from abandoned mock session returns 400 MOCK_SESSION_ABANDONED', async () => {
    const abandonedMock = await createTestMockSession({ status: 'abandoned', finalizationState: 'idle' });
    const mockAttempt = await createTestAttempt({
      userId,
      source: 'mock',
      sessionId: abandonedMock._id.toString(),
    });

    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: mockAttempt._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MOCK_SESSION_ABANDONED');
  });

  test('mock attempt parent ownership mismatch returns 403 FORBIDDEN', async () => {
    // Parent mock belongs to other user
    const foreignMock = await createTestMockSession({
      userId: otherUserId,
      status: 'submitted',
      finalizationState: 'completed',
    });
    // Attempt record claims userId but references foreign parent mock
    const mockAttempt = await createTestAttempt({
      userId,
      source: 'mock',
      sessionId: foreignMock._id.toString(),
    });

    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: mockAttempt._id.toString(),
      });

    expect(res.status).toBe(403);
    expect(['FORBIDDEN', 'OWNERSHIP_VIOLATION']).toContain(res.body.error.code);
  });

  test('in disabled mode, returns deterministic fallback explanation matching attempt truth', async () => {
    const incorrectAttempt = await createTestAttempt({
      userId,
      selectedAnswer: 'No change',
      isCorrect: false,
    });

    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: incorrectAttempt._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('explain_attempt');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBeNull();
    expect(res.body.data.mistakeExplanation).toBe('Your selected answer differs from the canonical answer.');
    expect(res.body.metadata.isDegraded).toBe(true);
    expect(res.body.metadata.provider).toBe('disabled');
  });

  test('in fake provider mode, generates structured response matching schema', async () => {
    process.env.LEARNING_LLM_PROVIDER = 'fake';

    const correctAttempt = await createTestAttempt({
      userId,
      selectedAnswer: '4% decrease',
      isCorrect: true,
    });

    const res = await request(app)
      .post('/api/v1/learning/explain-attempt')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        attemptId: correctAttempt._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('explain_attempt');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBe('v1.0.0');
    expect(res.body.data.conceptSummary).toBeDefined();
    expect(res.body.data.mistakeExplanation).toBeDefined();
    expect(res.body.metadata.provider).toBe('fake');
    expect(res.body.metadata.isDegraded).toBe(false);
  });
});
