'use strict';

/**
 * mockSessionService.js — Mock Session Lifecycle, Responses & Section Engine
 *
 * Implements:
 * 1. POST /api/v1/mock-sessions (Creation)
 * 2. POST /api/v1/mock-sessions/:id/start (Idempotent start)
 * 3. GET /api/v1/mock-sessions/:id (State & Question DTOs)
 * 4. GET /api/v1/mock-sessions/:id/questions/:questionId (First-view draft mutation & clean DTO)
 * 5. POST /api/v1/mock-sessions/:id/responses (Transactional answer draft with deadline & freeze checks)
 * 6. POST /api/v1/mock-sessions/:id/sections/:sectionId/complete (Atomic section transition & barrier)
 * 7. POST /api/v1/mock-sessions/:id/submit (Outer orchestration & post-finalization idempotency)
 * 8. POST /api/v1/mock-sessions/:id/abandon (Pre-finalization atomic abandon guard)
 * 9. GET /api/v1/mock-sessions/:id/review (Terminal review with explanations; denied on abandon)
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const MockSession = require('../../models/mockSessionModel');
const MockResponse = require('../../models/mockResponseModel');
const Question = require('../../models/questionModel');
const { userExists } = require('../userService');
const { getBlueprintById } = require('./mockBlueprintService');
const { validateAndNormalizeBlueprint } = require('./mockBlueprintValidationService');
const { assembleMockSessionQuestions } = require('./mockAssemblerService');
const {
  acquireFinalizationLease,
  processFinalizationWithOwnedLease,
} = require('./mockFinalizationService');
const { resolveSessionExpiry } = require('./mockExpiryService');
const AppError = require('../../utils/AppError');
const {
  SESSION_STATUS,
  FINALIZATION_STATE,
  NAVIGATION_POLICIES,
  MOCK_MODES,
  SECTION_STATUS,
  RESPONSE_STATUS,
  SESSION_LIMITS,
  FINALIZATION_LEASE,
  MOCK_ERROR_CODES,
  MOCK_ALGORITHM_VERSION,
} = require('../../config/mockConfig');

/**
 * Sanitizes Question object into student-facing Question DTO.
 * Guarantees zero leakage of answer, correctAnswer, explanation, or solution.
 */
const sanitizeQuestionDTO = (question, sectionId, order) => {
  return {
    questionId: question._id ? question._id.toString() : question.questionId?.toString(),
    sectionId,
    order,
    question: question.question,
    options: question.options,
    topic: question.topic,
    pattern: question.pattern,
    difficulty: question.difficulty,
  };
};

/**
 * Creates a new MockSession from an existing blueprintId or inline blueprint.
 */
const createSession = async ({ userId, blueprintId, blueprint: inlineBlueprint, generationSeed }) => {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    throw new AppError(400, MOCK_ERROR_CODES.USER_NOT_FOUND, 'userId is required.');
  }

  if (!(await userExists(userId))) {
    throw new AppError(404, MOCK_ERROR_CODES.USER_NOT_FOUND, `User "${userId}" not found.`);
  }

  let blueprintDoc = null;
  let normalizedBlueprint = null;

  if (blueprintId) {
    blueprintDoc = await getBlueprintById(blueprintId);
    normalizedBlueprint = blueprintDoc.toObject();
  } else if (inlineBlueprint) {
    normalizedBlueprint = validateAndNormalizeBlueprint(inlineBlueprint);
  } else {
    throw new AppError(400, MOCK_ERROR_CODES.INVALID_BLUEPRINT, 'blueprintId or inline blueprint is required.');
  }

  const effectiveExcludeRecent =
    normalizedBlueprint.effectiveExcludeRecentQuestions !== undefined && normalizedBlueprint.effectiveExcludeRecentQuestions !== null
      ? Boolean(normalizedBlueprint.effectiveExcludeRecentQuestions)
      : normalizedBlueprint.excludeRecentQuestions !== undefined && normalizedBlueprint.excludeRecentQuestions !== null
        ? Boolean(normalizedBlueprint.excludeRecentQuestions)
        : normalizedBlueprint.mode === MOCK_MODES.DIAGNOSTIC;
  normalizedBlueprint.effectiveExcludeRecentQuestions = effectiveExcludeRecent;

  const seed = generationSeed || crypto.randomUUID();

  // Assemble question sequence deterministically
  const { questionSequence, sectionStates } = await assembleMockSessionQuestions({
    blueprint: normalizedBlueprint,
    userId,
    generationSeed: seed,
    dryRun: false,
  });

  const sessionDoc = await MockSession.create({
    userId,
    blueprintId: blueprintDoc ? blueprintDoc._id : null,
    blueprintSnapshot: normalizedBlueprint,
    blueprintFingerprint: normalizedBlueprint.blueprintFingerprint,
    mode: normalizedBlueprint.mode,
    navigationPolicy: normalizedBlueprint.navigationPolicy,
    effectiveExcludeRecentQuestions: normalizedBlueprint.effectiveExcludeRecentQuestions,
    currentSectionId:
      normalizedBlueprint.navigationPolicy === NAVIGATION_POLICIES.SECTION_LOCKED && sectionStates.length > 0
        ? sectionStates[0].sectionId
        : null,
    questionSequence,
    sectionStates,
    totalQuestions: normalizedBlueprint.totalQuestions,
    durationMinutes: normalizedBlueprint.durationMinutes,
    generationSeed: seed,
    algorithmVersion: MOCK_ALGORITHM_VERSION,
    status: SESSION_STATUS.CREATED,
  });

  return sessionDoc;
};

/**
 * Idempotently starts the session timer and activates section 0 if section-locked.
 */
const startSession = async (sessionId, userId) => {
  const session = await MockSession.findById(sessionId);
  if (!session) {
    throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  }
  if (session.userId !== userId) {
    throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');
  }

  // Idempotency: if already started, return existing session without mutating timestamps
  if (session.status === SESSION_STATUS.STARTED) {
    return session;
  }

  // Terminal states cannot be started
  if (
    session.status === SESSION_STATUS.SUBMITTED ||
    session.status === SESSION_STATUS.EXPIRED ||
    session.status === SESSION_STATUS.ABANDONED
  ) {
    throw new AppError(400, MOCK_ERROR_CODES.INVALID_SESSION_STATE, 'Mock session is already terminal.');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + session.durationMinutes * 60 * 1000);

  session.status = SESSION_STATUS.STARTED;
  session.startedAt = now;
  session.expiresAt = expiresAt;

  if (session.navigationPolicy === NAVIGATION_POLICIES.SECTION_LOCKED) {
    if (session.sectionStates.length > 0) {
      const s0 = session.sectionStates[0];
      s0.status = SECTION_STATUS.IN_PROGRESS;
      s0.startedAt = now;
      if (s0.durationMinutes !== null && s0.durationMinutes !== undefined) {
        const calculatedExpiry = new Date(now.getTime() + s0.durationMinutes * 60 * 1000);
        s0.expiresAt = new Date(Math.min(calculatedExpiry.getTime(), expiresAt.getTime()));
      } else {
        s0.expiresAt = null;
      }
      session.currentSectionId = s0.sectionId;
    }
  }

  await session.save();
  return session;
};

/**
 * Atomically transitions current section and activates next section OR establishes finalization barrier.
 */
const transitionSectionTransactional = async ({
  sessionId,
  expectedSectionId,
  targetSectionStatus,
  workerToken,
  now,
}) => {
  const mongoSession = await mongoose.startSession();
  try {
    let transitionResult = null;
    await mongoSession.withTransaction(async () => {
      // 1. Array guard ensures the SAME array element has expected sectionId AND in_progress status
      const session = await MockSession.findOne({
        _id: sessionId,
        status: SESSION_STATUS.STARTED,
        currentSectionId: expectedSectionId,
        sectionStates: {
          $elemMatch: {
            sectionId: expectedSectionId,
            status: SECTION_STATUS.IN_PROGRESS,
          },
        },
      }).session(mongoSession);

      if (!session) return; // Another concurrent transition won or session is no longer active

      // 2. Transition current section
      const currentIdx = session.sectionStates.findIndex((s) => s.sectionId === expectedSectionId);
      session.sectionStates[currentIdx].status = targetSectionStatus; // COMPLETED or EXPIRED
      session.sectionStates[currentIdx].completedAt = now;

      const nextIdx = currentIdx + 1;
      const isFinalSection = nextIdx >= session.sectionStates.length;
      let responseSnapshot = null;

      if (isFinalSection) {
        // Final Section: Atomically establish finalization barrier in same document write
        session.currentSectionId = null;
        session.responsesFrozen = true;
        session.finalizationState = FINALIZATION_STATE.IN_PROGRESS;
        session.finalizationOwnerToken = workerToken;
        session.finalizationLeaseExpiresAt = new Date(now.getTime() + FINALIZATION_LEASE.DURATION_MS);
        session.finalizationHeartbeatAt = now;
        session.finalizationStartedAt = now;
        session.finalizationTargetStatus =
          now.getTime() >= session.expiresAt.getTime()
            ? SESSION_STATUS.EXPIRED
            : SESSION_STATUS.SUBMITTED;
        session.responseMutationVersion += 1;

        // Snapshot responses under the same atomic freeze barrier
        responseSnapshot = await MockResponse.find({ sessionId: session._id }).session(mongoSession);
      } else {
        // Non-final section: Atomically activate next section
        const nextSec = session.sectionStates[nextIdx];
        nextSec.status = SECTION_STATUS.IN_PROGRESS;
        nextSec.startedAt = now;
        if (nextSec.durationMinutes !== null && nextSec.durationMinutes !== undefined) {
          const calculatedExpiry = new Date(now.getTime() + nextSec.durationMinutes * 60 * 1000);
          nextSec.expiresAt = new Date(Math.min(calculatedExpiry.getTime(), session.expiresAt.getTime()));
        } else {
          nextSec.expiresAt = null;
        }
        session.currentSectionId = nextSec.sectionId;
      }

      await session.save({ session: mongoSession });
      transitionResult = {
        session,
        isFinalSection,
        workerToken,
        responseSnapshot,
        acquisitionPath: isFinalSection ? 'FINAL_SECTION_INITIAL' : null,
      };
    });

    return transitionResult;
  } finally {
    await mongoSession.endSession();
  }
};

/**
 * Resolves active section expiry for section-locked navigation outside response transactions.
 */
const resolveActiveSectionExpiry = async (sessionId, userId, now = new Date()) => {
  const session = await MockSession.findById(sessionId);
  if (!session || session.navigationPolicy !== NAVIGATION_POLICIES.SECTION_LOCKED) return null;
  if (session.status !== SESSION_STATUS.STARTED) return null;

  const activeSec = session.sectionStates.find(
    (s) => s.sectionId === session.currentSectionId && s.status === SECTION_STATUS.IN_PROGRESS
  );

  if (!activeSec || activeSec.durationMinutes === null || !activeSec.expiresAt) return null;
  if (now.getTime() < activeSec.expiresAt.getTime()) return null;

  const workerToken = crypto.randomUUID();
  const transition = await transitionSectionTransactional({
    sessionId,
    expectedSectionId: activeSec.sectionId,
    targetSectionStatus: SECTION_STATUS.EXPIRED,
    workerToken,
    now,
  });

  if (transition && transition.isFinalSection) {
    return await processFinalizationWithOwnedLease({
      mockSession: transition.session,
      responseSnapshot: transition.responseSnapshot,
      workerToken,
      acquisitionPath: transition.acquisitionPath,
    });
  }

  return transition ? transition.session : null;
};

/**
 * Completes a section manually under section_locked navigation.
 */
const completeSection = async (sessionId, userId, sectionId) => {
  const now = new Date();
  await resolveSessionExpiry(sessionId, userId, now);

  const session = await MockSession.findById(sessionId);
  if (!session) {
    throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  }
  if (session.userId !== userId) {
    throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');
  }
  if (session.status !== SESSION_STATUS.STARTED) {
    throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Mock session is not active.');
  }
  if (session.responsesFrozen || session.finalizationState !== FINALIZATION_STATE.IDLE) {
    throw new AppError(409, MOCK_ERROR_CODES.RESPONSE_FROZEN, 'Mock session responses are frozen.');
  }
  if (session.navigationPolicy !== NAVIGATION_POLICIES.SECTION_LOCKED) {
    throw new AppError(400, MOCK_ERROR_CODES.INVALID_SESSION_STATE, 'Section completion only applies to section_locked mocks.');
  }

  const activeSec = session.sectionStates.find((s) => s.sectionId === session.currentSectionId);
  if (!activeSec || activeSec.sectionId !== sectionId || activeSec.status !== SECTION_STATUS.IN_PROGRESS) {
    throw new AppError(409, MOCK_ERROR_CODES.SECTION_NOT_ACTIVE, 'Section is not active.');
  }

  // Check section deadline
  if (activeSec.durationMinutes !== null && activeSec.expiresAt && now.getTime() >= activeSec.expiresAt.getTime()) {
    await resolveActiveSectionExpiry(sessionId, userId, now);
    throw new AppError(409, MOCK_ERROR_CODES.SECTION_LOCKED, 'Section has expired.');
  }

  const workerToken = crypto.randomUUID();
  const transition = await transitionSectionTransactional({
    sessionId,
    expectedSectionId: sectionId,
    targetSectionStatus: SECTION_STATUS.COMPLETED,
    workerToken,
    now,
  });

  if (!transition) {
    throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Section completion conflict.');
  }

  if (transition.isFinalSection) {
    const resultSummary = await processFinalizationWithOwnedLease({
      mockSession: transition.session,
      responseSnapshot: transition.responseSnapshot,
      workerToken,
      acquisitionPath: transition.acquisitionPath,
    });
    return { isFinalSection: true, resultSummary };
  }

  return { isFinalSection: false, session: transition.session };
};

/**
 * Transactional save response helper.
 */
const saveResponseTransactional = async ({
  sessionId,
  userId,
  questionId,
  selectedAnswer,
  isMarkedForReview,
  timeTakenSeconds,
}) => {
  const mongoSession = await mongoose.startSession();
  try {
    let result;
    await mongoSession.withTransaction(async () => {
      // 1. Contending atomic write on the MockSession document
      const guardedSession = await MockSession.findOneAndUpdate(
        {
          _id: sessionId,
          userId,
          status: SESSION_STATUS.STARTED,
          responsesFrozen: false,
          finalizationOwnerToken: null,
        },
        {
          $inc: { responseMutationVersion: 1 },
        },
        {
          new: true,
          session: mongoSession,
        }
      );

      if (!guardedSession) {
        const existing = await MockSession.findById(sessionId).session(mongoSession);
        if (!existing) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
        if (existing.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');
        if (existing.responsesFrozen || existing.finalizationOwnerToken !== null) {
          throw new AppError(409, MOCK_ERROR_CODES.RESPONSE_FROZEN, 'Mock session responses are frozen.');
        }
        throw new AppError(400, MOCK_ERROR_CODES.INVALID_SESSION_STATE, 'Mock session is not active.');
      }

      // 2. Exact Server-Authoritative Timeout Guard (0ms grace period)
      const now = new Date();
      if (now.getTime() >= guardedSession.expiresAt.getTime()) {
        throw new AppError(409, MOCK_ERROR_CODES.MOCK_SESSION_EXPIRED, 'Mock session has expired.');
      }

      // 3. Question & Section Membership Validation
      const qEntry = guardedSession.questionSequence.find(
        (q) => q.questionId.toString() === questionId.toString()
      );
      if (!qEntry) throw new AppError(400, MOCK_ERROR_CODES.QUESTION_NOT_IN_SESSION, 'Question not in session.');

      if (guardedSession.navigationPolicy === NAVIGATION_POLICIES.SECTION_LOCKED) {
        if (guardedSession.currentSectionId !== qEntry.sectionId) {
          throw new AppError(409, MOCK_ERROR_CODES.SECTION_LOCKED, 'Section is locked.');
        }

        // Transactional Active Section Deadline Check (Zero timing grace)
        const activeSec = guardedSession.sectionStates.find(
          (s) => s.sectionId === guardedSession.currentSectionId
        );
        if (
          activeSec?.durationMinutes !== null &&
          activeSec?.expiresAt &&
          now.getTime() >= activeSec.expiresAt.getTime()
        ) {
          const err = new AppError(409, MOCK_ERROR_CODES.SECTION_LOCKED, 'Active section has expired.');
          err.isSectionExpiredSentinel = true;
          throw err;
        }
      }

      // 4. Authoritative Selected-Answer Validation
      const questionDoc = await Question.findById(questionId).session(mongoSession);
      if (!questionDoc) throw new AppError(404, MOCK_ERROR_CODES.QUESTION_NOT_FOUND, 'Question not found.');

      if (selectedAnswer !== null && selectedAnswer !== undefined) {
        if (!questionDoc.options.includes(selectedAnswer)) {
          throw new AppError(400, MOCK_ERROR_CODES.INVALID_OPTION, 'Selected answer must match one of the four options.');
        }
      }

      // 5. Strict timeTakenSeconds Validation (Reject wild inputs)
      if (
        typeof timeTakenSeconds !== 'number' ||
        !Number.isFinite(timeTakenSeconds) ||
        !Number.isInteger(timeTakenSeconds) ||
        timeTakenSeconds < 0
      ) {
        throw new AppError(400, MOCK_ERROR_CODES.INVALID_TIME_TAKEN, 'timeTakenSeconds must be a finite non-negative integer.');
      }

      // Section-Aware timeTakenSeconds bounds
      const elapsedSessionSec = Math.max(0, Math.ceil((now - guardedSession.startedAt) / 1000));
      let maxAllowedTime;
      const activeSec = guardedSession.sectionStates.find((s) => s.sectionId === guardedSession.currentSectionId);
      if (
        guardedSession.navigationPolicy === NAVIGATION_POLICIES.SECTION_LOCKED &&
        activeSec &&
        activeSec.startedAt &&
        activeSec.durationMinutes !== null
      ) {
        const elapsedSectionSec = Math.max(0, Math.ceil((now - activeSec.startedAt) / 1000));
        maxAllowedTime = Math.min(elapsedSessionSec, elapsedSectionSec) + SESSION_LIMITS.PACING_TOLERANCE_SECONDS;
      } else {
        maxAllowedTime = elapsedSessionSec + SESSION_LIMITS.PACING_TOLERANCE_SECONDS;
      }

      if (timeTakenSeconds > maxAllowedTime || timeTakenSeconds > SESSION_LIMITS.MAX_ALLOWED_TIME_TAKEN_SECONDS) {
        throw new AppError(400, MOCK_ERROR_CODES.INVALID_TIME_TAKEN, 'timeTakenSeconds exceeds allowed duration.');
      }

      // 6. Answer State & Review Flag Lifecycle
      const isAnswering = selectedAnswer !== null && selectedAnswer !== undefined;
      const responseStatus = isAnswering ? RESPONSE_STATUS.ANSWERED : RESPONSE_STATUS.VIEWED;

      const updateFields = {
        userId,
        sectionId: qEntry.sectionId,
        selectedAnswer: isAnswering ? selectedAnswer : null,
        status: responseStatus,
        timeTakenSeconds,
        updatedAt: now,
      };

      if (typeof isMarkedForReview === 'boolean') {
        updateFields.isMarkedForReview = isMarkedForReview;
      }

      result = await MockResponse.findOneAndUpdate(
        { sessionId: guardedSession._id, questionId: qEntry.questionId },
        {
          $set: updateFields,
          $setOnInsert: {
            createdAt: now,
            isViewed: true,
            viewedAt: now,
          },
        },
        { upsert: true, new: true, session: mongoSession }
      );
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
};

/**
 * Authoritative saveResponse orchestrator:
 * Resolves session or section expiry OUTSIDE the aborted transaction.
 */
const saveResponse = async (params) => {
  try {
    return await saveResponseTransactional(params);
  } catch (err) {
    if (err.code === MOCK_ERROR_CODES.MOCK_SESSION_EXPIRED) {
      await resolveSessionExpiry(params.sessionId, params.userId, new Date());
      throw err;
    }
    if (err.code === MOCK_ERROR_CODES.SECTION_LOCKED && err.isSectionExpiredSentinel) {
      await resolveActiveSectionExpiry(params.sessionId, params.userId, new Date());
      throw err;
    }
    throw err;
  }
};

/**
 * Views a question and records first-view draft under active conditions.
 */
const getQuestion = async (sessionId, userId, questionId) => {
  const now = new Date();
  await resolveSessionExpiry(sessionId, userId, now);

  const session = await MockSession.findById(sessionId);
  if (!session) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  if (session.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');

  if (session.status === SESSION_STATUS.EXPIRED) {
    throw new AppError(409, MOCK_ERROR_CODES.MOCK_SESSION_EXPIRED, 'Mock session has expired.');
  }

  const qEntry = session.questionSequence.find((q) => q.questionId.toString() === questionId.toString());
  if (!qEntry) throw new AppError(400, MOCK_ERROR_CODES.QUESTION_NOT_IN_SESSION, 'Question not in session.');

  if (session.navigationPolicy === NAVIGATION_POLICIES.SECTION_LOCKED) {
    if (session.currentSectionId !== qEntry.sectionId) {
      throw new AppError(409, MOCK_ERROR_CODES.SECTION_LOCKED, 'Section is locked.');
    }

    const activeSec = session.sectionStates.find((s) => s.sectionId === session.currentSectionId);
    if (activeSec?.durationMinutes !== null && activeSec?.expiresAt && now.getTime() >= activeSec.expiresAt.getTime()) {
      await resolveActiveSectionExpiry(sessionId, userId, now);
      throw new AppError(409, MOCK_ERROR_CODES.SECTION_LOCKED, 'Active section has expired.');
    }
  }

  const question = await Question.findById(questionId);
  if (!question) throw new AppError(404, MOCK_ERROR_CODES.QUESTION_NOT_FOUND, 'Question not found.');

  // First-view draft mutation obeys freeze & expiry
  let response = await MockResponse.findOne({ sessionId: session._id, questionId: question._id });
  if (!response && session.status === SESSION_STATUS.STARTED && !session.responsesFrozen) {
    response = await MockResponse.create({
      sessionId: session._id,
      questionId: question._id,
      userId,
      sectionId: qEntry.sectionId,
      status: RESPONSE_STATUS.VIEWED,
      isViewed: true,
      viewedAt: now,
      timeTakenSeconds: 0,
    });
    await MockSession.updateOne({ _id: session._id }, { $inc: { responseMutationVersion: 1 } });
  }

  const questionDTO = sanitizeQuestionDTO(question, qEntry.sectionId, qEntry.order);

  return {
    question: questionDTO,
    response: response
      ? {
          selectedAnswer: response.selectedAnswer,
          status: response.status,
          isMarkedForReview: response.isMarkedForReview,
          isViewed: response.isViewed,
          timeTakenSeconds: response.timeTakenSeconds,
        }
      : null,
  };
};

/**
 * Retrieves session by ID with question summary DTOs.
 */
const getSessionById = async (sessionId, userId) => {
  const now = new Date();
  await resolveSessionExpiry(sessionId, userId, now);

  const session = await MockSession.findById(sessionId);
  if (!session) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  if (session.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');

  const responses = await MockResponse.find({ sessionId: session._id });
  const respMap = new Map();
  for (const r of responses) {
    respMap.set(r.questionId.toString(), r);
  }

  const questionSummary = session.questionSequence.map((q) => {
    const r = respMap.get(q.questionId.toString());
    return {
      questionId: q.questionId.toString(),
      sectionId: q.sectionId,
      order: q.order,
      topic: q.topic,
      pattern: q.pattern,
      difficulty: q.difficulty,
      isAnswered: Boolean(r && r.selectedAnswer !== null && r.selectedAnswer !== undefined),
      isMarkedForReview: Boolean(r && r.isMarkedForReview),
      isViewed: Boolean(r && r.isViewed),
    };
  });

  return {
    sessionId: session._id,
    userId: session.userId,
    mode: session.mode,
    navigationPolicy: session.navigationPolicy,
    status: session.status,
    currentSectionId: session.currentSectionId,
    totalQuestions: session.totalQuestions,
    durationMinutes: session.durationMinutes,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    submittedAt: session.submittedAt,
    expiredAt: session.expiredAt,
    abandonedAt: session.abandonedAt,
    sectionStates: session.sectionStates,
    questionSummary,
  };
};

/**
 * Authoritative submitMockSession:
 * Handles post-finalization idempotency above lease acquisition.
 */
const submitMockSession = async ({ sessionId, userId }) => {
  const session = await MockSession.findById(sessionId);
  if (!session) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  if (session.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');

  // 1. Already submitted + completed: Zero-write idempotent 200 OK
  if (
    session.status === SESSION_STATUS.SUBMITTED &&
    session.finalizationState === FINALIZATION_STATE.COMPLETED &&
    session.resultSummary !== null
  ) {
    return session.resultSummary;
  }

  // 2. Expired: Cannot be manually submitted (409 MOCK_SESSION_EXPIRED)
  if (session.status === SESSION_STATUS.EXPIRED) {
    throw new AppError(409, MOCK_ERROR_CODES.MOCK_SESSION_EXPIRED, 'Mock session has already expired.');
  }

  // 3. Abandoned: Cannot be finalized or submitted (409 SESSION_STATE_CONFLICT)
  if (session.status === SESSION_STATUS.ABANDONED) {
    throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Mock session has been abandoned.');
  }

  // 4. Verify session is active (started)
  if (session.status !== SESSION_STATUS.STARTED) {
    throw new AppError(400, MOCK_ERROR_CODES.INVALID_SESSION_STATE, 'Mock session cannot be submitted in its current state.');
  }

  // 5. Active valid finalization in progress: 409 FINALIZATION_IN_PROGRESS
  const now = new Date();
  if (
    session.finalizationState === FINALIZATION_STATE.IN_PROGRESS &&
    session.finalizationLeaseExpiresAt &&
    session.finalizationLeaseExpiresAt > now
  ) {
    throw new AppError(
      409,
      MOCK_ERROR_CODES.FINALIZATION_IN_PROGRESS,
      'Mock session finalization is currently in progress. Please retry shortly.'
    );
  }

  // 6. Request finalization lease
  const workerToken = crypto.randomUUID();
  const leaseResult = await acquireFinalizationLease(sessionId, userId, workerToken, SESSION_STATUS.SUBMITTED);
  return await processFinalizationWithOwnedLease(leaseResult);
};

/**
 * Authoritative atomic abandon guard.
 */
const abandonSession = async (sessionId, userId) => {
  const existing = await MockSession.findById(sessionId);
  if (!existing) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  if (existing.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');

  const now = new Date();
  if (existing.status === SESSION_STATUS.STARTED && existing.expiresAt && now.getTime() >= existing.expiresAt.getTime()) {
    await resolveSessionExpiry(sessionId, userId, now);
    throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Mock session has already expired.');
  }

  const session = await MockSession.findOneAndUpdate(
    {
      _id: sessionId,
      userId,
      $or: [
        {
          status: SESSION_STATUS.CREATED,
        },
        {
          status: SESSION_STATUS.STARTED,
          responsesFrozen: false,
          finalizationState: FINALIZATION_STATE.IDLE,
          finalizationOwnerToken: null,
        },
      ],
    },
    {
      $set: {
        status: SESSION_STATUS.ABANDONED,
        abandonedAt: now,
      },
    },
    { new: true }
  );

  if (!session) {
    throw new AppError(
      409,
      MOCK_ERROR_CODES.SESSION_STATE_CONFLICT,
      'Session has already transitioned or finalization is in progress.'
    );
  }

  return { status: SESSION_STATUS.ABANDONED, abandonedAt: now };
};

/**
 * Question review with explanations for terminal sessions (submitted or expired).
 * Strictly denied for abandoned sessions.
 */
const getReview = async (sessionId, userId) => {
  let session = await MockSession.findById(sessionId);
  if (!session) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  if (session.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');

  if (session.status === SESSION_STATUS.ABANDONED) {
    throw new AppError(400, MOCK_ERROR_CODES.MOCK_SESSION_NOT_TERMINAL, 'Abandoned sessions cannot be reviewed.');
  }

  const now = new Date();
  if (session.status === SESSION_STATUS.STARTED && session.expiresAt && now.getTime() >= session.expiresAt.getTime()) {
    await resolveSessionExpiry(sessionId, userId, now);
    session = await MockSession.findById(sessionId);
  }

  if (session.status !== SESSION_STATUS.SUBMITTED && session.status !== SESSION_STATUS.EXPIRED) {
    throw new AppError(400, MOCK_ERROR_CODES.MOCK_SESSION_NOT_TERMINAL, 'Mock session is not in a terminal reviewable state.');
  }

  const qIds = session.questionSequence.map((q) => q.questionId);
  const questions = await Question.find({ _id: { $in: qIds } }).lean();
  const qMap = new Map();
  for (const q of questions) {
    qMap.set(q._id.toString(), q);
  }

  const responses = await MockResponse.find({ sessionId: session._id }).lean();
  const respMap = new Map();
  for (const r of responses) {
    respMap.set(r.questionId.toString(), r);
  }

  const reviewItems = session.questionSequence.map((seq) => {
    const qDoc = qMap.get(seq.questionId.toString());
    const resp = respMap.get(seq.questionId.toString());
    const isAnswered = Boolean(resp && resp.selectedAnswer !== null && resp.selectedAnswer !== undefined);
    const isCorrect = isAnswered && qDoc ? resp.selectedAnswer === qDoc.answer : false;

    return {
      questionId: seq.questionId.toString(),
      sectionId: seq.sectionId,
      order: seq.order,
      topic: seq.topic,
      pattern: seq.pattern,
      difficulty: seq.difficulty,
      question: qDoc?.question,
      options: qDoc?.options,
      correctAnswer: qDoc?.answer,
      explanation: qDoc?.explanation,
      solution: qDoc?.solution,
      selectedAnswer: resp?.selectedAnswer ?? null,
      isCorrect,
      isAnswered,
      isMarkedForReview: Boolean(resp?.isMarkedForReview),
      timeTakenSeconds: resp?.timeTakenSeconds ?? 0,
    };
  });

  return {
    sessionId: session._id,
    status: session.status,
    submittedAt: session.submittedAt,
    expiredAt: session.expiredAt,
    questions: reviewItems,
  };
};

module.exports = {
  sanitizeQuestionDTO,
  createSession,
  startSession,
  getSessionById,
  getQuestion,
  saveResponse,
  saveResponseTransactional,
  completeSection,
  resolveActiveSectionExpiry,
  transitionSectionTransactional,
  submitMockSession,
  abandonSession,
  getReview,
};
