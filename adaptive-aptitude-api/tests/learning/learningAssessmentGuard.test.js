'use strict';

/**
 * tests/learning/learningAssessmentGuard.test.js
 *
 * Tests the centralized user-level assessment guard:
 * - Global finalization lockout
 * - Active mock security
 * - Resource ownership (404 vs 403)
 * - Level 5 answer reveal gate
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const { assertAssessmentAccess } = require('../../src/services/learning/learningAssessmentGuard');
const MockSession = require('../../src/models/mockSessionModel');
const Attempt = require('../../src/models/attemptModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const Goal = require('../../src/models/goalModel');
const { normalizeLogicalDate } = require('../../src/utils/dateUtils');

describe('Phase 7: learningAssessmentGuard Security Suite', () => {
  const user1 = 'guard_user_1';
  const user2 = 'guard_user_2';

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearAllTestCollections();
  });

  describe('Step 1: Global Finalization Lockout', () => {
    it('blocks /tutor, /hint, /explain-attempt, /explain-progress, and /mock-review when finalization is in progress', async () => {
      // Create session in finalization
      await MockSession.create({
        userId: user1,
        mode: 'standard',
        navigationPolicy: 'free',
        effectiveExcludeRecentQuestions: false,
        totalQuestions: 10,
        durationMinutes: 15,
        generationSeed: 'seed',
        status: 'submitted',
        finalizationState: 'in_progress',
        questionSequence: [],
        sectionStates: [{ sectionId: 's1', order: 1, status: 'completed', questionCount: 10 }],
        blueprintSnapshot: {},
        blueprintFingerprint: 'fp',
      });

      // 1. /tutor -> 409
      await expect(
        assertAssessmentAccess({ userId: user1, endpoint: '/tutor' })
      ).rejects.toMatchObject({ statusCode: 409, code: 'FINALIZATION_IN_PROGRESS' });

      // 2. /hint -> 409
      await expect(
        assertAssessmentAccess({ userId: user1, endpoint: '/hint', hintLevel: 1, questionId: new mongoose.Types.ObjectId() })
      ).rejects.toMatchObject({ statusCode: 409, code: 'FINALIZATION_IN_PROGRESS' });

      // 3. /explain-attempt -> 409
      await expect(
        assertAssessmentAccess({ userId: user1, endpoint: '/explain-attempt', attemptId: new mongoose.Types.ObjectId() })
      ).rejects.toMatchObject({ statusCode: 409, code: 'FINALIZATION_IN_PROGRESS' });

      // 4. /explain-progress -> 409
      await expect(
        assertAssessmentAccess({ userId: user1, endpoint: '/explain-progress' })
      ).rejects.toMatchObject({ statusCode: 409, code: 'FINALIZATION_IN_PROGRESS' });

      // 5. /mock-review -> 409
      await expect(
        assertAssessmentAccess({ userId: user1, endpoint: '/mock-review', sessionId: new mongoose.Types.ObjectId() })
      ).rejects.toMatchObject({ statusCode: 409, code: 'FINALIZATION_IN_PROGRESS' });
    });

    it('does NOT block /explain-plan during finalization', async () => {
      await MockSession.create({
        userId: user1,
        mode: 'standard',
        navigationPolicy: 'free',
        effectiveExcludeRecentQuestions: false,
        totalQuestions: 10,
        durationMinutes: 15,
        generationSeed: 'seed',
        status: 'submitted',
        finalizationState: 'in_progress',
        questionSequence: [],
        sectionStates: [{ sectionId: 's1', order: 1, status: 'completed', questionCount: 10 }],
        blueprintSnapshot: {},
        blueprintFingerprint: 'fp',
      });

      const goal = await Goal.create({
        userId: user1,
        title: 'Goal 1',
        type: 'company',
        targetDate: new Date('2026-11-01'),
      });

      const plan = await StudyPlan.create({
        userId: user1,
        goalId: goal._id,
        name: 'Test Plan',
        durationPreset: '7d',
        targetDate: new Date('2026-10-20'),
        targets: [{ topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations', targetQuestions: 10 }],
      });

      const targetDateStr = '2026-10-15';
      await DailyObjective.create({
        userId: user1,
        planId: plan._id,
        goalId: goal._id,
        date: normalizeLogicalDate(targetDateStr),
        topic: 'Algebra',
        patterns: [{ pattern: 'Linear Equations & Systems of Equations', targetQuestions: 10 }],
      });

      const result = await assertAssessmentAccess({
        userId: user1,
        endpoint: '/explain-plan',
        planId: String(plan._id),
        targetDate: targetDateStr,
      });

      expect(result.studyPlan).toBeDefined();
      expect(result.dailyObjective).toBeDefined();
    });
  });

  describe('Step 2: Active Mock Security Matrix', () => {
    beforeEach(async () => {
      await MockSession.create({
        userId: user1,
        mode: 'standard',
        navigationPolicy: 'free',
        effectiveExcludeRecentQuestions: false,
        totalQuestions: 10,
        durationMinutes: 15,
        generationSeed: 'seed',
        status: 'started',
        finalizationState: 'idle',
        questionSequence: [],
        sectionStates: [{ sectionId: 's1', order: 1, status: 'in_progress', questionCount: 10 }],
        blueprintSnapshot: {},
        blueprintFingerprint: 'fp',
      });
    });

    it('blocks /tutor and /hint when user has an active mock session (403)', async () => {
      await expect(
        assertAssessmentAccess({ userId: user1, endpoint: '/tutor' })
      ).rejects.toMatchObject({ statusCode: 403, code: 'ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED' });

      await expect(
        assertAssessmentAccess({ userId: user1, endpoint: '/hint', hintLevel: 1, questionId: new mongoose.Types.ObjectId() })
      ).rejects.toMatchObject({ statusCode: 403, code: 'ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED' });
    });

    it('blocks /mock-review when session is still active (409 MOCK_SESSION_NOT_TERMINAL)', async () => {
      await expect(
        assertAssessmentAccess({ userId: user1, endpoint: '/mock-review', sessionId: new mongoose.Types.ObjectId() })
      ).rejects.toMatchObject({ statusCode: 409, code: 'MOCK_SESSION_NOT_TERMINAL' });
    });
  });

  describe('Step 3: Resource Ownership & Lifecycle Gates', () => {
    describe('/explain-attempt', () => {
      it('returns 404 ATTEMPT_NOT_FOUND when attempt does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await expect(
          assertAssessmentAccess({ userId: user1, endpoint: '/explain-attempt', attemptId: String(fakeId) })
        ).rejects.toMatchObject({ statusCode: 404, code: 'ATTEMPT_NOT_FOUND' });
      });

      it('returns 403 FORBIDDEN when attempt belongs to another user', async () => {
        const attempt = await Attempt.create({
          userId: user2,
          questionId: new mongoose.Types.ObjectId(),
          topic: 'Algebra',
          pattern: 'Linear Equations & Systems of Equations',
          difficulty: 2,
          selectedAnswer: '5',
          correctAnswer: '5',
          isCorrect: true,
          timeTaken: 30,
          source: 'practice',
        });

        await expect(
          assertAssessmentAccess({ userId: user1, endpoint: '/explain-attempt', attemptId: String(attempt._id) })
        ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
      });

      it('enforces dual ownership on mock attempts (403 if parent session belongs to another user)', async () => {
        const parentSession = await MockSession.create({
          userId: user2, // user2 owns session
          mode: 'standard',
          navigationPolicy: 'free',
          effectiveExcludeRecentQuestions: false,
          totalQuestions: 10,
          durationMinutes: 15,
          generationSeed: 'seed',
          status: 'submitted',
          finalizationState: 'completed',
          questionSequence: [],
          sectionStates: [{ sectionId: 's1', order: 1, status: 'completed', questionCount: 10 }],
          blueprintSnapshot: {},
          blueprintFingerprint: 'fp',
        });

        const mockAttempt = await Attempt.create({
          userId: user1, // user1 owns attempt
          questionId: new mongoose.Types.ObjectId(),
          topic: 'Algebra',
          pattern: 'Linear Equations & Systems of Equations',
          difficulty: 2,
          selectedAnswer: '5',
          correctAnswer: '5',
          isCorrect: true,
          timeTaken: 30,
          source: 'mock',
          sessionId: String(parentSession._id),
        });

        await expect(
          assertAssessmentAccess({ userId: user1, endpoint: '/explain-attempt', attemptId: String(mockAttempt._id) })
        ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
      });
    });

    describe('/mock-review', () => {
      it('returns 404 MOCK_SESSION_NOT_FOUND when session does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await expect(
          assertAssessmentAccess({ userId: user1, endpoint: '/mock-review', sessionId: String(fakeId) })
        ).rejects.toMatchObject({ statusCode: 404, code: 'MOCK_SESSION_NOT_FOUND' });
      });

      it('returns 403 FORBIDDEN when session belongs to another user', async () => {
        const session = await MockSession.create({
          userId: user2,
          mode: 'standard',
          navigationPolicy: 'free',
          effectiveExcludeRecentQuestions: false,
          totalQuestions: 10,
          durationMinutes: 15,
          generationSeed: 'seed',
          status: 'submitted',
          finalizationState: 'completed',
          questionSequence: [],
          sectionStates: [{ sectionId: 's1', order: 1, status: 'completed', questionCount: 10 }],
          blueprintSnapshot: {},
          blueprintFingerprint: 'fp',
        });

        await expect(
          assertAssessmentAccess({ userId: user1, endpoint: '/mock-review', sessionId: String(session._id) })
        ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
      });

      it('returns 400 MOCK_SESSION_ABANDONED when session was abandoned', async () => {
        const session = await MockSession.create({
          userId: user1,
          mode: 'standard',
          navigationPolicy: 'free',
          effectiveExcludeRecentQuestions: false,
          totalQuestions: 10,
          durationMinutes: 15,
          generationSeed: 'seed',
          status: 'abandoned',
          finalizationState: 'idle',
          questionSequence: [],
          sectionStates: [{ sectionId: 's1', order: 1, status: 'completed', questionCount: 10 }],
          blueprintSnapshot: {},
          blueprintFingerprint: 'fp',
        });

        await expect(
          assertAssessmentAccess({ userId: user1, endpoint: '/mock-review', sessionId: String(session._id) })
        ).rejects.toMatchObject({ statusCode: 400, code: 'MOCK_SESSION_ABANDONED' });
      });
    });

    describe('Level 5 Hint Answer Gate', () => {
      const questionId = new mongoose.Types.ObjectId();

      it('returns 403 ANSWER_REVEAL_LOCKED_ATTEMPT_REQUIRED when no user attempt exists', async () => {
        await expect(
          assertAssessmentAccess({
            userId: user1,
            endpoint: '/hint',
            taskType: 'hint',
            hintLevel: 5,
            questionId: String(questionId),
          })
        ).rejects.toMatchObject({
          statusCode: 403,
          code: 'ANSWER_REVEAL_LOCKED_ATTEMPT_REQUIRED',
        });
      });

      it('does NOT unlock Level 5 when only another user attempted the question', async () => {
        await Attempt.create({
          userId: user2, // user2 attempted
          questionId,
          topic: 'Algebra',
          pattern: 'Linear Equations & Systems of Equations',
          difficulty: 2,
          selectedAnswer: '5',
          correctAnswer: '5',
          isCorrect: true,
          timeTaken: 30,
          source: 'practice',
        });

        await expect(
          assertAssessmentAccess({
            userId: user1, // user1 asks for Level 5
            endpoint: '/hint',
            taskType: 'hint',
            hintLevel: 5,
            questionId: String(questionId),
          })
        ).rejects.toMatchObject({
          statusCode: 403,
          code: 'ANSWER_REVEAL_LOCKED_ATTEMPT_REQUIRED',
        });
      });

      it('unlocks Level 5 when requesting user has a prior immutable attempt', async () => {
        await Attempt.create({
          userId: user1, // user1 attempted
          questionId,
          topic: 'Algebra',
          pattern: 'Linear Equations & Systems of Equations',
          difficulty: 2,
          selectedAnswer: '5',
          correctAnswer: '5',
          isCorrect: true,
          timeTaken: 30,
          source: 'practice',
        });

        const res = await assertAssessmentAccess({
          userId: user1,
          endpoint: '/hint',
          taskType: 'hint',
          hintLevel: 5,
          questionId: String(questionId),
        });

        expect(res.qualifyingAttempt).toBeDefined();
        expect(String(res.qualifyingAttempt.userId)).toBe(user1);
      });
    });
  });
});
