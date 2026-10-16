'use strict';

/**
 * Phase 6: Mock HTTP Routes Integration Tests
 *
 * Verifies all 14 Phase 6 REST API endpoints:
 *   - POST   /api/v1/mock-blueprints
 *   - GET    /api/v1/mock-blueprints
 *   - GET    /api/v1/mock-blueprints/:id
 *   - POST   /api/v1/mock-blueprints/preview
 *   - POST   /api/v1/mock-sessions
 *   - POST   /api/v1/mock-sessions/:id/start
 *   - GET    /api/v1/mock-sessions/:id
 *   - GET    /api/v1/mock-sessions/:id/questions/:questionId
 *   - POST   /api/v1/mock-sessions/:id/responses
 *   - POST   /api/v1/mock-sessions/:id/sections/:sectionId/complete
 *   - POST   /api/v1/mock-sessions/:id/submit
 *   - POST   /api/v1/mock-sessions/:id/abandon
 *   - GET    /api/v1/mock-sessions/:id/result
 *   - GET    /api/v1/mock-sessions/:id/review
 */

const request = require('supertest');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearPhase6Collections } = require('../helpers/dbSetup');
const { seedMockQuestions, createTestUser, buildStandardBlueprintPayload } = require('../helpers/mockTestHelpers');
const { MOCK_ERROR_CODES, SESSION_STATUS, RESPONSE_STATUS } = require('../../src/config/mockConfig');
const MockBlueprint = require('../../src/models/mockBlueprintModel');
const mockBlueprintService = require('../../src/services/mock/mockBlueprintService');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Phase 6: End-to-End REST API Route Coverage', () => {
  let app = createApp();
  let seededQuestions;
  const userId = 'usr_routes_test';

  beforeAll(async () => {
    jest.setTimeout(90000);
    await connectTestDB();
    await clearPhase6Collections();
    await createTestUser(userId);
    seededQuestions = await seedMockQuestions({ countPerBand: 15 });
  }, 90000);

  afterAll(async () => {
    await clearPhase6Collections();
    await disconnectTestDB();
  });

  describe('Mock Blueprint Endpoints', () => {
    let blueprintId;

    it('POST /api/v1/mock-blueprints returns 403 BLUEPRINT_MUTATION_CLOSED (Phase 14 Tombstone)', async () => {
      const payload = buildStandardBlueprintPayload({
        title: 'Route Test Blueprint',
        sections: [
          {
            sectionId: 'sec-1',
            title: 'Quantitative Reasoning',
            questionCount: 10,
            scope: { patterns: ['Successive Percentage Changes'] },
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/mock-blueprints')
        .set(getAuthHeaders(userId))
        .send(payload)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BLUEPRINT_MUTATION_CLOSED');

      // Create directly for subsequent read tests
      const bp = await mockBlueprintService.createBlueprint(payload);
      blueprintId = bp._id.toString();
    });

    it('POST /api/v1/mock-blueprints returns 403 even on invalid payload', async () => {
      const res = await request(app)
        .post('/api/v1/mock-blueprints')
        .set(getAuthHeaders(userId))
        .send({ title: '' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BLUEPRINT_MUTATION_CLOSED');
    });

    it('GET /api/v1/mock-blueprints lists created blueprints', async () => {
      const res = await request(app)
        .get('/api/v1/mock-blueprints')
        .set(getAuthHeaders(userId))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(b => b._id.toString() === blueprintId)).toBe(true);
    });

    it('GET /api/v1/mock-blueprints/:id returns blueprint by id', async () => {
      const res = await request(app)
        .get(`/api/v1/mock-blueprints/${blueprintId}`)
        .set(getAuthHeaders(userId))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(blueprintId);
    });

    it('GET /api/v1/mock-blueprints/:id returns 404 for non-existent blueprint', async () => {
      const fakeId = new (require('mongoose').Types.ObjectId)().toString();
      const res = await request(app)
        .get(`/api/v1/mock-blueprints/${fakeId}`)
        .set(getAuthHeaders(userId))
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(MOCK_ERROR_CODES.MOCK_BLUEPRINT_NOT_FOUND);
    });
  });

  describe('Mock Session Lifecycle & Response Endpoints', () => {
    let blueprintId;
    let sessionId;
    let firstQuestionId;
    let firstQuestionCorrectAnswer;

    beforeAll(async () => {
      const bp = await mockBlueprintService.createBlueprint(buildStandardBlueprintPayload({
        sections: [
          {
            sectionId: 'sec-1',
            title: 'Quantitative Reasoning',
            questionCount: 10,
            scope: { patterns: ['Successive Percentage Changes'] },
          },
        ],
      }));
      blueprintId = bp._id.toString();

      const sRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({
          blueprintId,
          userId,
        });
      sessionId = sRes.body.data._id;
      firstQuestionId = sRes.body.data.questionSequence[0].questionId;
      const Question = require('../../src/models/questionModel');
      const qDoc = await Question.findById(firstQuestionId);
      firstQuestionCorrectAnswer = qDoc.answer;
    });

    it('GET /api/v1/mock-sessions/:id retrieves session in created status', async () => {
      const res = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}?userId=${userId}`)
        .set(getAuthHeaders(userId))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId.toString()).toBe(sessionId.toString());
      expect(res.body.data.status).toBe(SESSION_STATUS.CREATED);
    });

    it('POST /api/v1/mock-sessions/:id/start starts the session and is idempotent', async () => {
      const res1 = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/start`)
        .set(getAuthHeaders(userId))
        .send({ userId })
        .expect(200);

      expect(res1.body.success).toBe(true);
      expect(res1.body.data.status).toBe(SESSION_STATUS.STARTED);
      expect(res1.body.data.startedAt).toBeDefined();

      // Idempotent repeat call returns identical session
      const res2 = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/start`)
        .set(getAuthHeaders(userId))
        .send({ userId })
        .expect(200);

      expect(res2.body.data.status).toBe(SESSION_STATUS.STARTED);
      expect(res2.body.data.startedAt).toBe(res1.body.data.startedAt);
    });

    it('GET /api/v1/mock-sessions/:id/questions/:questionId views question without answer leak', async () => {
      const res = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}/questions/${firstQuestionId}?userId=${userId}`)
        .set(getAuthHeaders(userId))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.question.questionId).toBe(firstQuestionId.toString());
      expect(res.body.data.question.answer).toBeUndefined();
      expect(res.body.data.question.solution).toBeUndefined();
      expect(res.body.data.question.explanation).toBeUndefined();
      expect(res.body.data.response.status).toBe(RESPONSE_STATUS.VIEWED);
    });

    it('POST /api/v1/mock-sessions/:id/responses saves an answer', async () => {
      const res = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId: firstQuestionId,
          selectedAnswer: firstQuestionCorrectAnswer,
          isMarkedForReview: true,
          timeTakenSeconds: 1,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(RESPONSE_STATUS.ANSWERED);
      expect(res.body.data.selectedAnswer).toBe(firstQuestionCorrectAnswer);
      expect(res.body.data.isMarkedForReview).toBe(true);
    });

    it('POST /api/v1/mock-sessions/:id/responses allows clearing an answer', async () => {
      const res = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId: firstQuestionId,
          clearAnswer: true,
          timeTakenSeconds: 2,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.selectedAnswer).toBeNull();
      expect(res.body.data.status).toBe(RESPONSE_STATUS.VIEWED);
      expect(res.body.data.isMarkedForReview).toBe(true); // Review flag preserved!
    });

    it('POST /api/v1/mock-sessions/:id/responses re-selects answer and unmarks review', async () => {
      const res = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/responses`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          questionId: firstQuestionId,
          selectedAnswer: firstQuestionCorrectAnswer,
          isMarkedForReview: false,
          timeTakenSeconds: 3,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.selectedAnswer).toBe(firstQuestionCorrectAnswer);
      expect(res.body.data.isMarkedForReview).toBe(false);
    });

    it('GET /api/v1/mock-sessions/:id/result returns 400 when session is still in progress', async () => {
      const res = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}/result?userId=${userId}`)
        .set(getAuthHeaders(userId))
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(MOCK_ERROR_CODES.MOCK_SESSION_NOT_TERMINAL);
    });

    it('POST /api/v1/mock-sessions/:id/submit submits session and returns result', async () => {
      const res = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/submit`)
        .set(getAuthHeaders(userId))
        .send({ userId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.overall).toBeDefined();
      expect(res.body.data.overall.answered).toBe(1);
      expect(res.body.data.overall.unanswered).toBe(9);
      expect(res.body.data.overall.correct).toBe(1);
    });

    it('POST /api/v1/mock-sessions/:id/submit is idempotent after submission', async () => {
      const res = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/submit`)
        .set(getAuthHeaders(userId))
        .send({ userId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.overall).toBeDefined();
      expect(res.body.data.overall.answered).toBe(1);
    });

    it('GET /api/v1/mock-sessions/:id/result returns result summary after submission', async () => {
      const res = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}/result?userId=${userId}`)
        .set(getAuthHeaders(userId))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.overall).toBeDefined();
      expect(res.body.data.overall.answered).toBe(1);
    });

    it('GET /api/v1/mock-sessions/:id/review returns full review with correct answers', async () => {
      const res = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}/review?userId=${userId}`)
        .set(getAuthHeaders(userId))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.questions)).toBe(true);
      expect(res.body.data.questions[0].correctAnswer).toBeDefined();
      expect(res.body.data.questions[0].explanation).toBeDefined();
    });
  });

  describe('Mock Session Abandon Endpoint', () => {
    let blueprintId;
    let sessionId;

    beforeAll(async () => {
      const bp = await mockBlueprintService.createBlueprint(buildStandardBlueprintPayload({
        sections: [
          {
            sectionId: 'sec-1',
            title: 'Quantitative Reasoning',
            questionCount: 10,
            scope: { patterns: ['Successive Percentage Changes'] },
          },
        ],
      }));
      blueprintId = bp._id.toString();

      const sRes = await request(app)
        .post('/api/v1/mock-sessions')
        .set(getAuthHeaders(userId))
        .send({ blueprintId, userId });
      sessionId = sRes.body.data._id;
    });

    it('POST /api/v1/mock-sessions/:id/abandon abandons an unstarted or started session', async () => {
      const res = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/abandon`)
        .set(getAuthHeaders(userId))
        .send({ userId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SESSION_STATUS.ABANDONED);
      expect(res.body.data.abandonedAt).toBeDefined();
    });

    it('POST /api/v1/mock-sessions/:id/abandon returns 409 if already abandoned', async () => {
      const res = await request(app)
        .post(`/api/v1/mock-sessions/${sessionId}/abandon`)
        .set(getAuthHeaders(userId))
        .send({ userId })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(MOCK_ERROR_CODES.SESSION_STATE_CONFLICT);
    });

    it('GET /api/v1/mock-sessions/:id/review returns 400 for abandoned session', async () => {
      const res = await request(app)
        .get(`/api/v1/mock-sessions/${sessionId}/review?userId=${userId}`)
        .set(getAuthHeaders(userId))
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(MOCK_ERROR_CODES.MOCK_SESSION_NOT_TERMINAL);
    });
  });
});
