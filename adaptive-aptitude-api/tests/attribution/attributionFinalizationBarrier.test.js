'use strict';

/**
 * Suite 6: Attribution Finalization Barrier Tests — Phase 10: PAOA
 */

const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');

const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const MockSession = require('../../src/models/mockSessionModel');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Suite 6: Attribution Finalization Barrier Tests', () => {
  let app;
  const userId = 'usr_barrier_test';

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
      { userId, email: `${userId}@example.com`, name: 'Barrier Student' },
    ]);
  });

  const createActiveMockInFinalization = async () => {
    return MockSession.create({
      userId,
      blueprintSnapshot: {
        sections: [
          {
            sectionId: 'sec-1',
            order: 0,
            questionCount: 5,
            scope: { patterns: ['Linear Equations & Systems of Equations'] },
          },
        ],
      },
      blueprintFingerprint: 'fp-lock',
      mode: 'standard',
      navigationPolicy: 'free',
      effectiveExcludeRecentQuestions: false,
      questionSequence: [],
      sectionStates: [],
      totalQuestions: 5,
      durationMinutes: 10,
      generationSeed: 'seed-lock',
      status: 'submitted',
      finalizationState: 'in_progress',
      finalizationLeaseExpiresAt: new Date(Date.now() + 30000),
    });
  };

  // ── 1. Issuance Barrier ────────────────────────────────────────────────────
  describe('1. Issuance Barrier', () => {
    it('blocks prescription issuance when finalizationState is in_progress', async () => {
      const lockSession = await createActiveMockInFinalization();

      const res = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set('Idempotency-Key', 'key_barrier_issuance_1')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          originSurface: 'next_action',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');

      // Clear finalization lock
      await MockSession.updateOne({ _id: lockSession._id }, { finalizationState: 'completed' });

      // Issuance succeeds immediately after finalization clears
      const retryRes = await request(app)
        .post('/api/v1/attribution/prescriptions')
        .set('Idempotency-Key', 'key_barrier_issuance_1')
        .set(getAuthHeaders(userId))
        .send({
          userId,
          originSurface: 'next_action',
        });

      expect(retryRes.status).toBe(201);
      expect(retryRes.body.data.status).toBe('issued');
    });
  });

  // ── 2. PACING_CALIBRATION Activation & Completion Barrier ──────────────────
  describe('2. PACING_CALIBRATION Barrier', () => {
    it('blocks PACING_CALIBRATION activation when finalization is in_progress', async () => {
      const rxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
      const now = new Date();
      await PrescriptionExecutionRecord.create({
        prescriptionId: rxId,
        userId,
        issuanceIdempotencyKey: 'key_pacing_barrier',
        issuanceRequestFingerprint: 'a'.repeat(64),
        nonTerminalSlotKey: userId,
        phase10AlgorithmVersion: 'v1',
        orchestrationAlgorithmVersion: 'v1',
        originSurface: 'next_action',
        actionId: 'act_pacing',
        actionType: 'PACING_CALIBRATION',
        actionSubtype: 'CALIBRATION_PRACTICE',
        priorityTier: 'normal',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        prescribedQuestions: 5,
        issuanceSnapshot: { actionType: 'PACING_CALIBRATION' },
        status: 'issued',
        issuedAt: now,
        expiresAt: new Date(now.getTime() + 86400000),
        lastActivityAt: now,
      });

      const lockSession = await createActiveMockInFinalization();

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rxId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');

      // Clear lock
      await MockSession.updateOne({ _id: lockSession._id }, { finalizationState: 'completed' });

      const retryRes = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rxId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.status).toBe('active');
    });

    it('blocks PACING_CALIBRATION completion when finalization is in_progress', async () => {
      const rxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
      const now = new Date();
      const activatedAt = new Date(now.getTime() - 60000);

      await PrescriptionExecutionRecord.create({
        prescriptionId: rxId,
        userId,
        issuanceIdempotencyKey: 'key_pacing_comp_barrier',
        issuanceRequestFingerprint: 'b'.repeat(64),
        nonTerminalSlotKey: userId,
        phase10AlgorithmVersion: 'v1',
        orchestrationAlgorithmVersion: 'v1',
        originSurface: 'next_action',
        actionId: 'act_pacing',
        actionType: 'PACING_CALIBRATION',
        actionSubtype: 'CALIBRATION_PRACTICE',
        priorityTier: 'normal',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        prescribedQuestions: 0,
        issuanceSnapshot: { actionType: 'PACING_CALIBRATION' },
        activationBaselineSnapshot: {
          actionType: 'PACING_CALIBRATION',
          topic: 'Algebra',
          topicRushingRiskScore: 0.65,
          rushingRiskWindowDays: 30,
        },
        status: 'active',
        issuedAt: new Date(activatedAt.getTime() - 60000),
        activatedAt,
        expiresAt: new Date(now.getTime() + 86400000),
        lastActivityAt: activatedAt,
      });

      const lockSession = await createActiveMockInFinalization();

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rxId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');

      // Clear lock
      await MockSession.updateOne({ _id: lockSession._id }, { finalizationState: 'completed' });

      const retryRes = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rxId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.status).toBe('completed');
    });
  });

  // ── 3. EXAM_BENCHMARK Activation Barrier ───────────────────────────────────
  describe('3. EXAM_BENCHMARK Barrier', () => {
    it('blocks EXAM_BENCHMARK activation when finalization is in_progress', async () => {
      const goal = await Goal.create({
        userId,
        title: 'Benchmark Goal',
        type: 'company',
        targetDate: new Date('2026-12-01'),
        status: 'active',
      });

      const rxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
      const now = new Date();
      await PrescriptionExecutionRecord.create({
        prescriptionId: rxId,
        userId,
        issuanceIdempotencyKey: 'key_benchmark_barrier',
        issuanceRequestFingerprint: 'c'.repeat(64),
        nonTerminalSlotKey: userId,
        phase10AlgorithmVersion: 'v1',
        orchestrationAlgorithmVersion: 'v1',
        originSurface: 'next_action',
        actionId: 'act_benchmark',
        actionType: 'EXAM_BENCHMARK',
        actionSubtype: 'BENCHMARK_FULL_SIMULATION',
        priorityTier: 'normal',
        goalId: goal._id,
        prescribedQuestions: 0,
        issuanceSnapshot: { actionType: 'EXAM_BENCHMARK', goalId: String(goal._id) },
        status: 'issued',
        issuedAt: now,
        expiresAt: new Date(now.getTime() + 86400000),
        lastActivityAt: now,
      });

      const lockSession = await createActiveMockInFinalization();

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rxId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('FINALIZATION_IN_PROGRESS');

      // Clear lock
      await MockSession.updateOne({ _id: lockSession._id }, { finalizationState: 'completed' });

      const retryRes = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rxId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.status).toBe('active');
    });
  });
});
