'use strict';

/**
 * Suite 5: Attribution Summary Analytics Tests — Phase 10: PAOA
 */

const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');

const User = require('../../src/models/userModel');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Suite 5: Attribution Summary Analytics Tests', () => {
  let app;
  const userId = 'usr_summary_test';

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
      { userId, email: `${userId}@example.com`, name: 'Summary Student' },
    ]);
  });

  const createRecord = async (overrides = {}) => {
    const rxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
    const now = new Date();
    return PrescriptionExecutionRecord.create({
      prescriptionId: rxId,
      userId,
      issuanceIdempotencyKey: `key_${rxId}`,
      issuanceRequestFingerprint: 'f'.repeat(64),
      nonTerminalSlotKey: null,
      phase10AlgorithmVersion: 'v1',
      orchestrationAlgorithmVersion: 'v1',
      originSurface: 'next_action',
      actionId: 'act_1',
      actionType: 'PREREQUISITE_REMEDIATION',
      actionSubtype: 'BLOCKING_PREREQUISITE',
      priorityTier: 'urgent',
      topic: 'Algebra',
      pattern: 'Linear Equations & Systems of Equations',
      prescribedQuestions: 5,
      issuanceSnapshot: { actionType: 'PREREQUISITE_REMEDIATION' },
      status: 'completed',
      issuedAt: now,
      expiresAt: new Date(now.getTime() + 86400000),
      completedAt: now,
      executionRequirementMet: true,
      targetMilestoneMet: true,
      ...overrides,
    });
  };

  // ── 1. Empty State Baseline ────────────────────────────────────────────────
  describe('1. Empty State Baseline', () => {
    it('returns empty summary with null adherence and milestone rates when 0 records exist', async () => {
      const res = await request(app)
        .get(`/api/v1/attribution/users/${userId}/summary`)
        .set(getAuthHeaders(userId));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.userId).toBe(userId);
      expect(data.windowDays).toBe(30);
      expect(data.evaluatedPrescriptionCount).toBe(0);
      expect(data.resolvedPrescriptionCount).toBe(0);
      expect(data.isTruncated).toBe(false);
      expect(data.isExhaustive).toBe(true);
      expect(data.adherence.executionAdherenceRate).toBeNull();
      expect(data.learningOutcomes.milestoneSuccessRate).toBeNull();
      expect(data.attributionNotice).toBe(
        'Observational pre/post association recorded. Causal lift is not claimed.'
      );
    });
  });

  // ── 2. Query Validation (windowDays & actionType) ───────────────────────────
  describe('2. Query Validation', () => {
    it('returns 400 VALIDATION_ERROR on windowDays < 1 or > 90 or non-integer', async () => {
      const res1 = await request(app)
        .get(`/api/v1/attribution/users/${userId}/summary?windowDays=0`)
        .set(getAuthHeaders(userId));
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('VALIDATION_ERROR');

      const res2 = await request(app)
        .get(`/api/v1/attribution/users/${userId}/summary?windowDays=91`)
        .set(getAuthHeaders(userId));
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get(`/api/v1/attribution/users/${userId}/summary?windowDays=abc`)
        .set(getAuthHeaders(userId));
      expect(res3.status).toBe(400);
    });

    it('returns 400 VALIDATION_ERROR on invalid actionType filter', async () => {
      const res = await request(app)
        .get(`/api/v1/attribution/users/${userId}/summary?actionType=INVALID_ACTION_TYPE`)
        .set(getAuthHeaders(userId));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('filters correctly by valid canonical actionType', async () => {
      await createRecord({ actionType: 'PREREQUISITE_REMEDIATION' });
      await createRecord({ actionType: 'RETENTION_RESCUE' });

      const res = await request(app)
        .get(`/api/v1/attribution/users/${userId}/summary?actionType=PREREQUISITE_REMEDIATION`)
        .set(getAuthHeaders(userId));

      expect(res.status).toBe(200);
      expect(res.body.data.evaluatedPrescriptionCount).toBe(1);
      expect(res.body.data.actionTypeFilter).toBe('PREREQUISITE_REMEDIATION');
    });
  });

  // ── 3. Zero-Write & In-Memory Effective Expiry Contract ───────────────────
  describe('3. In-Memory Effective Expiry & Zero-Write Contract', () => {
    it('tallies expired active record under effectiveStatus: "expired" without mutating DB', async () => {
      const pastTime = new Date(Date.now() - 3600000); // 1 hour ago
      const rx = await createRecord({
        status: 'active',
        nonTerminalSlotKey: userId,
        issuedAt: new Date(pastTime.getTime() - 86400000),
        expiresAt: pastTime, // expired
        completedAt: null,
      });

      const res = await request(app)
        .get(`/api/v1/attribution/users/${userId}/summary`)
        .set(getAuthHeaders(userId));

      expect(res.status).toBe(200);
      expect(res.body.data.statusCounts.active).toBe(0);
      expect(res.body.data.statusCounts.expired).toBe(1);
      expect(res.body.data.recentPrescriptions[0].effectiveStatus).toBe('expired');
      expect(res.body.data.recentPrescriptions[0].status).toBe('active');

      // Verify ZERO database writes occurred
      const inDb = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(inDb.status).toBe('active');
      expect(inDb.nonTerminalSlotKey).toBe(userId);
    });
  });

  // ── 4. Adherence & Milestone Metrics Evaluation ────────────────────────────
  describe('4. Adherence & Milestone Metrics Evaluation', () => {
    it('computes executionAdherenceRate and milestoneSuccessRate accurately', async () => {
      // 1. completed with milestone met
      await createRecord({
        status: 'completed',
        executionRequirementMet: true,
        targetMilestoneMet: true,
      });
      // 2. completed with milestone NOT met
      await createRecord({
        status: 'completed',
        executionRequirementMet: true,
        targetMilestoneMet: false,
      });
      // 3. completed with NULL evidence (e.g. pacing insufficient evidence) -> excluded from milestone rate
      await createRecord({
        status: 'completed',
        executionRequirementMet: true,
        targetMilestoneMet: null,
      });
      // 4. abandoned
      await createRecord({
        status: 'abandoned',
        abandonedAt: new Date(),
        completedAt: null,
        executionRequirementMet: false,
        targetMilestoneMet: null,
      });

      const res = await request(app)
        .get(`/api/v1/attribution/users/${userId}/summary`)
        .set(getAuthHeaders(userId));

      expect(res.status).toBe(200);
      const data = res.body.data;
      // resolvedCount = 3 completed + 1 abandoned = 4
      expect(data.resolvedPrescriptionCount).toBe(4);
      // adherence = 3 completed / 4 resolved = 0.75
      expect(data.adherence.executionAdherenceRate).toBe(0.75);

      // milestones evaluated = 1 (true) + 1 (false) = 2. Null is excluded.
      expect(data.learningOutcomes.milestonesEvaluated).toBe(2);
      expect(data.learningOutcomes.milestonesMet).toBe(1);
      expect(data.learningOutcomes.milestonesInsufficientEvidence).toBe(1);
      // milestoneSuccessRate = 1 / 2 = 0.5
      expect(data.learningOutcomes.milestoneSuccessRate).toBe(0.5);
    });
  });

  // ── 5. Probe vs Evaluated Bounding (501 / 500) ─────────────────────────────
  describe('5. Probe Bounding (501 / 500 limit)', () => {
    it('caps evaluated records at 500 and sets isTruncated = true when probe finds 501', async () => {
      // Insert 501 records in batch
      const records = [];
      const baseTime = Date.now();
      for (let i = 0; i < 501; i++) {
        records.push({
          prescriptionId: `rx_${new mongoose.Types.ObjectId().toString()}`,
          userId,
          issuanceIdempotencyKey: `key_batch_${i}`,
          issuanceRequestFingerprint: 'f'.repeat(64),
          phase10AlgorithmVersion: 'v1',
          orchestrationAlgorithmVersion: 'v1',
          originSurface: 'next_action',
          actionId: `act_${i}`,
          actionType: 'DIAGNOSTIC_ASSESSMENT',
          actionSubtype: 'FOUNDATIONAL_DIAGNOSTIC',
          priorityTier: 'normal',
          topic: 'Algebra',
          pattern: 'Linear Equations & Systems of Equations',
          prescribedQuestions: 1,
          issuanceSnapshot: { actionType: 'DIAGNOSTIC_ASSESSMENT' },
          status: 'completed',
          issuedAt: new Date(baseTime - i * 1000), // strictly ordered timestamps
          expiresAt: new Date(baseTime + 86400000),
          completedAt: new Date(baseTime - i * 1000),
          executionRequirementMet: true,
          targetMilestoneMet: true,
        });
      }

      await PrescriptionExecutionRecord.insertMany(records);

      const res = await request(app)
        .get(`/api/v1/attribution/users/${userId}/summary`)
        .set(getAuthHeaders(userId));

      expect(res.status).toBe(200);
      expect(res.body.data.evaluatedPrescriptionCount).toBe(500);
      expect(res.body.data.isTruncated).toBe(true);
      expect(res.body.data.isExhaustive).toBe(false);
      expect(res.body.data.recentPrescriptions).toHaveLength(500);
    });
  });
});
