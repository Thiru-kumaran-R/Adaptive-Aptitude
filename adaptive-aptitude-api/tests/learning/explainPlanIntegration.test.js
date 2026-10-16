'use strict';

const mongoose = require('mongoose');
const request = require('supertest');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const StudyPlan = require('../../src/models/studyPlanModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const MockSession = require('../../src/models/mockSessionModel');
const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const { normalizeLogicalDate } = require('../../src/utils/dateUtils');
const { resetRateLimits } = require('../../src/utils/learning/rateLimiter');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Phase 7: Explain Plan Integration (POST /api/v1/learning/explain-plan)', () => {
  let app;
  const originalEnv = { ...process.env };
  const userId = 'plan_student_1';
  const otherUserId = 'plan_student_2';
  let samplePlan;
  let sampleObjective;
  const targetDateStr = '2026-10-15';

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

    await User.create({ userId, name: 'Plan Student 1' });
    await User.create({ userId: otherUserId, name: 'Plan Student 2' });

    const goal = await Goal.create({
      userId,
      title: 'Target Exam Goal',
      type: 'entrance',
      targetDate: new Date('2026-12-31'),
    });

    samplePlan = await StudyPlan.create({
      userId,
      goalId: goal._id,
      name: 'Quantitative Foundation Plan',
      status: 'active',
    });

    sampleObjective = await DailyObjective.create({
      userId,
      goalId: goal._id,
      planId: samplePlan._id,
      topic: 'Percentage',
      date: normalizeLogicalDate(targetDateStr),
      patterns: [
        {
          pattern: 'Successive Percentage Changes',
          targetQuestions: 5,
          completedQuestions: 2,
        },
      ],
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('validates missing planId with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/learning/explain-plan')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        targetDate: targetDateStr,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('validates missing targetDate with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/learning/explain-plan')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        planId: samplePlan._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 STUDY_PLAN_NOT_FOUND when plan does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/v1/learning/explain-plan')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        planId: fakeId.toString(),
        targetDate: targetDateStr,
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('STUDY_PLAN_NOT_FOUND');
  });

  test('strict ownership: returns 403 FORBIDDEN when study plan belongs to another user', async () => {
    const res = await request(app)
      .post('/api/v1/learning/explain-plan')
      .set(getAuthHeaders(otherUserId))
      .send({
        userId: otherUserId,
        planId: samplePlan._id.toString(),
        targetDate: targetDateStr,
      });

    expect(res.status).toBe(403);
    expect(['FORBIDDEN', 'OWNERSHIP_VIOLATION']).toContain(res.body.error.code);
  });

  test('returns 404 DAILY_OBJECTIVE_NOT_FOUND when objective does not exist for targetDate', async () => {
    const res = await request(app)
      .post('/api/v1/learning/explain-plan')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        planId: samplePlan._id.toString(),
        targetDate: '2026-11-20',
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DAILY_OBJECTIVE_NOT_FOUND');
  });

  test('explain-plan is NOT blocked during mock finalization (remains ALLOWED per Section 14)', async () => {
    await createTestMockSession({ status: 'submitted', finalizationState: 'in_progress' });

    const res = await request(app)
      .post('/api/v1/learning/explain-plan')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        planId: samplePlan._id.toString(),
        targetDate: targetDateStr,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.objectiveSummary).toBeDefined();
  });

  test('in disabled mode, returns deterministic plan explanation deriving totals from patterns', async () => {
    const res = await request(app)
      .post('/api/v1/learning/explain-plan')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        planId: samplePlan._id.toString(),
        targetDate: targetDateStr,
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('explain_plan');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBeNull();
    expect(res.body.data.planId).toBe(samplePlan._id.toString());
    expect(res.body.data.targetDate).toBe(targetDateStr);
    expect(res.body.data.objectiveSummary).toBeDefined();
    expect(res.body.metadata.isDegraded).toBe(true);
    expect(res.body.metadata.provider).toBe('disabled');
  });

  test('in fake provider mode, returns schema-valid response with isDegraded: false', async () => {
    process.env.LEARNING_LLM_PROVIDER = 'fake';

    const res = await request(app)
      .post('/api/v1/learning/explain-plan')
      .set(getAuthHeaders(userId))
      .send({
        userId,
        planId: samplePlan._id.toString(),
        targetDate: targetDateStr,
      });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
    expect(res.body.metadata.taskType).toBe('explain_plan');
    expect(res.body.metadata.algorithmVersion).toBe('v1');
    expect(res.body.metadata.promptVersion).toBe('v1.0.0');
    expect(res.body.data.planId).toBe(samplePlan._id.toString());
    expect(res.body.data.targetDate).toBe(targetDateStr);
    expect(res.body.metadata.isDegraded).toBe(false);
    expect(res.body.metadata.provider).toBe('fake');
    expect(res.body.metadata.model).toBe('fake-llm-v1');
  });
});
