'use strict';

/**
 * Suite 2: Attribution Activation Tests — Phase 10: PAOA
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

describe('Suite 2: Attribution Activation Tests', () => {
  let app;
  const userId = 'usr_activation_test';
  const otherUserId = 'usr_other_act_test';

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
      { userId, email: `${userId}@example.com`, name: 'Activation Student' },
      { userId: otherUserId, email: `${otherUserId}@example.com`, name: 'Other Student' },
    ]);
  });

  const createIssuedPrescription = async (overrides = {}) => {
    const rxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000);

    return PrescriptionExecutionRecord.create({
      prescriptionId: rxId,
      userId,
      issuanceIdempotencyKey: `key_${rxId}`,
      issuanceRequestFingerprint: 'a'.repeat(64),
      nonTerminalSlotKey: userId,
      phase10AlgorithmVersion: 'v1',
      orchestrationAlgorithmVersion: 'v1',
      originSurface: 'next_action',
      actionId: 'test_action_id',
      actionType: 'DIAGNOSTIC_ASSESSMENT',
      actionSubtype: 'FOUNDATIONAL_DIAGNOSTIC',
      priorityTier: 'normal',
      topic: 'Algebra',
      pattern: 'Linear Equations & Systems of Equations',
      prescribedQuestions: 10,
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
      expiresAt,
      lastActivityAt: now,
      ...overrides,
    });
  };

  // ── 1. Basic Activation & CAS Transition ───────────────────────────────────
  describe('1. CAS Activation Transition', () => {
    it('successfully activates an issued prescription and populates activationBaselineSnapshot', async () => {
      const rx = await createIssuedPrescription();

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.activatedAt).toBeDefined();
      expect(res.body.data.executionGuidance.sessionId).toBe(rx.prescriptionId);
      expect(res.body.data.executionGuidance.targetSource).toBe('practice');

      const updated = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(updated.status).toBe('active');
      expect(updated.activationBaselineSnapshot).toBeDefined();
      expect(updated.activationBaselineSnapshot.actionType).toBe('DIAGNOSTIC_ASSESSMENT');
    });

    it('returns 200 OK idempotent replay when already active and unexpired (zero writes)', async () => {
      const rx = await createIssuedPrescription();

      const firstRes = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });
      expect(firstRes.status).toBe(200);
      const firstActivatedAt = firstRes.body.data.activatedAt;

      const replayRes = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });
      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.status).toBe('active');
      expect(new Date(replayRes.body.data.activatedAt).getTime()).toBe(
        new Date(firstActivatedAt).getTime()
      );
    });
  });

  // ── 2. Error & Security Boundaries ─────────────────────────────────────────
  describe('2. Error & Security Boundaries', () => {
    it('returns 404 PRESCRIPTION_NOT_FOUND for non-existent prescriptionId', async () => {
      const missingRxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${missingRxId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PRESCRIPTION_NOT_FOUND');
    });

    it('returns 403 FORBIDDEN if prescription belongs to another student', async () => {
      const rx = await createIssuedPrescription({ userId: otherUserId });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId }); // requesting as userId instead of otherUserId

      expect(res.status).toBe(403);
      expect(['FORBIDDEN', 'OWNERSHIP_VIOLATION']).toContain(res.body.error.code);
    });

    it('returns 409 PRESCRIPTION_STATE_CONFLICT for terminal status prescription', async () => {
      const rx = await createIssuedPrescription({
        status: 'completed',
        completedAt: new Date(),
        nonTerminalSlotKey: null,
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PRESCRIPTION_STATE_CONFLICT');
    });
  });

  // ── 3. Exact Expiry Boundaries ─────────────────────────────────────────────
  describe('3. Exact Expiry Boundaries (expiresAt - 1ms, exactly, + 1ms)', () => {
    it('activates successfully when referenceNow = expiresAt - 1ms', async () => {
      const expiresAt = new Date('2026-10-10T12:00:00.000Z');
      const rx = await createIssuedPrescription({
        issuedAt: new Date('2026-10-09T12:00:00.000Z'),
        expiresAt,
      });

      // Pass referenceNow = expiresAt - 1ms
      const validClock = new Date(expiresAt.getTime() - 1);

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .set('x-reference-now', validClock.toISOString())
        .send({ userId });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });

    it('rejects with 409 PRESCRIPTION_STATE_CONFLICT when referenceNow = expiresAt exactly', async () => {
      const expiresAt = new Date('2026-10-10T12:00:00.000Z');
      const rx = await createIssuedPrescription({
        issuedAt: new Date('2026-10-09T12:00:00.000Z'),
        expiresAt,
      });

      const exactClock = new Date(expiresAt.getTime());

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .set('x-reference-now', exactClock.toISOString())
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PRESCRIPTION_STATE_CONFLICT');

      // Verify DB record status was atomically materialized as expired
      const inDb = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(inDb.status).toBe('expired');
      expect(inDb.nonTerminalSlotKey).toBeNull();
    });

    it('rejects with 409 PRESCRIPTION_STATE_CONFLICT when referenceNow = expiresAt + 1ms', async () => {
      const expiresAt = new Date('2026-10-10T12:00:00.000Z');
      const rx = await createIssuedPrescription({
        issuedAt: new Date('2026-10-09T12:00:00.000Z'),
        expiresAt,
      });

      const pastClock = new Date(expiresAt.getTime() + 1);

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .set('x-reference-now', pastClock.toISOString())
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PRESCRIPTION_STATE_CONFLICT');
    });
  });

  // ── 4. Baseline Snapshots for All 6 Action Types ───────────────────────────
  describe('4. Baseline Snapshots for All 6 Action Types', () => {
    it('captures baseline snapshot for PREREQUISITE_REMEDIATION', async () => {
      await StudentProgress.create({
        userId,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        mastery: 0.55,
      });

      const rx = await createIssuedPrescription({
        actionType: 'PREREQUISITE_REMEDIATION',
        actionSubtype: 'BLOCKING_PREREQUISITE',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        blockedTargetTopic: 'Algebra',
        blockedTargetPattern: 'Inequalities & Modulus Functions',
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      const updated = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(updated.activationBaselineSnapshot.actionType).toBe('PREREQUISITE_REMEDIATION');
      expect(updated.activationBaselineSnapshot.prerequisiteMastery).toBe(0.55);
      expect(updated.activationBaselineSnapshot.blockedTargetPattern).toBe('Inequalities & Modulus Functions');
    });

    it('captures baseline snapshot for RETENTION_RESCUE', async () => {
      const revItem = await RevisionItem.create({
        userId,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        stage: 2,
        intervalDays: 7,
        nextReviewDate: new Date(),
        status: 'scheduled',
      });

      const rx = await createIssuedPrescription({
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'DUE_TODAY_REVISION',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        revisionItemId: revItem._id,
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      const updated = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(updated.activationBaselineSnapshot.actionType).toBe('RETENTION_RESCUE');
      expect(updated.activationBaselineSnapshot.stage).toBe(2);
      expect(updated.activationBaselineSnapshot.intervalDays).toBe(7);
    });

    it('captures baseline snapshot for CURRICULUM_ADVANCEMENT', async () => {
      const planGoal = await Goal.create({
        userId,
        title: 'Curriculum Goal',
        type: 'company',
        targetDate: new Date('2026-12-01'),
        status: 'active',
      });

      const plan = await StudyPlan.create({
        userId,
        goalId: planGoal._id,
        name: 'Geometry Plan',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-12-01'),
        status: 'active',
        targets: [{ topic: 'Geometry', pattern: 'Triangles & Trigonometry', targetMastery: 0.85 }],
      });

      const now = new Date();
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      const dailyObj = await DailyObjective.create({
        userId,
        goalId: planGoal._id,
        planId: plan._id,
        date: todayStart,
        topic: 'Geometry',
        status: 'in_progress',
        patterns: [
          { pattern: 'Triangles & Trigonometry', targetQuestions: 15, completedQuestions: 5 },
        ],
      });

      await StudentProgress.create({
        userId,
        topic: 'Geometry',
        pattern: 'Triangles & Trigonometry',
        mastery: 0.60,
      });

      const rx = await createIssuedPrescription({
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'PLAN_TARGET_ADVANCEMENT',
        topic: 'Geometry',
        pattern: 'Triangles & Trigonometry',
        planId: plan._id,
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      const updated = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(updated.activationBaselineSnapshot.actionType).toBe('CURRICULUM_ADVANCEMENT');
      expect(updated.activationBaselineSnapshot.storedMastery).toBe(0.60);
      expect(updated.activationBaselineSnapshot.patternRemainingQuestions).toBe(10);
    });

    it('captures baseline snapshot for PACING_CALIBRATION', async () => {
      const rx = await createIssuedPrescription({
        actionType: 'PACING_CALIBRATION',
        actionSubtype: 'CALIBRATION_PRACTICE',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      const updated = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(updated.activationBaselineSnapshot.actionType).toBe('PACING_CALIBRATION');
      expect(updated.activationBaselineSnapshot.rushingRiskWindowDays).toBe(30);
    });

    it('captures baseline snapshot for EXAM_BENCHMARK', async () => {
      const goal = await Goal.create({
        userId,
        title: 'TCS Placement Prep',
        type: 'company',
        targetDate: new Date('2026-12-01'),
        status: 'active',
      });

      const plan = await StudyPlan.create({
        userId,
        goalId: goal._id,
        name: 'Benchmark Plan',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-12-01'),
        status: 'active',
        targets: [{ topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations', targetMastery: 0.85 }],
      });

      const rx = await createIssuedPrescription({
        actionType: 'EXAM_BENCHMARK',
        actionSubtype: 'BENCHMARK_FULL_SIMULATION',
        goalId: goal._id,
        planId: plan._id,
        topic: null,
        pattern: null,
        prescribedQuestions: 0,
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/activate`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      const updated = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(updated.activationBaselineSnapshot.actionType).toBe('EXAM_BENCHMARK');
      expect(updated.activationBaselineSnapshot.goalId).toBe(goal._id.toString());
    });
  });
});
