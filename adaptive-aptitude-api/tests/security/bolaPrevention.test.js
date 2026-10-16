'use strict';

/**
 * tests/security/bolaPrevention.test.js
 *
 * Security test suite for Phase 14 BOLA / IDOR Prevention across all business domains:
 * - Injected victim userId in body/query rejected with HTTP 403 IDENTITY_MISMATCH
 * - Cross-user resource document manipulation rejected with HTTP 403 OWNERSHIP_VIOLATION
 * - Zero authsessions lookups during ordinary JWT-authenticated requests
 */

const request = require('supertest');
const createApp = require('../../src/app');
const authService = require('../../src/services/authService');
const AuthSession = require('../../src/models/authSessionModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const Attempt = require('../../src/models/attemptModel');
const MockSession = require('../../src/models/mockSessionModel');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');
const { _clearRegistryForTesting } = require('../../src/middleware/rateLimiter');

describe('Security: BOLA & IDOR Prevention Matrix', () => {
  let app;
  const callerUserId = 'usr_alice_1001';
  const victimUserId = 'usr_bob_2002';
  let callerToken;

  beforeAll(() => {
    app = createApp();
    callerToken = authService.signAccessToken({
      userId: callerUserId,
      sessionId: 'sess_alice_1',
      tokenId: 'tok_alice_1'
    });
  });

  beforeEach(() => {
    _clearRegistryForTesting();
  });

  describe('Direct Identity Mismatch Rejection (HTTP 403 IDENTITY_MISMATCH)', () => {
    it('rejects POST /api/v1/goals with victim userId in body', async () => {
      const res = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${callerToken}`)
        .send({ userId: victimUserId, title: 'Hacked Goal' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });

    it('rejects POST /api/v1/study-plans with victim userId in body', async () => {
      const res = await request(app)
        .post('/api/v1/study-plans')
        .set('Authorization', `Bearer ${callerToken}`)
        .send({ userId: victimUserId, title: 'Hacked Plan' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });

    it('rejects POST /api/v1/attempts with victim userId in body', async () => {
      const res = await request(app)
        .post('/api/v1/attempts')
        .set('Authorization', `Bearer ${callerToken}`)
        .send({ userId: victimUserId, questionId: 'q_123' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });

    it('rejects GET /api/v1/adaptive/next-question with victim userId in query', async () => {
      const res = await request(app)
        .get(`/api/v1/adaptive/next-question?userId=${victimUserId}`)
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });

    it('rejects planning preview requests with victim userId in query/body', async () => {
      const res = await request(app)
        .get(`/api/v1/planning/preview?userId=${victimUserId}`)
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });

    it('rejects revision requests with victim userId in query/body', async () => {
      const res = await request(app)
        .get(`/api/v1/revisions/due?userId=${victimUserId}`)
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });

    it('rejects learning tutor requests with victim userId in body', async () => {
      const res = await request(app)
        .post('/api/v1/learning/tutoring/chat')
        .set('Authorization', `Bearer ${callerToken}`)
        .send({ userId: victimUserId, message: 'Explain problem' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });

    it('rejects analytics requests with victim userId in query', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/dashboard?userId=${victimUserId}`)
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });

    it('rejects orchestration requests with victim userId in query', async () => {
      const res = await request(app)
        .get(`/api/v1/orchestration/next-action?userId=${victimUserId}`)
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });

    it('rejects prescription issuance requests with victim userId in body', async () => {
      const res = await request(app)
        .post('/api/v1/attribution/prescriptions/issue')
        .set('Authorization', `Bearer ${callerToken}`)
        .send({ userId: victimUserId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
    });
  });

  describe('Resource Document Ownership Rejection (HTTP 403 OWNERSHIP_VIOLATION)', () => {
    it('rejects access to a goal owned by victim with HTTP 403 OWNERSHIP_VIOLATION', async () => {
      jest.spyOn(Goal, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'goal_victim_1', userId: victimUserId })
      });

      const res = await request(app)
        .get('/api/v1/goals/goal_victim_1')
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNERSHIP_VIOLATION');
      Goal.findById.mockRestore();
    });

    it('rejects access to a study plan owned by victim with HTTP 403 OWNERSHIP_VIOLATION', async () => {
      jest.spyOn(StudyPlan, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'plan_victim_1', userId: victimUserId })
      });

      const res = await request(app)
        .get('/api/v1/study-plans/plan_victim_1')
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNERSHIP_VIOLATION');
      StudyPlan.findById.mockRestore();
    });

    it('rejects access to an attempt owned by victim with HTTP 403 OWNERSHIP_VIOLATION', async () => {
      jest.spyOn(Attempt, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'att_victim_1', userId: victimUserId })
      });

      const res = await request(app)
        .get('/api/v1/attempts/att_victim_1')
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNERSHIP_VIOLATION');
      Attempt.findById.mockRestore();
    });

    it('rejects startSession on a mock session owned by victim with HTTP 403 OWNERSHIP_VIOLATION', async () => {
      jest.spyOn(MockSession, 'findById').mockResolvedValue({
        _id: 'mock_victim_1',
        userId: victimUserId
      });

      const res = await request(app)
        .post('/api/v1/mock-sessions/mock_victim_1/start')
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNERSHIP_VIOLATION');
      MockSession.findById.mockRestore();
    });

    it('rejects prescription activation on a prescription owned by victim with HTTP 403 OWNERSHIP_VIOLATION', async () => {
      const rxId = 'rx_000000000000000000000001';
      const User = require('../../src/models/userModel');
      jest.spyOn(User, 'exists').mockResolvedValue({ _id: 'u_1' });
      jest.spyOn(MockSession, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) })
      });
      jest.spyOn(PrescriptionExecutionRecord, 'findOne').mockResolvedValue({
        prescriptionId: rxId,
        userId: victimUserId
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rxId}/activate`)
        .set('Authorization', `Bearer ${callerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNERSHIP_VIOLATION');
      PrescriptionExecutionRecord.findOne.mockRestore();
      User.exists.mockRestore();
      MockSession.findOne.mockRestore();
    });
  });

  describe('Zero AuthSession Lookups During Ordinary Business Requests', () => {
    it('executes JWT-authenticated business request with zero AuthSession lookups', async () => {
      const findSpy = jest.spyOn(AuthSession, 'find');
      const findOneSpy = jest.spyOn(AuthSession, 'findOne');
      const findByIdSpy = jest.spyOn(AuthSession, 'findById');

      jest.spyOn(Goal, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      // Make request to an authenticated endpoint
      await request(app)
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${callerToken}`);

      expect(findSpy).not.toHaveBeenCalled();
      expect(findOneSpy).not.toHaveBeenCalled();
      expect(findByIdSpy).not.toHaveBeenCalled();

      findSpy.mockRestore();
      findOneSpy.mockRestore();
      findByIdSpy.mockRestore();
      Goal.find.mockRestore();
    });
  });
});
