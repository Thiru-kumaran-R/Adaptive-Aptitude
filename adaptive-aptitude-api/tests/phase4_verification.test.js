'use strict';

/**
 * tests/phase4_verification.test.js
 *
 * End-to-end integration scenarios for Phase 4 verification:
 *   - Section 108: New User Scenario
 *   - Section 109: Strong Student Scenario
 *   - Section 110: Struggling Student Scenario
 *   - Section 111: Prerequisite Redirect Scenario
 *   - Section 112: Daily Objective Scenario
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('./helpers/dbSetup');
const User = require('../src/models/userModel');
const Question = require('../src/models/questionModel');
const Attempt = require('../src/models/attemptModel');
const StudentProgress = require('../src/models/studentProgressModel');
const DailyObjective = require('../src/models/dailyObjectiveModel');
const adaptiveEngine = require('../src/services/adaptive/adaptiveEngine');
const { normalizeToMidnightUTC } = require('../src/services/dailyObjectiveService');

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

describe('Phase 4 Verification Scenarios (Audit Scenarios)', () => {
  // ───────────────────────────────────────────────────────────────────────────
  // Scenario 1: New User Scenario (Section 108)
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 1: New Student Scenario — 0 attempts, 0 progress, no objective/plan', async () => {
    const userId = 'new_student_audit_01';
    await User.create({ userId, name: 'Brand New Student' });

    // Seed question for the first canonical foundational pattern: 'Linear Equations & Systems of Equations' in 'Algebra'
    await Question.create({
      question: 'Solve for x: 2x + 4 = 10',
      answer: '3',
      options: ['2', '3', '4', '5'],
      explanation: '2x = 6 => x = 3',
      topic: 'Algebra',
      pattern: 'Linear Equations & Systems of Equations',
      difficulty: 2,
    });

    const result = await adaptiveEngine.getNextQuestion(userId);

    expect(result.decision.selectedTopic).toBeDefined();
    expect(result.decision.selectedPattern).toBeDefined();
    expect(result.decision.difficulty.baseDifficulty).toBe(2);
    expect(result.decision.difficulty.selectedDifficulty).toBe(2);
    expect(result.decision.mastery).toBe(0);
    expect(result.decision.reasonCodes).toContain('FOUNDATIONAL_FALLBACK');
    expect(result.question._id).toBeDefined();
    expect(result.question.answer).toBeUndefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Scenario 2: Strong Student Scenario (Section 109)
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 2: Strong Student Scenario — high accuracy increases difficulty by +1', async () => {
    const userId = 'strong_student_audit_02';
    await User.create({ userId, name: 'Strong Student' });

    const topic = 'Percentage';
    const pattern = 'Basic Percentage Calculation';

    // Seed 4 correct attempts at difficulty 4 (100% recent accuracy)
    for (let i = 0; i < 4; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 4,
        selectedAnswer: 'Correct',
        correctAnswer: 'Correct',
        isCorrect: true,
        timeTaken: 15,
        source: 'practice',
        attemptedAt: new Date(Date.now() - (4 - i) * 1000),
      });
    }

    // Seed questions at difficulties 4 and 5
    await Question.create({
      question: 'Level 4 Question',
      answer: 'Ans',
      options: ['1', '2', '3', 'Ans'],
      explanation: 'Expl',
      topic,
      pattern,
      difficulty: 4,
    });
    const q5 = await Question.create({
      question: 'Level 5 Question',
      answer: 'Ans',
      options: ['1', '2', '3', 'Ans'],
      explanation: 'Expl',
      topic,
      pattern,
      difficulty: 5,
    });

    const result = await adaptiveEngine.getNextQuestion(userId, { topic, pattern });

    expect(result.decision.difficulty.baseDifficulty).toBe(4);
    expect(result.decision.difficulty.adjustment).toBe(1);
    expect(result.decision.difficulty.targetDifficulty).toBe(5);
    expect(result.decision.difficulty.selectedDifficulty).toBe(5);
    expect(result.decision.reasonCodes).toContain('DIFFICULTY_INCREASED');
    expect(result.question._id.toString()).toBe(q5._id.toString());
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Scenario 3: Struggling Student Scenario (Section 110)
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 3: Struggling Student Scenario — low accuracy decreases difficulty by -1', async () => {
    const userId = 'struggling_student_audit_03';
    await User.create({ userId, name: 'Struggling Student' });

    const topic = 'Percentage';
    const pattern = 'Basic Percentage Calculation';

    // Seed 4 attempts at difficulty 5 with 1 correct and 3 incorrect (25% accuracy)
    for (let i = 0; i < 4; i++) {
      await Attempt.create({
        userId,
        questionId: new mongoose.Types.ObjectId(),
        topic,
        pattern,
        difficulty: 5,
        selectedAnswer: i === 0 ? 'Ans' : 'Wrong',
        correctAnswer: 'Ans',
        isCorrect: i === 0,
        timeTaken: 30,
        source: 'practice',
        attemptedAt: new Date(Date.now() - (4 - i) * 1000),
      });
    }

    // Seed question at difficulty 4
    const q4 = await Question.create({
      question: 'Level 4 Question for Struggling Student',
      answer: 'Ans',
      options: ['A', 'B', 'Ans', 'D'],
      explanation: 'Expl',
      topic,
      pattern,
      difficulty: 4,
    });

    const result = await adaptiveEngine.getNextQuestion(userId, { topic, pattern });

    expect(result.decision.difficulty.baseDifficulty).toBe(5);
    expect(result.decision.difficulty.adjustment).toBe(-1);
    expect(result.decision.difficulty.targetDifficulty).toBe(4);
    expect(result.decision.difficulty.selectedDifficulty).toBe(4);
    expect(result.decision.reasonCodes).toContain('DIFFICULTY_DECREASED');
    expect(result.question._id.toString()).toBe(q4._id.toString());
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Scenario 4: Prerequisite Redirect Scenario (Section 111)
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 4: Prerequisite Redirect Scenario — redirects to unmastered prerequisite', async () => {
    const userId = 'prereq_redirect_student_04';
    await User.create({ userId, name: 'Redirect Student' });

    // Target pattern requires ONLY 'Basic Percentage Calculation'
    const requestedPattern = 'Weighted Percentage Calculations';
    const prereqPattern = 'Basic Percentage Calculation';

    // Prerequisite has mastery 0.40 (< 0.70 threshold)
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: prereqPattern,
      mastery: 0.40,
      attempts: 5,
    });

    // Seed question for prerequisite pattern
    const qPrereq = await Question.create({
      question: 'Prerequisite Question',
      answer: 'Ans',
      options: ['A', 'B', 'Ans', 'D'],
      explanation: 'Expl',
      topic: 'Percentage',
      pattern: prereqPattern,
      difficulty: 2,
    });

    const result = await adaptiveEngine.getNextQuestion(userId, {
      topic: 'Percentage',
      pattern: requestedPattern,
    });

    expect(result.decision.requestedPattern).toBe(requestedPattern);
    expect(result.decision.selectedPattern).toBe(prereqPattern);
    expect(result.decision.prerequisiteRedirect).toBe(true);
    expect(result.decision.reasonCodes).toContain('PREREQUISITE_NOT_MASTERED');
    expect(result.decision.reasonCodes).toContain('PREREQUISITE_REMEDIATION');
    expect(result.question._id.toString()).toBe(qPrereq._id.toString());
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Scenario 5: Daily Objective Multi-Candidate Scenario (Section 112)
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 5: Daily Objective Scenario — prioritizes incomplete candidate by formula', async () => {
    const userId = 'daily_objective_student_05';
    await User.create({ userId, name: 'Daily Objective Student' });

    const today = normalizeToMidnightUTC(new Date());
    const planId = new mongoose.Types.ObjectId();
    const goalId = new mongoose.Types.ObjectId();

    // Pattern 1: targetQuestions = 10, completed = 8 => remaining = 2 => ratio = 0.2
    // Pattern 2: targetQuestions = 10, completed = 1 => remaining = 9 => ratio = 0.9
    // Both have mastery = 0.50 => masteryNeed = 0.50
    // Pattern 1 score = 0.70 * 0.50 + 0.30 * 0.20 = 0.35 + 0.06 = 0.41
    // Pattern 2 score = 0.70 * 0.50 + 0.30 * 0.90 = 0.35 + 0.27 = 0.62
    await DailyObjective.create({
      userId,
      planId,
      goalId,
      date: today,
      topic: 'Percentage',
      patterns: [
        {
          pattern: 'Successive Percentage Changes',
          targetQuestions: 10,
          completedQuestions: 8,
        },
        {
          pattern: 'Basic Percentage Calculation',
          targetQuestions: 10,
          completedQuestions: 1,
        },
      ],
    });

    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      mastery: 0.50,
      attempts: 5,
    });
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      mastery: 0.50,
      attempts: 5,
    });

    await Question.create({
      question: 'Basic Percentage Question',
      answer: 'Ans',
      options: ['1', '2', 'Ans', '4'],
      explanation: 'Expl',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 2,
    });

    const result = await adaptiveEngine.getNextQuestion(userId);

    // Basic Percentage Calculation has higher remaining questions (9 vs 2) -> score 0.62 vs 0.41
    expect(result.decision.selectedPattern).toBe('Basic Percentage Calculation');
    expect(result.decision.reasonCodes).toContain('DAILY_OBJECTIVE');
  });
});
