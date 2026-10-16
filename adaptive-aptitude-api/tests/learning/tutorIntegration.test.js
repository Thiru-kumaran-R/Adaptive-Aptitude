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
const authConfig = require('../../src/config/authConfig');
const { _clearRegistryForTesting } = require('../../src/middleware/rateLimiter');

describe('Phase 7: Concept Tutor Integration (POST /api/v1/learning/tutor)', () => {
  let app;
  const originalEnv = { ...process.env };
  const userId = 'tutor_student_1';

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
    authConfig.RATE_LIMIT_LLM_MAX = 100;
    _clearRegistryForTesting();
    process.env = { ...originalEnv };
    process.env.LEARNING_LLM_PROVIDER = 'disabled';
    await User.create({ userId, name: 'Tutor Student' });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    authConfig.RATE_LIMIT_LLM_MAX = 20;
    _clearRegistryForTesting();
  });

  test('validates required fields: missing topic returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        pattern: 'Successive Percentage Changes',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/topic and pattern are required/i);
  });

  test('validates required fields: missing pattern returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: 'Percentage',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/topic and pattern are required/i);
  });

  test('validates canonical truth: unknown topic or pattern returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: 'UnknownNonexistentTopic',
        pattern: 'NonexistentPattern',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('blocks tutor request when user has active mock session with 403 ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED', async () => {
    await createTestMockSession({ status: 'started' });

    const res = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED');
  });

  test('blocks tutor request when mock finalization is in progress with 409 FINALIZATION_IN_PROGRESS', async () => {
    await createTestMockSession({ status: 'submitted', finalizationState: 'in_progress' });

    const res = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');
  });

  test('in disabled mode, returns deterministic fallback with isDegraded: true and valid schema', async () => {
    process.env.LEARNING_LLM_PROVIDER = 'disabled';

    const res = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
        studentMessage: 'Can you explain successive discounts?',
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.data).toBeDefined();
    expect(res.body.data.topic).toBe('Percentage');
    expect(res.body.data.pattern).toBe('Successive Percentage Changes');
    expect(res.body.data.conceptExplanation).toBeDefined();
    expect(res.body.metadata.taskType).toBe('concept_tutor');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBeNull();
    expect(res.body.metadata.isDegraded).toBe(true);
    expect(res.body.metadata.provider).toBe('disabled');
    expect(res.body.metadata.degradationReason).toBe('disabled_mode');
    expect(res.body.provenance).toBeDefined();
    expect(Array.isArray(res.body.provenance.facts)).toBe(true);
    expect(Array.isArray(res.body.provenance.deterministicSignals)).toBe(true);
    expect(Array.isArray(res.body.provenance.llmInterpretations)).toBe(true);
  });

  test('in fake provider mode, returns provider-generated tutor response with isDegraded: false', async () => {
    process.env.LEARNING_LLM_PROVIDER = 'fake';

    const res = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
        studentMessage: 'Explain this to me',
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.data).toBeDefined();
    expect(res.body.data.topic).toBe('Percentage');
    expect(res.body.data.pattern).toBe('Successive Percentage Changes');
    expect(res.body.metadata.taskType).toBe('concept_tutor');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBe('v1.0.0');
    expect(res.body.metadata.isDegraded).toBe(false);
    expect(res.body.metadata.provider).toBe('fake');
    expect(res.body.metadata.model).toBe('fake-llm-v1');
  });

  test('bounds studentMessage and conversation history gracefully', async () => {
    process.env.LEARNING_LLM_PROVIDER = 'fake';

    const longMessage = 'A'.repeat(800); // Exceeds 500 chars limit
    const longHistory = [
      { role: 'user', content: 'Turn 1' },
      { role: 'assistant', content: 'Response 1' },
      { role: 'user', content: 'Turn 2' },
      { role: 'assistant', content: 'Response 2' },
      { role: 'user', content: 'Turn 3' },
      { role: 'assistant', content: 'Response 3' },
      { role: 'user', content: 'Turn 4' },
      { role: 'assistant', content: 'Response 4' },
      { role: 'user', content: 'Turn 5' },
    ];

    const res = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
        studentMessage: longMessage,
        conversationHistory: longHistory,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.topic).toBe('Percentage');
  });

  test('enforces process-local rate limit returning 429 LEARNING_RATE_LIMIT_EXCEEDED after quota', async () => {
    // 30 requests per hour allowed
    for (let i = 0; i < 30; i++) {
      const res = await request(app)
        .post('/api/v1/learning/tutor')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          topic: 'Percentage',
          pattern: 'Successive Percentage Changes',
        });
      expect(res.status).toBe(200);
    }

    // 31st request triggers rate limit
    const limitedRes = await request(app)
      .post('/api/v1/learning/tutor')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
      });

    expect(limitedRes.status).toBe(429);
    expect(limitedRes.body.error.code).toBe('LEARNING_RATE_LIMIT_EXCEEDED');
  });
});
