'use strict';

/**
 * tests/adaptiveMastery.test.js
 *
 * Tests for Phase 4 V1 Mastery Calculation and Highest Difficulty Mastered:
 *   - Direct manual calculation fixture with exact mathematical assertions
 *   - Zero history behavior (0 attempts => mastery = 0)
 *   - Confidence scaling (< 10 attempts vs >= 10 attempts)
 *   - Numeric threshold mastery labels
 *   - highestDifficultyMastered (>= 3 attempts & >= 80% accuracy)
 *   - Recalculate & persist to StudentProgress
 *   - Recovery utility: recalculatePatternLearningState
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('./helpers/dbSetup');
const Attempt = require('../src/models/attemptModel');
const StudentProgress = require('../src/models/studentProgressModel');
const Question = require('../src/models/questionModel');
const User = require('../src/models/userModel');
const attemptService = require('../src/services/attemptService');
const masteryService = require('../src/services/adaptive/masteryService');
const config = require('../src/config/adaptiveConfig');

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

describe('Adaptive Mastery Service (Phase 4 V1)', () => {
  const userId = 'mastery_test_user';
  const topic = 'Percentage';
  const pattern = 'Basic Percentage Calculation';

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Zero History Test
  // ───────────────────────────────────────────────────────────────────────────
  it('M1: returns 0 mastery for a user with 0 attempts', async () => {
    const result = await masteryService.calculatePatternMastery(userId, topic, pattern);
    expect(result.mastery).toBe(0);
    expect(result.rawMastery).toBe(0);
    expect(result.totalAttempts).toBe(0);
    expect(result.recentAccuracy).toBe(0);
    expect(result.overallAccuracy).toBe(0);
    expect(result.recentDifficultyCompetence).toBe(0);
    expect(result.attemptConfidence).toBe(0);
    expect(result.masteryLabel).toBe('weak');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Manual Formula Fixture Test
  // ───────────────────────────────────────────────────────────────────────────
  it('M2: matches exact manual calculation fixture for controlled attempts', async () => {
    // Fixture Setup:
    // 12 attempts total.
    // 10 most recent attempts:
    //   - 8 correct, difficulties: [3, 4, 4, 5, 5, 6, 6, 7] -> sum = 40, avg = 5.0 -> competence = 0.50
    //   - 2 incorrect, difficulties: [4, 5]
    //   -> recentAttemptCount = 10, recentCorrect = 8 => recentAccuracy = 0.80
    // 2 earlier attempts:
    //   - 1 correct (diff 2), 1 incorrect (diff 3)
    // -> totalAttempts = 12, totalCorrect = 8 + 1 = 9 => overallAccuracy = 9 / 12 = 0.75
    //
    // Manual Math:
    //   recentAccuracy = 8 / 10 = 0.80
    //   overallAccuracy = 9 / 12 = 0.75
    //   recentDifficultyCompetence = 40 / 8 / 10 = 0.50
    //   attemptConfidence = min(12 / 10, 1.0) = 1.0
    //   rawMastery = 0.55 * 0.80 + 0.25 * 0.75 + 0.20 * 0.50
    //              = 0.44 + 0.1875 + 0.10 = 0.7275
    //   finalMastery = 0.7275 * (0.60 + 0.40 * 1.0) = 0.7275 * 1.0 = 0.7275

    const baseTime = new Date('2026-09-30T10:00:00Z').getTime();

    // 2 older attempts
    await Attempt.create({
      userId,
      questionId: new mongoose.Types.ObjectId(),
      topic,
      pattern,
      difficulty: 3,
      selectedAnswer: 'Wrong',
      correctAnswer: 'Right',
      isCorrect: false,
      timeTaken: 20,
      source: 'practice',
      attemptedAt: new Date(baseTime + 1000),
    });
    await Attempt.create({
      userId,
      questionId: new mongoose.Types.ObjectId(),
      topic,
      pattern,
      difficulty: 2,
      selectedAnswer: 'Right',
      correctAnswer: 'Right',
      isCorrect: true,
      timeTaken: 20,
      source: 'practice',
      attemptedAt: new Date(baseTime + 2000),
    });

    // 10 recent attempts (8 correct, 2 incorrect)
    const recentDefs = [
      { isCorrect: true, diff: 3 },
      { isCorrect: true, diff: 4 },
      { isCorrect: true, diff: 4 },
      { isCorrect: true, diff: 5 },
      { isCorrect: true, diff: 5 },
      { isCorrect: true, diff: 6 },
      { isCorrect: true, diff: 6 },
      { isCorrect: true, diff: 7 },
      { isCorrect: false, diff: 4 },
      { isCorrect: false, diff: 5 },
    ];

    for (let i = 0; i < recentDefs.length; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: recentDefs[i].diff,
        selectedAnswer: recentDefs[i].isCorrect ? 'Right' : 'Wrong',
        correctAnswer: 'Right',
        isCorrect: recentDefs[i].isCorrect,
        timeTaken: 25,
        source: 'practice',
        attemptedAt: new Date(baseTime + 10000 + i * 1000),
      });
    }

    const result = await masteryService.calculatePatternMastery(userId, topic, pattern);

    const expectedRecentAccuracy = 8 / 10;
    const expectedOverallAccuracy = 9 / 12;
    const expectedCompetence = 40 / 8 / 10;
    const expectedConfidence = 1.0;
    const expectedRawMastery = 0.55 * 0.80 + 0.25 * 0.75 + 0.20 * 0.50; // 0.7275
    const expectedFinalMastery = expectedRawMastery * 1.0;

    expect(result.recentAccuracy).toBeCloseTo(expectedRecentAccuracy, 5);
    expect(result.overallAccuracy).toBeCloseTo(expectedOverallAccuracy, 5);
    expect(result.recentDifficultyCompetence).toBeCloseTo(expectedCompetence, 5);
    expect(result.attemptConfidence).toBeCloseTo(expectedConfidence, 5);
    expect(result.rawMastery).toBeCloseTo(expectedRawMastery, 5);
    expect(result.mastery).toBeCloseTo(expectedFinalMastery, 5);
    expect(result.masteryLabel).toBe('proficient'); // 0.70 <= 0.7275 < 0.85
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Confidence Scaling Test (< 10 attempts reduces confidence)
  // ───────────────────────────────────────────────────────────────────────────
  it('M3: confidence factor scales down raw mastery when attempts < 10', async () => {
    // 5 attempts, all correct at difficulty 4
    // recentAccuracy = 1.0, overallAccuracy = 1.0, competence = 0.40
    // rawMastery = 0.55*1 + 0.25*1 + 0.20*0.40 = 0.80 + 0.08 = 0.88
    // attemptConfidence = 5 / 10 = 0.50
    // confidenceMultiplier = 0.60 + 0.40 * 0.50 = 0.80
    // finalMastery = 0.88 * 0.80 = 0.704

    for (let i = 0; i < 5; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 4,
        selectedAnswer: 'Right',
        correctAnswer: 'Right',
        isCorrect: true,
        timeTaken: 15,
        source: 'daily_plan',
        attemptedAt: new Date(Date.now() + i * 100),
      });
    }

    const result = await masteryService.calculatePatternMastery(userId, topic, pattern);

    expect(result.totalAttempts).toBe(5);
    expect(result.attemptConfidence).toBe(0.5);
    expect(result.rawMastery).toBeCloseTo(0.88, 5);
    expect(result.mastery).toBeCloseTo(0.704, 5);
    expect(result.mastery).toBeLessThan(result.rawMastery);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Mastery Labels Thresholds
  // ───────────────────────────────────────────────────────────────────────────
  it('M4: classifies mastery into correct labels based on numeric thresholds', () => {
    // Exact prompt boundary values: 0, 0.399, 0.40, 0.699, 0.70, 0.849, 0.85, 1
    expect(masteryService.getMasteryLabel(0)).toBe('weak');
    expect(masteryService.getMasteryLabel(0.399)).toBe('weak');
    expect(masteryService.getMasteryLabel(0.3999)).toBe('weak');
    expect(masteryService.getMasteryLabel(0.40)).toBe('developing');
    expect(masteryService.getMasteryLabel(0.699)).toBe('developing');
    expect(masteryService.getMasteryLabel(0.6999)).toBe('developing');
    expect(masteryService.getMasteryLabel(0.70)).toBe('proficient');
    expect(masteryService.getMasteryLabel(0.849)).toBe('proficient');
    expect(masteryService.getMasteryLabel(0.8499)).toBe('proficient');
    expect(masteryService.getMasteryLabel(0.85)).toBe('mastered');
    expect(masteryService.getMasteryLabel(1.0)).toBe('mastered');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Highest Difficulty Mastered Formal Rule
  // ───────────────────────────────────────────────────────────────────────────
  it('M5: highestDifficultyMastered requires >=3 attempts and >=80% accuracy', async () => {
    // Difficulty 3: 5 attempts, 3 correct (60%) -> NOT mastered
    for (let i = 0; i < 5; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 3,
        selectedAnswer: i < 3 ? 'Right' : 'Wrong',
        correctAnswer: 'Right',
        isCorrect: i < 3,
        timeTaken: 20,
        source: 'practice',
      });
    }

    // Difficulty 4: 4 attempts, 4 correct (100%) -> MASTERED (>=3 attempts, >=80%)
    for (let i = 0; i < 4; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 4,
        selectedAnswer: 'Right',
        correctAnswer: 'Right',
        isCorrect: true,
        timeTaken: 20,
        source: 'practice',
      });
    }

    // Difficulty 6: 1 attempt, 1 correct (100%) -> NOT mastered (< 3 attempts)
    await Attempt.create({
      userId,
      questionId: new mongoose.Types.ObjectId(),
      topic,
      pattern,
      difficulty: 6,
      selectedAnswer: 'Right',
      correctAnswer: 'Right',
      isCorrect: true,
      timeTaken: 20,
      source: 'practice',
    });

    const highest = await masteryService.calculateHighestDifficultyMastered(userId, topic, pattern);
    expect(highest).toBe(4);
  });

  it('M6: highestDifficultyMastered returns 0 if no difficulty qualifies', async () => {
    // 2 attempts at diff 5 (100% correct) -> not enough attempts
    await Attempt.create({
      userId,
      questionId: new mongoose.Types.ObjectId(),
      topic,
      pattern,
      difficulty: 5,
      selectedAnswer: 'Right',
      correctAnswer: 'Right',
      isCorrect: true,
      timeTaken: 20,
      source: 'practice',
    });
    await Attempt.create({
      userId,
      questionId: new mongoose.Types.ObjectId(),
      topic,
      pattern,
      difficulty: 5,
      selectedAnswer: 'Right',
      correctAnswer: 'Right',
      isCorrect: true,
      timeTaken: 20,
      source: 'practice',
    });

    const highest = await masteryService.calculateHighestDifficultyMastered(userId, topic, pattern);
    expect(highest).toBe(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Recalculate & Persist to StudentProgress + Recovery Utility
  // ───────────────────────────────────────────────────────────────────────────
  it('M7: recalculateAndPersistPatternMastery updates StudentProgress document', async () => {
    // Create 3 attempts at difficulty 2
    for (let i = 0; i < 3; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 2,
        selectedAnswer: 'Right',
        correctAnswer: 'Right',
        isCorrect: true,
        timeTaken: 10,
        source: 'practice',
      });
    }

    const updated = await masteryService.recalculateAndPersistPatternMastery(userId, topic, pattern);
    expect(updated.mastery).toBeGreaterThan(0);
    expect(updated.highestDifficultyMastered).toBe(2);

    const fromDb = await StudentProgress.findOne({ userId, topic, pattern });
    expect(fromDb.mastery).toBe(updated.mastery);
    expect(fromDb.highestDifficultyMastered).toBe(2);
  });

  it('M8: recalculatePatternLearningState recovery utility successfully repairs learning state', async () => {
    // Create 4 attempts at difficulty 5 (all correct)
    for (let i = 0; i < 4; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 5,
        selectedAnswer: 'Right',
        correctAnswer: 'Right',
        isCorrect: true,
        timeTaken: 12,
        source: 'practice',
      });
    }

    // Set stale mastery in DB manually to simulate failure
    await StudentProgress.findOneAndUpdate(
      { userId, topic, pattern },
      { $set: { mastery: 0, highestDifficultyMastered: 0 } },
      { upsert: true }
    );

    // Run deterministic repair
    const repaired = await masteryService.recalculatePatternLearningState(userId, topic, pattern);
    expect(repaired.mastery).toBeGreaterThan(0);
    expect(repaired.highestDifficultyMastered).toBe(5);

    const doc = await StudentProgress.findOne({ userId, topic, pattern });
    expect(doc.mastery).toBe(repaired.mastery);
    expect(doc.highestDifficultyMastered).toBe(5);
  });

  it('M9: mastery persistence failure preserves Attempt, logs structured MASTERY_RECALCULATION_FAILED, and repair utility restores state', async () => {
    await User.create({ userId, name: 'Alice Mastery Recovery' });
    const q = await Question.create({
      question: 'Sample Question for Failure Recovery',
      answer: '50',
      options: ['10', '20', '50', '100'],
      explanation: 'Explanation text here',
      topic,
      pattern,
      difficulty: 3,
    });

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Spy on recalculateAndPersistPatternMastery to simulate failure during attempt creation
    const originalRecalc = masteryService.recalculateAndPersistPatternMastery;
    const recalcSpy = jest
      .spyOn(masteryService, 'recalculateAndPersistPatternMastery')
      .mockRejectedValueOnce(new Error('Simulated Database Network Error'));

    // Record an attempt
    const attempt = await attemptService.createAttempt({
      userId,
      questionId: q._id.toString(),
      selectedAnswer: '50',
      timeTaken: 15,
      source: 'practice',
    });

    // 1. Attempt is preserved in DB
    expect(attempt).toBeDefined();
    expect(attempt._id).toBeDefined();
    const persistedAttempt = await Attempt.findById(attempt._id);
    expect(persistedAttempt).not.toBeNull();
    expect(persistedAttempt.topic).toBe(topic);
    expect(persistedAttempt.pattern).toBe(pattern);
    expect(persistedAttempt.difficulty).toBe(3);
    expect(persistedAttempt.isCorrect).toBe(true);

    // 2. Failure is logged with structured event
    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedCall = consoleErrorSpy.mock.calls.find((call) =>
      typeof call[0] === 'string' && call[0].includes('MASTERY_RECALCULATION_FAILED')
    );
    expect(loggedCall).toBeDefined();
    const parsedLog = JSON.parse(loggedCall[0]);
    expect(parsedLog.event).toBe('MASTERY_RECALCULATION_FAILED');
    expect(parsedLog.userId).toBe(userId);
    expect(parsedLog.topic).toBe(topic);
    expect(parsedLog.pattern).toBe(pattern);
    expect(parsedLog.attemptId).toBeDefined();

    // Sensitive data is NOT in log
    expect(loggedCall[0].includes('50')).toBe(false);
    expect(loggedCall[0].includes('password')).toBe(false);

    // Restore spy
    recalcSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // 3. Repair mechanism restores derived learning state
    const repaired = await masteryService.recalculatePatternLearningState(userId, topic, pattern);
    expect(repaired.mastery).toBeGreaterThan(0);
    expect(repaired.topic).toBe(topic);
    expect(repaired.pattern).toBe(pattern);

    const doc = await StudentProgress.findOne({ userId, topic, pattern });
    expect(doc.mastery).toBe(repaired.mastery);
  });
});
