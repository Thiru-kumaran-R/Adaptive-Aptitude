'use strict';

/**
 * Suite 4: Attribution Concurrency & CAS Race Tests — Phase 10: PAOA
 */

const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');

const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const Attempt = require('../../src/models/attemptModel');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Suite 4: Attribution Concurrency & Race Tests', () => {
  let app;
  const userId = 'usr_concurrency_test';

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
      { userId, email: `${userId}@example.com`, name: 'Concurrency Student' },
    ]);
  });

  // ── 1. Same-Key Concurrent Issuance Race ───────────────────────────────────
  describe('1. Same-Key Concurrent Issuance Race', () => {
    it('resolves concurrent same-key requests with exactly one 201 Created and one 200 OK replay', async () => {
      const idempotencyKey = 'key_concurrent_same_1';

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/v1/attribution/prescriptions')
          .set('Idempotency-Key', idempotencyKey)
          .set(getAuthHeaders(userId))
          .send({ userId, originSurface: 'next_action' }),
        request(app)
          .post('/api/v1/attribution/prescriptions')
          .set('Idempotency-Key', idempotencyKey)
          .set(getAuthHeaders(userId))
          .send({ userId, originSurface: 'next_action' }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 201]);

      // Exactly one record created in MongoDB
      const count = await PrescriptionExecutionRecord.countDocuments({
        userId,
        issuanceIdempotencyKey: idempotencyKey,
      });
      expect(count).toBe(1);

      // Both returned the same prescriptionId
      expect(res1.body.data.prescriptionId).toBe(res2.body.data.prescriptionId);
    });
  });

  // ── 2. Different-Key Active-Slot Race ───────────────────────────────────────
  describe('2. Different-Key Active-Slot Race', () => {
    it('handles concurrent different-key issuance safely without double slot allocation', async () => {
      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/v1/attribution/prescriptions')
          .set('Idempotency-Key', 'key_race_diff_1')
          .set(getAuthHeaders(userId))
          .send({ userId, originSurface: 'next_action' }),
        request(app)
          .post('/api/v1/attribution/prescriptions')
          .set('Idempotency-Key', 'key_race_diff_2')
          .set(getAuthHeaders(userId))
          .send({ userId, originSurface: 'next_action' }),
      ]);

      // One or both succeeded, but at most ONE non-terminal prescription exists for the user
      const nonTerminalCount = await PrescriptionExecutionRecord.countDocuments({
        userId,
        status: { $in: ['issued', 'active'] },
        nonTerminalSlotKey: userId,
      });

      expect(nonTerminalCount).toBe(1);
    });
  });

  // ── 3. Activation CAS Race ────────────────────────────────────────────────
  describe('3. Activation CAS Race', () => {
    it('handles concurrent activation requests idempotently without duplicate mutation', async () => {
      const rxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
      const now = new Date();
      await PrescriptionExecutionRecord.create({
        prescriptionId: rxId,
        userId,
        issuanceIdempotencyKey: 'key_act_race',
        issuanceRequestFingerprint: 'c'.repeat(64),
        nonTerminalSlotKey: userId,
        phase10AlgorithmVersion: 'v1',
        orchestrationAlgorithmVersion: 'v1',
        originSurface: 'next_action',
        actionId: 'test_act',
        actionType: 'DIAGNOSTIC_ASSESSMENT',
        actionSubtype: 'FOUNDATIONAL_DIAGNOSTIC',
        priorityTier: 'normal',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        prescribedQuestions: 5,
        issuanceSnapshot: {
          actionType: 'DIAGNOSTIC_ASSESSMENT',
          actionSubtype: 'FOUNDATIONAL_DIAGNOSTIC',
          topic: 'Algebra',
          pattern: 'Linear Equations & Systems of Equations',
          storedMastery: 0,
          existingAttemptCount: 0,
        },
        status: 'issued',
        issuedAt: now,
        expiresAt: new Date(now.getTime() + 86400000),
        lastActivityAt: now,
      });

      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/v1/attribution/prescriptions/${rxId}/activate`)
          .set(getAuthHeaders(userId))
          .send({ userId }),
        request(app)
          .post(`/api/v1/attribution/prescriptions/${rxId}/activate`)
          .set(getAuthHeaders(userId))
          .send({ userId }),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.status).toBe('active');
      expect(res2.body.data.status).toBe('active');

      const inDb = await PrescriptionExecutionRecord.findOne({ prescriptionId: rxId });
      expect(inDb.status).toBe('active');
    });
  });

  // ── 4. Completion vs Abandonment CAS Race ──────────────────────────────────
  describe('4. Completion vs Abandonment CAS Race', () => {
    it('ensures exactly one terminal status wins when complete and abandon race concurrently', async () => {
      const rxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
      const now = new Date();
      const activatedAt = new Date(now.getTime() - 60000);

      await PrescriptionExecutionRecord.create({
        prescriptionId: rxId,
        userId,
        issuanceIdempotencyKey: 'key_race_comp_aband',
        issuanceRequestFingerprint: 'd'.repeat(64),
        nonTerminalSlotKey: userId,
        phase10AlgorithmVersion: 'v1',
        orchestrationAlgorithmVersion: 'v1',
        originSurface: 'next_action',
        actionId: 'test_act',
        actionType: 'DIAGNOSTIC_ASSESSMENT',
        actionSubtype: 'FOUNDATIONAL_DIAGNOSTIC',
        priorityTier: 'normal',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        prescribedQuestions: 1,
        issuanceSnapshot: { actionType: 'DIAGNOSTIC_ASSESSMENT' },
        activationBaselineSnapshot: { actionType: 'DIAGNOSTIC_ASSESSMENT' },
        status: 'active',
        issuedAt: new Date(activatedAt.getTime() - 60000),
        activatedAt,
        expiresAt: new Date(now.getTime() + 86400000),
        lastActivityAt: activatedAt,
      });

      // Add 1 valid attributed attempt
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        sessionId: rxId,
        source: 'practice',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 45,
        attemptedAt: new Date(activatedAt.getTime() + 5000),
      });

      const [compRes, abandRes] = await Promise.all([
        request(app)
          .post(`/api/v1/attribution/prescriptions/${rxId}/complete`)
          .set(getAuthHeaders(userId))
          .send({ userId }),
        request(app)
          .post(`/api/v1/attribution/prescriptions/${rxId}/complete`)
          .set(getAuthHeaders(userId))
          .send({ userId, abandon: true }),
      ]);

      const inDb = await PrescriptionExecutionRecord.findOne({ prescriptionId: rxId });
      // Record must have exactly one terminal status ('completed' or 'abandoned')
      expect(['completed', 'abandoned']).toContain(inDb.status);
      expect(inDb.nonTerminalSlotKey).toBeNull();

      // No double transition or corrupted status
      if (inDb.status === 'completed') {
        expect(compRes.status).toBe(200);
      } else {
        expect(abandRes.status).toBe(200);
      }
    });
  });

  // ── 5. Expiry CAS Race ────────────────────────────────────────────────────
  describe('5. Expiry CAS Race', () => {
    it('prevents completion of prescription whose lease expired, materializing expiry atomically', async () => {
      const rxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
      const past = new Date(Date.now() - 5000);

      await PrescriptionExecutionRecord.create({
        prescriptionId: rxId,
        userId,
        issuanceIdempotencyKey: 'key_race_expiry',
        issuanceRequestFingerprint: 'e'.repeat(64),
        nonTerminalSlotKey: userId,
        phase10AlgorithmVersion: 'v1',
        orchestrationAlgorithmVersion: 'v1',
        originSurface: 'next_action',
        actionId: 'test_act',
        actionType: 'DIAGNOSTIC_ASSESSMENT',
        actionSubtype: 'FOUNDATIONAL_DIAGNOSTIC',
        priorityTier: 'normal',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        prescribedQuestions: 1,
        issuanceSnapshot: { actionType: 'DIAGNOSTIC_ASSESSMENT' },
        activationBaselineSnapshot: { actionType: 'DIAGNOSTIC_ASSESSMENT' },
        status: 'active',
        issuedAt: new Date(past.getTime() - 60000),
        activatedAt: new Date(past.getTime() - 30000),
        expiresAt: past, // Expired
        lastActivityAt: past,
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rxId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PRESCRIPTION_STATE_CONFLICT');

      const inDb = await PrescriptionExecutionRecord.findOne({ prescriptionId: rxId });
      expect(inDb.status).toBe('expired');
      expect(inDb.nonTerminalSlotKey).toBeNull();
    });
  });
});
