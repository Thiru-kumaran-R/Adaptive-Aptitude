'use strict';

/**
 * Suite 3: Attribution Completion Tests — Phase 10: PAOA
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
const RevisionProcessingRecord = require('../../src/models/revisionProcessingRecordModel');
const Attempt = require('../../src/models/attemptModel');
const MockSession = require('../../src/models/mockSessionModel');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');

describe('Suite 3: Attribution Completion Tests', () => {
  let app;
  const userId = 'usr_completion_test';
  const otherUserId = 'usr_other_comp_test';

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
    await RevisionProcessingRecord.deleteMany({});

    await User.create([
      { userId, email: `${userId}@example.com`, name: 'Completion Student' },
      { userId: otherUserId, email: `${otherUserId}@example.com`, name: 'Other Student' },
    ]);
  });

  const createActivePrescription = async (overrides = {}) => {
    const rxId = `rx_${new mongoose.Types.ObjectId().toString()}`;
    const now = new Date();
    const activatedAt = new Date(now.getTime() - 60000); // 1 minute ago
    const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000);

    return PrescriptionExecutionRecord.create({
      prescriptionId: rxId,
      userId,
      issuanceIdempotencyKey: `key_${rxId}`,
      issuanceRequestFingerprint: 'b'.repeat(64),
      nonTerminalSlotKey: userId,
      phase10AlgorithmVersion: 'v1',
      orchestrationAlgorithmVersion: 'v1',
      originSurface: 'next_action',
      actionId: 'test_action_id',
      actionType: 'PREREQUISITE_REMEDIATION',
      actionSubtype: 'BLOCKING_PREREQUISITE',
      priorityTier: 'urgent',
      topic: 'Algebra',
      pattern: 'Linear Equations & Systems of Equations',
      prescribedQuestions: 5,
      blockedTargetTopic: 'Algebra',
      blockedTargetPattern: 'Inequalities & Modulus Functions',
      issuanceSnapshot: {
        actionType: 'PREREQUISITE_REMEDIATION',
        prerequisitePattern: 'Linear Equations & Systems of Equations',
        prerequisiteTopic: 'Algebra',
        prerequisiteMastery: 0.5,
        blockedTargetPattern: 'Inequalities & Modulus Functions',
        blockedTargetTopic: 'Algebra',
        allPrerequisitesForTarget: [
          { pattern: 'Linear Equations & Systems of Equations', mastery: 0.5 },
        ],
      },
      activationBaselineSnapshot: {
        actionType: 'PREREQUISITE_REMEDIATION',
        prerequisitePattern: 'Linear Equations & Systems of Equations',
        prerequisiteTopic: 'Algebra',
        prerequisiteMastery: 0.5,
        blockedTargetPattern: 'Inequalities & Modulus Functions',
        blockedTargetTopic: 'Algebra',
        allPrerequisitesForTarget: [
          { pattern: 'Linear Equations & Systems of Equations', mastery: 0.5 },
        ],
      },
      status: 'active',
      issuedAt: new Date(activatedAt.getTime() - 60000),
      activatedAt,
      expiresAt,
      lastActivityAt: activatedAt,
      ...overrides,
    });
  };

  const createAttributedAttempt = async (rx, overrides = {}) => {
    const questionId = new mongoose.Types.ObjectId();
    return Attempt.create({
      userId: rx.userId,
      questionId,
      sessionId: rx.prescriptionId,
      source: rx.actionType === 'RETENTION_RESCUE' ? 'revision' : 'practice',
      topic: rx.topic,
      pattern: rx.pattern,
      difficulty: 1,
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      timeTaken: 45,
      attemptedAt: new Date(rx.activatedAt.getTime() + 1000),
      ...overrides,
    });
  };

  // ── 1. Attempt Attribution & Threshold Enforcement ─────────────────────────
  describe('1. Attempt Attribution & Threshold Enforcement', () => {
    it('returns 409 PRESCRIPTION_EXECUTION_INCOMPLETE when attempts < prescribedQuestions', async () => {
      const rx = await createActivePrescription({ prescribedQuestions: 5 });

      // Create only 3 attributed attempts
      for (let i = 0; i < 3; i++) {
        await createAttributedAttempt(rx);
      }

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PRESCRIPTION_EXECUTION_INCOMPLETE');

      // Record remains active
      const inDb = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(inDb.status).toBe('active');
    });

    it('excludes unattributed attempts (wrong sessionId, pre-activation, or wrong source)', async () => {
      const rx = await createActivePrescription({ prescribedQuestions: 2 });

      // 1. Wrong sessionId
      await createAttributedAttempt(rx, { sessionId: 'some_other_session_id' });
      // 2. Pre-activation attemptedAt
      await createAttributedAttempt(rx, {
        attemptedAt: new Date(rx.activatedAt.getTime() - 10000),
      });
      // 3. Wrong source (mock instead of practice)
      await createAttributedAttempt(rx, { source: 'mock' });

      // Still 0 valid attributed attempts
      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PRESCRIPTION_EXECUTION_INCOMPLETE');
    });
  });

  // ── 2. PREREQUISITE_REMEDIATION Outcome ───────────────────────────────────
  describe('2. PREREQUISITE_REMEDIATION Outcome', () => {
    it('evaluates targetMilestoneMet = true when finalMastery >= 0.70', async () => {
      const rx = await createActivePrescription({ prescribedQuestions: 2 });
      for (let i = 0; i < 2; i++) await createAttributedAttempt(rx);

      await StudentProgress.create({
        userId,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        mastery: 0.75,
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.executionRequirementMet).toBe(true);
      expect(res.body.data.targetMilestoneMet).toBe(true);
      expect(res.body.data.outcomeSnapshot.finalPrerequisiteMastery).toBe(0.75);
      expect(res.body.data.outcomeSnapshot.prerequisiteThresholdMet).toBe(true);
    });

    it('evaluates targetMilestoneMet = false when finalMastery < 0.70', async () => {
      const rx = await createActivePrescription({ prescribedQuestions: 2 });
      for (let i = 0; i < 2; i++) await createAttributedAttempt(rx);

      await StudentProgress.create({
        userId,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        mastery: 0.65,
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.executionRequirementMet).toBe(true);
      expect(res.body.data.targetMilestoneMet).toBe(false);
    });
  });

  // ── 3. RETENTION_RESCUE Outcome ───────────────────────────────────────────
  describe('3. RETENTION_RESCUE Outcome', () => {
    it('returns 409 REVISION_PROCESSING_PENDING if RevisionProcessingRecord is absent', async () => {
      const revItem = await RevisionItem.create({
        userId,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        stage: 2,
        intervalDays: 7,
        nextReviewDate: new Date(),
        status: 'scheduled',
      });

      const rx = await createActivePrescription({
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'DUE_TODAY_REVISION',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        revisionItemId: revItem._id,
        prescribedQuestions: 1,
        activationBaselineSnapshot: {
          actionType: 'RETENTION_RESCUE',
          revisionItemId: String(revItem._id),
          topic: 'Algebra',
          pattern: 'Linear Equations & Systems of Equations',
          stage: 2,
          intervalDays: 7,
        },
      });

      const attempt = await createAttributedAttempt(rx);

      // No RevisionProcessingRecord created yet
      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('REVISION_PROCESSING_PENDING');
    });

    it('completes with targetMilestoneMet = true when stage advances after processing', async () => {
      const revItem = await RevisionItem.create({
        userId,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        stage: 2,
        intervalDays: 7,
        nextReviewDate: new Date(),
        status: 'scheduled',
      });

      const rx = await createActivePrescription({
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'DUE_TODAY_REVISION',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        revisionItemId: revItem._id,
        prescribedQuestions: 1,
        activationBaselineSnapshot: {
          actionType: 'RETENTION_RESCUE',
          revisionItemId: String(revItem._id),
          topic: 'Algebra',
          pattern: 'Linear Equations & Systems of Equations',
          stage: 2,
          intervalDays: 7,
        },
      });

      const attempt = await createAttributedAttempt(rx);

      // Create RevisionProcessingRecord for attempt
      await RevisionProcessingRecord.create({
        attemptId: attempt._id,
        userId,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
      });

      // Update RevisionItem to reflect final processed attempt and stage 3
      await RevisionItem.updateOne(
        { _id: revItem._id },
        {
          stage: 3,
          intervalDays: 14,
          lastOutcome: 'correct',
          lastProcessedAttemptId: attempt._id,
        }
      );

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.targetMilestoneMet).toBe(true);
      expect(res.body.data.outcomeSnapshot.retentionRescued).toBe(true);
      expect(res.body.data.outcomeSnapshot.finalStage).toBe(3);
    });
  });

  // ── 4. CURRICULUM_ADVANCEMENT Outcome ─────────────────────────────────────
  describe('4. CURRICULUM_ADVANCEMENT Outcome', () => {
    it('evaluates targetMilestoneMet = true when masteryDelta > 0 or finalMastery >= 0.85', async () => {
      const rx = await createActivePrescription({
        actionType: 'CURRICULUM_ADVANCEMENT',
        topic: 'Geometry',
        pattern: 'Triangles & Trigonometry',
        prescribedQuestions: 2,
        activationBaselineSnapshot: {
          actionType: 'CURRICULUM_ADVANCEMENT',
          topic: 'Geometry',
          pattern: 'Triangles & Trigonometry',
          storedMastery: 0.60,
        },
      });

      for (let i = 0; i < 2; i++) await createAttributedAttempt(rx);

      // Update progress to 0.70 (delta > 0)
      await StudentProgress.create({
        userId,
        topic: 'Geometry',
        pattern: 'Triangles & Trigonometry',
        mastery: 0.70,
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.targetMilestoneMet).toBe(true);
      expect(res.body.data.outcomeSnapshot.masteryDelta).toBe(0.1);
    });
  });

  // ── 5. PACING_CALIBRATION Outcome ─────────────────────────────────────────
  describe('5. PACING_CALIBRATION Outcome', () => {
    it('evaluates targetMilestoneMet = null when postRisk has insufficient evidence', async () => {
      const rx = await createActivePrescription({
        actionType: 'PACING_CALIBRATION',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        prescribedQuestions: 2,
        activationBaselineSnapshot: {
          actionType: 'PACING_CALIBRATION',
          topic: 'Algebra',
          topicRushingRiskScore: 0.75,
          rushingRiskWindowDays: 30,
        },
      });

      for (let i = 0; i < 2; i++) await createAttributedAttempt(rx);

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.targetMilestoneMet).toBeNull();
      expect(res.body.data.outcomeSnapshot.outcomeEvidenceStatus).toBe('INSUFFICIENT_POST_EVIDENCE');
    });
  });

  // ── 6. EXAM_BENCHMARK Outcome ─────────────────────────────────────────────
  describe('6. EXAM_BENCHMARK Outcome', () => {
    it('verifies standard mock completed started after activation and scope subset', async () => {
      const planGoal = await Goal.create({
        userId,
        title: 'Benchmark Goal',
        type: 'company',
        targetDate: new Date('2026-12-01'),
        status: 'active',
      });

      const plan = await StudyPlan.create({
        userId,
        goalId: planGoal._id,
        name: 'Benchmark Plan',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-12-01'),
        status: 'active',
        targets: [{ topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations', targetMastery: 0.85 }],
      });

      const rx = await createActivePrescription({
        actionType: 'EXAM_BENCHMARK',
        actionSubtype: 'BENCHMARK_FULL_SIMULATION',
        goalId: planGoal._id,
        planId: plan._id,
        topic: null,
        pattern: null,
        prescribedQuestions: 0,
        issuanceSnapshot: {
          actionType: 'EXAM_BENCHMARK',
          goalId: String(planGoal._id),
          planId: String(plan._id),
          planTargetPatternsSnapshot: [
            { topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations' },
          ],
        },
      });

      const mockSession = await MockSession.create({
        userId,
        blueprintSnapshot: {
          title: 'Standard Mock Exam',
          sections: [
            {
              sectionId: 'sec-1',
              order: 0,
              questionCount: 5,
              scope: {
                patterns: ['Linear Equations & Systems of Equations'],
              },
            },
          ],
        },
        blueprintFingerprint: 'fp-1',
        mode: 'standard',
        navigationPolicy: 'free',
        effectiveExcludeRecentQuestions: false,
        questionSequence: [],
        sectionStates: [],
        totalQuestions: 5,
        durationMinutes: 10,
        generationSeed: 'seed_1',
        status: 'submitted',
        finalizationState: 'completed',
        startedAt: new Date(rx.activatedAt.getTime() + 5000), // started after activation
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          mockSessionId: mockSession._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.mockSessionId).toBe(mockSession._id.toString());
      expect(res.body.data.executionRequirementMet).toBe(true);
      expect(res.body.data.targetMilestoneMet).toBe(true);
    });

    it('rejects benchmark mock started BEFORE prescription activation', async () => {
      const rx = await createActivePrescription({
        actionType: 'EXAM_BENCHMARK',
        prescribedQuestions: 0,
      });

      const mockSession = await MockSession.create({
        userId,
        blueprintSnapshot: {
          title: 'Early Mock Exam',
          sections: [
            {
              sectionId: 'sec-1',
              order: 0,
              questionCount: 5,
              scope: { patterns: ['Linear Equations & Systems of Equations'] },
            },
          ],
        },
        blueprintFingerprint: 'fp-2',
        mode: 'standard',
        navigationPolicy: 'free',
        effectiveExcludeRecentQuestions: false,
        questionSequence: [],
        sectionStates: [],
        totalQuestions: 5,
        durationMinutes: 10,
        generationSeed: 'seed_2',
        status: 'submitted',
        finalizationState: 'completed',
        startedAt: new Date(rx.activatedAt.getTime() - 10000), // BEFORE activation
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          mockSessionId: mockSession._id.toString(),
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PRESCRIPTION_EXECUTION_INCOMPLETE');
    });
  });

  // ── 7. Abandonment Flow ───────────────────────────────────────────────────
  describe('7. Abandonment Flow', () => {
    it('transitions active prescription to status: "abandoned" when abandon = true', async () => {
      const rx = await createActivePrescription();

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          abandon: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('abandoned');
      expect(res.body.data.executionRequirementMet).toBe(false);
      expect(res.body.data.targetMilestoneMet).toBeNull();
      expect(res.body.data.outcomeSnapshot.reason).toBe('USER_ABANDONED');

      const inDb = await PrescriptionExecutionRecord.findOne({ prescriptionId: rx.prescriptionId });
      expect(inDb.status).toBe('abandoned');
      expect(inDb.nonTerminalSlotKey).toBeNull();
    });

    it('allows benchmark abandonment without mockSessionId', async () => {
      const rx = await createActivePrescription({
        actionType: 'EXAM_BENCHMARK',
        prescribedQuestions: 0,
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({
          userId,
          abandon: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('abandoned');
    });

    it('returns 200 OK idempotent replay on repeated abandonment', async () => {
      const rx = await createActivePrescription();

      await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId, abandon: true });

      const replayRes = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId, abandon: true });

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.status).toBe('abandoned');
    });
  });

  // ── 8. Lifecycle & Terminal Conflicts ─────────────────────────────────────
  describe('8. Lifecycle & Terminal Conflicts', () => {
    it('returns 409 PRESCRIPTION_STATE_CONFLICT if prescription is issued (not activated)', async () => {
      const rx = await createActivePrescription({ status: 'issued', activatedAt: null });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PRESCRIPTION_STATE_CONFLICT');
    });

    it('returns 409 PRESCRIPTION_STATE_CONFLICT if prescription is expired', async () => {
      const rx = await createActivePrescription({
        expiresAt: new Date(Date.now() - 5000),
      });

      const res = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PRESCRIPTION_STATE_CONFLICT');
    });

    it('returns 200 OK idempotent replay if already completed (zero writes)', async () => {
      const rx = await createActivePrescription({ prescribedQuestions: 1 });
      await createAttributedAttempt(rx);

      await StudentProgress.create({
        userId,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        mastery: 0.80,
      });

      const firstRes = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });
      expect(firstRes.status).toBe(200);

      const replayRes = await request(app)
        .post(`/api/v1/attribution/prescriptions/${rx.prescriptionId}/complete`)
        .set(getAuthHeaders(userId))
        .send({ userId });
      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.status).toBe('completed');
    });
  });
});
