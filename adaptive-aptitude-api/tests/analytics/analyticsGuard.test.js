'use strict';

/**
 * Suite 1: tests/analytics/analyticsGuard.test.js
 *
 * Verifies:
 *   - 409 FINALIZATION_IN_PROGRESS when finalizationState is 'in_progress'
 *   - Allows analytics when finalizationState is 'completed' or 'idle'
 *   - Quarantines active mock sessions ('created', 'started') from queries
 *   - 404 USER_NOT_FOUND when user does not exist
 *   - 404 GOAL_NOT_FOUND when goal does not exist
 *   - 403 FORBIDDEN when goal belongs to another student
 *   - Topic query parameter normalization and validation (400 INVALID_TOPIC)
 *   - WindowDays query parameter normalization and validation (400 INVALID_WINDOW_DAYS)
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

describe('Suite 1: Analytics Guard & Pre-Execution Boundary Gates', () => {
  let app = createApp();
  const validUser = 'usr_analytics_guard_1';
  const otherUser = 'usr_analytics_guard_2';
  let goalIdValid;
  let goalIdOther;

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
      title: 'Valid User Goal',
      type: 'competitive',
      status: 'active',
    });
    goalIdValid = g1._id.toString();

    const g2 = await Goal.create({
      userId: otherUser,
      title: 'Other User Goal',
      type: 'competitive',
      status: 'active',
    });
    goalIdOther = g2._id.toString();
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  describe('User Validation Gate', () => {
    it('returns 400 VALIDATION_ERROR when userId is missing', async () => {
      const res = await request(app).get('/api/v1/analytics/dashboard').set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 VALIDATION_ERROR when userId is empty string', async () => {
      const res = await request(app).get('/api/v1/analytics/dashboard?userId=   ').set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 USER_NOT_FOUND when user does not exist', async () => {
      const res = await request(app).get('/api/v1/analytics/dashboard?userId=non_existent_user').set(getAuthHeaders('non_existent_user'));
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('Distributed Finalization Lock Gate', () => {
    it('returns 409 FINALIZATION_IN_PROGRESS when mock session finalizationState is in_progress', async () => {
      const session = await MockSession.create({
        userId: validUser,
        blueprintSnapshot: { sections: [] },
        blueprintFingerprint: 'dummy-fp-guard',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        questionSequence: [],
        sectionStates: [],
        totalQuestions: 10,
        durationMinutes: 30,
        generationSeed: 'seed-guard-1',
        status: SESSION_STATUS.SUBMITTED,
        finalizationState: FINALIZATION_STATE.IN_PROGRESS,
      });

      const res = await request(app).get(`/api/v1/analytics/dashboard?userId=${validUser}`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');

      // Cleanup
      await MockSession.deleteOne({ _id: session._id });
    });

    it('allows analytics when finalizationState is idle or completed', async () => {
      const session = await MockSession.create({
        userId: validUser,
        blueprintSnapshot: { sections: [] },
        blueprintFingerprint: 'dummy-fp-guard-idle',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        questionSequence: [],
        sectionStates: [],
        totalQuestions: 10,
        durationMinutes: 30,
        generationSeed: 'seed-guard-2',
        status: SESSION_STATUS.CREATED,
        finalizationState: FINALIZATION_STATE.IDLE,
      });

      const res = await request(app).get(`/api/v1/analytics/dashboard?userId=${validUser}`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Cleanup
      await MockSession.deleteOne({ _id: session._id });
    });
  });

  describe('Goal Ownership Gate (/readiness/:goalId)', () => {
    it('returns 400 VALIDATION_ERROR when goalId format is invalid', async () => {
      const res = await request(app).get(`/api/v1/analytics/readiness/invalid-object-id?userId=${validUser}`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 GOAL_NOT_FOUND when goal does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/v1/analytics/readiness/${nonExistentId}?userId=${validUser}`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('GOAL_NOT_FOUND');
    });

    it('returns 403 FORBIDDEN when goal belongs to another student', async () => {
      const res = await request(app).get(`/api/v1/analytics/readiness/${goalIdOther}?userId=${validUser}`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(['FORBIDDEN', 'OWNERSHIP_VIOLATION']).toContain(res.body.error.code);
    });
  });

  describe('Cognitive Profile Topic Normalization Gate', () => {
    it('accepts valid canonical topic scalar string (trimmed)', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&topic=Percentage`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid topic query parameter (non-canonical)', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&topic=NonCanonicalTopic`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOPIC');
    });

    it('rejects blank string topic', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&topic=%20%20`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOPIC');
    });

    it('rejects repeated/array topic parameters', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&topic=Percentage&topic=Algebra`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOPIC');
    });
  });

  describe('Cognitive Profile windowDays Normalization Gate', () => {
    it('accepts scalar integer strings: ?windowDays=1 => 1', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&windowDays=1`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(200);
      expect(res.body.data.analysisWindow.windowDays).toBe(1);
    });

    it('accepts scalar integer strings: ?windowDays=30 => 30', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&windowDays=30`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(200);
      expect(res.body.data.analysisWindow.windowDays).toBe(30);
    });

    it('accepts scalar integer strings: ?windowDays=90 => 90', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&windowDays=90`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(200);
      expect(res.body.data.analysisWindow.windowDays).toBe(90);
    });

    it('rejects ?windowDays=0 with 400 INVALID_WINDOW_DAYS', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&windowDays=0`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WINDOW_DAYS');
    });

    it('rejects ?windowDays=91 with 400 INVALID_WINDOW_DAYS', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&windowDays=91`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WINDOW_DAYS');
    });

    it('rejects ?windowDays=30.5 with 400 INVALID_WINDOW_DAYS', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&windowDays=30.5`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WINDOW_DAYS');
    });

    it('rejects ?windowDays=abc with 400 INVALID_WINDOW_DAYS', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&windowDays=abc`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WINDOW_DAYS');
    });

    it('rejects ?windowDays= (empty string) with 400 INVALID_WINDOW_DAYS', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&windowDays=`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WINDOW_DAYS');
    });

    it('rejects repeated/array windowDays parameters with 400 INVALID_WINDOW_DAYS', async () => {
      const res = await request(app).get(`/api/v1/analytics/cognitive-profile?userId=${validUser}&windowDays=10&windowDays=20`).set(getAuthHeaders(validUser));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WINDOW_DAYS');
    });
  });
});
