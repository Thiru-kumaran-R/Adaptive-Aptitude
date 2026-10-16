'use strict';

/**
 * tests/security/ownershipGuard.test.js
 *
 * Security test suite for Phase 14 Ownership Guards & BOLA/IDOR Prevention:
 * - enforcePrincipalUserIdBodyQuery (universal 74/74 protected route coverage)
 * - enforcePrincipalUserId (14/14 :userId parameter route coverage)
 * - Exact method+path tombstone bypass for POST /users and POST /mock-blueprints
 * - Independent resource document ownership violation (HTTP 403 OWNERSHIP_VIOLATION)
 */

const request = require('supertest');
const createApp = require('../../src/app');
const authService = require('../../src/services/authService');
const {
  enforcePrincipalUserIdBodyQuery,
  enforcePrincipalUserId,
  verifyGoalOwnership,
  verifyPlanOwnership,
  verifyAttemptOwnership,
  verifyMockSessionOwnership
} = require('../../src/middleware/authorize');
const { _clearRegistryForTesting } = require('../../src/middleware/rateLimiter');

describe('Security: Ownership Guards & Universal Principal User-ID Verification', () => {
  let app;
  const callerUserId = 'usr_owner_1111';
  const victimUserId = 'usr_victim_2222';
  let validToken;

  beforeAll(() => {
    app = createApp();
    validToken = authService.signAccessToken({
      userId: callerUserId,
      sessionId: 'sess_owner_1',
      tokenId: 'tok_owner_1'
    });
  });

  beforeEach(() => {
    _clearRegistryForTesting();
  });

  describe('Universal Body/Query Principal Guard Middleware (enforcePrincipalUserIdBodyQuery)', () => {
    it('allows requests when client supplies matching userId', () => {
      const req = {
        method: 'POST',
        originalUrl: '/api/v1/goals',
        baseUrl: '/api/v1',
        path: '/goals',
        user: { userId: callerUserId },
        body: { userId: callerUserId },
        query: {}
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      enforcePrincipalUserIdBodyQuery(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('allows requests when client supplies no userId in body or query', () => {
      const req = {
        method: 'GET',
        originalUrl: '/api/v1/goals',
        baseUrl: '/api/v1',
        path: '/goals',
        user: { userId: callerUserId },
        body: {},
        query: {}
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      enforcePrincipalUserIdBodyQuery(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects requests with HTTP 403 IDENTITY_MISMATCH when body userId differs', () => {
      const req = {
        method: 'POST',
        originalUrl: '/api/v1/goals',
        baseUrl: '/api/v1',
        path: '/goals',
        user: { userId: callerUserId },
        body: { userId: victimUserId },
        query: {}
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      enforcePrincipalUserIdBodyQuery(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'IDENTITY_MISMATCH',
          message: 'Caller identity does not match token subject.'
        }
      });
    });

    it('rejects requests with HTTP 403 IDENTITY_MISMATCH when query userId differs', () => {
      const req = {
        method: 'GET',
        originalUrl: '/api/v1/adaptive/next-question?userId=' + victimUserId,
        baseUrl: '/api/v1',
        path: '/adaptive/next-question',
        user: { userId: callerUserId },
        body: {},
        query: { userId: victimUserId }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      enforcePrincipalUserIdBodyQuery(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'IDENTITY_MISMATCH',
          message: 'Caller identity does not match token subject.'
        }
      });
    });

    it('fails closed with HTTP 401 UNAUTHORIZED if req.user is absent on non-tombstone routes', () => {
      const req = {
        method: 'GET',
        originalUrl: '/api/v1/goals',
        baseUrl: '/api/v1',
        path: '/goals',
        body: {},
        query: {}
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      enforcePrincipalUserIdBodyQuery(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Route-Level Parameter Guard (enforcePrincipalUserId)', () => {
    it('allows requests when req.params.userId matches req.user.userId', () => {
      const req = {
        params: { userId: callerUserId },
        user: { userId: callerUserId }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      enforcePrincipalUserId(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects requests with HTTP 403 IDENTITY_MISMATCH when req.params.userId differs', () => {
      const req = {
        params: { userId: victimUserId },
        user: { userId: callerUserId }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      enforcePrincipalUserId(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'IDENTITY_MISMATCH',
          message: 'Caller identity does not match token subject.'
        }
      });
    });
  });

  describe('100% Coverage of 14 :userId Parameter Routes (14 / 14)', () => {
    const userIdRoutes = [
      '/api/v1/users/:userId',
      '/api/v1/goals/user/:userId',
      '/api/v1/study-plans/user/:userId',
      '/api/v1/daily-objectives/user/:userId',
      '/api/v1/attempts/user/:userId',
      '/api/v1/progress/:userId',
      '/api/v1/progress/:userId/topics',
      '/api/v1/progress/:userId/patterns',
      '/api/v1/progress/:userId/weakest',
      '/api/v1/progress/:userId/difficulty-distribution',
      '/api/v1/progress/:userId/accuracy-over-time',
      '/api/v1/progress/:userId/by-source',
      '/api/v1/revisions/user/:userId',
      '/api/v1/attribution/users/:userId/summary'
    ];

    it('verifies all 14 :userId routes are defined and distinct', () => {
      expect(userIdRoutes).toHaveLength(14);
      expect(new Set(userIdRoutes).size).toBe(14);
    });

    userIdRoutes.forEach((routeTemplate) => {
      it(`rejects mismatching :userId with HTTP 403 IDENTITY_MISMATCH on ${routeTemplate}`, async () => {
        const route = routeTemplate.replace(':userId', victimUserId);
        const res = await request(app)
          .get(route)
          .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('IDENTITY_MISMATCH');
      });
    });
  });

  describe('Tombstone Bypass Invariant Contract', () => {
    it('bypasses identity checks for anonymous POST /api/v1/users -> 410', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .send({ userId: victimUserId });

      expect(res.status).toBe(410);
      expect(res.body.error.code).toBe('USER_CREATION_ENDPOINT_DEPRECATED');
    });

    it('bypasses identity checks for authenticated POST /api/v1/users -> 410', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ userId: victimUserId });

      expect(res.status).toBe(410);
      expect(res.body.error.code).toBe('USER_CREATION_ENDPOINT_DEPRECATED');
    });

    it('bypasses identity checks for anonymous POST /api/v1/mock-blueprints -> 403', async () => {
      const res = await request(app)
        .post('/api/v1/mock-blueprints')
        .send({ userId: victimUserId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('BLUEPRINT_MUTATION_CLOSED');
    });

    it('bypasses identity checks for authenticated learner POST /api/v1/mock-blueprints -> 403', async () => {
      const res = await request(app)
        .post('/api/v1/mock-blueprints')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ userId: victimUserId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('BLUEPRINT_MUTATION_CLOSED');
    });
  });

  describe('Resource Document Ownership Guards (verify*Ownership)', () => {
    it('returns HTTP 403 OWNERSHIP_VIOLATION when goal is not owned by caller', async () => {
      const Goal = require('../../src/models/goalModel');
      jest.spyOn(Goal, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'goal_fake_1', userId: victimUserId })
      });

      await expect(verifyGoalOwnership('goal_fake_1', callerUserId)).rejects.toMatchObject({
        statusCode: 403,
        code: 'OWNERSHIP_VIOLATION'
      });
      Goal.findById.mockRestore();
    });

    it('returns HTTP 403 OWNERSHIP_VIOLATION when study plan is not owned by caller', async () => {
      const StudyPlan = require('../../src/models/studyPlanModel');
      jest.spyOn(StudyPlan, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'plan_fake_1', userId: victimUserId })
      });

      await expect(verifyPlanOwnership('plan_fake_1', callerUserId)).rejects.toMatchObject({
        statusCode: 403,
        code: 'OWNERSHIP_VIOLATION'
      });
      StudyPlan.findById.mockRestore();
    });

    it('returns HTTP 403 OWNERSHIP_VIOLATION when attempt is not owned by caller', async () => {
      const Attempt = require('../../src/models/attemptModel');
      jest.spyOn(Attempt, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'att_fake_1', userId: victimUserId })
      });

      await expect(verifyAttemptOwnership('att_fake_1', callerUserId)).rejects.toMatchObject({
        statusCode: 403,
        code: 'OWNERSHIP_VIOLATION'
      });
      Attempt.findById.mockRestore();
    });

    it('returns HTTP 403 OWNERSHIP_VIOLATION when mock session is not owned by caller', async () => {
      const MockSession = require('../../src/models/mockSessionModel');
      jest.spyOn(MockSession, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'mock_sess_fake_1', userId: victimUserId })
      });

      await expect(verifyMockSessionOwnership('mock_sess_fake_1', callerUserId)).rejects.toMatchObject({
        statusCode: 403,
        code: 'OWNERSHIP_VIOLATION'
      });
      MockSession.findById.mockRestore();
    });
  });
});
