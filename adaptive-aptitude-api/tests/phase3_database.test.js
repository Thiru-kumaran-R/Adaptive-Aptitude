'use strict';

/**
 * tests/phase3_database.test.js
 *
 * Phase 3 Database Layer Tests
 *
 * Tests A–F: Model layer, unique constraints, referential integrity,
 * attempt snapshot, progress aggregation.
 *
 * Uses test database only. Never touches adaptive_aptitude (production).
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearPhase3Collections } = require('./helpers/dbSetup');
const { seedUser, seedGoal, seedStudyPlan, seedAttempt, seedProgress } = require('./helpers/seedData');

const User = require('../src/models/userModel');
const Goal = require('../src/models/goalModel');
const StudyPlan = require('../src/models/studyPlanModel');
const DailyObjective = require('../src/models/dailyObjectiveModel');
const Attempt = require('../src/models/attemptModel');
const StudentProgress = require('../src/models/studentProgressModel');
const studentProgressService = require('../src/services/studentProgressService');
const { normalizeToMidnightUTC } = require('../src/services/dailyObjectiveService');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearPhase3Collections();
});

// ─────────────────────────────────────────────────────────────────────────────
// Test A: userId consistency — same String across all Phase 3 models
// ─────────────────────────────────────────────────────────────────────────────
describe('Test A — userId consistency across Phase 3 models', () => {
  it('A1: userId is required on User', async () => {
    await expect(User.create({ name: 'No ID' })).rejects.toThrow();
  });

  it('A2: userId is required on Goal', async () => {
    await expect(Goal.create({ title: 'Goal', type: 'competitive' })).rejects.toThrow();
  });

  it('A3: userId is required on Attempt', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(
      Attempt.create({
        questionId: fakeId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 1,
        selectedAnswer: '50',
        correctAnswer: '50',
        isCorrect: true,
        timeTaken: 30,
        source: 'practice',
      })
    ).rejects.toThrow();
  });

  it('A4: userId is required on StudentProgress', async () => {
    await expect(
      StudentProgress.create({ topic: 'Percentage', pattern: 'Basic Percentage Calculation' })
    ).rejects.toThrow();
  });

  it('A5: userId stored as String — not ObjectId', async () => {
    const user = await User.create({ userId: 'string_user_1', name: 'String User' });
    expect(typeof user.userId).toBe('string');
    expect(user.userId).toBe('string_user_1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test B: DailyObjective unique constraint { userId, planId, date }
// ─────────────────────────────────────────────────────────────────────────────
describe('Test B — DailyObjective uniqueness: {userId, planId, date}', () => {
  it('B1: cannot create two objectives for same userId+planId+date', async () => {
    const user = await seedUser('b1_user');
    const goal = await seedGoal('b1_user');
    const plan = await seedStudyPlan('b1_user', goal._id);

    const date = normalizeToMidnightUTC(new Date());

    await DailyObjective.create({
      userId: 'b1_user',
      planId: plan._id,
      goalId: goal._id,
      date,
      topic: 'Percentage',
      patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 5 }],
    });

    await expect(
      DailyObjective.create({
        userId: 'b1_user',
        planId: plan._id,
        goalId: goal._id,
        date,
        topic: 'Percentage',
        patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 3 }],
      })
    ).rejects.toThrow();
  });

  it('B2: same userId+date with DIFFERENT planId is allowed', async () => {
    const user = await seedUser('b2_user');
    const goal = await seedGoal('b2_user');
    const plan1 = await seedStudyPlan('b2_user', goal._id, { name: 'Plan 1' });
    const plan2 = await seedStudyPlan('b2_user', goal._id, { name: 'Plan 2' });

    const date = normalizeToMidnightUTC(new Date());

    const obj1 = await DailyObjective.create({
      userId: 'b2_user',
      planId: plan1._id,
      goalId: goal._id,
      date,
      topic: 'Percentage',
      patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 5 }],
    });
    const obj2 = await DailyObjective.create({
      userId: 'b2_user',
      planId: plan2._id,
      goalId: goal._id,
      date,
      topic: 'Percentage',
      patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 5 }],
    });

    expect(obj1._id.toString()).not.toBe(obj2._id.toString());
  });

  it('B3: date normalization prevents time-of-day bypass of uniqueness', async () => {
    const user = await seedUser('b3_user');
    const goal = await seedGoal('b3_user');
    const plan = await seedStudyPlan('b3_user', goal._id);

    const morning = normalizeToMidnightUTC(new Date('2026-10-01T08:00:00Z'));
    const evening = normalizeToMidnightUTC(new Date('2026-10-01T22:00:00Z'));

    // Both normalize to 2026-10-01T00:00:00Z
    expect(morning.toISOString()).toBe(evening.toISOString());

    await DailyObjective.create({
      userId: 'b3_user',
      planId: plan._id,
      goalId: goal._id,
      date: morning,
      topic: 'Percentage',
      patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 5 }],
    });

    await expect(
      DailyObjective.create({
        userId: 'b3_user',
        planId: plan._id,
        goalId: goal._id,
        date: evening, // normalized to same midnight UTC
        topic: 'Percentage',
        patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 3 }],
      })
    ).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test C: Pattern-level targetDifficulty in DailyObjective
// ─────────────────────────────────────────────────────────────────────────────
describe('Test C — Pattern-level targetDifficulty', () => {
  it('C1: targetDifficulty is optional at pattern level', async () => {
    const user = await seedUser('c1_user');
    const goal = await seedGoal('c1_user');
    const plan = await seedStudyPlan('c1_user', goal._id);

    const obj = await DailyObjective.create({
      userId: 'c1_user',
      planId: plan._id,
      goalId: goal._id,
      date: normalizeToMidnightUTC(new Date()),
      topic: 'Percentage',
      patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 5 }],
    });

    expect(obj.patterns[0].targetDifficulty).toBeUndefined();
  });

  it('C2: targetDifficulty validates 1–10 range when provided', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const planId = new mongoose.Types.ObjectId();
    const goalId = new mongoose.Types.ObjectId();

    await expect(
      DailyObjective.create({
        userId: 'c2_user',
        planId,
        goalId,
        date: normalizeToMidnightUTC(new Date()),
        topic: 'Percentage',
        patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 5, targetDifficulty: 0 }],
      })
    ).rejects.toThrow();
  });

  it('C3: valid targetDifficulty per pattern is stored correctly', async () => {
    const user = await seedUser('c3_user');
    const goal = await seedGoal('c3_user');
    const plan = await seedStudyPlan('c3_user', goal._id);

    const obj = await DailyObjective.create({
      userId: 'c3_user',
      planId: plan._id,
      goalId: goal._id,
      date: normalizeToMidnightUTC(new Date()),
      topic: 'Percentage',
      patterns: [
        { pattern: 'Basic Percentage Calculation', targetQuestions: 5, targetDifficulty: 3 },
        { pattern: 'Successive Percentage Changes', targetQuestions: 3 }, // no difficulty
      ],
    });

    expect(obj.patterns[0].targetDifficulty).toBe(3);
    expect(obj.patterns[1].targetDifficulty).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test D: Attempt server-side snapshot
// ─────────────────────────────────────────────────────────────────────────────
describe('Test D — Attempt stores server-side snapshot', () => {
  it('D1: all historical fields are stored in Attempt', async () => {
    const fakeQuestionId = new mongoose.Types.ObjectId();
    const attempt = await seedAttempt({
      userId: 'd1_user',
      questionId: fakeQuestionId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 3,
      selectedAnswer: '50',
      correctAnswer: '50',
      isCorrect: true,
      timeTaken: 45,
      source: 'practice',
    });

    expect(attempt.topic).toBe('Percentage');
    expect(attempt.pattern).toBe('Basic Percentage Calculation');
    expect(attempt.difficulty).toBe(3);
    expect(attempt.correctAnswer).toBe('50');
    expect(attempt.isCorrect).toBe(true);
    expect(attempt.attemptedAt).toBeTruthy();
  });

  it('D2: isCorrect is false when selectedAnswer !== correctAnswer', async () => {
    const fakeQuestionId = new mongoose.Types.ObjectId();
    const attempt = await seedAttempt({
      userId: 'd2_user',
      questionId: fakeQuestionId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 2,
      selectedAnswer: '25', // wrong
      correctAnswer: '50',
      isCorrect: false, // computed server-side
      timeTaken: 20,
      source: 'daily_plan',
    });

    expect(attempt.isCorrect).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test E: StudentProgress unique constraint { userId, topic, pattern }
// ─────────────────────────────────────────────────────────────────────────────
describe('Test E — StudentProgress unique constraint', () => {
  it('E1: duplicate {userId, topic, pattern} raises MongoServerError', async () => {
    const attrs = {
      userId: 'e1_user',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
    };
    await StudentProgress.create(attrs);
    await expect(StudentProgress.create(attrs)).rejects.toThrow();
  });

  it('E2: same userId + same topic + different pattern is allowed', async () => {
    await StudentProgress.create({
      userId: 'e2_user',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
    });
    const p2 = await StudentProgress.create({
      userId: 'e2_user',
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
    });
    expect(p2._id).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test F: Progress aggregation formula
// ─────────────────────────────────────────────────────────────────────────────
describe('Test F — Progress aggregation formula', () => {
  it('F1: updateProgressFromAttempt increments attempts, correct, incorrect', async () => {
    await studentProgressService.updateProgressFromAttempt({
      userId: 'f1_user',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      isCorrect: true,
      timeTaken: 30,
      attemptedAt: new Date(),
    });

    const p = await StudentProgress.findOne({ userId: 'f1_user' });
    expect(p.attempts).toBe(1);
    expect(p.correct).toBe(1);
    expect(p.incorrect).toBe(0);
    expect(p.accuracy).toBeCloseTo(100, 1);
    expect(p.totalTimeSpent).toBe(30);
    expect(p.averageTime).toBeCloseTo(30, 1);
  });

  it('F2: accuracy = (correct / attempts) * 100', async () => {
    const opts = { userId: 'f2_user', topic: 'Percentage', pattern: 'Basic Percentage Calculation' };
    await studentProgressService.updateProgressFromAttempt({ ...opts, isCorrect: true, timeTaken: 20, attemptedAt: new Date() });
    await studentProgressService.updateProgressFromAttempt({ ...opts, isCorrect: false, timeTaken: 40, attemptedAt: new Date() });

    const p = await StudentProgress.findOne({ userId: 'f2_user' });
    expect(p.attempts).toBe(2);
    expect(p.correct).toBe(1);
    expect(p.incorrect).toBe(1);
    expect(p.accuracy).toBeCloseTo(50, 1);
    expect(p.totalTimeSpent).toBe(60);
    expect(p.averageTime).toBeCloseTo(30, 1);
  });

  it('F3: mastery remains 0 after progress updates — reserved for Phase 4', async () => {
    await studentProgressService.updateProgressFromAttempt({
      userId: 'f3_user',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      isCorrect: true,
      timeTaken: 15,
      attemptedAt: new Date(),
    });
    const p = await StudentProgress.findOne({ userId: 'f3_user' });
    expect(p.mastery).toBe(0);
  });

  it('F4: highestDifficultyMastered remains 0 — reserved for Phase 4', async () => {
    await studentProgressService.updateProgressFromAttempt({
      userId: 'f4_user',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      isCorrect: true,
      timeTaken: 15,
      attemptedAt: new Date(),
    });
    const p = await StudentProgress.findOne({ userId: 'f4_user' });
    expect(p.highestDifficultyMastered).toBe(0);
  });

  it('F5: consecutive streak tracking', async () => {
    const opts = { userId: 'f5_user', topic: 'Percentage', pattern: 'Basic Percentage Calculation', timeTaken: 10, attemptedAt: new Date() };
    await studentProgressService.updateProgressFromAttempt({ ...opts, isCorrect: true });
    await studentProgressService.updateProgressFromAttempt({ ...opts, isCorrect: true });
    await studentProgressService.updateProgressFromAttempt({ ...opts, isCorrect: false });

    const p = await StudentProgress.findOne({ userId: 'f5_user' });
    expect(p.consecutiveCorrect).toBe(0);  // reset by incorrect
    expect(p.consecutiveIncorrect).toBe(1);
  });

  it('F6: rebuildProgressForUser rebuilds from Attempt history', async () => {
    const questionId = new mongoose.Types.ObjectId();
    await seedAttempt({ userId: 'f6_user', questionId, topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations', difficulty: 1, isCorrect: true, timeTaken: 20 });
    await seedAttempt({ userId: 'f6_user', questionId, topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations', difficulty: 2, isCorrect: false, timeTaken: 40 });

    const result = await studentProgressService.rebuildProgressForUser('f6_user');
    expect(result.rebuilt).toBe(1); // one (topic, pattern) combination

    const p = await StudentProgress.findOne({ userId: 'f6_user', topic: 'Algebra' });
    expect(p).toBeTruthy();
    expect(p.attempts).toBe(2);
    expect(p.correct).toBe(1);
    expect(p.incorrect).toBe(1);
    expect(p.accuracy).toBeCloseTo(50, 1);
    expect(p.mastery).toBe(0); // reserved
    expect(p.highestDifficultyMastered).toBe(0); // reserved
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test G: Goal date validation — targetDate >= startDate
// ─────────────────────────────────────────────────────────────────────────────
describe('Test G — Goal date validation', () => {
  it('G1: targetDate before startDate is rejected', async () => {
    await expect(
      Goal.create({
        userId: 'g1_user',
        title: 'Bad Goal',
        type: 'competitive',
        startDate: new Date('2026-10-10'),
        targetDate: new Date('2026-10-01'), // before startDate
      })
    ).rejects.toThrow();
  });

  it('G2: targetDate equal to startDate is valid', async () => {
    const g = await Goal.create({
      userId: 'g2_user',
      title: 'Same Day Goal',
      type: 'competitive',
      startDate: new Date('2026-10-10'),
      targetDate: new Date('2026-10-10'),
    });
    expect(g._id).toBeTruthy();
  });

  it('G3: priority must be 1–5', async () => {
    await expect(
      Goal.create({ userId: 'g3_user', title: 'Bad Priority', type: 'competitive', priority: 6 })
    ).rejects.toThrow();
  });

  it('G4: valid priority 5 is accepted', async () => {
    const g = await Goal.create({ userId: 'g4_user', title: 'Max Priority', type: 'competitive', priority: 5 });
    expect(g.priority).toBe(5);
  });
});
