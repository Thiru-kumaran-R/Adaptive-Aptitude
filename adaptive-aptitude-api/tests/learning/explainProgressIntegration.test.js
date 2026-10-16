'use strict';

const mongoose = require('mongoose');
const request = require('supertest');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const StudentProgress = require('../../src/models/studentProgressModel');
const MockSession = require('../../src/models/mockSessionModel');
const User = require('../../src/models/userModel');
const { resetRateLimits } = require('../../src/utils/learning/rateLimiter');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Phase 7: Explain Progress Integration (POST /api/v1/learning/explain-progress)', () => {
  let app;
  const originalEnv = { ...process.env };
  const userId = 'progress_student_1';
  const topic = 'Percentage';
  const pattern = 'Successive Percentage Changes';

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

    await User.create({ userId, name: 'Progress Student' });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('validates missing fields with 400 VALIDATION_ERROR', async () => {
    const resNoUser = await request(app)
      .post('/api/v1/learning/explain-progress')
      .set(getAuthHeaders(userId))
      .send({ topic, pattern });
    expect(resNoUser.status).toBe(400);
    expect(resNoUser.body.error.code).toBe('VALIDATION_ERROR');

    const resNoTopic = await request(app)
      .post('/api/v1/learning/explain-progress')
      .set(getAuthHeaders(userId))
      .send({ userId, pattern });
    expect(resNoTopic.status).toBe(400);
    expect(resNoTopic.body.error.code).toBe('VALIDATION_ERROR');

    const resNoPattern = await request(app)
      .post('/api/v1/learning/explain-progress')
      .set(getAuthHeaders(userId))
      .send({ userId, topic });
    expect(resNoPattern.status).toBe(400);
    expect(resNoPattern.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('blocks explain-progress when mock finalization is in progress with 409 FINALIZATION_IN_PROGRESS', async () => {
    await createTestMockSession({ status: 'submitted', finalizationState: 'in_progress' });

    const res = await request(app)
      .post('/api/v1/learning/explain-progress')
      .set(getAuthHeaders(userId))
      .send({ userId, topic, pattern });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');
  });

  test('allows explain-progress when user has active mock session (excludes unfinalized mock data)', async () => {
    await createTestMockSession({ status: 'started', finalizationState: 'idle' });

    const res = await request(app)
      .post('/api/v1/learning/explain-progress')
      .set(getAuthHeaders(userId))
      .send({ userId, topic, pattern });

    expect(res.status).toBe(200);
    expect(res.body.data.masteryInterpretation).toBeDefined();
  });

  test('in disabled mode, returns deterministic progress explanation matching Phase 3/4 progress data', async () => {
    // Seed progress
    await StudentProgress.create({
      userId,
      topic,
      pattern,
      attempts: 10,
      correct: 8,
      incorrect: 2,
      accuracy: 80,
      totalTimeSpent: 300,
      averageTime: 30,
      consecutiveCorrect: 4,
      consecutiveIncorrect: 0,
      mastery: 0.8,
      lastAttemptAt: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/learning/explain-progress')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic,
        pattern,
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('explain_progress');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBeNull();
    expect(res.body.data.masteryInterpretation).toBeDefined();
    expect(res.body.data.recommendedAction).toBeDefined();
    expect(res.body.metadata.isDegraded).toBe(true);
    expect(res.body.metadata.provider).toBe('disabled');
  });

  test('in fake provider mode, returns schema-valid progress explanation with isDegraded: false', async () => {
    process.env.LEARNING_LLM_PROVIDER = 'fake';

    const res = await request(app)
      .post('/api/v1/learning/explain-progress')
      .set(getAuthHeaders(userId))
      .send({ userId, topic, pattern });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('explain_progress');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBe('v1.0.0');
    expect(res.body.data.masteryInterpretation).toBeDefined();
    expect(res.body.metadata.isDegraded).toBe(false);
    expect(res.body.metadata.provider).toBe('fake');
    expect(res.body.metadata.model).toBe('fake-llm-v1');
  });
});
