'use strict';

/**
 * tests/mock/mockSessionLifecycle.test.js
 *
 * Comprehensive tests for Phase 6 Session Lifecycle, Question DTOs,
 * Response Draft Management, Section Transitions, and Abandonment.
 */

const request = require('supertest');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const MockSession = require('../../src/models/mockSessionModel');
const MockBlueprint = require('../../src/models/mockBlueprintModel');
const MockResponse = require('../../src/models/mockResponseModel');
const Question = require('../../src/models/questionModel');
const User = require('../../src/models/userModel');
const { seedMockQuestions, createTestUser } = require('../helpers/mockTestHelpers');
const {
  MOCK_MODES,
  NAVIGATION_POLICIES,
  SESSION_STATUS,
  RESPONSE_STATUS,
} = require('../../src/config/mockConfig');
const mockBlueprintService = require('../../src/services/mock/mockBlueprintService');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Phase 6: Mock Session Lifecycle, Responses & Section Engine', () => {
  let app;
  const userId = 'session-lifecycle-user-1';

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
    await createTestUser(userId);
    // Seed questions for Percentage and Average patterns
    await seedMockQuestions({
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      countPerBand: 5,
    });
    await seedMockQuestions({
      topic: 'Average',
      pattern: 'Basic Arithmetic Mean & Missing Observations',
      countPerBand: 5,
    });
  });

  const buildTestBlueprint = (nav = NAVIGATION_POLICIES.FREE) => ({
    title: 'Lifecycle Test Blueprint',
    mode: MOCK_MODES.STANDARD,
    navigationPolicy: nav,
    durationMinutes: 30,
    sections: [
      {
        sectionId: 'sec-1',
        title: 'Section 1',
        questionCount: 3,
        durationMinutes: nav === NAVIGATION_POLICIES.SECTION_LOCKED ? 15 : null,
        scope: {
          patterns: ['Successive Percentage Changes'],
        },
      },
      {
        sectionId: 'sec-2',
        title: 'Section 2',
        questionCount: 3,
        durationMinutes: nav === NAVIGATION_POLICIES.SECTION_LOCKED ? 15 : null,
        scope: {
          patterns: ['Basic Arithmetic Mean & Missing Observations'],
        },
      },
    ],
  });

  describe('Session Creation and Start Idempotency', () => {
    it('creates a session in created status with correct sequence', async () => {
      const res = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          blueprint: buildTestBlueprint(NAVIGATION_POLICIES.FREE),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const session = res.body.data;
      expect(session.status).toBe(SESSION_STATUS.CREATED);
      expect(session.totalQuestions).toBe(6);
      expect(session.questionSequence).toHaveLength(6);
      expect(session.startedAt).toBeNull();
      expect(session.expiresAt).toBeNull();
    });

    it('resolves and persists effectiveExcludeRecentQuestions across all 4 mode/override permutations with single ownership on MockSession', async () => {
      // 1. Standard + omitted -> false
      const bp1 = buildTestBlueprint(NAVIGATION_POLICIES.FREE);
      delete bp1.excludeRecentQuestions;
      const res1 = await request(app).post('/api/v1/mock-sessions').set(getAuthHeaders(userId)).send({ userId, blueprint: bp1 });
      expect(res1.status).toBe(201);
      const session1 = await MockSession.findById(res1.body.data._id);
      expect(session1.effectiveExcludeRecentQuestions).toBe(false);
      expect(session1.blueprintSnapshot.effectiveExcludeRecentQuestions).toBe(false);

      // 2. Diagnostic + omitted -> true
      const bp2 = { ...buildTestBlueprint(NAVIGATION_POLICIES.FREE), mode: MOCK_MODES.DIAGNOSTIC };
      delete bp2.excludeRecentQuestions;
      const res2 = await request(app).post('/api/v1/mock-sessions').set(getAuthHeaders(userId)).send({ userId, blueprint: bp2 });
      expect(res2.status).toBe(201);
      const session2 = await MockSession.findById(res2.body.data._id);
      expect(session2.effectiveExcludeRecentQuestions).toBe(true);
      expect(session2.blueprintSnapshot.effectiveExcludeRecentQuestions).toBe(true);

      // 3. Standard + explicit true -> true
      const bp3 = { ...buildTestBlueprint(NAVIGATION_POLICIES.FREE), mode: MOCK_MODES.STANDARD, excludeRecentQuestions: true };
      const res3 = await request(app).post('/api/v1/mock-sessions').set(getAuthHeaders(userId)).send({ userId, blueprint: bp3 });
      expect(res3.status).toBe(201);
      const session3 = await MockSession.findById(res3.body.data._id);
      expect(session3.effectiveExcludeRecentQuestions).toBe(true);
      expect(session3.blueprintSnapshot.effectiveExcludeRecentQuestions).toBe(true);

      // 4. Diagnostic + explicit false -> false
      const bp4 = { ...buildTestBlueprint(NAVIGATION_POLICIES.FREE), mode: MOCK_MODES.DIAGNOSTIC, excludeRecentQuestions: false };
      const res4 = await request(app).post('/api/v1/mock-sessions').set(getAuthHeaders(userId)).send({ userId, blueprint: bp4 });
      expect(res4.status).toBe(201);
      const session4 = await MockSession.findById(res4.body.data._id);
      expect(session4.effectiveExcludeRecentQuestions).toBe(false);
      expect(session4.blueprintSnapshot.effectiveExcludeRecentQuestions).toBe(false);

      // 5. Verify persisted MockBlueprint has NO effectiveExcludeRecentQuestions property
      const savedBp = await mockBlueprintService.createBlueprint(buildTestBlueprint(NAVIGATION_POLICIES.FREE));
      expect(savedBp.effectiveExcludeRecentQuestions).toBeUndefined();
      expect(savedBp.excludeRecentQuestions).toBeNull();
    });

    it('idempotently starts a session without altering timestamps on repeat start', async () => {
      const createRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          blueprint: buildTestBlueprint(NAVIGATION_POLICIES.FREE),
        });
      const sessionId = createRes.body.data._id;

      const startRes1 = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/start`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(startRes1.status).toBe(200);
      expect(startRes1.body.data.status).toBe(SESSION_STATUS.STARTED);
      const startedAt1 = startRes1.body.data.startedAt;
      const expiresAt1 = startRes1.body.data.expiresAt;
      expect(startedAt1).toBeDefined();
      expect(expiresAt1).toBeDefined();

      // Second start call
      const startRes2 = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/start`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(startRes2.status).toBe(200);
      expect(startRes2.body.data.startedAt).toBe(startedAt1);
      expect(startRes2.body.data.expiresAt).toBe(expiresAt1);
    });
  });

  describe('Question DTO Security & First-View Draft', () => {
    it('serves Question DTO without answer, correctAnswer, explanation, or solution', async () => {
      const createRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          blueprint: buildTestBlueprint(NAVIGATION_POLICIES.FREE),
        });
      const sessionId = createRes.body.data._id;
      const qId = createRes.body.data.questionSequence[0].questionId;

      await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/start`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      const qRes = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}/questions/${qId}`)
        .set(getAuthHeaders(userId))
        .query({ userId });

      expect(qRes.status).toBe(200);
      expect(qRes.body.success).toBe(true);
      const qData = qRes.body.data.question;

      // Question-facing allowed fields
      expect(qData.questionId).toBe(qId);
      expect(qData.question).toBeDefined();
      expect(qData.options).toHaveLength(4);
      expect(qData.topic).toBeDefined();
      expect(qData.pattern).toBeDefined();
      expect(qData.difficulty).toBeDefined();

      // STRICT ZERO LEAKAGE
      expect(qData.answer).toBeUndefined();
      expect(qData.correctAnswer).toBeUndefined();
      expect(qData.explanation).toBeUndefined();
      expect(qData.solution).toBeUndefined();

      // First-view draft recorded
      const respRecord = await MockResponse.findOne({ sessionId, questionId: qId });
      expect(respRecord).toBeDefined();
      expect(respRecord.isViewed).toBe(true);
      expect(respRecord.status).toBe(RESPONSE_STATUS.VIEWED);
    });
  });

  describe('Response Draft Saving & Validations', () => {
    let sessionId;
    let questionId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          blueprint: buildTestBlueprint(NAVIGATION_POLICIES.FREE),
        });
      sessionId = createRes.body.data._id;
      questionId = createRes.body.data.questionSequence[0].questionId;

      await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/start`)
        .set(getAuthHeaders(userId))
        .send({ userId });
    });

    it('saves selected answer and marks response as answered', async () => {
      const saveRes = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId,
          selectedAnswer: 'Option A',
          isMarkedForReview: true,
          timeTakenSeconds: 3,
        });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);
      expect(saveRes.body.data.selectedAnswer).toBe('Option A');
      expect(saveRes.body.data.status).toBe(RESPONSE_STATUS.ANSWERED);
      expect(saveRes.body.data.isMarkedForReview).toBe(true);
      expect(saveRes.body.data.timeTakenSeconds).toBe(3);
    });

    it('allows editing an answer and clearing an answer (selectedAnswer: null -> viewed)', async () => {
      // 1. Answer initially
      await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId,
          selectedAnswer: 'Option A',
          isMarkedForReview: false,
          timeTakenSeconds: 2,
        });

      // 2. Edit answer to Option B
      const editRes = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId,
          selectedAnswer: 'Option B',
          timeTakenSeconds: 3,
        });
      expect(editRes.body.data.selectedAnswer).toBe('Option B');

      // 3. Clear answer (selectedAnswer: null)
      const clearRes = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId,
          selectedAnswer: null,
          timeTakenSeconds: 4,
        });
      expect(clearRes.body.data.selectedAnswer).toBeNull();
      expect(clearRes.body.data.status).toBe(RESPONSE_STATUS.VIEWED);
    });

    it('rejects option that does not exist in Question.options with 400 INVALID_OPTION', async () => {
      const res = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId,
          selectedAnswer: 'Completely Invalid Option',
          timeTakenSeconds: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_OPTION');
    });

    it('rejects negative or invalid timeTakenSeconds with 400 INVALID_TIME_TAKEN', async () => {
      const resNeg = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId,
          selectedAnswer: 'Option A',
          timeTakenSeconds: -5,
        });
      expect(resNeg.status).toBe(400);
      expect(resNeg.body.error.code).toBe('INVALID_TIME_TAKEN');

      const resFloat = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId,
          selectedAnswer: 'Option A',
          timeTakenSeconds: 12.34,
        });
      expect(resFloat.status).toBe(400);
      expect(resFloat.body.error.code).toBe('INVALID_TIME_TAKEN');
    });
  });

  describe('Section-Locked Navigation & Atomic Transitions', () => {
    it('enforces active section locking and transitions atomically to next section', async () => {
      const createRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          blueprint: buildTestBlueprint(NAVIGATION_POLICIES.SECTION_LOCKED),
        });
      const sessionId = createRes.body.data._id;
      const sec2QId = createRes.body.data.questionSequence.find((q) => q.sectionId === 'sec-2').questionId;

      await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/start`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      // Attempting to access Section 2 question while Section 1 is active -> 409 SECTION_LOCKED
      const lockedRes = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}/questions/${sec2QId}`)
        .set(getAuthHeaders(userId))
        .query({ userId });
      expect(lockedRes.status).toBe(409);
      expect(lockedRes.body.error.code).toBe('SECTION_LOCKED');

      // Complete Section 1
      const compRes = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/sections/sec-1/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });
      expect(compRes.status).toBe(200);
      expect(compRes.body.data.isFinalSection).toBe(false);

      // Now Section 2 is active!
      const sec2Res = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}/questions/${sec2QId}`)
        .set(getAuthHeaders(userId))
        .query({ userId });
      expect(sec2Res.status).toBe(200);
      expect(sec2Res.body.data.question.sectionId).toBe('sec-2');
    });

    it('completing the final section atomically establishes finalization barrier and finalizes test', async () => {
      const createRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          blueprint: buildTestBlueprint(NAVIGATION_POLICIES.SECTION_LOCKED),
        });
      const sessionId = createRes.body.data._id;

      await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/start`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      // Complete Section 1
      await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/sections/sec-1/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      // Complete Section 2 (Final section)
      const finalRes = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/sections/sec-2/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(finalRes.status).toBe(200);
      expect(finalRes.body.data.isFinalSection).toBe(true);
      expect(finalRes.body.data.resultSummary).toBeDefined();

      const sessionInDb = await MockSession.findById(sessionId);
      expect(sessionInDb.status).toBe(SESSION_STATUS.SUBMITTED);
      expect(sessionInDb.responsesFrozen).toBe(true);
    });
  });

  describe('Abandon Session Engine & Review Denial', () => {
    it('abandons created session', async () => {
      const createRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          blueprint: buildTestBlueprint(NAVIGATION_POLICIES.FREE),
        });
      const sessionId = createRes.body.data._id;

      const abandonRes = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/abandon`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(abandonRes.status).toBe(200);
      expect(abandonRes.body.data.status).toBe(SESSION_STATUS.ABANDONED);
      expect(abandonRes.body.data.abandonedAt).toBeDefined();
    });

    it('abandons active started session before finalization', async () => {
      const createRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          blueprint: buildTestBlueprint(NAVIGATION_POLICIES.FREE),
        });
      const sessionId = createRes.body.data._id;

      await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/start`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      const abandonRes = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/abandon`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(abandonRes.status).toBe(200);
      expect(abandonRes.body.data.status).toBe(SESSION_STATUS.ABANDONED);
    });

    it('denies review on abandoned sessions with 400 MOCK_SESSION_NOT_TERMINAL', async () => {
      const createRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          blueprint: buildTestBlueprint(NAVIGATION_POLICIES.FREE),
        });
      const sessionId = createRes.body.data._id;

      await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/abandon`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      const reviewRes = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}/review`)
        .set(getAuthHeaders(userId))
        .query({ userId });

      expect(reviewRes.status).toBe(400);
      expect(reviewRes.body.error.code).toBe('MOCK_SESSION_NOT_TERMINAL');
    });
  });
});
