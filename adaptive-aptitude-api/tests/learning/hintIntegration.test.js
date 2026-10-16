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

describe('Phase 7: Hint Integration (POST /api/v1/learning/hint)', () => {
  let app;
  const originalEnv = { ...process.env };
  const userId = 'hint_student_1';
  const otherUserId = 'hint_student_2';
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
      sectionStates: [{ sectionId: 'sec-1', order: 1, status: 'in_progress', questionCount: 1 }],
      totalQuestions: 1,
      durationMinutes: 30,
      generationSeed: 'seed-123',
      algorithmVersion: 'v1',
      status: 'started',
      finalizationState: 'idle',
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

    await User.create({ userId, name: 'Hint Student 1' });
    await User.create({ userId: otherUserId, name: 'Hint Student 2' });

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

  test('validates missing questionId with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        hintLevel: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 QUESTION_NOT_FOUND when questionId does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: fakeId.toString(),
        hintLevel: 1,
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('QUESTION_NOT_FOUND');
  });

  test('rejects invalid hintLevel with 400 INVALID_HINT_LEVEL', async () => {
    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: sampleQuestion._id.toString(),
        hintLevel: 6,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_HINT_LEVEL');
  });

  test('blocks hint request when user has active mock session with 403 ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED', async () => {
    await createTestMockSession({ status: 'started' });

    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: sampleQuestion._id.toString(),
        hintLevel: 1,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED');
  });

  test('blocks hint request when mock finalization is in progress with 409 FINALIZATION_IN_PROGRESS', async () => {
    await createTestMockSession({ status: 'submitted', finalizationState: 'in_progress' });

    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: sampleQuestion._id.toString(),
        hintLevel: 1,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');
  });

  test('Level 1–4 hint without attempt succeeds and never reveals answer', async () => {
    for (let level = 1; level <= 4; level++) {
      const res = await request(app)
        .post('/api/v1/learning/hint')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId: sampleQuestion._id.toString(),
          hintLevel: level,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.hintLevel).toBe(level);
      expect(res.body.data.revealsAnswer).toBe(false);
      expect(res.body.data.hint).toBeDefined();
      expect(res.body.data.hint.toLowerCase()).not.toContain('4% decrease');
    }
  });

  test('Level 5 hint WITHOUT user-owned attempt returns 403 ANSWER_REVEAL_LOCKED_ATTEMPT_REQUIRED', async () => {
    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: sampleQuestion._id.toString(),
        hintLevel: 5,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ANSWER_REVEAL_LOCKED_ATTEMPT_REQUIRED');
  });

  test('Level 5 hint with foreign user attempt still returns 403 ANSWER_REVEAL_LOCKED_ATTEMPT_REQUIRED', async () => {
    // Other user attempts the question
    await createTestAttempt({ userId: otherUserId });

    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: sampleQuestion._id.toString(),
        hintLevel: 5,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ANSWER_REVEAL_LOCKED_ATTEMPT_REQUIRED');
  });

  test('Level 5 hint with user-owned attempt succeeds and provides untruncated canonical answer', async () => {
    // Current user attempts the question
    await createTestAttempt({ userId });

    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: sampleQuestion._id.toString(),
        hintLevel: 5,
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('hint');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.data.hintLevel).toBe(5);
    expect(res.body.data.revealsAnswer).toBe(true);
    expect(res.body.data.hint).toContain('4% decrease');
    expect(res.body.data.nextAction).toBe('view_explanation');
  });

  test('active mock overrides prior attempt eligibility for Level 5', async () => {
    await createTestAttempt({ userId });

    // Start active mock
    await createTestMockSession({ status: 'started' });

    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: sampleQuestion._id.toString(),
        hintLevel: 5,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED');
  });

  test('fake provider mode generates valid hint matching request hintLevel', async () => {
    process.env.LEARNING_LLM_PROVIDER = 'fake';

    const res = await request(app)
      .post('/api/v1/learning/hint')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        questionId: sampleQuestion._id.toString(),
        hintLevel: 3,
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('hint');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.data.hintLevel).toBe(3);
    expect(res.body.data.revealsAnswer).toBe(false);
    expect(res.body.metadata.provider).toBe('fake');
    expect(res.body.metadata.isDegraded).toBe(false);
  });
});
