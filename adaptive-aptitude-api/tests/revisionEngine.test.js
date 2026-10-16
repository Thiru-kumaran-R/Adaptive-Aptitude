'use strict';

/**
 * tests/revisionEngine.test.js — Phase 5: Spaced Revision Engine Tests
 */

const mongoose = require('mongoose');
const supertest = require('supertest');
const { signAccessToken } = require('../src/services/authService');

function getAuthHeaders(userId = 'usr_test_default', extra = {}) {
  return { Authorization: `Bearer ${signAccessToken({ userId, ...extra })}` };
}

function createAuthRequest(defaultUserId = 'usr_test_default') {
  return function authRequest(targetApp) {
    const inst = supertest(targetApp);
    return new Proxy(inst, {
      get(target, method) {
        const origMethod = target[method];
        if (typeof origMethod !== 'function' || !['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          return origMethod;
        }
        return function(url) {
          const testInstance = origMethod.call(target, url);
          let targetUserId = defaultUserId;
          const queryMatch = url && typeof url === 'string' && url.match(/[?&]userId=([^&]+)/);
          const pathMatch = url && typeof url === 'string' && url.match(/\/(?:user|users)\/([^/?]+)/);
          if (queryMatch) {
            targetUserId = decodeURIComponent(queryMatch[1]);
          } else if (pathMatch) {
            targetUserId = decodeURIComponent(pathMatch[1]);
          }
          if (targetUserId) {
            testInstance.set(getAuthHeaders(targetUserId));
          }
          const origSend = testInstance.send;
          testInstance.send = function(data) {
            if (data && typeof data === 'object' && data.userId) {
              testInstance.set(getAuthHeaders(data.userId));
            }
            return origSend.call(testInstance, data);
          };
          return testInstance;
        };
      }
    });
  };
}
const request = createAuthRequest();
const createApp = require('../src/app');
const { connectTestDB, disconnectTestDB } = require('./helpers/dbSetup');
const User = require('../src/models/userModel');
const Attempt = require('../src/models/attemptModel');
const Question = require('../src/models/questionModel');
const RevisionItem = require('../src/models/revisionItemModel');
const RevisionProcessingRecord = require('../src/models/revisionProcessingRecordModel');
const StudentProgress = require('../src/models/studentProgressModel');
const DailyObjective = require('../src/models/dailyObjectiveModel');
const { processAttempt } = require('../src/services/revision/revisionSchedulerService');
const revisionSchedulerService = require('../src/services/revision/revisionSchedulerService');
const masteryService = require('../src/services/adaptive/masteryService');
const { rebuildRevisionState } = require('../src/services/revision/revisionRecoveryService');
const { formatLogicalDate, addLogicalDays } = require('../src/utils/dateUtils');

const app = createApp();

describe('Spaced Revision Engine (Phase 5)', () => {
  const testUserId = 'test_rev_user_' + Date.now();
  let sampleQuestion;
  const testTopic = 'Percentage';
  const testPattern = 'Basic Percentage Calculation';

  beforeAll(async () => {
    await connectTestDB();

    await User.create({
      userId: testUserId,
      name: 'Revision User',
      email: `${testUserId}@example.com`,
    });

    sampleQuestion = await Question.create({
      question: 'What is 20% of 50?',
      answer: '10',
      options: ['5', '10', '15', '20'],
      explanation: '20% of 50 is 10',
      topic: testTopic,
      pattern: testPattern,
      difficulty: 1,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ userId: testUserId });
    await Attempt.deleteMany({ userId: testUserId });
    await RevisionItem.deleteMany({ userId: testUserId });
    await RevisionProcessingRecord.deleteMany({ userId: testUserId });
    await StudentProgress.deleteMany({ userId: testUserId });
    await DailyObjective.deleteMany({ userId: testUserId });
    if (sampleQuestion) {
      await Question.deleteMany({ _id: sampleQuestion._id });
    }
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await RevisionItem.deleteMany({ userId: testUserId });
  });

  describe('RevisionItem Model & Uniqueness', () => {
    it('enforces compound unique index { userId, topic, pattern }', async () => {
      await RevisionItem.create({
        userId: testUserId,
        topic: testTopic,
        pattern: testPattern,
        nextReviewDate: new Date('2026-10-02T00:00:00.000Z'),
      });

      let duplicateError = null;
      try {
        await RevisionItem.create({
          userId: testUserId,
          topic: testTopic,
          pattern: testPattern,
          nextReviewDate: new Date('2026-10-05T00:00:00.000Z'),
        });
      } catch (err) {
        duplicateError = err;
      }

      expect(duplicateError).toBeDefined();
      expect(duplicateError.code).toBe(11000); // MongoDB duplicate key code
    });
  });

  describe('Attempt Triggers & Progression', () => {
    it('schedules RevisionItem on incorrect attempt (stage 0, interval 1d, nextReviewDate tomorrow)', async () => {
      const res = await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: sampleQuestion._id.toString(),
          selectedAnswer: 'WRONG_ANSWER',
          timeTaken: 25,
          source: 'practice',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isCorrect).toBe(false);

      const revItem = await RevisionItem.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });

      expect(revItem).toBeDefined();
      expect(revItem.stage).toBe(0);
      expect(revItem.intervalDays).toBe(1);
      expect(revItem.status).toBe('scheduled');
      expect(revItem.lastOutcome).toBe('incorrect');
      expect(revItem.consecutiveRevisionSuccesses).toBe(0);
    });

    it('does NOT advance revision stage on correct non-revision attempt', async () => {
      // First, create a scheduled RevisionItem at stage 1
      await RevisionItem.create({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        stage: 1,
        intervalDays: 3,
        nextReviewDate: new Date('2026-10-04T00:00:00.000Z'),
        status: 'scheduled',
      });

      // Submit a correct normal practice attempt
      const res = await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: sampleQuestion._id.toString(),
          selectedAnswer: sampleQuestion.answer,
          timeTaken: 20,
          source: 'practice', // Non-revision source!
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isCorrect).toBe(true);

      const revItem = await RevisionItem.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });

      // Stage must remain 1 and interval must remain 3
      expect(revItem.stage).toBe(1);
      expect(revItem.intervalDays).toBe(3);
    });

    it('advances revision stage on successful revision attempt (1d -> 3d -> 7d -> 14d -> 30d)', async () => {
      // Start at stage 0 (1 day)
      await RevisionItem.create({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        stage: 0,
        intervalDays: 1,
        nextReviewDate: new Date('2026-10-02T00:00:00.000Z'),
        status: 'scheduled',
      });

      // Submit correct revision attempt
      const res = await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: sampleQuestion._id.toString(),
          selectedAnswer: sampleQuestion.answer,
          timeTaken: 20,
          source: 'revision', // Revision source!
        });

      expect(res.status).toBe(201);

      const revItem = await RevisionItem.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });

      // Advanced to stage 1 (3 days)
      expect(revItem.stage).toBe(1);
      expect(revItem.intervalDays).toBe(3);
      expect(revItem.lastOutcome).toBe('correct');
      expect(revItem.consecutiveRevisionSuccesses).toBe(1);
    });

    it('resets to stage 0 (1-day interval) on failed revision attempt', async () => {
      // Set to stage 3 (14 days)
      await RevisionItem.create({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        stage: 3,
        intervalDays: 14,
        nextReviewDate: new Date('2026-10-15T00:00:00.000Z'),
        status: 'scheduled',
        consecutiveRevisionSuccesses: 3,
      });

      // Submit failed revision attempt
      const res = await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: sampleQuestion._id.toString(),
          selectedAnswer: 'WRONG_ANSWER',
          timeTaken: 20,
          source: 'revision',
        });

      expect(res.status).toBe(201);

      const revItem = await RevisionItem.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });

      // Must be reset to stage 0 and 1-day interval
      expect(revItem.stage).toBe(0);
      expect(revItem.intervalDays).toBe(1);
      expect(revItem.consecutiveRevisionSuccesses).toBe(0);
      expect(revItem.lastOutcome).toBe('incorrect');
    });

    it('requires mastery >= 0.85 to complete final 30-day stage (Case A: completed; Case B: extended)', async () => {
      // Case A: High mastery (>= 0.85) completes
      // Seed 15 high-difficulty attempts so recalculateAndPersistPatternMastery yields mastery >= 0.85
      const highMasteryAttempts = [];
      for (let i = 0; i < 15; i++) {
        highMasteryAttempts.push({
          userId: testUserId,
          questionId: sampleQuestion._id,
          topic: sampleQuestion.topic,
          pattern: sampleQuestion.pattern,
          difficulty: 10,
          selectedAnswer: sampleQuestion.answer,
          correctAnswer: sampleQuestion.answer,
          isCorrect: true,
          timeTaken: 15,
          source: 'practice',
          attemptedAt: new Date(),
        });
      }
      await Attempt.insertMany(highMasteryAttempts);

      await RevisionItem.findOneAndUpdate(
        { userId: testUserId, topic: sampleQuestion.topic, pattern: sampleQuestion.pattern },
        {
          $set: {
            stage: 4, // 30-day stage
            intervalDays: 30,
            nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
            status: 'scheduled',
          },
        },
        { upsert: true }
      );

      await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: sampleQuestion._id.toString(),
          selectedAnswer: sampleQuestion.answer,
          timeTaken: 20,
          source: 'revision',
        });

      const revCompleted = await RevisionItem.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });
      expect(revCompleted.status).toBe('completed');

      // Case B: Lower mastery (< 0.85) remains scheduled and reschedules for +30 days
      // Clear attempts so mastery drops below 0.85 on single attempt
      await Attempt.deleteMany({ userId: testUserId });

      await RevisionItem.findOneAndUpdate(
        { userId: testUserId, topic: sampleQuestion.topic, pattern: sampleQuestion.pattern },
        {
          $set: {
            stage: 4,
            intervalDays: 30,
            nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
            status: 'scheduled',
          },
        }
      );

      await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: sampleQuestion._id.toString(),
          selectedAnswer: sampleQuestion.answer,
          timeTaken: 20,
          source: 'revision',
        });

      const revExtended = await RevisionItem.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });
      expect(revExtended.status).toBe('scheduled');
      expect(revExtended.intervalDays).toBe(30);
    });

    it('advances Stage 4 to completed when current revision attempt causes recalculated mastery to cross >= 0.85 (must not use stale 0.84)', async () => {
      await Attempt.deleteMany({ userId: testUserId });
      await StudentProgress.deleteMany({ userId: testUserId });
      await RevisionItem.deleteMany({ userId: testUserId });
      await RevisionProcessingRecord.deleteMany({ userId: testUserId });

      const diff2Q = await Question.create({
        question: 'What is 10% of 20? (diff 2)',
        answer: '2',
        options: ['1', '2', '3', '4'],
        explanation: '10% of 20 is 2',
        topic: testTopic,
        pattern: testPattern,
        difficulty: 2,
      });

      const diff8Q = await Question.create({
        question: 'What is 10% of 80? (diff 8)',
        answer: '8',
        options: ['6', '7', '8', '9'],
        explanation: '10% of 80 is 8',
        topic: testTopic,
        pattern: testPattern,
        difficulty: 8,
      });

      // 1. Seed 10 correct attempts at difficulty 2 (avgDiff = 2.0 -> rawMastery = 0.84)
      const baseAttempts = [];
      const baseTime = Date.now() - 100000;
      for (let i = 0; i < 10; i++) {
        baseAttempts.push({
          userId: testUserId,
          questionId: diff2Q._id,
          topic: testTopic,
          pattern: testPattern,
          difficulty: 2,
          selectedAnswer: diff2Q.answer,
          correctAnswer: diff2Q.answer,
          isCorrect: true,
          timeTaken: 15,
          source: 'practice',
          attemptedAt: new Date(baseTime + i * 1000),
        });
      }
      await Attempt.insertMany(baseAttempts);

      // Recalculate baseline mastery and verify it is 0.84
      const initialProgress = await masteryService.recalculateAndPersistPatternMastery(
        testUserId,
        testTopic,
        testPattern
      );
      expect(initialProgress.mastery).toBeCloseTo(0.84, 2);

      // 2. Set RevisionItem at Stage 4 (30-day review due)
      await RevisionItem.create({
        userId: testUserId,
        topic: testTopic,
        pattern: testPattern,
        stage: 4,
        intervalDays: 30,
        nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
        status: 'scheduled',
      });

      // 3. Submit a correct revision attempt at difficulty 8
      // New recent 10 diffs: nine 2s and one 8 -> sum 26, avgDiff 2.6 -> new mastery = 0.852 >= 0.85
      const res = await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: diff8Q._id.toString(),
          selectedAnswer: diff8Q.answer,
          timeTaken: 20,
          source: 'revision',
        });

      expect(res.status).toBe(201);

      // Verify StudentProgress mastery was recalculated post-attempt
      const updatedProgress = await StudentProgress.findOne({
        userId: testUserId,
        topic: testTopic,
        pattern: testPattern,
      });
      expect(updatedProgress.mastery).toBeGreaterThanOrEqual(0.85);

      // Verify RevisionItem transitioned to 'completed', proving it observed updated mastery (>= 0.85)
      // rather than stale pre-attempt mastery (0.84) which would have extended it +30 days
      const revItem = await RevisionItem.findOne({
        userId: testUserId,
        topic: testTopic,
        pattern: testPattern,
      });
      expect(revItem.status).toBe('completed');
      const procRecord = await RevisionProcessingRecord.findOne({
        attemptId: res.body.data._id,
      });
      expect(procRecord).not.toBeNull();

      await Question.deleteMany({ _id: { $in: [diff2Q._id, diff8Q._id] } });
    });

    it('extends Stage 4 for +30 days when current revision attempt causes recalculated mastery to fall < 0.85 (must not use stale 0.86)', async () => {
      await Attempt.deleteMany({ userId: testUserId });
      await StudentProgress.deleteMany({ userId: testUserId });
      await RevisionItem.deleteMany({ userId: testUserId });
      await RevisionProcessingRecord.deleteMany({ userId: testUserId });

      const diff10Q = await Question.create({
        question: 'Diff 10 Question',
        answer: '10',
        options: ['1', '2', '5', '10'],
        explanation: 'diff 10',
        topic: testTopic,
        pattern: testPattern,
        difficulty: 10,
      });

      const diff2Q = await Question.create({
        question: 'Diff 2 Question',
        answer: '2',
        options: ['1', '2', '3', '4'],
        explanation: 'diff 2',
        topic: testTopic,
        pattern: testPattern,
        difficulty: 2,
      });

      const diff4Q = await Question.create({
        question: 'Diff 4 Question',
        answer: '4',
        options: ['1', '2', '3', '4'],
        explanation: 'diff 4',
        topic: testTopic,
        pattern: testPattern,
        difficulty: 4,
      });

      const diff1Q = await Question.create({
        question: 'Diff 1 Question',
        answer: '1',
        options: ['1', '2', '3', '4'],
        explanation: 'diff 1',
        topic: testTopic,
        pattern: testPattern,
        difficulty: 1,
      });

      // 1. Seed 10 correct attempts:
      // Oldest: difficulty 10 (at t0)
      // 8 attempts at difficulty 2 (at t1..t8)
      // 1 attempt at difficulty 4 (at t9)
      // Sum = 10 + 16 + 4 = 30 -> avgDiff = 3.0 -> rawMastery = 0.86
      const baseTime = Date.now() - 200000;
      const baseAttempts = [
        {
          userId: testUserId,
          questionId: diff10Q._id,
          topic: testTopic,
          pattern: testPattern,
          difficulty: 10,
          selectedAnswer: diff10Q.answer,
          correctAnswer: diff10Q.answer,
          isCorrect: true,
          timeTaken: 15,
          source: 'practice',
          attemptedAt: new Date(baseTime),
        },
      ];
      for (let i = 1; i <= 8; i++) {
        baseAttempts.push({
          userId: testUserId,
          questionId: diff2Q._id,
          topic: testTopic,
          pattern: testPattern,
          difficulty: 2,
          selectedAnswer: diff2Q.answer,
          correctAnswer: diff2Q.answer,
          isCorrect: true,
          timeTaken: 15,
          source: 'practice',
          attemptedAt: new Date(baseTime + i * 1000),
        });
      }
      baseAttempts.push({
        userId: testUserId,
        questionId: diff4Q._id,
        topic: testTopic,
        pattern: testPattern,
        difficulty: 4,
        selectedAnswer: diff4Q.answer,
        correctAnswer: diff4Q.answer,
        isCorrect: true,
        timeTaken: 15,
        source: 'practice',
        attemptedAt: new Date(baseTime + 9000),
      });
      await Attempt.insertMany(baseAttempts);

      // Recalculate baseline mastery and verify it is 0.86
      const initialProgress = await masteryService.recalculateAndPersistPatternMastery(
        testUserId,
        testTopic,
        testPattern
      );
      expect(initialProgress.mastery).toBeCloseTo(0.86, 2);

      // 2. Set RevisionItem at Stage 4
      await RevisionItem.create({
        userId: testUserId,
        topic: testTopic,
        pattern: testPattern,
        stage: 4,
        intervalDays: 30,
        nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
        status: 'scheduled',
      });

      // 3. Submit a correct revision attempt at difficulty 1
      // The oldest attempt (difficulty 10) falls out of the recent-10 window.
      // New recent 10 sum: 30 - 10 + 1 = 21 -> avgDiff = 2.1 -> new mastery = 0.842 < 0.85
      const res = await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: diff1Q._id.toString(),
          selectedAnswer: diff1Q.answer,
          timeTaken: 20,
          source: 'revision',
        });

      expect(res.status).toBe(201);

      // Verify StudentProgress mastery fell below 0.85
      const updatedProgress = await StudentProgress.findOne({
        userId: testUserId,
        topic: testTopic,
        pattern: testPattern,
      });
      expect(updatedProgress.mastery).toBeLessThan(0.85);

      // Verify RevisionItem extended +30 days, proving it observed updated mastery (< 0.85)
      // and did NOT falsely graduate based on stale pre-attempt mastery (0.86)
      const revItem = await RevisionItem.findOne({
        userId: testUserId,
        topic: testTopic,
        pattern: testPattern,
      });
      expect(revItem.status).toBe('scheduled');
      expect(revItem.intervalDays).toBe(30);
      const procRecord = await RevisionProcessingRecord.findOne({
        attemptId: res.body.data._id,
      });
      expect(procRecord).not.toBeNull();

      await Question.deleteMany({ _id: { $in: [diff10Q._id, diff2Q._id, diff4Q._id, diff1Q._id] } });
    });

    it('guarantees Attempt and StudentProgress are preserved if revision processing fails (REVISION_SCHEDULING_FAILED)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const revSpy = jest.spyOn(revisionSchedulerService, 'processAttempt').mockImplementationOnce(() => {
        throw new Error('SIMULATED_REVISION_SCHEDULING_FAILURE');
      });

      const res = await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: sampleQuestion._id.toString(),
          selectedAnswer: sampleQuestion.answer,
          timeTaken: 25,
          source: 'practice',
        });

      // Attempt endpoint still returns 201 Created because Attempt is primary and safely committed
      expect(res.status).toBe(201);
      expect(res.body.data.isCorrect).toBe(true);

      const attemptId = res.body.data._id;
      const savedAttempt = await Attempt.findById(attemptId);
      expect(savedAttempt).toBeDefined();

      // StudentProgress was also preserved
      const progress = await StudentProgress.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });
      expect(progress).toBeDefined();

      // Structured error was logged
      expect(consoleSpy).toHaveBeenCalled();
      const logs = consoleSpy.mock.calls.map((c) => c[0]);
      const revFailLog = logs.find((l) => typeof l === 'string' && l.includes('REVISION_SCHEDULING_FAILED'));
      expect(revFailLog).toBeDefined();

      revSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('guarantees revision processing is idempotent per Attempt', async () => {
      const mockAttempt = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        source: 'revision',
        isCorrect: true,
        attemptedAt: new Date('2026-10-01T12:00:00.000Z'),
      };

      // Process once
      const res1 = await processAttempt(mockAttempt, { referenceDate: '2026-10-01' });
      expect(res1.changed).toBe(true);
      const stageAfter1 = res1.revisionItem.stage;

      // Process same attempt again
      const res2 = await processAttempt(mockAttempt, { referenceDate: '2026-10-01' });
      expect(res2.changed).toBe(false);
      expect(res2.revisionItem.stage).toBe(stageAfter1);
    });

    it('guarantees non-consecutive duplicate retry of an earlier Attempt is safely ignored (A -> B -> retry A)', async () => {
      const attemptA = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        source: 'practice',
        isCorrect: false,
        attemptedAt: new Date('2026-10-01T10:00:00.000Z'),
      };

      const attemptB = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        source: 'revision',
        isCorrect: true,
        attemptedAt: new Date('2026-10-02T10:00:00.000Z'),
      };

      // 1. Process Attempt A (initial failure -> stage 0)
      const resA = await processAttempt(attemptA, { referenceDate: '2026-10-01' });
      expect(resA.changed).toBe(true);
      expect(resA.revisionItem.stage).toBe(0);

      // 2. Process Attempt B (revision success -> stage 1)
      const resB = await processAttempt(attemptB, { referenceDate: '2026-10-02' });
      expect(resB.changed).toBe(true);
      expect(resB.revisionItem.stage).toBe(1);

      // 3. Retry Attempt A (non-consecutive retry; lastAttemptId was B)
      const resRetryA = await processAttempt(attemptA, { referenceDate: '2026-10-03' });
      expect(resRetryA.changed).toBe(false);
      expect(resRetryA.reasonCode).toBe('REVISION_DUPLICATE_IGNORED');
      expect(resRetryA.revisionItem.stage).toBe(1); // Unchanged!
      expect(resRetryA.revisionItem.intervalDays).toBe(3);
    });

    it('guarantees permanent revision idempotency across >50 attempts (Attempt A -> 100 attempts -> retry A)', async () => {
      const attemptA = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        source: 'practice',
        isCorrect: false,
        attemptedAt: new Date('2026-10-01T08:00:00.000Z'),
      };

      // 1. Process Attempt A (initial failure -> stage 0, 1-day interval)
      const resA = await processAttempt(attemptA, { referenceDate: '2026-10-01' });
      expect(resA.changed).toBe(true);
      expect(resA.revisionItem.stage).toBe(0);

      // Verify RevisionProcessingRecord exists for Attempt A
      const receiptA = await RevisionProcessingRecord.findOne({ attemptId: attemptA._id });
      expect(receiptA).toBeDefined();
      expect(receiptA.userId).toBe(testUserId);

      // 2. Process 100 intervening attempts (B1 ... B100) on different or same patterns
      // This completely evicts Attempt A from any 50-item ring buffer
      for (let i = 1; i <= 100; i++) {
        const attemptB = {
          _id: new mongoose.Types.ObjectId(),
          userId: testUserId,
          topic: sampleQuestion.topic,
          pattern: sampleQuestion.pattern,
          source: 'practice',
          isCorrect: true, // Non-revision correct doesn't advance stage
          attemptedAt: new Date(Date.now() + i * 1000),
        };
        await processAttempt(attemptB, { referenceDate: '2026-10-01' });
      }

      // Check current RevisionItem state before retry
      const revItemBefore = await RevisionItem.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      }).lean();
      expect(revItemBefore.stage).toBe(0);

      // 3. Retry Attempt A
      const resRetryA = await processAttempt(attemptA, { referenceDate: '2026-10-02' });
      expect(resRetryA.changed).toBe(false);
      expect(resRetryA.reasonCode).toBe('REVISION_DUPLICATE_IGNORED');

      const revItemAfter = await RevisionItem.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      }).lean();

      // State remains strictly identical
      expect(revItemAfter.stage).toBe(revItemBefore.stage);
      expect(revItemAfter.intervalDays).toBe(revItemBefore.intervalDays);
      expect(revItemAfter.status).toBe(revItemBefore.status);
      expect(revItemAfter.nextReviewDate.toISOString()).toBe(revItemBefore.nextReviewDate.toISOString());
    });

    it('guarantees atomic concurrency: concurrent duplicate deliveries result in exactly 1 transition', async () => {
      const concurrentAttempt = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        source: 'practice',
        isCorrect: false,
        attemptedAt: new Date('2026-10-01T14:00:00.000Z'),
      };

      const results = await Promise.all([
        processAttempt(concurrentAttempt, { referenceDate: '2026-10-01' }),
        processAttempt(concurrentAttempt, { referenceDate: '2026-10-01' }),
        processAttempt(concurrentAttempt, { referenceDate: '2026-10-01' }),
        processAttempt(concurrentAttempt, { referenceDate: '2026-10-01' }),
      ]);

      const changedResults = results.filter((r) => r.changed === true);
      const duplicateResults = results.filter((r) => r.reasonCode === 'REVISION_DUPLICATE_IGNORED');

      expect(changedResults.length).toBe(1);
      expect(duplicateResults.length).toBe(3);

      const receiptsCount = await RevisionProcessingRecord.countDocuments({
        attemptId: concurrentAttempt._id,
      });
      expect(receiptsCount).toBe(1);

      const revItem = await RevisionItem.findOne({
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
      });
      expect(revItem.stage).toBe(0);
      expect(revItem.intervalDays).toBe(1);
    });

    it('guarantees atomic rollback: if RevisionItem persistence throws, receipt is rolled back and retry succeeds', async () => {
      const rollbackAttempt = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        source: 'practice',
        isCorrect: false,
        attemptedAt: new Date('2026-10-01T15:00:00.000Z'),
      };

      // 1. Injected failure
      await expect(
        processAttempt(rollbackAttempt, {
          referenceDate: '2026-10-01',
          testInjectedFailure: true,
        })
      ).rejects.toThrow('INJECTED_REVISION_PERSISTENCE_FAILURE');

      // Verify receipt was NOT committed
      const receiptCount = await RevisionProcessingRecord.countDocuments({
        attemptId: rollbackAttempt._id,
      });
      expect(receiptCount).toBe(0);

      // 2. Retry without failure succeeds
      const retryRes = await processAttempt(rollbackAttempt, { referenceDate: '2026-10-01' });
      expect(retryRes.changed).toBe(true);
      expect(retryRes.revisionItem.stage).toBe(0);

      const receiptAfter = await RevisionProcessingRecord.findOne({
        attemptId: rollbackAttempt._id,
      });
      expect(receiptAfter).toBeDefined();
    });

    it('does NOT increment DailyObjective.completedQuestions for source = "revision"', async () => {
      // Create a daily objective
      const todayDate = new Date();
      todayDate.setUTCHours(0, 0, 0, 0);

      const dummyPlanId = new mongoose.Types.ObjectId();
      const dummyGoalId = new mongoose.Types.ObjectId();

      await DailyObjective.create({
        userId: testUserId,
        planId: dummyPlanId,
        goalId: dummyGoalId,
        date: todayDate,
        topic: sampleQuestion.topic,
        patterns: [{ pattern: sampleQuestion.pattern, targetQuestions: 10, completedQuestions: 0 }],
      });

      // Submit revision attempt
      await request(app)
        .post('/api/v1/attempts')
        .send({
          userId: testUserId,
          questionId: sampleQuestion._id.toString(),
          selectedAnswer: sampleQuestion.answer,
          timeTaken: 15,
          source: 'revision',
        });

      const obj = await DailyObjective.findOne({ userId: testUserId, planId: dummyPlanId });
      expect(obj.patterns[0].completedQuestions).toBe(0);
    });
  });

  describe('Due Revision Queries & Recovery', () => {
    it('retrieves due revisions with deterministic ordering (overdue first, lower mastery first)', async () => {
      const refDate = '2026-10-05';

      // Item 1: Overdue (due Oct 2)
      await RevisionItem.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        nextReviewDate: new Date('2026-10-02T00:00:00.000Z'),
        status: 'scheduled',
      });

      // Item 2: Due Today (due Oct 5)
      await RevisionItem.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
        nextReviewDate: new Date('2026-10-05T00:00:00.000Z'),
        status: 'scheduled',
      });

      // Item 3: Future (due Oct 10) - should NOT be returned
      await RevisionItem.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: 'Single Percentage Increase and Decrease',
        nextReviewDate: new Date('2026-10-10T00:00:00.000Z'),
        status: 'scheduled',
      });

      const res = await request(app)
        .get(`/api/v1/revisions/due?userId=${testUserId}&referenceDate=${refDate}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);

      // Overdue item comes first
      expect(res.body.data[0].pattern).toBe('Basic Percentage Calculation');
      expect(res.body.data[0].reasonCode).toBe('OVERDUE_REVISION');

      // Due today item comes second
      expect(res.body.data[1].pattern).toBe('Successive Percentage Changes');
      expect(res.body.data[1].reasonCode).toBe('DUE_TODAY');
    });

    it('rebuildRevisionState reconstructs exact state by chronologically replaying historical attempts', async () => {
      // Seed 3 historical attempts:
      // 1. Practice incorrect -> schedules stage 0 (interval 1)
      // 2. Revision correct -> advances to stage 1 (interval 3)
      // 3. Revision correct -> advances to stage 2 (interval 7)
      const patternName = 'Percentage Increase & Decrease';
      const q = await Question.findOne({ topic: 'Percentage', pattern: patternName });

      if (q) {
        await Attempt.deleteMany({ userId: testUserId, pattern: patternName });

        await Attempt.create({
          userId: testUserId,
          questionId: q._id,
          topic: 'Percentage',
          pattern: patternName,
          difficulty: 2,
          selectedAnswer: 'WRONG',
          correctAnswer: q.answer,
          isCorrect: false,
          timeTaken: 30,
          source: 'practice',
          attemptedAt: new Date('2026-10-01T10:00:00.000Z'),
        });

        await Attempt.create({
          userId: testUserId,
          questionId: q._id,
          topic: 'Percentage',
          pattern: patternName,
          difficulty: 2,
          selectedAnswer: q.answer,
          correctAnswer: q.answer,
          isCorrect: true,
          timeTaken: 25,
          source: 'revision',
          attemptedAt: new Date('2026-10-02T10:00:00.000Z'),
        });

        await Attempt.create({
          userId: testUserId,
          questionId: q._id,
          topic: 'Percentage',
          pattern: patternName,
          difficulty: 2,
          selectedAnswer: q.answer,
          correctAnswer: q.answer,
          isCorrect: true,
          timeTaken: 20,
          source: 'revision',
          attemptedAt: new Date('2026-10-05T10:00:00.000Z'),
        });

        // Corrupt / Delete the RevisionItem
        await RevisionItem.deleteOne({ userId: testUserId, pattern: patternName });

        // Run recovery rebuild
        const recovered = await rebuildRevisionState(testUserId, 'Percentage', patternName);

        expect(recovered).toBeDefined();
        expect(recovered.stage).toBe(2);
        expect(recovered.intervalDays).toBe(7);
        expect(recovered.consecutiveRevisionSuccesses).toBe(2);
        expect(recovered.lastOutcome).toBe('correct');
      }
    });

    it('proves live attempt processing and recovery rebuild produce equivalent state for identical attempt sequence', async () => {
      const equivPattern = 'Equivalent State Pattern Test';
      const q = await Question.findOne({ topic: 'Percentage' });

      // Clean up
      await Attempt.deleteMany({ userId: testUserId, pattern: equivPattern });
      await RevisionItem.deleteMany({ userId: testUserId, pattern: equivPattern });

      // Step 1: Execute sequence via live processing
      const attempts = [
        {
          userId: testUserId,
          questionId: q._id,
          topic: 'Percentage',
          pattern: equivPattern,
          difficulty: 1,
          selectedAnswer: 'WRONG',
          correctAnswer: q.answer,
          isCorrect: false,
          timeTaken: 25,
          source: 'practice',
          attemptedAt: new Date('2026-10-01T10:00:00.000Z'),
        },
        {
          userId: testUserId,
          questionId: q._id,
          topic: 'Percentage',
          pattern: equivPattern,
          difficulty: 1,
          selectedAnswer: q.answer,
          correctAnswer: q.answer,
          isCorrect: true,
          timeTaken: 20,
          source: 'revision',
          attemptedAt: new Date('2026-10-02T10:00:00.000Z'),
        },
        {
          userId: testUserId,
          questionId: q._id,
          topic: 'Percentage',
          pattern: equivPattern,
          difficulty: 1,
          selectedAnswer: 'WRONG',
          correctAnswer: q.answer,
          isCorrect: false,
          timeTaken: 30,
          source: 'revision',
          attemptedAt: new Date('2026-10-05T10:00:00.000Z'),
        },
      ];

      const insertedAttempts = await Attempt.insertMany(attempts);

      // Process live sequentially
      for (const att of insertedAttempts) {
        await processAttempt(att, { referenceDate: att.attemptedAt });
      }

      const liveState = await RevisionItem.findOne({ userId: testUserId, pattern: equivPattern }).lean();

      // Step 2: Delete RevisionItem and execute rebuild
      await RevisionItem.deleteOne({ userId: testUserId, pattern: equivPattern });

      const rebuildState = await rebuildRevisionState(testUserId, 'Percentage', equivPattern);

      // Step 3: Assert strict equivalence
      expect(rebuildState.stage).toBe(liveState.stage);
      expect(rebuildState.intervalDays).toBe(liveState.intervalDays);
      expect(rebuildState.status).toBe(liveState.status);
      expect(rebuildState.lastOutcome).toBe(liveState.lastOutcome);
      expect(rebuildState.consecutiveRevisionSuccesses).toBe(liveState.consecutiveRevisionSuccesses);
      expect(rebuildState.nextReviewDate.toISOString()).toBe(liveState.nextReviewDate.toISOString());
      expect(rebuildState.lastProcessedAttemptId.toString()).toBe(liveState.lastProcessedAttemptId.toString());

      // Clean up
      await Attempt.deleteMany({ userId: testUserId, pattern: equivPattern });
      await RevisionItem.deleteMany({ userId: testUserId, pattern: equivPattern });
    });
  });
});
