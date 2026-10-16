'use strict';

/**
 * tests/mock/mockFinalizationAndRebuild.test.js
 *
 * Comprehensive tests for Phase 6 Finalization, Answered-Only Attempts,
 * Exactly-Once Processing, Signed Scoring, Six-Domain Analytics, and Result Rebuild Parity.
 */

const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const MockSession = require('../../src/models/mockSessionModel');
const MockResponse = require('../../src/models/mockResponseModel');
const MockAttemptFinalizationRecord = require('../../src/models/mockAttemptFinalizationRecordModel');
const Attempt = require('../../src/models/attemptModel');
const {
  acquireFinalizationLease,
  processFinalizationWithOwnedLease,
  rebuildMockResult,
} = require('../../src/services/mock/mockFinalizationService');
const {
  submitMockSession,
} = require('../../src/services/mock/mockSessionService');
const { resolveSessionExpiry } = require('../../src/services/mock/mockExpiryService');
const { calculateMockResult } = require('../../src/services/mock/mockScoringService');
const { seedMockQuestions, createTestUser } = require('../helpers/mockTestHelpers');
const {
  MOCK_MODES,
  NAVIGATION_POLICIES,
  SESSION_STATUS,
  FINALIZATION_STATE,
  RESPONSE_STATUS,
  MOCK_ERROR_CODES,
} = require('../../src/config/mockConfig');

describe('Phase 6: Finalization, Signed Scoring & Result Rebuild Engine', () => {
  const userId = 'finalization-user-1';

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
    await seedMockQuestions({
      topic: 'Average',
      pattern: 'Basic Arithmetic Mean & Missing Observations',
      countPerBand: 5,
    });
  });

  const setupMockSessionWithQuestions = async (scoringOverrides = {}) => {
    const q1List = await seedMockQuestions({ topic: 'Percentage', pattern: 'Successive Percentage Changes', countPerBand: 2 });
    const q2List = await seedMockQuestions({ topic: 'Average', pattern: 'Basic Arithmetic Mean & Missing Observations', countPerBand: 2 });

    const q1 = q1List[0];
    const q2 = q1List[1];
    const q3 = q2List[0];
    const q4 = q2List[1];

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    const session = await MockSession.create({
      userId,
      blueprintSnapshot: {
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        scoring: {
          correctMarks: scoringOverrides.correctMarks ?? 2.0,
          incorrectMarks: scoringOverrides.incorrectMarks ?? -0.5,
          unansweredMarks: scoringOverrides.unansweredMarks ?? -0.25,
        },
        sections: [
          {
            sectionId: 'sec-1',
            order: 0,
            questionCount: 2,
            scoring: scoringOverrides.section1Scoring || null,
            scope: { patterns: ['Successive Percentage Changes'] },
          },
          {
            sectionId: 'sec-2',
            order: 1,
            questionCount: 2,
            scoring: scoringOverrides.section2Scoring || null,
            scope: { patterns: ['Basic Arithmetic Mean & Missing Observations'] },
          },
        ],
      },
      blueprintFingerprint: 'fingerprint-scoring-test',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      effectiveExcludeRecentQuestions: false,
      totalQuestions: 4,
      durationMinutes: 60,
      generationSeed: 'scoring-seed-1',
      algorithmVersion: 'v1',
      status: SESSION_STATUS.STARTED,
      startedAt: now,
      expiresAt,
      questionSequence: [
        { questionId: q1._id, sectionId: 'sec-1', order: 0, topic: q1.topic, pattern: q1.pattern, difficulty: q1.difficulty },
        { questionId: q2._id, sectionId: 'sec-1', order: 1, topic: q2.topic, pattern: q2.pattern, difficulty: q2.difficulty },
        { questionId: q3._id, sectionId: 'sec-2', order: 2, topic: q3.topic, pattern: q3.pattern, difficulty: q3.difficulty },
        { questionId: q4._id, sectionId: 'sec-2', order: 3, topic: q4.topic, pattern: q4.pattern, difficulty: q4.difficulty },
      ],
      sectionStates: [
        { sectionId: 'sec-1', order: 0, status: 'in_progress', questionCount: 2 },
        { sectionId: 'sec-2', order: 1, status: 'in_progress', questionCount: 2 },
      ],
    });

    return { session, questions: [q1, q2, q3, q4] };
  };

  describe('Answered-Only Attempts and Receipts', () => {
    it('zero-answer mock finalization creates 0 Attempts and 0 receipts, and scores as unanswered', async () => {
      const { session } = await setupMockSessionWithQuestions();

      // Zero answers saved (all 4 questions unanswered)
      const workerToken = 'zero-answer-worker';
      const leaseResult = await acquireFinalizationLease(session._id, userId, workerToken, SESSION_STATUS.SUBMITTED);
      const resultSummary = await processFinalizationWithOwnedLease(leaseResult);

      expect(resultSummary).toBeDefined();
      expect(resultSummary.overall.totalQuestions).toBe(4);
      expect(resultSummary.overall.answered).toBe(0);
      expect(resultSummary.overall.unanswered).toBe(4);
      expect(resultSummary.overall.accuracy).toBe(0);

      // Verify Attempt collection: delta = 0
      const attemptsCount = await Attempt.countDocuments({ sessionId: session._id.toString() });
      expect(attemptsCount).toBe(0);

      // Verify Receipts collection: delta = 0
      const receiptsCount = await MockAttemptFinalizationRecord.countDocuments({ sessionId: session._id });
      expect(receiptsCount).toBe(0);

      // Verify rebuild parity on zero-answered mock
      const rebuild = await rebuildMockResult(session._id);
      expect(rebuild.verified).toBe(true);
    });

    it('partial-answer mock creates Attempts and receipts ONLY for answered questions', async () => {
      const { session, questions } = await setupMockSessionWithQuestions();
      const now = new Date();

      // Question 0: Answered correctly (Option A is correct answer in helper)
      await MockResponse.create({
        sessionId: session._id,
        questionId: questions[0]._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: 'Option A',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 20,
        createdAt: now,
        updatedAt: now,
      });

      // Question 2: Answered incorrectly (Option B is incorrect)
      await MockResponse.create({
        sessionId: session._id,
        questionId: questions[2]._id,
        userId,
        sectionId: 'sec-2',
        selectedAnswer: 'Option B',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 30,
        createdAt: now,
        updatedAt: now,
      });

      // Questions 1 & 3: Unanswered (no response or selectedAnswer: null)

      const workerToken = 'partial-worker-1';
      const leaseResult = await acquireFinalizationLease(session._id, userId, workerToken, SESSION_STATUS.SUBMITTED);
      const resultSummary = await processFinalizationWithOwnedLease(leaseResult);

      expect(resultSummary.overall.totalQuestions).toBe(4);
      expect(resultSummary.overall.answered).toBe(2);
      expect(resultSummary.overall.unanswered).toBe(2);
      expect(resultSummary.overall.correct).toBe(1);
      expect(resultSummary.overall.incorrect).toBe(1);
      expect(resultSummary.overall.accuracy).toBe(50); // 1 / 2 * 100

      // Only answered questions create Attempts and receipts!
      const attempts = await Attempt.find({ sessionId: session._id.toString() });
      expect(attempts).toHaveLength(2);

      const receipts = await MockAttemptFinalizationRecord.find({ sessionId: session._id });
      expect(receipts).toHaveLength(2);

      // Verify exact rebuild parity
      const rebuild = await rebuildMockResult(session._id);
      expect(rebuild.verified).toBe(true);
    });

    it('verifies exact MockAttemptFinalizationRecord receipt shape and zero duplicated assessment fields', async () => {
      const { session, questions } = await setupMockSessionWithQuestions();
      const q = questions[0];

      await MockResponse.create({
        sessionId: session._id,
        questionId: q._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: 'Option A',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 25,
      });

      const workerToken = 'receipt-shape-worker';
      const leaseResult = await acquireFinalizationLease(session._id, userId, workerToken, SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(leaseResult);

      const receipt = await MockAttemptFinalizationRecord.findOne({ sessionId: session._id, questionId: q._id }).lean();
      expect(receipt).toBeDefined();

      // Exactly the seven approved minimal audit fields:
      expect(receipt.sessionId.toString()).toBe(session._id.toString());
      expect(receipt.questionId.toString()).toBe(q._id.toString());
      expect(receipt.userId).toBe(userId);
      expect(receipt.attemptId).toBeDefined();
      expect(receipt.algorithmVersion).toBe('v1');
      expect(receipt.status).toBe('completed');
      expect(receipt.finalizedAt instanceof Date || typeof receipt.finalizedAt === 'string').toBe(true);

      // Verify ONLY the 7 allowed domain fields (+ _id) exist
      const receiptKeys = Object.keys(receipt);
      const allowedKeys = new Set([
        '_id',
        'sessionId',
        'questionId',
        'userId',
        'attemptId',
        'algorithmVersion',
        'status',
        'finalizedAt',
      ]);
      const unexpectedKeys = receiptKeys.filter((k) => !allowedKeys.has(k));
      expect(unexpectedKeys).toEqual([]);

      // Strictly verify prohibited duplicated assessment data is absent:
      const prohibitedKeys = [
        'selectedAnswer',
        'correctAnswer',
        'isCorrect',
        'rawScoreAwarded',
        'timeTakenSeconds',
        'topic',
        'pattern',
        'difficulty',
        'options',
        'explanation',
        'solution',
      ];
      for (const prohibited of prohibitedKeys) {
        expect(receipt[prohibited]).toBeUndefined();
      }
    });
  });

  describe('Exactly-Once Guarantee & Crash Recovery', () => {
    it('recovers Attempt if crash occurred before receipt was written without duplicate Attempt', async () => {
      const { session, questions } = await setupMockSessionWithQuestions();
      const q = questions[0];

      // Simulate: Attempt was created before a crash, but MockAttemptFinalizationRecord was NOT created
      const orphanedAttempt = await Attempt.create({
        userId,
        questionId: q._id,
        topic: q.topic,
        pattern: q.pattern,
        difficulty: q.difficulty,
        selectedAnswer: 'Option A',
        correctAnswer: q.answer,
        isCorrect: true,
        timeTaken: 15,
        source: 'mock',
        sessionId: session._id.toString(),
      });

      // Response exists
      await MockResponse.create({
        sessionId: session._id,
        questionId: q._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: 'Option A',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 15,
      });

      // Finalize session
      const workerToken = 'crash-recovery-worker';
      const leaseResult = await acquireFinalizationLease(session._id, userId, workerToken, SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(leaseResult);

      // Verify exactly one Attempt exists (no second Attempt created)
      const attempts = await Attempt.find({ sessionId: session._id.toString(), questionId: q._id });
      expect(attempts).toHaveLength(1);
      expect(attempts[0]._id.toString()).toBe(orphanedAttempt._id.toString());

      // Receipt is now safely created linking to the recovered Attempt
      const receipt = await MockAttemptFinalizationRecord.findOne({ sessionId: session._id, questionId: q._id });
      expect(receipt).toBeDefined();
      expect(receipt.attemptId.toString()).toBe(orphanedAttempt._id.toString());
    });

    it('enforces partial unique index: rejects duplicate mock Attempt per (sessionId, questionId)', async () => {
      const { session, questions } = await setupMockSessionWithQuestions();
      const q = questions[0];

      await Attempt.create({
        userId,
        questionId: q._id,
        topic: q.topic,
        pattern: q.pattern,
        difficulty: q.difficulty,
        selectedAnswer: 'Option A',
        correctAnswer: q.answer,
        isCorrect: true,
        timeTaken: 10,
        source: 'mock',
        sessionId: session._id.toString(),
      });

      // Inserting second mock attempt with same (sessionId, questionId) must fail unique index
      await expect(
        Attempt.create({
          userId,
          questionId: q._id,
          topic: q.topic,
          pattern: q.pattern,
          difficulty: q.difficulty,
          selectedAnswer: 'Option B',
          correctAnswer: q.answer,
          isCorrect: false,
          timeTaken: 20,
          source: 'mock',
          sessionId: session._id.toString(),
        })
      ).rejects.toThrow();
    });
  });

  describe('Signed Scoring, Section Overrides & Reconciliation', () => {
    it('applies negative marking without clamping rawScore or percentage to zero', async () => {
      // 4 questions, scoring: correct: +1, incorrect: -2, unanswered: -1
      const { session, questions } = await setupMockSessionWithQuestions({
        correctMarks: 1.0,
        incorrectMarks: -2.0,
        unansweredMarks: -1.0,
      });

      // All 4 questions answered INCORRECTLY:
      // rawScore = 4 * (-2) = -8
      // maxPossible = 4 * 1 = 4
      // percentage = (-8 / 4) * 100 = -200%
      for (let i = 0; i < 4; i++) {
        await MockResponse.create({
          sessionId: session._id,
          questionId: questions[i]._id,
          userId,
          sectionId: questions[i].topic === 'Percentage' ? 'sec-1' : 'sec-2',
          selectedAnswer: 'Option D', // Incorrect
          status: RESPONSE_STATUS.ANSWERED,
          timeTakenSeconds: 10,
        });
      }

      const leaseResult = await acquireFinalizationLease(session._id, userId, 'neg-worker', SESSION_STATUS.SUBMITTED);
      const result = await processFinalizationWithOwnedLease(leaseResult);

      expect(result.overall.rawScore).toBe(-8);
      expect(result.overall.maxPossibleScore).toBe(4);
      expect(result.overall.percentage).toBe(-200); // Preserved negative percentage!
    });

    it('reconciles section overrides: sum(section.rawScore) === overall.rawScore', async () => {
      // Section 1 scoring override: correct: +4, incorrect: -1, unanswered: 0
      // Section 2 scoring: default (correct: +2, incorrect: -0.5, unanswered: 0)
      const { session, questions } = await setupMockSessionWithQuestions({
        correctMarks: 2.0,
        incorrectMarks: -0.5,
        unansweredMarks: 0,
        section1Scoring: { correctMarks: 4.0, incorrectMarks: -1.0, unansweredMarks: 0 },
      });

      // Q0 in Sec 1: Correct (+4)
      await MockResponse.create({
        sessionId: session._id,
        questionId: questions[0]._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: 'Option A',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 15,
      });

      // Q1 in Sec 1: Incorrect (-1)
      await MockResponse.create({
        sessionId: session._id,
        questionId: questions[1]._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: 'Option B',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 15,
      });

      // Q2 in Sec 2: Correct (+2)
      await MockResponse.create({
        sessionId: session._id,
        questionId: questions[2]._id,
        userId,
        sectionId: 'sec-2',
        selectedAnswer: 'Option A',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 15,
      });

      // Q3 in Sec 2: Unanswered (0)

      const leaseResult = await acquireFinalizationLease(session._id, userId, 'override-worker', SESSION_STATUS.SUBMITTED);
      const result = await processFinalizationWithOwnedLease(leaseResult);

      const sec1Result = result.sections.find((s) => s.sectionId === 'sec-1');
      const sec2Result = result.sections.find((s) => s.sectionId === 'sec-2');

      expect(sec1Result.rawScore).toBe(3); // 4 - 1 = 3
      expect(sec1Result.maxPossibleScore).toBe(8); // 2 * 4 = 8

      expect(sec2Result.rawScore).toBe(2); // 2 + 0 = 2
      expect(sec2Result.maxPossibleScore).toBe(4); // 2 * 2 = 4

      // Exact Reconciliation Invariants
      expect(sec1Result.rawScore + sec2Result.rawScore).toBe(result.overall.rawScore); // 3 + 2 = 5
      expect(sec1Result.maxPossibleScore + sec2Result.maxPossibleScore).toBe(result.overall.maxPossibleScore); // 8 + 4 = 12
      expect(result.overall.rawScore).toBe(5);
      expect(result.overall.maxPossibleScore).toBe(12);
    });
  });

  describe('Post-Finalization Idempotency & Repeat Submits', () => {
    it('repeat submit on already submitted session returns 200 OK with zero writes', async () => {
      const { session, questions } = await setupMockSessionWithQuestions();

      // Submit session first time
      const res1 = await submitMockSession({ sessionId: session._id, userId });
      expect(res1).toBeDefined();

      const preAttempts = await Attempt.countDocuments();
      const preReceipts = await MockAttemptFinalizationRecord.countDocuments();

      // Second submit
      const res2 = await submitMockSession({ sessionId: session._id, userId });
      expect(res2).toEqual(res1);

      const postAttempts = await Attempt.countDocuments();
      const postReceipts = await MockAttemptFinalizationRecord.countDocuments();

      // ZERO new writes
      expect(postAttempts - preAttempts).toBe(0);
      expect(postReceipts - preReceipts).toBe(0);
    });

    it('submit on expired session throws 409 MOCK_SESSION_EXPIRED', async () => {
      const { session } = await setupMockSessionWithQuestions();
      session.status = SESSION_STATUS.EXPIRED;
      session.expiredAt = new Date();
      await session.save();

      await expect(submitMockSession({ sessionId: session._id, userId })).rejects.toThrow();
      try {
        await submitMockSession({ sessionId: session._id, userId });
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(MOCK_ERROR_CODES.MOCK_SESSION_EXPIRED);
      }
    });

    it('submit on abandoned session throws 409 SESSION_STATE_CONFLICT', async () => {
      const { session } = await setupMockSessionWithQuestions();
      session.status = SESSION_STATUS.ABANDONED;
      session.abandonedAt = new Date();
      await session.save();

      try {
        await submitMockSession({ sessionId: session._id, userId });
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(MOCK_ERROR_CODES.SESSION_STATE_CONFLICT);
      }
    });

    it('repeat resolveSessionExpiry on expired + completed session returns 200 with zero writes', async () => {
      const { session } = await setupMockSessionWithQuestions();

      // Finalize as expired
      const lease = await acquireFinalizationLease(session._id, userId, 'exp-worker', SESSION_STATUS.EXPIRED);
      const res1 = await processFinalizationWithOwnedLease(lease);

      const preAttempts = await Attempt.countDocuments();
      const res2 = await resolveSessionExpiry(session._id, userId, new Date());
      const postAttempts = await Attempt.countDocuments();

      expect(res2).toEqual(res1);
      expect(postAttempts - preAttempts).toBe(0);
    });
  });

  describe('Result Rebuild Parity & Integrity Violations', () => {
    it('throws 500 RESULT_INCOMPLETE_FINALIZATION if answered question lacks receipt', async () => {
      const { session, questions } = await setupMockSessionWithQuestions();

      // Answer question 0
      await MockResponse.create({
        sessionId: session._id,
        questionId: questions[0]._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: 'Option A',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 15,
      });

      // Finalize
      const lease = await acquireFinalizationLease(session._id, userId, 'audit-worker', SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(lease);

      // Tamper: Delete receipt for question 0
      await MockAttemptFinalizationRecord.deleteOne({ sessionId: session._id, questionId: questions[0]._id });

      try {
        await rebuildMockResult(session._id);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(500);
        expect(err.code).toBe(MOCK_ERROR_CODES.RESULT_INCOMPLETE_FINALIZATION);
      }
    });

    it('throws 500 RESULT_INTEGRITY_ERROR if receipt points to wrong Attempt', async () => {
      const { session, questions } = await setupMockSessionWithQuestions();

      await MockResponse.create({
        sessionId: session._id,
        questionId: questions[0]._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: 'Option A',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 15,
      });

      const lease = await acquireFinalizationLease(session._id, userId, 'audit-worker-2', SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(lease);

      // Tamper: point receipt to non-existent attempt
      await MockAttemptFinalizationRecord.updateOne(
        { sessionId: session._id, questionId: questions[0]._id },
        { $set: { attemptId: new (require('mongoose').Types.ObjectId)() } }
      );

      try {
        await rebuildMockResult(session._id);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(500);
        expect(err.code).toBe(MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR);
      }
    });
  });
});
