'use strict';

/**
 * Suite 4: tests/analytics/retentionAnalytics.test.js
 *
 * Verifies:
 *   - Current factual RevisionItem state (active, completed, dueToday, overdue, stageDistribution)
 *   - UTC logical-day boundaries for due/overdue classification
 *   - Invariant: activeRevisionItems === sum(stageDistribution)
 *   - Uses only source = 'revision' attempts as observation candidates
 *   - Immediate preceding attempt anchor across any source
 *   - Timestamp collision resolution ({ attemptedAt: 1, _id: 1 } lexicographical sorting)
 *   - Boundary-anchor recovery across 1,000-document truncation
 *   - Excluded counters: excludedInvalidChronologyCount (gap <= 0), excludedShortGapCount (0 < gap < 0.5)
 *   - Half-open bucket intervals
 *   - Returns only populated buckets
 *   - Strict retention accounting identity:
 *     revisionAttemptsAnalyzed === bucketedRevisionObservationCount + excludedNoPriorAttemptCount + excludedShortGapCount + excludedInvalidChronologyCount
 *   - Cross-endpoint consistency: dashboard.dueRevisionCount === retention.currentState.dueTodayCount
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const User = require('../../src/models/userModel');
const RevisionItem = require('../../src/models/revisionItemModel');
const Attempt = require('../../src/models/attemptModel');
const { getRetentionAnalytics } = require('../../src/services/analytics/retentionAnalyticsService');
const { getDashboardAnalytics } = require('../../src/services/analytics/dashboardAggregateService');

describe('Suite 4: Spaced Repetition Analytics & Gap Memory Decay', () => {
  const userId = 'usr_retention_test';
  const now = new Date('2026-10-06T12:00:00.000Z');

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();
    await User.create({ userId, email: 'retention@test.com', name: 'Retention Test User' });
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await RevisionItem.deleteMany({});
    await Attempt.deleteMany({});
  });

  describe('Current Revision State & UTC Logical Day Semantics', () => {
    it('correctly calculates active, completed, dueToday, overdue, and stageDistribution', async () => {
      // todayStartUtc = 2026-10-06T00:00:00.000Z, tomorrowStartUtc = 2026-10-07T00:00:00.000Z
      await RevisionItem.create([
        // Due today: 2026-10-06T08:00:00Z, stage 0
        {
          userId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          status: 'scheduled',
          stage: 0,
          nextReviewDate: new Date('2026-10-06T08:00:00.000Z'),
        },
        // Overdue: 2026-10-05T00:00:00Z, stage 1
        {
          userId,
          topic: 'Percentage',
          pattern: 'Single Percentage Increase and Decrease',
          status: 'scheduled',
          stage: 1,
          nextReviewDate: new Date('2026-10-05T00:00:00.000Z'),
        },
        // Future due: 2026-10-08T00:00:00Z, stage 2
        {
          userId,
          topic: 'Percentage',
          pattern: 'Successive Percentage Changes',
          status: 'scheduled',
          stage: 2,
          nextReviewDate: new Date('2026-10-08T00:00:00.000Z'),
        },
        // Completed item (stage 4)
        {
          userId,
          topic: 'Percentage',
          pattern: 'Population Growth and Demographics',
          status: 'completed',
          stage: 4,
          nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
        },
        // Paused item (not counted in active or completed)
        {
          userId,
          topic: 'Percentage',
          pattern: 'Reverse Percentage & Base Value',
          status: 'paused',
          stage: 0,
          nextReviewDate: new Date('2026-10-06T05:00:00.000Z'),
        },
      ]);

      const result = await getRetentionAnalytics(userId, now);
      const cs = result.currentState;

      expect(cs.activeRevisionItems).toBe(3);
      expect(cs.completedRevisionItems).toBe(1);
      expect(cs.dueTodayCount).toBe(1);
      expect(cs.overdueCount).toBe(1);

      // Invariant: sum(stageDistribution) === activeRevisionItems
      const sumStages =
        cs.stageDistribution.stage0_1day +
        cs.stageDistribution.stage1_3days +
        cs.stageDistribution.stage2_7days +
        cs.stageDistribution.stage3_14days +
        cs.stageDistribution.stage4_30days;
      expect(sumStages).toBe(cs.activeRevisionItems);
    });

    it('cross-endpoint consistency: dashboard.dueRevisionCount strictly equals retention.currentState.dueTodayCount', async () => {
      await RevisionItem.create([
        {
          userId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          status: 'scheduled',
          stage: 0,
          nextReviewDate: new Date('2026-10-06T09:00:00.000Z'),
        },
        {
          userId,
          topic: 'Percentage',
          pattern: 'Single Percentage Increase and Decrease',
          status: 'scheduled',
          stage: 1,
          nextReviewDate: new Date('2026-10-06T15:00:00.000Z'),
        },
        {
          userId,
          topic: 'Percentage',
          pattern: 'Successive Percentage Changes',
          status: 'scheduled',
          stage: 2,
          nextReviewDate: new Date('2026-10-05T00:00:00.000Z'), // Overdue
        },
      ]);

      const [retentionResult, dashboardResult] = await Promise.all([
        getRetentionAnalytics(userId, now),
        getDashboardAnalytics(userId, now),
      ]);

      expect(dashboardResult.dueRevisionCount).toBe(2);
      expect(retentionResult.currentState.dueTodayCount).toBe(2);
      expect(dashboardResult.dueRevisionCount).toBe(retentionResult.currentState.dueTodayCount);
    });
  });

  describe('Gap Retention Analytics & Accounting Identity', () => {
    it('anchors against immediate preceding attempt and correctly computes elapsed days into half-open buckets', async () => {
      const qId = new mongoose.Types.ObjectId();
      const t0 = new Date('2026-10-01T10:00:00.000Z');
      const t1 = new Date(t0.getTime() + 1.0 * 86400000); // 1.0 day gap -> [0.5, 1.5)
      const t2 = new Date(t0.getTime() + 3.0 * 86400000); // 2.0 day gap from t1 -> [1.5, 4.5)

      // Anchor attempt: source 'practice'
      await Attempt.create({
        userId,
        questionId: qId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 25,
        source: 'practice',
        attemptedAt: t0,
      });

      // Revision observation 1: 1.0 day later, correct
      await Attempt.create({
        userId,
        questionId: qId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 20,
        source: 'revision',
        attemptedAt: t1,
      });

      // Revision observation 2: 2.0 days later, incorrect
      await Attempt.create({
        userId,
        questionId: qId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: 'B',
        correctAnswer: 'A',
        isCorrect: false,
        timeTaken: 30,
        source: 'revision',
        attemptedAt: t2,
      });

      const result = await getRetentionAnalytics(userId, now);
      const ev = result.evidence;
      expect(ev.revisionAttemptsAnalyzed).toBe(2);
      expect(ev.excludedNoPriorAttemptCount).toBe(0);
      expect(ev.excludedShortGapCount).toBe(0);
      expect(ev.excludedInvalidChronologyCount).toBe(0);

      const buckets = result.observedRetentionByGap;
      expect(buckets.length).toBe(2);

      const b1 = buckets.find((b) => b.gapBucket === '0.5-1.5d');
      expect(b1).toBeDefined();
      expect(b1.totalEvents).toBe(1);
      expect(b1.correctEvents).toBe(1);
      expect(b1.observedRetentionRate).toBe(100.0);

      const b2 = buckets.find((b) => b.gapBucket === '1.5-4.5d');
      expect(b2).toBeDefined();
      expect(b2.totalEvents).toBe(1);
      expect(b2.correctEvents).toBe(0);
      expect(b2.observedRetentionRate).toBe(0.0);
    });

    it('sub-half-day gap (0 < gap < 0.5d) is counted in excludedShortGapCount', async () => {
      const qId = new mongoose.Types.ObjectId();
      const t0 = new Date('2026-10-01T10:00:00.000Z');
      const t1 = new Date(t0.getTime() + 0.2 * 86400000); // 0.2 days gap

      await Attempt.create([
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 25,
          source: 'practice',
          attemptedAt: t0,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 20,
          source: 'revision',
          attemptedAt: t1,
        },
      ]);

      const result = await getRetentionAnalytics(userId, now);
      expect(result.evidence.revisionAttemptsAnalyzed).toBe(1);
      expect(result.evidence.excludedShortGapCount).toBe(1);
      expect(result.observedRetentionByGap.length).toBe(0);
    });

    it('same-timestamp predecessor produces gapDays = 0 and increments excludedInvalidChronologyCount', async () => {
      const qId = new mongoose.Types.ObjectId();
      const t0 = new Date('2026-10-01T10:00:00.000Z');

      await Attempt.create([
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 25,
          source: 'practice',
          attemptedAt: t0,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 20,
          source: 'revision',
          attemptedAt: t0, // Exactly the same timestamp
        },
      ]);

      const result = await getRetentionAnalytics(userId, now);
      expect(result.evidence.revisionAttemptsAnalyzed).toBe(1);
      expect(result.evidence.excludedInvalidChronologyCount).toBe(1);
    });

    it('revision attempt with no prior attempt increments excludedNoPriorAttemptCount', async () => {
      const qId = new mongoose.Types.ObjectId();
      const t0 = new Date('2026-10-01T10:00:00.000Z');

      await Attempt.create({
        userId,
        questionId: qId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 25,
        source: 'revision',
        attemptedAt: t0,
      });

      const result = await getRetentionAnalytics(userId, now);
      expect(result.evidence.revisionAttemptsAnalyzed).toBe(1);
      expect(result.evidence.excludedNoPriorAttemptCount).toBe(1);
    });

    it('recovers predecessor outside loaded 1,000 without incrementing attempts analyzed', async () => {
      const qId = new mongoose.Types.ObjectId();
      const oldTime = new Date('2026-08-01T00:00:00.000Z');
      const recentTime = new Date('2026-10-01T00:00:00.000Z');

      // 1. Insert 1 anchor for (Percentage, Basic Percentage Calculation) deep in history
      await Attempt.create({
        userId,
        questionId: qId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 30,
        source: 'practice',
        attemptedAt: oldTime,
      });

      // 2. Insert 1,000 filler attempts on a different pattern between oldTime and recentTime
      const fillers = [];
      for (let i = 0; i < 1000; i++) {
        fillers.push({
          userId,
          questionId: qId,
          topic: 'Algebra',
          pattern: 'Linear Equations — Single Variable',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 10,
          source: 'practice',
          attemptedAt: new Date(oldTime.getTime() + (i + 1) * 60000),
        });
      }
      await Attempt.insertMany(fillers);

      // 3. Insert 1 revision attempt on (Percentage, Basic Percentage Calculation) at recentTime
      await Attempt.create({
        userId,
        questionId: qId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 25,
        source: 'revision',
        attemptedAt: recentTime,
      });

      const result = await getRetentionAnalytics(userId, now);

      // Only 1 revision attempt exists
      expect(result.evidence.revisionAttemptsAnalyzed).toBe(1);
      // The predecessor was outside the 1,000 most recent attempts, but recovered successfully!
      expect(result.evidence.excludedNoPriorAttemptCount).toBe(0);

      // It entered a bucket (>35.5d)
      const bucketedCount = result.observedRetentionByGap.reduce((sum, b) => sum + b.totalEvents, 0);
      expect(bucketedCount).toBe(1);

      // Invariant holds
      expect(result.evidence.revisionAttemptsAnalyzed).toBe(
        bucketedCount +
          result.evidence.excludedNoPriorAttemptCount +
          result.evidence.excludedShortGapCount +
          result.evidence.excludedInvalidChronologyCount
      );
    });
  });
});
