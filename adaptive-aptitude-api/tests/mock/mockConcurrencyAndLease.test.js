'use strict';

/**
 * tests/mock/mockConcurrencyAndLease.test.js
 *
 * Comprehensive tests for Phase 6 Concurrency Races, Distributed Lease Engine,
 * Three-Path Acquisition (A, B1, B2), Exact Lease Boundary, Heartbeat & Terminal Fencing.
 */

const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const MockSession = require('../../src/models/mockSessionModel');
const MockResponse = require('../../src/models/mockResponseModel');
const {
  acquireFinalizationLease,
  renewHeartbeat,
  handleFinalizationFailure,
} = require('../../src/services/mock/mockFinalizationService');
const {
  saveResponseTransactional,
  abandonSession,
} = require('../../src/services/mock/mockSessionService');
const { seedMockQuestions, createTestUser } = require('../helpers/mockTestHelpers');
const {
  MOCK_MODES,
  NAVIGATION_POLICIES,
  SESSION_STATUS,
  FINALIZATION_STATE,
  FINALIZATION_LEASE,
  MOCK_ERROR_CODES,
} = require('../../src/config/mockConfig');

describe('Phase 6: Concurrency Races & Distributed Lease Engine', () => {
  const userId = 'concurrency-test-user-1';

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearAllTestCollections();
    await createTestUser(userId);
    await seedMockQuestions({
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      countPerBand: 5,
    });
  });

  const createStartedSession = async (customFields = {}) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    return await MockSession.create({
      userId,
      blueprintSnapshot: {
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        scoring: { correctMarks: 1, incorrectMarks: 0, unansweredMarks: 0 },
        sections: [
          {
            sectionId: 'sec-1',
            questionCount: 2,
            scope: { patterns: ['Successive Percentage Changes'] },
          },
        ],
      },
      blueprintFingerprint: 'dummy-fingerprint',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      effectiveExcludeRecentQuestions: false,
      totalQuestions: 2,
      durationMinutes: 60,
      generationSeed: 'test-seed-concurrency',
      algorithmVersion: 'v1',
      status: SESSION_STATUS.STARTED,
      startedAt: now,
      expiresAt,
      questionSequence: [
        {
          questionId: (await seedMockQuestions({ countPerBand: 1 }))[0]._id,
          sectionId: 'sec-1',
          order: 0,
          topic: 'Percentage',
          pattern: 'Successive Percentage Changes',
          difficulty: 2,
        },
        {
          questionId: (await seedMockQuestions({ countPerBand: 1 }))[1]._id,
          sectionId: 'sec-1',
          order: 1,
          topic: 'Percentage',
          pattern: 'Successive Percentage Changes',
          difficulty: 5,
        },
      ],
      sectionStates: [
        {
          sectionId: 'sec-1',
          order: 0,
          status: 'in_progress',
          startedAt: now,
          expiresAt,
          durationMinutes: 60,
          questionCount: 2,
        },
      ],
      ...customFields,
    });
  };

  describe('Response Freeze Contention (Save vs Freeze)', () => {
    it('freeze barrier blocks subsequent response saves with 409 RESPONSE_FROZEN', async () => {
      const session = await createStartedSession();
      const qId = session.questionSequence[0].questionId;

      // 1. Worker acquires finalization lease -> sets responsesFrozen = true
      const workerToken = 'worker-token-freeze-test';
      await acquireFinalizationLease(session._id, userId, workerToken, SESSION_STATUS.SUBMITTED);

      // 2. Attempt saveResponseTransactional after freeze
      await expect(
        saveResponseTransactional({
          sessionId: session._id,
          userId,
          questionId: qId,
          selectedAnswer: 'Option A',
          isMarkedForReview: false,
          timeTakenSeconds: 5,
        })
      ).rejects.toThrow();

      try {
        await saveResponseTransactional({
          sessionId: session._id,
          userId,
          questionId: qId,
          selectedAnswer: 'Option A',
          isMarkedForReview: false,
          timeTakenSeconds: 5,
        });
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(MOCK_ERROR_CODES.RESPONSE_FROZEN);
      }
    });

    it('save winning before freeze commits and is included in the frozen snapshot', async () => {
      const session = await createStartedSession();
      const qId = session.questionSequence[0].questionId;

      // 1. Save wins first
      await saveResponseTransactional({
        sessionId: session._id,
        userId,
        questionId: qId,
        selectedAnswer: 'Option A',
        isMarkedForReview: true,
        timeTakenSeconds: 3,
      });

      // 2. Finalization acquires lease and snapshots responses
      const workerToken = 'worker-snapshot-winner';
      const leaseResult = await acquireFinalizationLease(session._id, userId, workerToken, SESSION_STATUS.SUBMITTED);

      expect(leaseResult.responseSnapshot).toHaveLength(1);
      expect(leaseResult.responseSnapshot[0].selectedAnswer).toBe('Option A');
      expect(leaseResult.responseSnapshot[0].isMarkedForReview).toBe(true);
    });
  });

  describe('Submit vs Abandon Concurrency Race', () => {
    it('abandon rejected with 409 SESSION_STATE_CONFLICT once finalization acquires lease', async () => {
      const session = await createStartedSession();

      // Submit acquires lease first
      const workerToken = 'submit-worker-1';
      await acquireFinalizationLease(session._id, userId, workerToken, SESSION_STATUS.SUBMITTED);

      // Concurrent abandon attempts transition
      try {
        await abandonSession(session._id, userId);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(MOCK_ERROR_CODES.SESSION_STATE_CONFLICT);
      }

      const updated = await MockSession.findById(session._id);
      expect(updated.status).toBe(SESSION_STATUS.STARTED);
      expect(updated.responsesFrozen).toBe(true);
    });

    it('submit rejected with 409 SESSION_STATE_CONFLICT once abandon succeeds first', async () => {
      const session = await createStartedSession();

      // Abandon succeeds first
      await abandonSession(session._id, userId);

      // Concurrent submit tries to acquire lease
      try {
        await acquireFinalizationLease(session._id, userId, 'submit-worker-2', SESSION_STATUS.SUBMITTED);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(MOCK_ERROR_CODES.SESSION_STATE_CONFLICT);
      }

      const updated = await MockSession.findById(session._id);
      expect(updated.status).toBe(SESSION_STATUS.ABANDONED);
    });
  });

  describe('Three-Path Lease Engine & Recovery (Path A, B1, B2)', () => {
    it('Path A: initial acquisition sets freeze, lease, heartbeat, and targetStatus', async () => {
      const session = await createStartedSession();
      const workerToken = 'worker-path-a';

      const res = await acquireFinalizationLease(session._id, userId, workerToken, SESSION_STATUS.SUBMITTED);
      expect(res.acquisitionPath).toBe('PATH_A_INITIAL');
      expect(res.mockSession.responsesFrozen).toBe(true);
      expect(res.mockSession.finalizationState).toBe(FINALIZATION_STATE.IN_PROGRESS);
      expect(res.mockSession.finalizationOwnerToken).toBe(workerToken);
      expect(res.mockSession.finalizationTargetStatus).toBe(SESSION_STATUS.SUBMITTED);
      expect(res.mockSession.finalizationStartedAt).toBeDefined();
    });

    it('Path B1: crash recovery occurs when lease has expired (leaseExpiresAt <= now)', async () => {
      const initialStartedAt = new Date(Date.now() - 60000);
      const expiredLease = new Date(Date.now() - 5000); // Expired 5 seconds ago

      const session = await createStartedSession({
        responsesFrozen: true,
        finalizationState: FINALIZATION_STATE.IN_PROGRESS,
        finalizationOwnerToken: 'dead-worker-1',
        finalizationLeaseExpiresAt: expiredLease,
        finalizationHeartbeatAt: expiredLease,
        finalizationStartedAt: initialStartedAt,
        finalizationTargetStatus: SESSION_STATUS.SUBMITTED,
      });

      const recoveryWorkerToken = 'recovery-worker-b1';
      const res = await acquireFinalizationLease(session._id, userId, recoveryWorkerToken, SESSION_STATUS.SUBMITTED);

      expect(res.acquisitionPath).toBe('PATH_B1_CRASH_RECOVERY');
      expect(res.mockSession.finalizationOwnerToken).toBe(recoveryWorkerToken);

      // Invariants: Preserves finalizationStartedAt and immutable finalizationTargetStatus!
      expect(new Date(res.mockSession.finalizationStartedAt).getTime()).toBe(initialStartedAt.getTime());
      expect(res.mockSession.finalizationTargetStatus).toBe(SESSION_STATUS.SUBMITTED);
    });

    it('Path B1 preserves targetStatus = submitted even if current wall clock has passed expiry', async () => {
      const initialStartedAt = new Date(Date.now() - 120000);
      const expiredLease = new Date(Date.now() - 1000);
      const pastSessionExpiry = new Date(Date.now() - 30000); // Clock now > session.expiresAt

      const session = await createStartedSession({
        expiresAt: pastSessionExpiry, // Clock has passed!
        responsesFrozen: true,
        finalizationState: FINALIZATION_STATE.IN_PROGRESS,
        finalizationOwnerToken: 'crashed-worker-clock-test',
        finalizationLeaseExpiresAt: expiredLease,
        finalizationStartedAt: initialStartedAt,
        finalizationTargetStatus: SESSION_STATUS.SUBMITTED, // Originally submitted
      });

      const recoveryWorkerToken = 'recovery-worker-clock-test';
      const res = await acquireFinalizationLease(session._id, userId, recoveryWorkerToken, SESSION_STATUS.SUBMITTED);

      expect(res.acquisitionPath).toBe('PATH_B1_CRASH_RECOVERY');
      // Must NOT convert submitted -> expired due to late recovery!
      expect(res.mockSession.finalizationTargetStatus).toBe(SESSION_STATUS.SUBMITTED);
    });

    it('Path B2: explicit failed-state retry allows immediate acquisition without waiting for lease timeout', async () => {
      const initialStartedAt = new Date(Date.now() - 40000);

      const session = await createStartedSession({
        responsesFrozen: true,
        finalizationState: FINALIZATION_STATE.FAILED,
        finalizationOwnerToken: null,
        finalizationLeaseExpiresAt: null,
        finalizationStartedAt: initialStartedAt,
        finalizationTargetStatus: SESSION_STATUS.SUBMITTED,
      });

      const retryWorkerToken = 'retry-worker-b2';
      const res = await acquireFinalizationLease(session._id, userId, retryWorkerToken, SESSION_STATUS.SUBMITTED);

      expect(res.acquisitionPath).toBe('PATH_B2_EXPLICIT_FAILED');
      expect(res.mockSession.finalizationOwnerToken).toBe(retryWorkerToken);
      expect(res.mockSession.finalizationState).toBe(FINALIZATION_STATE.IN_PROGRESS);
      expect(new Date(res.mockSession.finalizationStartedAt).getTime()).toBe(initialStartedAt.getTime());
      expect(res.mockSession.finalizationTargetStatus).toBe(SESSION_STATUS.SUBMITTED);
    });

    it('rejects lease acquisition when another worker owns an active unexpired lease (409 FINALIZATION_IN_PROGRESS)', async () => {
      const session = await createStartedSession({
        responsesFrozen: true,
        finalizationState: FINALIZATION_STATE.IN_PROGRESS,
        finalizationOwnerToken: 'active-worker-live',
        finalizationLeaseExpiresAt: new Date(Date.now() + 20000), // Valid for 20 more seconds!
      });

      try {
        await acquireFinalizationLease(session._id, userId, 'competing-worker', SESSION_STATUS.SUBMITTED);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(MOCK_ERROR_CODES.FINALIZATION_IN_PROGRESS);
      }
    });
  });

  describe('Exact Lease Boundary & Heartbeat Fencing', () => {
    it('exact boundary: leaseExpiresAt === now is treated as EXPIRED', async () => {
      const now = new Date();
      const session = await createStartedSession({
        responsesFrozen: true,
        finalizationState: FINALIZATION_STATE.IN_PROGRESS,
        finalizationOwnerToken: 'boundary-worker',
        finalizationLeaseExpiresAt: now, // Exactly equal to now (expired)
        finalizationStartedAt: new Date(now.getTime() - 10000),
        finalizationTargetStatus: SESSION_STATUS.SUBMITTED,
      });

      // Path B1 should succeed because lease is expired (<= now)
      const res = await acquireFinalizationLease(session._id, userId, 'recovery-boundary-worker', SESSION_STATUS.SUBMITTED);
      expect(res.acquisitionPath).toBe('PATH_B1_CRASH_RECOVERY');
    });

    it('heartbeat renewal fails with 409 FINALIZATION_LEASE_LOST if lease has expired', async () => {
      const expiredLease = new Date(Date.now() - 1000);
      const workerToken = 'expired-heartbeat-worker';

      const session = await createStartedSession({
        responsesFrozen: true,
        finalizationState: FINALIZATION_STATE.IN_PROGRESS,
        finalizationOwnerToken: workerToken,
        finalizationLeaseExpiresAt: expiredLease,
      });

      try {
        await renewHeartbeat(session._id, workerToken);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(MOCK_ERROR_CODES.FINALIZATION_LEASE_LOST);
      }
    });

    it('failure release fails if worker lease has expired, leaving state for B1 recovery', async () => {
      const expiredLease = new Date(Date.now() - 2000);
      const workerToken = 'stale-failure-worker';

      const session = await createStartedSession({
        responsesFrozen: true,
        finalizationState: FINALIZATION_STATE.IN_PROGRESS,
        finalizationOwnerToken: workerToken,
        finalizationLeaseExpiresAt: expiredLease,
      });

      // Attempt to release failure
      await handleFinalizationFailure(session._id, workerToken, new Error('Simulated failure'));

      // Check document: state remains in_progress with expired lease, ready for B1 recovery!
      const after = await MockSession.findById(session._id);
      expect(after.finalizationState).toBe(FINALIZATION_STATE.IN_PROGRESS);
      expect(after.finalizationOwnerToken).toBe(workerToken);
    });
  });
});
