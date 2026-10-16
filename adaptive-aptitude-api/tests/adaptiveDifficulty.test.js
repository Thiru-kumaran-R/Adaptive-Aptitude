'use strict';

/**
 * tests/adaptiveDifficulty.test.js
 *
 * Tests for Phase 4 Difficulty Adaptation:
 *   - Insufficient evidence (< 3 recent attempts => adjustment = 0)
 *   - Difficulty increase (recent accuracy >= 0.80 => +1)
 *   - Difficulty decrease (recent accuracy <= 0.40 => -1)
 *   - Difficulty hold (0.40 < accuracy < 0.80 => 0)
 *   - Boundary clamping (lower 1, upper 10)
 *   - DailyObjective pattern targetDifficulty as base difficulty
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('./helpers/dbSetup');
const Attempt = require('../src/models/attemptModel');
const difficultySelectionService = require('../src/services/adaptive/difficultySelectionService');

beforeAll(async () => {
  await connectTestDB();
}, 60000);

afterAll(async () => {
  await clearAllTestCollections();
  await disconnectTestDB();
}, 60000);

beforeEach(async () => {
  await clearAllTestCollections();
});

describe('Adaptive Difficulty Service (Phase 4 V1)', () => {
  const userId = 'difficulty_test_user';
  const topic = 'Percentage';
  const pattern = 'Basic Percentage Calculation';

  it('D1: holds difficulty when recent attempts < 3 (insufficient evidence)', async () => {
    // 2 attempts, both correct at difficulty 4
    await Attempt.create({
      userId,
      questionId: new mongoose.Types.ObjectId(),
      topic,
      pattern,
      difficulty: 4,
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      timeTaken: 20,
      source: 'practice',
    });
    await Attempt.create({
      userId,
      questionId: new mongoose.Types.ObjectId(),
      topic,
      pattern,
      difficulty: 4,
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      timeTaken: 20,
      source: 'practice',
    });

    const result = await difficultySelectionService.selectTargetDifficulty(userId, topic, pattern);

    expect(result.recentAttemptCount).toBe(2);
    expect(result.adjustment).toBe(0);
    expect(result.baseDifficulty).toBe(4);
    expect(result.targetDifficulty).toBe(4);
    expect(result.reasonCodes).toContain('DIFFICULTY_HELD');
  });

  it('D2: increases difficulty by +1 when recent accuracy >= 0.80 with >= 3 attempts', async () => {
    // 4 attempts at difficulty 5: 4 correct (100% accuracy)
    for (let i = 0; i < 4; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 5,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 20,
        source: 'practice',
      });
    }

    const result = await difficultySelectionService.selectTargetDifficulty(userId, topic, pattern);

    expect(result.recentAttemptCount).toBe(4);
    expect(result.recentAccuracy).toBe(1.0);
    expect(result.baseDifficulty).toBe(5);
    expect(result.adjustment).toBe(1);
    expect(result.targetDifficulty).toBe(6);
    expect(result.reasonCodes).toContain('DIFFICULTY_INCREASED');
  });

  it('D3: decreases difficulty by -1 when recent accuracy <= 0.40 with >= 3 attempts', async () => {
    // 4 attempts at difficulty 5: 1 correct, 3 incorrect (25% accuracy)
    for (let i = 0; i < 4; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 5,
        selectedAnswer: i === 0 ? 'A' : 'B',
        correctAnswer: 'A',
        isCorrect: i === 0,
        timeTaken: 25,
        source: 'practice',
      });
    }

    const result = await difficultySelectionService.selectTargetDifficulty(userId, topic, pattern);

    expect(result.recentAttemptCount).toBe(4);
    expect(result.recentAccuracy).toBe(0.25);
    expect(result.baseDifficulty).toBe(5);
    expect(result.adjustment).toBe(-1);
    expect(result.targetDifficulty).toBe(4);
    expect(result.reasonCodes).toContain('DIFFICULTY_DECREASED');
  });

  it('D4: holds difficulty (adjustment = 0) when 0.40 < recent accuracy < 0.80', async () => {
    // 5 attempts at difficulty 6: 3 correct, 2 incorrect (60% accuracy)
    for (let i = 0; i < 5; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 6,
        selectedAnswer: i < 3 ? 'A' : 'B',
        correctAnswer: 'A',
        isCorrect: i < 3,
        timeTaken: 20,
        source: 'practice',
      });
    }

    const result = await difficultySelectionService.selectTargetDifficulty(userId, topic, pattern);

    expect(result.recentAttemptCount).toBe(5);
    expect(result.recentAccuracy).toBe(0.6);
    expect(result.baseDifficulty).toBe(6);
    expect(result.adjustment).toBe(0);
    expect(result.targetDifficulty).toBe(6);
    expect(result.reasonCodes).toContain('DIFFICULTY_HELD');
  });

  it('D5: clamps difficulty at upper boundary 10 (never 11)', async () => {
    // 3 attempts at difficulty 10: 3 correct (100% accuracy)
    for (let i = 0; i < 3; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 10,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 20,
        source: 'practice',
      });
    }

    const result = await difficultySelectionService.selectTargetDifficulty(userId, topic, pattern);

    expect(result.baseDifficulty).toBe(10);
    expect(result.adjustment).toBe(1);
    expect(result.targetDifficulty).toBe(10);
  });

  it('D6: clamps difficulty at lower boundary 1 (never 0)', async () => {
    // 3 attempts at difficulty 1: 0 correct (0% accuracy)
    for (let i = 0; i < 3; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 1,
        selectedAnswer: 'Wrong',
        correctAnswer: 'A',
        isCorrect: false,
        timeTaken: 20,
        source: 'practice',
      });
    }

    const result = await difficultySelectionService.selectTargetDifficulty(userId, topic, pattern);

    expect(result.baseDifficulty).toBe(1);
    expect(result.adjustment).toBe(-1);
    expect(result.targetDifficulty).toBe(1);
  });

  it('D7: uses DailyObjective patternTargetDifficulty as base difficulty when supplied', async () => {
    // No prior attempts, patternTargetDifficulty = 7
    const result = await difficultySelectionService.selectTargetDifficulty(userId, topic, pattern, {
      patternTargetDifficulty: 7,
    });

    expect(result.baseDifficulty).toBe(7);
    expect(result.adjustment).toBe(0);
    expect(result.targetDifficulty).toBe(7);
    expect(result.reasonCodes).toContain('TARGET_DIFFICULTY_USED');
  });
});
