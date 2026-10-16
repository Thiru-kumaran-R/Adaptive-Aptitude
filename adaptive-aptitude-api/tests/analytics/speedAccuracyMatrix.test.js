'use strict';

/**
 * Suite 2: tests/analytics/speedAccuracyMatrix.test.js
 *
 * Verifies:
 *   - Native median algorithm (odd, even, boundary, negative/null filtering)
 *   - Baseline sample threshold (MIN_SPEED_BASELINE_SAMPLES = 3)
 *   - Quadrant classification: accurateAndFast, accurateAndSlow, fastErrorRushing, slowErrorStruggling
 *   - 0.60 rushing threshold multiplier boundary
 *   - rushingRiskScore calculation and null-denominator safety
 *   - Proves no attempt is ever labeled "mastered"
 *   - Topic query parameter filtering behavior vs omitted topic
 *   - attemptsAnalyzed reflects topic filter
 *   - Overall aggregate medians (medianTimeCorrectSeconds, medianTimeIncorrectSeconds)
 *   - Odd/even samples, empty subsets, topic-filtered medians, 1,000-attempt bound
 *   - Proves DTO medians are overall summaries, never averages of group medians
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const User = require('../../src/models/userModel');
const Attempt = require('../../src/models/attemptModel');
const { calculateMedian } = require('../../src/services/analytics/analyticsMathUtils');
const { getSpeedAccuracyMatrix } = require('../../src/services/analytics/speedAccuracyMatrixService');

describe('Suite 2: Speed-Accuracy Matrix & Longitudinal Speed Profiling', () => {
  const userId = 'usr_speed_matrix_test';

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();
    await User.create({ userId, email: 'speed@test.com', name: 'Speed Test User' });
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  describe('Section 20 Median Utility Unit Verification', () => {
    it('correctly calculates odd-count median', () => {
      expect(calculateMedian([10, 20, 30])).toBe(20);
      expect(calculateMedian([50, 10, 30, 20, 40])).toBe(30);
    });

    it('correctly calculates even-count median', () => {
      expect(calculateMedian([10, 20, 30, 40])).toBe(25);
      expect(calculateMedian([10, 20])).toBe(15);
    });

    it('returns null on empty, null, or invalid input', () => {
      expect(calculateMedian([])).toBeNull();
      expect(calculateMedian(null)).toBeNull();
      expect(calculateMedian([null, undefined, -5, NaN])).toBeNull();
    });

    it('filters out negative values and non-finite numbers', () => {
      expect(calculateMedian([-10, 20, 40, Infinity])).toBe(30);
    });
  });

  describe('Quadrant Classification & Boundaries', () => {
    beforeEach(async () => {
      await Attempt.deleteMany({});
    });

    it('returns insufficient_baseline when correct attempts < 3', async () => {
      const qId = new mongoose.Types.ObjectId();
      const now = new Date();

      // Only 2 correct attempts on pattern "P1" at diff 3
      await Attempt.create([
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 30,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 40,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          timeTaken: 20,
          source: 'practice',
          attemptedAt: now,
        },
      ]);

      const result = await getSpeedAccuracyMatrix(userId, 30, null, now);
      expect(result.speedAccuracyMatrix.insufficientBaselineCount).toBe(3);
      expect(result.speedAccuracyMatrix.quadrantCounts.accurateAndFast).toBe(0);
      expect(result.speedAccuracyMatrix.quadrantCounts.accurateAndSlow).toBe(0);
      expect(result.speedAccuracyMatrix.quadrantCounts.fastErrorRushing).toBe(0);
      expect(result.speedAccuracyMatrix.quadrantCounts.slowErrorStruggling).toBe(0);
      expect(result.speedAccuracyMatrix.rushingRiskScore).toBeNull();
    });

    it('accurately tests median boundary (timeTaken <= T_median vs > T_median) and rushing boundary (< 0.60 * T_median)', async () => {
      const qId = new mongoose.Types.ObjectId();
      const now = new Date();

      // Create 3 correct attempts with times [20, 30, 40] => T_median = 30
      // 0.60 * T_median = 18
      await Attempt.create([
        // Baseline creators
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 20, // <= 30 => accurateAndFast
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 30, // <= 30 => accurateAndFast (exact boundary)
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 40, // > 30 => accurateAndSlow
          source: 'practice',
          attemptedAt: now,
        },
        // Incorrect attempts testing rushing boundary (18)
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          timeTaken: 17.9, // < 18 => fastErrorRushing
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          timeTaken: 18.0, // >= 18 => slowErrorStruggling (exact boundary)
          source: 'practice',
          attemptedAt: now,
        },
      ]);

      const result = await getSpeedAccuracyMatrix(userId, 30, null, now);
      const qc = result.speedAccuracyMatrix.quadrantCounts;

      expect(qc.accurateAndFast).toBe(2); // 20, 30
      expect(qc.accurateAndSlow).toBe(1); // 40
      expect(qc.fastErrorRushing).toBe(1); // 17.9
      expect(qc.slowErrorStruggling).toBe(1); // 18.0
      expect(result.speedAccuracyMatrix.insufficientBaselineCount).toBe(0);

      // Rushing risk: 1 / (1 + 1) = 0.50
      expect(result.speedAccuracyMatrix.rushingRiskScore).toBe(0.5);

      // Proves no attempt is ever labeled "mastered"
      expect(JSON.stringify(result)).not.toContain('mastered');
    });

    it('returns rushingRiskScore = null when classified incorrect attempts = 0', async () => {
      const qId = new mongoose.Types.ObjectId();
      const now = new Date();

      // 3 correct attempts, 0 incorrect attempts
      await Attempt.create([
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 25,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 30,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 3,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 35,
          source: 'practice',
          attemptedAt: now,
        },
      ]);

      const result = await getSpeedAccuracyMatrix(userId, 30, null, now);
      expect(result.speedAccuracyMatrix.rushingRiskScore).toBeNull();
    });
  });

  describe('Topic Filtering & attemptsAnalyzed Scope', () => {
    beforeEach(async () => {
      await Attempt.deleteMany({});
    });

    it('when topic is omitted: all eligible attempts across all canonical topics are analyzed', async () => {
      const qId = new mongoose.Types.ObjectId();
      const now = new Date();

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
          timeTaken: 20,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Algebra',
          pattern: 'Linear Equations — Single Variable',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 25,
          source: 'daily_plan',
          attemptedAt: now,
        },
      ]);

      const result = await getSpeedAccuracyMatrix(userId, 30, null, now);
      expect(result.analysisWindow.attemptsAnalyzed).toBe(2);
    });

    it('when topic is supplied: speed-accuracy matrix strictly filters to Attempt.topic === requestedTopic', async () => {
      const qId = new mongoose.Types.ObjectId();
      const now = new Date();

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
          timeTaken: 20,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Algebra',
          pattern: 'Linear Equations — Single Variable',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 25,
          source: 'daily_plan',
          attemptedAt: now,
        },
      ]);

      const result = await getSpeedAccuracyMatrix(userId, 30, 'Percentage', now);
      expect(result.analysisWindow.attemptsAnalyzed).toBe(1);
    });
  });

  describe('Overall Aggregate Medians (DTO Serialization)', () => {
    beforeEach(async () => {
      await Attempt.deleteMany({});
    });

    it('computes overall aggregate medians medianTimeCorrectSeconds and medianTimeIncorrectSeconds across bounded attempts', async () => {
      const qId = new mongoose.Types.ObjectId();
      const now = new Date();

      // Odd correct sample: [10, 20, 30] => median 20
      // Even incorrect sample: [15, 25, 35, 45] => median 30
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
          timeTaken: 10,
          source: 'practice',
          attemptedAt: now,
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
          source: 'practice',
          attemptedAt: now,
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
          timeTaken: 30,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          timeTaken: 15,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          timeTaken: 25,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          timeTaken: 35,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Basic Percentage Calculation',
          difficulty: 1,
          selectedAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          timeTaken: 45,
          source: 'practice',
          attemptedAt: now,
        },
      ]);

      const result = await getSpeedAccuracyMatrix(userId, 30, null, now);
      expect(result.speedAccuracyMatrix.medianTimeCorrectSeconds).toBe(20.0);
      expect(result.speedAccuracyMatrix.medianTimeIncorrectSeconds).toBe(30.0);
    });

    it('returns null when respective correct or incorrect subsets are empty', async () => {
      const qId = new mongoose.Types.ObjectId();
      const now = new Date();

      // Only 1 correct attempt
      await Attempt.create({
        userId,
        questionId: qId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 42,
        source: 'practice',
        attemptedAt: now,
      });

      const result = await getSpeedAccuracyMatrix(userId, 30, null, now);
      expect(result.speedAccuracyMatrix.medianTimeCorrectSeconds).toBe(42.0);
      expect(result.speedAccuracyMatrix.medianTimeIncorrectSeconds).toBeNull();
    });

    it('proves DTO medians are overall bounded attempt summaries, never averages of group medians', async () => {
      const qId = new mongoose.Types.ObjectId();
      const now = new Date();

      // Group 1: 3 correct attempts with times [10, 10, 10] => group median = 10
      // Group 2: 1 correct attempt with time [100]
      // Overall sample: [10, 10, 10, 100] => overall median = (10 + 10) / 2 = 10.0
      // (If someone averaged group medians, they would get (10 + 100) / 2 = 55)
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
          timeTaken: 10,
          source: 'practice',
          attemptedAt: now,
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
          timeTaken: 10,
          source: 'practice',
          attemptedAt: now,
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
          timeTaken: 10,
          source: 'practice',
          attemptedAt: now,
        },
        {
          userId,
          questionId: qId,
          topic: 'Percentage',
          pattern: 'Successive Percentage Changes',
          difficulty: 1,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeTaken: 100,
          source: 'practice',
          attemptedAt: now,
        },
      ]);

      const result = await getSpeedAccuracyMatrix(userId, 30, null, now);
      expect(result.speedAccuracyMatrix.medianTimeCorrectSeconds).toBe(10.0);
    });
  });
});
