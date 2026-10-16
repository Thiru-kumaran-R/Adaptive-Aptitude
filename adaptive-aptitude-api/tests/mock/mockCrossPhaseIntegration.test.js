'use strict';

/**
 * tests/mock/mockCrossPhaseIntegration.test.js
 *
 * Verifies Phase 6 Cross-Phase Integration Boundaries:
 * - Phase 3 Attempt adapter (timeTakenSeconds -> timeTaken) & StudentProgress
 * - Phase 4 Mastery recalculation integration
 * - Phase 5 Spaced Revision Engine semantics for mock attempts
 * - DailyObjective and StudyPlan isolation
 * - Recursive Zero Answer Leakage verification
 * - Review endpoint access control & explanation delivery
 */

const request = require('supertest');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const MockSession = require('../../src/models/mockSessionModel');
const MockResponse = require('../../src/models/mockResponseModel');
const Attempt = require('../../src/models/attemptModel');
const StudentProgress = require('../../src/models/studentProgressModel');
const RevisionItem = require('../../src/models/revisionItemModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const Question = require('../../src/models/questionModel');
const {
  acquireFinalizationLease,
  processFinalizationWithOwnedLease,
} = require('../../src/services/mock/mockFinalizationService');
const { seedMockQuestions, createTestUser } = require('../helpers/mockTestHelpers');
const masteryService = require('../../src/services/adaptive/masteryService');
const {
  MOCK_MODES,
  NAVIGATION_POLICIES,
  SESSION_STATUS,
  RESPONSE_STATUS,
} = require('../../src/config/mockConfig');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Phase 6: Cross-Phase Integration & Boundary Verification', () => {
  let app;
  const userId = 'cross-phase-user-1';

  beforeAll(async () => {
    await connectTestDB();
    app = createApp();
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

  const setupMockSession = async () => {
    const questions = await seedMockQuestions({
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      countPerBand: 1,
    });
    const q1 = questions[0];
    const q2 = questions[1];

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    const session = await MockSession.create({
      userId,
      blueprintSnapshot: {
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        scoring: { correctMarks: 1.0, incorrectMarks: 0.0, unansweredMarks: 0.0 },
        sections: [
          {
            sectionId: 'sec-1',
            order: 0,
            questionCount: 2,
            scope: { patterns: ['Successive Percentage Changes'] },
          },
        ],
      },
      blueprintFingerprint: 'cross-phase-fingerprint',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      effectiveExcludeRecentQuestions: false,
      totalQuestions: 2,
      durationMinutes: 60,
      generationSeed: 'cross-phase-seed',
      algorithmVersion: 'v1',
      status: SESSION_STATUS.STARTED,
      startedAt: now,
      expiresAt,
      questionSequence: [
        { questionId: q1._id, sectionId: 'sec-1', order: 0, topic: q1.topic, pattern: q1.pattern, difficulty: q1.difficulty },
        { questionId: q2._id, sectionId: 'sec-1', order: 1, topic: q2.topic, pattern: q2.pattern, difficulty: q2.difficulty },
      ],
      sectionStates: [
        { sectionId: 'sec-1', order: 0, status: 'in_progress', questionCount: 2 },
      ],
    });

    return { session, questions: [q1, q2] };
  };

  describe('Phase 3 & 4: Attempt Adapter & Mastery Recalculation', () => {
    it('maps timeTakenSeconds to Attempt.timeTaken and triggers mastery recalculation via attemptService with zero direct Phase 6 mastery math', async () => {
      const { session, questions } = await setupMockSession();
      const q = questions[0];

      await MockResponse.create({
        sessionId: session._id,
        questionId: q._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: q.answer, // Correct
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 42,
      });

      const workerToken = 'cp-worker-1';
      const lease = await acquireFinalizationLease(session._id, userId, workerToken, SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(lease);

      // 1. Verify Attempt record was created through attemptService adapter
      const attempt = await Attempt.findOne({ sessionId: session._id.toString(), questionId: q._id });
      expect(attempt).toBeDefined();
      expect(attempt.source).toBe('mock');
      expect(attempt.timeTaken).toBe(42); // Mapped from timeTakenSeconds!
      expect(attempt.isCorrect).toBe(true);

      // 2. Verify StudentProgress aggregate was updated by Phase 4 post-attempt hook
      const progress = await StudentProgress.findOne({
        userId,
        topic: q.topic,
        pattern: q.pattern,
      });
      expect(progress).toBeDefined();
      expect(progress.attempts).toBeGreaterThanOrEqual(1);

      // 3. Verify resulting mastery strictly equals the output of existing Phase 4 mastery service
      const expectedMasteryData = await masteryService.calculatePatternMastery(userId, q.topic, q.pattern);
      expect(typeof progress.mastery).toBe('number');
      expect(progress.mastery).toBe(expectedMasteryData.mastery);
      expect(masteryService.getMasteryLabel(progress.mastery)).toBe(expectedMasteryData.masteryLabel);

      // 4. Verify Phase 6 finalization service does not compute or modify mastery directly
      const mockFinalizationServiceCode = require('fs').readFileSync(
        require.resolve('../../src/services/mock/mockFinalizationService'),
        'utf8'
      );
      expect(mockFinalizationServiceCode).not.toContain('calculatePatternMastery');
      expect(mockFinalizationServiceCode).not.toContain('recalculateAndPersistPatternMastery');
      expect(mockFinalizationServiceCode).not.toContain('exponentialMovingAverage');
    });
  });

  describe('Phase 5: Spaced Revision Engine Mock Semantics', () => {
    it('incorrect mock attempt resets/schedules RevisionItem to Stage 0, interval 1 day', async () => {
      const { session, questions } = await setupMockSession();
      const q = questions[0];

      // Pre-existing RevisionItem at Stage 2 (interval 7 days)
      await RevisionItem.create({
        userId,
        topic: q.topic,
        pattern: q.pattern,
        stage: 2,
        intervalDays: 7,
        nextReviewDate: '2026-10-15',
        consecutiveRevisionSuccesses: 2,
        status: 'scheduled',
      });

      // Submit INCORRECT answer in mock test
      await MockResponse.create({
        sessionId: session._id,
        questionId: q._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: 'Wrong Answer',
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 25,
      });

      const lease = await acquireFinalizationLease(session._id, userId, 'rev-worker-1', SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(lease);

      // Rule 3: Incorrect non-revision attempt resets/schedules item (stage 0, interval 1d)
      const updatedItem = await RevisionItem.findOne({ userId, topic: q.topic, pattern: q.pattern });
      expect(updatedItem).toBeDefined();
      expect(updatedItem.stage).toBe(0);
      expect(updatedItem.intervalDays).toBe(1);
      expect(updatedItem.lastOutcome).toBe('incorrect');
    });

    it('correct mock attempt DOES NOT advance revision stage, intervalDays, or nextReviewDate', async () => {
      const { session, questions } = await setupMockSession();
      const q = questions[0];

      // Pre-existing RevisionItem at Stage 2 (interval 7 days)
      const originalNextReview = new Date('2026-10-15T00:00:00.000Z');
      await RevisionItem.create({
        userId,
        topic: q.topic,
        pattern: q.pattern,
        stage: 2,
        intervalDays: 7,
        nextReviewDate: originalNextReview,
        consecutiveRevisionSuccesses: 2,
        status: 'scheduled',
      });

      // Submit CORRECT answer in mock test
      await MockResponse.create({
        sessionId: session._id,
        questionId: q._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: q.answer,
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 25,
      });

      const lease = await acquireFinalizationLease(session._id, userId, 'rev-worker-2', SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(lease);

      // Rule 4: Correct non-revision attempt does NOT advance stage or interval!
      const itemAfter = await RevisionItem.findOne({ userId, topic: q.topic, pattern: q.pattern });
      expect(itemAfter.stage).toBe(2); // Retained stage 2
      expect(itemAfter.intervalDays).toBe(7); // Retained interval 7
      expect(new Date(itemAfter.nextReviewDate).toISOString()).toBe(originalNextReview.toISOString()); // Retained nextReviewDate
    });
  });

  describe('DailyObjective & StudyPlan Isolation', () => {
    it('mock attempts do NOT increment DailyObjective completedQuestions', async () => {
      const { session, questions } = await setupMockSession();
      const q = questions[0];

      // Pre-existing DailyObjective for this pattern
      const dailyObj = await DailyObjective.create({
        userId,
        planId: new (require('mongoose').Types.ObjectId)(),
        goalId: new (require('mongoose').Types.ObjectId)(),
        date: new Date('2026-10-02T00:00:00.000Z'),
        topic: q.topic,
        patterns: [
          {
            pattern: q.pattern,
            targetQuestions: 10,
            completedQuestions: 2, // Initial
          },
        ],
      });

      // Answer in mock test
      await MockResponse.create({
        sessionId: session._id,
        questionId: q._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: q.answer,
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 30,
      });

      const lease = await acquireFinalizationLease(session._id, userId, 'iso-worker-1', SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(lease);

      // Verify DailyObjective was completely isolated and unaffected
      const objAfter = await DailyObjective.findById(dailyObj._id);
      expect(objAfter.patterns[0].completedQuestions).toBe(2); // Unchanged!
    });

    it('mock completion does NOT auto-complete or replan StudyPlan', async () => {
      const { session, questions } = await setupMockSession();
      const q = questions[0];

      const studyPlan = await StudyPlan.create({
        userId,
        goalId: new (require('mongoose').Types.ObjectId)(),
        name: 'Mock Isolation Study Plan',
        status: 'active',
        startDate: new Date('2026-10-02'),
        endDate: new Date('2026-10-05'),
        targets: [
          {
            topic: q.topic,
            pattern: q.pattern,
            targetQuestions: 20,
            targetMastery: 0.85,
          },
        ],
      });

      // Finalize mock test
      const lease = await acquireFinalizationLease(session._id, userId, 'plan-iso-worker', SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(lease);

      // Verify StudyPlan remains active and unchanged
      const planAfter = await StudyPlan.findById(studyPlan._id);
      expect(planAfter.status).toBe('active');
      expect(planAfter.targets[0].targetQuestions).toBe(20);
    });
  });

  describe('Recursive Zero Answer Leakage Verification', () => {
    it('recursively scans active question payloads to guarantee zero presence of answers/solutions', async () => {
      const { session, questions } = await setupMockSession();
      const qId = questions[0]._id;

      const res = await request(app)
        .get(`/api/v1/mock-sessions/${session._id}/questions/${qId}`)
        .set(getAuthHeaders(userId))
        .query({ userId });

      expect(res.status).toBe(200);

      // Recursive scanner traversing full JSON tree
      const forbiddenKeys = new Set(['answer', 'correctAnswer', 'explanation', 'solution']);
      const scanObject = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return;
        for (const [key, val] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          expect(forbiddenKeys.has(key)).toBe(false);
          if (typeof val === 'object' && val !== null) {
            scanObject(val, currentPath);
          }
        }
      };

      scanObject(res.body);
    });
  });

  describe('Post-Submission Review Access', () => {
    it('exposes correct answers and explanations after test is submitted', async () => {
      const { session, questions } = await setupMockSession();
      const q = questions[0];

      await MockResponse.create({
        sessionId: session._id,
        questionId: q._id,
        userId,
        sectionId: 'sec-1',
        selectedAnswer: q.answer,
        status: RESPONSE_STATUS.ANSWERED,
        timeTakenSeconds: 20,
      });

      const lease = await acquireFinalizationLease(session._id, userId, 'review-worker-1', SESSION_STATUS.SUBMITTED);
      await processFinalizationWithOwnedLease(lease);

      const reviewRes = await request(app)
        .get(`/api/v1/mock-sessions/${session._id}/review`)
        .set(getAuthHeaders(userId))
        .query({ userId });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.data.questions).toHaveLength(2);

      const reviewedQ = reviewRes.body.data.questions.find((item) => item.questionId === q._id.toString());
      expect(reviewedQ).toBeDefined();
      expect(reviewedQ.correctAnswer).toBe(q.answer);
      expect(reviewedQ.explanation).toBe(q.explanation);
      expect(reviewedQ.selectedAnswer).toBe(q.answer);
      expect(reviewedQ.isCorrect).toBe(true);
    });
  });
});
