'use strict';

/**
 * mockFinalizationService.js — Resumable, Crash-Proof Finalization & Three-Way Lease Engine
 *
 * Implements:
 * 1. acquireFinalizationLease (Path A Initial, Path B1 Crash Recovery, Path B2 Explicit Failed-State)
 * 2. Exact lease boundary semantics (valid iff expiresAt > now; expired iff expiresAt <= now)
 * 3. Immutable finalizationTargetStatus retention across recovery
 * 4. Periodic heartbeat fencing & terminal write ownership
 * 5. Answered-only attempt creation & minimal receipts
 * 6. attemptService.createAttempt adapter mapping timeTakenSeconds -> timeTaken
 * 7. Receipt integrity validation (500 RESULT_INTEGRITY_ERROR)
 * 8. Result rebuild parity engine (rebuildMockResult)
 */

const mongoose = require('mongoose');
const MockSession = require('../../models/mockSessionModel');
const MockResponse = require('../../models/mockResponseModel');
const MockAttemptFinalizationRecord = require('../../models/mockAttemptFinalizationRecordModel');
const Attempt = require('../../models/attemptModel');
const attemptService = require('../attemptService');
const { calculateMockResult } = require('./mockScoringService');
const AppError = require('../../utils/AppError');
const {
  SESSION_STATUS,
  FINALIZATION_STATE,
  FINALIZATION_LEASE,
  MOCK_ALGORITHM_VERSION,
  MOCK_ERROR_CODES,
} = require('../../config/mockConfig');

/**
 * Acquires a distributed finalization lease via Path A, Path B1, or Path B2.
 */
const acquireFinalizationLease = async (sessionId, userId, workerToken, requestedTargetStatus) => {
  if (![SESSION_STATUS.SUBMITTED, SESSION_STATUS.EXPIRED].includes(requestedTargetStatus)) {
    throw new AppError(400, MOCK_ERROR_CODES.INVALID_SESSION_STATE, 'Invalid finalization target status.');
  }

  const mongoSession = await mongoose.startSession();
  try {
    let leaseResult;
    await mongoSession.withTransaction(async () => {
      const now = new Date();
      const leaseUntil = new Date(now.getTime() + FINALIZATION_LEASE.DURATION_MS);

      let acquisitionPath = null;
      let mockSession = null;

      // 1. Inspect existing session inside transaction
      const existing = await MockSession.findById(sessionId).session(mongoSession);
      if (!existing) {
        throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
      }
      if (existing.userId !== userId) {
        throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');
      }

      // Check terminal state conflicts
      if (
        existing.status === SESSION_STATUS.ABANDONED ||
        existing.status === SESSION_STATUS.SUBMITTED ||
        existing.status === SESSION_STATUS.EXPIRED
      ) {
        throw new AppError(
          409,
          MOCK_ERROR_CODES.SESSION_STATE_CONFLICT,
          'Session has already transitioned to an incompatible terminal state.'
        );
      }

      // Check active unexpired lease: valid iff finalizationLeaseExpiresAt > now
      if (
        existing.finalizationState === FINALIZATION_STATE.IN_PROGRESS &&
        existing.finalizationLeaseExpiresAt &&
        existing.finalizationLeaseExpiresAt > now
      ) {
        throw new AppError(
          409,
          MOCK_ERROR_CODES.FINALIZATION_IN_PROGRESS,
          'Mock session finalization is currently in progress. Please retry shortly.'
        );
      }

      // Compute effective target for Path A: global expiry wins if now >= expiresAt
      const effectiveTargetStatus =
        existing.expiresAt && now.getTime() >= existing.expiresAt.getTime()
          ? SESSION_STATUS.EXPIRED
          : requestedTargetStatus;

      // 2. Deterministic Acquisition Path Resolution:

      // Try PATH A: INITIAL ACQUISITION (Unfrozen, Idle, No Owner)
      mockSession = await MockSession.findOneAndUpdate(
        {
          _id: sessionId,
          userId,
          status: SESSION_STATUS.STARTED,
          responsesFrozen: false,
          finalizationState: FINALIZATION_STATE.IDLE,
          finalizationOwnerToken: null,
        },
        {
          $set: {
            responsesFrozen: true, // Permanent barrier established
            finalizationState: FINALIZATION_STATE.IN_PROGRESS,
            finalizationOwnerToken: workerToken,
            finalizationLeaseExpiresAt: leaseUntil,
            finalizationHeartbeatAt: now,
            finalizationStartedAt: now, // Initial start timestamp set once
            finalizationTargetStatus: effectiveTargetStatus, // Target recorded once
          },
          $inc: { responseMutationVersion: 1 },
        },
        { new: true, session: mongoSession }
      );

      if (mockSession) {
        acquisitionPath = 'PATH_A_INITIAL';
      } else {
        // Try PATH B1: CRASH RECOVERY (Frozen, In-Progress, Expired Lease <= now)
        // CRUCIAL: Strictly preserves existing finalizationTargetStatus (NEVER derived from current wall clock)
        // CRUCIAL: Strictly preserves existing finalizationStartedAt
        mockSession = await MockSession.findOneAndUpdate(
          {
            _id: sessionId,
            userId,
            status: SESSION_STATUS.STARTED,
            responsesFrozen: true,
            finalizationState: FINALIZATION_STATE.IN_PROGRESS,
            finalizationLeaseExpiresAt: { $lte: now },
          },
          {
            $set: {
              finalizationOwnerToken: workerToken,
              finalizationLeaseExpiresAt: leaseUntil,
              finalizationHeartbeatAt: now,
            },
            $inc: { responseMutationVersion: 1 },
          },
          { new: true, session: mongoSession }
        );

        if (mockSession) {
          acquisitionPath = 'PATH_B1_CRASH_RECOVERY';
        } else {
          // Try PATH B2: EXPLICIT FAILED-STATE RECOVERY (Frozen, Failed, No Owner, Immediate Retry)
          // CRUCIAL: Strictly preserves existing finalizationTargetStatus (NEVER overwritten or recalculated)
          // CRUCIAL: Strictly preserves existing finalizationStartedAt
          mockSession = await MockSession.findOneAndUpdate(
            {
              _id: sessionId,
              userId,
              status: SESSION_STATUS.STARTED,
              responsesFrozen: true,
              finalizationState: FINALIZATION_STATE.FAILED,
              finalizationOwnerToken: null,
              $or: [
                { finalizationLeaseExpiresAt: null },
                { finalizationLeaseExpiresAt: { $lte: now } },
              ],
            },
            {
              $set: {
                finalizationState: FINALIZATION_STATE.IN_PROGRESS,
                finalizationOwnerToken: workerToken,
                finalizationLeaseExpiresAt: leaseUntil,
                finalizationHeartbeatAt: now,
              },
              $inc: { responseMutationVersion: 1 },
            },
            { new: true, session: mongoSession }
          );

          if (mockSession) {
            acquisitionPath = 'PATH_B2_EXPLICIT_FAILED';
          }
        }
      }

      if (!mockSession) {
        throw new AppError(
          400,
          MOCK_ERROR_CODES.INVALID_SESSION_STATE,
          'Mock session cannot be submitted in its current state.'
        );
      }

      // Snapshot all MockResponses within this transaction
      const responseSnapshot = await MockResponse.find({ sessionId: mockSession._id }).session(mongoSession);
      leaseResult = { mockSession, responseSnapshot, acquisitionPath, workerToken };
    });

    return leaseResult;
  } finally {
    await mongoSession.endSession();
  }
};

/**
 * Renews finalization lease heartbeat.
 * Fenced strictly with finalizationLeaseExpiresAt > now.
 */
const renewHeartbeat = async (sessionId, workerToken) => {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + FINALIZATION_LEASE.DURATION_MS);

  const res = await MockSession.updateOne(
    {
      _id: sessionId,
      status: SESSION_STATUS.STARTED,
      finalizationOwnerToken: workerToken,
      finalizationState: FINALIZATION_STATE.IN_PROGRESS,
      finalizationLeaseExpiresAt: { $gt: now },
    },
    {
      $set: {
        finalizationLeaseExpiresAt: leaseUntil,
        finalizationHeartbeatAt: now,
      },
    }
  );

  if (res.matchedCount !== 1) {
    throw new AppError(
      409,
      MOCK_ERROR_CODES.FINALIZATION_LEASE_LOST,
      'Finalization lease lost or expired.'
    );
  }
};

/**
 * Handles explicit failure release, transitioning state to 'failed' and releasing owner.
 * Only succeeds if worker still owns a valid unexpired lease.
 */
const handleFinalizationFailure = async (sessionId, workerToken, error) => {
  const now = new Date();
  const res = await MockSession.updateOne(
    {
      _id: sessionId,
      status: SESSION_STATUS.STARTED,
      finalizationOwnerToken: workerToken,
      finalizationState: FINALIZATION_STATE.IN_PROGRESS,
      finalizationLeaseExpiresAt: { $gt: now },
    },
    {
      $set: {
        finalizationState: FINALIZATION_STATE.FAILED,
        finalizationOwnerToken: null,
        finalizationLeaseExpiresAt: null,
        finalizationHeartbeatAt: now,
        responsesFrozen: true,
      },
    }
  );

  if (res.matchedCount !== 1) {
    // Stale worker whose lease has expired has no authority to mutate finalization state.
    // Crash recovery will proceed via PATH_B1_CRASH_RECOVERY instead.
    return;
  }

  console.error(
    JSON.stringify({
      event: 'MOCK_FINALIZATION_FAILED',
      sessionId,
      algorithmVersion: MOCK_ALGORITHM_VERSION,
      errorCode: error.code || MOCK_ERROR_CODES.FINALIZATION_EXECUTION_FAILED,
      finalizationState: 'failed',
      timestamp: now.toISOString(),
    })
  );
};

/**
 * Executes finalization processing for a worker that owns the lease.
 * Slices answered responses, verifies/creates Attempt and receipt, scores, and commits.
 */
const processFinalizationWithOwnedLease = async ({
  mockSession,
  responseSnapshot,
  workerToken,
  acquisitionPath,
}) => {
  const sessionId = mockSession._id;
  const userId = mockSession.userId;

  try {
    // 1. Separate answered vs unanswered responses
    // Only answered questions create Attempts and receipts
    const answeredResponses = (responseSnapshot || []).filter(
      (r) => r.selectedAnswer !== null && r.selectedAnswer !== undefined
    );

    const attemptsByQuestionId = new Map();
    let questionsProcessedSinceHeartbeat = 0;

    for (const resp of answeredResponses) {
      questionsProcessedSinceHeartbeat++;
      if (questionsProcessedSinceHeartbeat >= 5) {
        await renewHeartbeat(sessionId, workerToken);
        questionsProcessedSinceHeartbeat = 0;
      }

      const qId = resp.questionId;
      const qIdStr = qId.toString();

      // Check receipt
      const receipt = await MockAttemptFinalizationRecord.findOne({
        sessionId,
        questionId: qId,
      });

      let linkedAttempt = null;

      if (receipt) {
        // Receipt -> Attempt Integrity Validation
        if (
          receipt.sessionId.toString() !== sessionId.toString() ||
          !mockSession.questionSequence.some((q) => q.questionId.toString() === receipt.questionId.toString())
        ) {
          throw new AppError(500, MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR, 'Receipt session/question mismatch.');
        }

        linkedAttempt = await Attempt.findById(receipt.attemptId);
        if (
          !linkedAttempt ||
          linkedAttempt._id.toString() !== receipt.attemptId.toString() ||
          linkedAttempt.userId !== userId ||
          linkedAttempt.sessionId !== sessionId.toString() ||
          linkedAttempt.questionId.toString() !== receipt.questionId.toString() ||
          linkedAttempt.source !== 'mock'
        ) {
          throw new AppError(
            500,
            MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR,
            'Receipt Attempt integrity check failed.'
          );
        }

        attemptsByQuestionId.set(qIdStr, linkedAttempt);
      } else {
        // Receipt missing: check if Attempt already exists (recovery case)
        linkedAttempt = await Attempt.findOne({
          sessionId: sessionId.toString(),
          questionId: qId,
          source: 'mock',
        });

        if (!linkedAttempt) {
          // Create new Attempt via attemptService
          try {
            linkedAttempt = await attemptService.createAttempt({
              userId,
              questionId: qId,
              selectedAnswer: resp.selectedAnswer,
              timeTaken: resp.timeTakenSeconds, // Adapter mapping: timeTakenSeconds -> timeTaken
              source: 'mock',
              sessionId: sessionId.toString(),
            });
          } catch (createErr) {
            // E11000 duplicate key collision: recover existing Attempt
            if (createErr.code === 11000 || (createErr.message && createErr.message.includes('E11000'))) {
              linkedAttempt = await Attempt.findOne({
                sessionId: sessionId.toString(),
                questionId: qId,
                source: 'mock',
              });
            } else {
              throw createErr;
            }
          }
        }

        if (
          !linkedAttempt ||
          linkedAttempt.userId !== userId ||
          linkedAttempt.sessionId !== sessionId.toString() ||
          linkedAttempt.questionId.toString() !== qIdStr ||
          linkedAttempt.source !== 'mock'
        ) {
          throw new AppError(
            500,
            MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR,
            'Created or recovered Attempt integrity check failed.'
          );
        }

        // Write minimal receipt
        await MockAttemptFinalizationRecord.create({
          sessionId,
          questionId: qId,
          userId,
          attemptId: linkedAttempt._id,
          algorithmVersion: MOCK_ALGORITHM_VERSION,
          status: 'completed',
          finalizedAt: new Date(),
        });

        attemptsByQuestionId.set(qIdStr, linkedAttempt);
      }
    }

    // 2. Pure deterministic calculation of mock assessment results
    const resultSummary = calculateMockResult({
      session: mockSession,
      questionSequence: mockSession.questionSequence,
      responses: responseSnapshot,
      attemptsByQuestionId,
    });

    // 3. Terminal Write Fencing
    const now = new Date();
    const target = mockSession.finalizationTargetStatus;

    const terminalUpdatePayload =
      target === SESSION_STATUS.SUBMITTED
        ? {
            status: SESSION_STATUS.SUBMITTED,
            finalizationState: FINALIZATION_STATE.COMPLETED,
            finalizationOwnerToken: null,
            finalizationLeaseExpiresAt: null,
            submittedAt: now,
            expiredAt: null,
            resultSummary,
          }
        : {
            status: SESSION_STATUS.EXPIRED,
            finalizationState: FINALIZATION_STATE.COMPLETED,
            finalizationOwnerToken: null,
            finalizationLeaseExpiresAt: null,
            expiredAt: now,
            submittedAt: null,
            resultSummary,
          };

    const finalSession = await MockSession.findOneAndUpdate(
      {
        _id: sessionId,
        status: SESSION_STATUS.STARTED,
        finalizationOwnerToken: workerToken,
        finalizationState: FINALIZATION_STATE.IN_PROGRESS,
        finalizationLeaseExpiresAt: { $gt: now },
      },
      {
        $set: terminalUpdatePayload,
      },
      { new: true }
    );

    if (!finalSession) {
      throw new AppError(
        409,
        MOCK_ERROR_CODES.FINALIZATION_LEASE_LOST,
        'Finalization write rejected: lease lost or expired.'
      );
    }

    return finalSession.resultSummary;
  } catch (err) {
    if (err.code !== MOCK_ERROR_CODES.FINALIZATION_LEASE_LOST) {
      await handleFinalizationFailure(sessionId, workerToken, err);
    }
    throw err;
  }
};

/**
 * Rebuilds and verifies mock result integrity from receipts and Attempts.
 * Enforces authoritative completeness and deep parity against persisted resultSummary.
 */
const rebuildMockResult = async (sessionId) => {
  const session = await MockSession.findById(sessionId);
  if (!session) {
    throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  }

  // Load receipts
  const receipts = await MockAttemptFinalizationRecord.find({ sessionId: session._id });
  const receiptMap = new Map();
  for (const r of receipts) {
    receiptMap.set(r.questionId.toString(), r);
  }

  // Load receipt-linked Attempts
  const attemptIds = receipts.map((r) => r.attemptId);
  const attempts = await Attempt.find({ _id: { $in: attemptIds } });
  const attemptMap = new Map();
  for (const a of attempts) {
    attemptMap.set(a._id.toString(), a);
  }

  // Receipt -> Attempt Integrity Validation
  for (const r of receipts) {
    if (
      r.sessionId.toString() !== session._id.toString() ||
      !session.questionSequence.some((q) => q.questionId.toString() === r.questionId.toString())
    ) {
      throw new AppError(500, MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR, 'Receipt session/question mismatch.');
    }

    const linkedAttempt = attemptMap.get(r.attemptId.toString());
    if (
      !linkedAttempt ||
      linkedAttempt._id.toString() !== r.attemptId.toString() ||
      linkedAttempt.userId !== session.userId ||
      linkedAttempt.sessionId !== session._id.toString() ||
      linkedAttempt.questionId.toString() !== r.questionId.toString() ||
      linkedAttempt.source !== 'mock'
    ) {
      throw new AppError(500, MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR, 'Receipt Attempt integrity check failed.');
    }
  }

  // Load frozen responses
  const responses = await MockResponse.find({ sessionId: session._id });
  const answeredResponses = responses.filter(
    (r) => r.selectedAnswer !== null && r.selectedAnswer !== undefined
  );

  // Authoritative completeness check:
  // Every frozen answered response MUST have exactly one valid receipt and one valid Attempt!
  // (Receipt count is NOT compared against totalQuestions).
  if (receipts.length !== answeredResponses.length) {
    throw new AppError(
      500,
      MOCK_ERROR_CODES.RESULT_INCOMPLETE_FINALIZATION,
      `Finalization incomplete: expected ${answeredResponses.length} receipts for answered questions, found ${receipts.length}.`
    );
  }

  const attemptsByQuestionId = new Map();
  for (const resp of answeredResponses) {
    const qIdStr = resp.questionId.toString();
    const receipt = receiptMap.get(qIdStr);
    if (!receipt) {
      throw new AppError(
        500,
        MOCK_ERROR_CODES.RESULT_INCOMPLETE_FINALIZATION,
        `Answered question "${qIdStr}" lacks finalization receipt.`
      );
    }
    const attempt = attemptMap.get(receipt.attemptId.toString());
    if (!attempt) {
      throw new AppError(
        500,
        MOCK_ERROR_CODES.RESULT_INCOMPLETE_FINALIZATION,
        `Answered question "${qIdStr}" lacks linked Attempt.`
      );
    }
    attemptsByQuestionId.set(qIdStr, attempt);
  }

  // Calculate rebuilt result via shared calculator
  const rebuiltResult = calculateMockResult({
    session,
    questionSequence: session.questionSequence,
    responses,
    attemptsByQuestionId,
  });

  // Deep comparison against persisted resultSummary
  const persisted = session.resultSummary;
  if (!persisted) {
    throw new AppError(
      500,
      MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR,
      'Mock session lacks persisted resultSummary.'
    );
  }

  const checkDeepEquality = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  const domains = ['overall', 'sections', 'topics', 'patterns', 'difficulties', 'pacing'];
  for (const domain of domains) {
    if (!checkDeepEquality(rebuiltResult[domain], persisted[domain])) {
      throw new AppError(
        500,
        MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR,
        `Result rebuild mismatch in domain "${domain}".`
      );
    }
  }

  return {
    verified: true,
    resultSummary: rebuiltResult,
  };
};

module.exports = {
  acquireFinalizationLease,
  renewHeartbeat,
  handleFinalizationFailure,
  processFinalizationWithOwnedLease,
  rebuildMockResult,
};
