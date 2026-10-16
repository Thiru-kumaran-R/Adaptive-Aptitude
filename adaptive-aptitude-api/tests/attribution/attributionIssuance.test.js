'use strict';

/**
 * Suite 1: Attribution Prescription Issuance Tests — Phase 10: PAOA
 */

const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const StudentProgress = require('../../src/models/studentProgressModel');
const RevisionItem = require('../../src/models/revisionItemModel');
const Attempt = require('../../src/models/attemptModel');
const MockSession = require('../../src/models/mockSessionModel');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');

const { computeIssuanceFingerprint } = require('../../src/utils/attributionFingerprint');
const attributionConfig = require('../../src/config/attributionConfig');
const { ORCHESTRATION_ALGORITHM_VERSION } = require('../../src/config/orchestrationConfig');

describe('Suite 1: Attribution Prescription Issuance Tests', () => {
  let app;
  const userId = 'usr_issuance_test';
  const otherUserId = 'usr_other_test';

  beforeAll(async () => {
    await connectTestDB();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearAllTestCollections();
    await PrescriptionExecutionRecord.deleteMany({});

    await User.create([
      { userId, email: `${userId}@example.com`, name: 'Issuance Student' },
      { userId: otherUserId, email: `${otherUserId}@example.com`, name: 'Other Student' },
    ]);
  });

  // ── 1. Model & Index Contract Verification ─────────────────────────────────
  describe('1. Model & Index Verification', () => {
    it('verifies exactly 6 custom indexes and 0 field-level unique/index declarations', () => {
      const indexes = PrescriptionExecutionRecord.schema.indexes();
      expect(indexes).toHaveLength(6);

      const [idx1, idx2, idx3, idx4, idx5, idx6] = indexes;

      // 1. prescriptionId unique
      expect(idx1[0]).toEqual({ prescriptionId: 1 });
      expect(idx1[1].unique).toBe(true);

      // 2. compound userId + issuanceIdempotencyKey unique
      expect(idx2[0]).toEqual({ userId: 1, issuanceIdempotencyKey: 1 });
      expect(idx2[1].unique).toBe(true);

      // 3. partial unique nonTerminalSlotKey
      expect(idx3[0]).toEqual({ nonTerminalSlotKey: 1 });
      expect(idx3[1].unique).toBe(true);
      expect(idx3[1].partialFilterExpression).toEqual({
        nonTerminalSlotKey: { $type: 'string' },
      });

      // 4. userId + issuedAt DESC
      expect(idx4[0]).toEqual({ userId: 1, issuedAt: -1 });

      // 5. status + expiresAt
      expect(idx5[0]).toEqual({ status: 1, expiresAt: 1 });

      // 6. policyVersion + policyFingerprint sparse
      expect(idx6[0]).toEqual({ policyVersion: 1, policyFingerprint: 1 });
      expect(idx6[1].sparse).toBe(true);

      // Verify 0 field-level index or unique flags
      const paths = PrescriptionExecutionRecord.schema.paths;
      for (const [pathname, pathObj] of Object.entries(paths)) {
        if (pathname === '_id') continue;
        expect(pathObj._index).toBeFalsy();
      }
    });

    it('verifies exactly 16 Mongoose models in registry', () => {
      const modelNames = mongoose.modelNames();
      expect(modelNames).toHaveLength(16);
      expect(modelNames).toContain('PrescriptionExecutionRecord');
      expect(modelNames).toContain('OrchestrationPolicyVersion');
    });
  });

  // ── 2. Request Fingerprint Determinism ─────────────────────────────────────
  describe('2. Fingerprint Determinism & Delimiter Safety', () => {
    it('generates identical SHA-256 digests regardless of call sequence', () => {
      const fp1 = computeIssuanceFingerprint(userId, 'next_action', '64b8f0a1c9e77b0012a4b891', null);
      const fp2 = computeIssuanceFingerprint(userId, 'next_action', '64b8f0a1c9e77b0012a4b891', null);
      expect(fp1).toHaveLength(64);
      expect(fp1).toBe(fp2);
    });

    it('produces different hashes for different payloads without delimiter collision', () => {
      const fp1 = computeIssuanceFingerprint(userId, 'next_action', null, 'act:1');
      const fp2 = computeIssuanceFingerprint(userId, 'next_action', 'act:1', null);
      expect(fp1).not.toBe(fp2);
    });
  });

  // ── 3. goalId Validation Contract ──────────────────────────────────────────
  describe('3. goalId Validation Contract', () => {
    it('succeeds when goalId is omitted (resolvedGoal = null, no Phase 10 active goal scan)', async () => {
      const res = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_goal_omitted_1')
        .send({
          userId,
          originSurface: 'next_action',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prescriptionId).toMatch(/^rx_[a-f0-9]{24}$/);
      expect(res.body.data.status).toBe('issued');
    });

    it('returns 400 VALIDATION_ERROR on malformed goalId syntax', async () => {
      const res = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_invalid_goal')
        .send({
          userId,
          originSurface: 'next_action',
          goalId: 'invalid-goal-id-syntax',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 GOAL_NOT_FOUND on non-existent goalId', async () => {
      const nonExistentGoalId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_missing_goal')
        .send({
          userId,
          originSurface: 'next_action',
          goalId: nonExistentGoalId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('GOAL_NOT_FOUND');
    });

    it('returns 403 FORBIDDEN on foreign goalId', async () => {
      const foreignGoal = await Goal.create({
        userId: otherUserId,
        title: 'TCS Placement Prep',
        type: 'company',
        targetDate: new Date('2026-12-01'),
        status: 'active',
      });

      const res = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_foreign_goal')
        .send({
          userId,
          originSurface: 'next_action',
          goalId: foreignGoal._id.toString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ── 4. Idempotency Key Replay Semantics ─────────────────────────────────────
  describe('4. Idempotency & Replay Semantics', () => {
    it('returns 200 OK idempotent replay with same key and same payload (zero writes)', async () => {
      const firstRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_replay_same_1')
        .send({
          userId,
          originSurface: 'next_action',
        });
      expect(firstRes.status).toBe(201);
      const initialRxId = firstRes.body.data.prescriptionId;

      const countBefore = await PrescriptionExecutionRecord.countDocuments();

      const replayRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_replay_same_1')
        .send({
          userId,
          originSurface: 'next_action',
        });

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.prescriptionId).toBe(initialRxId);

      const countAfter = await PrescriptionExecutionRecord.countDocuments();
      expect(countAfter).toBe(countBefore);
    });

    it('returns 409 IDEMPOTENCY_KEY_REUSE_MISMATCH on same key with differing payload', async () => {
      await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_mismatch_1')
        .send({
          userId,
          originSurface: 'next_action',
        });

      const mismatchRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_mismatch_1')
        .send({
          userId,
          originSurface: 'daily_agenda',
          actionId: 'some_action_id',
        });

      expect(mismatchRes.status).toBe(409);
      expect(mismatchRes.body.error.code).toBe('IDEMPOTENCY_KEY_REUSE_MISMATCH');
    });

    it('returns 200 OK replay with effectiveStatus = "expired" after lease expires (zero writes)', async () => {
      const issuedRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_expired_replay')
        .send({
          userId,
          originSurface: 'next_action',
        });
      expect(issuedRes.status).toBe(201);

      // Manually wind record expiresAt into the past
      await PrescriptionExecutionRecord.updateOne(
        { prescriptionId: issuedRes.body.data.prescriptionId },
        { expiresAt: new Date(Date.now() - 3600000) }
      );

      const replayRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_expired_replay')
        .send({
          userId,
          originSurface: 'next_action',
        });

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.effectiveStatus).toBe('expired');
      expect(replayRes.body.data.isExpired).toBe(true);

      // Verify status in DB remains unmodified ('issued') during read-only replay
      const stored = await PrescriptionExecutionRecord.findOne({
        prescriptionId: issuedRes.body.data.prescriptionId,
      });
      expect(stored.status).toBe('issued');
    });
  });

  // ── 5. Predecessor Supersession & Expiry ────────────────────────────────────
  describe('5. Predecessor Supersession & Expiry', () => {
    it('supersedes unexpired predecessor on new issuance with different key', async () => {
      const firstRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_predecessor_1')
        .send({
          userId,
          originSurface: 'next_action',
        });
      expect(firstRes.status).toBe(201);
      const firstRxId = firstRes.body.data.prescriptionId;

      const secondRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_predecessor_2')
        .send({
          userId,
          originSurface: 'next_action',
        });
      expect(secondRes.status).toBe(201);
      const secondRxId = secondRes.body.data.prescriptionId;

      const predRecord = await PrescriptionExecutionRecord.findOne({ prescriptionId: firstRxId });
      expect(predRecord.status).toBe('superseded');
      expect(predRecord.supersededByPrescriptionId).toBe(secondRxId);
      expect(predRecord.nonTerminalSlotKey).toBeNull();
      expect(predRecord.supersededAt).toBeDefined();

      const newRecord = await PrescriptionExecutionRecord.findOne({ prescriptionId: secondRxId });
      expect(newRecord.status).toBe('issued');
      expect(newRecord.nonTerminalSlotKey).toBe(userId);
    });

    it('marks expired predecessor as status: "expired" when referenceNow >= expiresAt', async () => {
      const firstRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_predecessor_expired_1')
        .send({
          userId,
          originSurface: 'next_action',
        });
      const firstRxId = firstRes.body.data.prescriptionId;

      // Wind expiresAt into past
      await PrescriptionExecutionRecord.updateOne(
        { prescriptionId: firstRxId },
        { expiresAt: new Date(Date.now() - 5000) }
      );

      const secondRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_predecessor_expired_2')
        .send({
          userId,
          originSurface: 'next_action',
        });
      expect(secondRes.status).toBe(201);

      const predRecord = await PrescriptionExecutionRecord.findOne({ prescriptionId: firstRxId });
      expect(predRecord.status).toBe('expired');
      expect(predRecord.supersededAt).toBeNull();
      expect(predRecord.supersededByPrescriptionId).toBeNull();
      expect(predRecord.nonTerminalSlotKey).toBeNull();
    });
  });

  // ── 6. Origin Surfaces & COGNITIVE_REST Rejection ──────────────────────────
  describe('6. Origin Surfaces & Rejection', () => {
    it('returns 409 NO_ISSUABLE_PRESCRIPTION if actionId not found in daily agenda activities', async () => {
      const res = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_agenda_not_found')
        .send({
          userId,
          originSurface: 'daily_agenda',
          actionId: 'non_existent_activity_id',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('NO_ISSUABLE_PRESCRIPTION');
    });

    it('preserves full executionIntent and public Phase 9 DTO structure', async () => {
      const res = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set(getAuthHeaders(userId))
        .set('Idempotency-Key', 'key_dto_structure_1')
        .send({
          userId,
          originSurface: 'next_action',
        });

      expect(res.status).toBe(201);
      const action = res.body.data.action;
      expect(action).toBeDefined();
      expect(action.actionId).toBeDefined();
      expect(action.actionType).toBeDefined();
      expect(action.actionSubtype).toBeDefined();
      expect(action.priorityTier).toBeDefined();
      expect(action.prescribedQuestions).toBeGreaterThanOrEqual(0);
      expect(action.executionIntent).toBeDefined();
      expect(action.executionIntent.capability).toBeDefined();
    });
  });
});
