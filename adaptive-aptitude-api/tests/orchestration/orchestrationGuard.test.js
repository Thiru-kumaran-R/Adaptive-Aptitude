'use strict';

/**
 * Suite 1: tests/orchestration/orchestrationGuard.test.js
 *
 * Verifies Phase 9 dedicated orchestrationGuard gates:
 *   - Missing, blank, array userId -> 400 VALIDATION_ERROR
 *   - Unknown user -> 404 USER_NOT_FOUND
 *   - Malformed goalId -> 400 VALIDATION_ERROR
 *   - Missing goalId in DB -> 404 GOAL_NOT_FOUND
 *   - Foreign goal (ownership mismatch) -> 403 FORBIDDEN
 *   - Mock session with finalizationState = 'in_progress' -> 409 FINALIZATION_IN_PROGRESS
 *   - All 3 Phase 9 endpoints strictly protected by orchestrationGuard
 *   - Reference clock is attached to context
 */

const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const MockSession = require('../../src/models/mockSessionModel');
const { MOCK_MODES, NAVIGATION_POLICIES, SESSION_STATUS, FINALIZATION_STATE } = require('../../src/config/mockConfig');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Suite 1: Phase 9 Orchestration Guard Tests', () => {
  let app = createApp();
  const validUser = 'usr_orch_guard_1';
  const otherUser = 'usr_orch_guard_2';
  let validGoalId;
  let otherGoalId;

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();

    await User.create([
      { userId: validUser, email: 'guard1@test.com', name: 'Guard User 1' },
      { userId: otherUser, email: 'guard2@test.com', name: 'Guard User 2' },
    ]);

    const g1 = await Goal.create({
      userId: validUser,
      title: 'Valid Goal',
      type: 'competitive',
      status: 'active',
      targetDate: new Date('2026-11-01T00:00:00Z'),
    });
    validGoalId = g1._id.toString();

    const g2 = await Goal.create({
      userId: otherUser,
      title: 'Other Goal',
      type: 'competitive',
      status: 'active',
      targetDate: new Date('2026-11-01T00:00:00Z'),
    });
    otherGoalId = g2._id.toString();
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await MockSession.deleteMany({});
  });

  const routes = [
    '/api/v1/orchestration/next-action',
    '/api/v1/orchestration/daily-agenda',
    '/api/v1/orchestration/interventions',
  ];

  describe('1. userId Parameter Validation', () => {
    routes.forEach((route) => {
      it(`[${route}] rejects missing userId with 400 VALIDATION_ERROR`, async () => {
        const res = await request(app).get(route).set(getAuthHeaders(validUser));
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      });

      it(`[${route}] rejects empty or whitespace userId with 400 VALIDATION_ERROR`, async () => {
        const res = await request(app).get(`${route}?userId=   `).set(getAuthHeaders(validUser));
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      });

      it(`[${route}] rejects array userId with 400 VALIDATION_ERROR`, async () => {
        const res = await request(app).get(`${route}?userId=u1&userId=u2`).set(getAuthHeaders(validUser));
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      });

      it(`[${route}] rejects unknown userId with 404 USER_NOT_FOUND`, async () => {
        const res = await request(app).get(`${route}?userId=nonexistent_user`).set(getAuthHeaders('nonexistent_user'));
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('USER_NOT_FOUND');
      });
    });
  });

  describe('2. goalId Parameter Validation', () => {
    routes.forEach((route) => {
      it(`[${route}] rejects malformed goalId with 400 VALIDATION_ERROR`, async () => {
        const res = await request(app).get(`${route}?userId=${validUser}&goalId=invalid-hex-id`).set(getAuthHeaders(validUser));
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      });

      it(`[${route}] rejects missing goal in DB with 404 GOAL_NOT_FOUND`, async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).get(`${route}?userId=${validUser}&goalId=${fakeId}`).set(getAuthHeaders(validUser));
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('GOAL_NOT_FOUND');
      });

      it(`[${route}] rejects foreign goal (different student) with 403 FORBIDDEN`, async () => {
        const res = await request(app).get(`${route}?userId=${validUser}&goalId=${otherGoalId}`).set(getAuthHeaders(validUser));
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(['FORBIDDEN', 'OWNERSHIP_VIOLATION']).toContain(res.body.error.code);
      });
    });
  });

  describe('3. Finalization Lockout Barrier (409 Conflict)', () => {
    routes.forEach((route) => {
      it(`[${route}] returns 409 FINALIZATION_IN_PROGRESS when mock session has finalizationState="in_progress"`, async () => {
        await MockSession.create({
          userId: validUser,
          mode: MOCK_MODES.STANDARD,
          status: SESSION_STATUS.SUBMITTED,
          finalizationState: FINALIZATION_STATE.IN_PROGRESS,
          navigationPolicy: NAVIGATION_POLICIES.FREE,
          effectiveExcludeRecentQuestions: false,
          generationSeed: 'seed_orch_guard',
          blueprintFingerprint: 'bp_fp_orch_guard',
          totalQuestions: 10,
          durationMinutes: 30,
          blueprintSnapshot: {
            title: 'Mock BP',
            examType: 'standard',
            totalQuestions: 10,
            durationMinutes: 30,
            sections: [],
          },
          sectionStates: [],
          questionSequence: [],
        });

        const res = await request(app).get(`${route}?userId=${validUser}`).set(getAuthHeaders(validUser));
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');
      });

      it(`[${route}] allows query when finalizationState is "completed"`, async () => {
        await MockSession.create({
          userId: validUser,
          mode: MOCK_MODES.STANDARD,
          status: SESSION_STATUS.SUBMITTED,
          finalizationState: FINALIZATION_STATE.COMPLETED,
          navigationPolicy: NAVIGATION_POLICIES.FREE,
          effectiveExcludeRecentQuestions: false,
          generationSeed: 'seed_orch_guard_completed',
          blueprintFingerprint: 'bp_fp_orch_guard_completed',
          totalQuestions: 10,
          durationMinutes: 30,
          blueprintSnapshot: {
            title: 'Mock BP',
            examType: 'standard',
            totalQuestions: 10,
            durationMinutes: 30,
            sections: [],
          },
          sectionStates: [],
          questionSequence: [],
        });

        const res = await request(app).get(`${route}?userId=${validUser}`).set(getAuthHeaders(validUser));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });

  describe('4. Reference Clock Attachment', () => {
    it('returns meta.referenceNow matching ISO format on next-action', async () => {
      const res = await request(app).get(`/api/v1/orchestration/next-action?userId=${validUser}`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(200);
      expect(res.body.meta).toBeDefined();
      expect(typeof res.body.meta.referenceNow).toBe('string');
      expect(new Date(res.body.meta.referenceNow).toISOString()).toBe(res.body.meta.referenceNow);
    });
  });
});
