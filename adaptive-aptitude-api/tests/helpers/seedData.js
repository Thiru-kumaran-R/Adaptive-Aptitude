'use strict';

/**
 * tests/helpers/seedData.js
 *
 * Minimal representative question dataset for API integration tests.
 * Seeds the test database with a small set of questions covering
 * a few topics and patterns at different difficulty levels.
 *
 * This seed data is structurally correct but NOT imported from the
 * verified production dataset — it is a representative subset used
 * only for testing API behavior.
 */

const Question = require('../../src/models/questionModel');

const SEED_QUESTIONS = [
  // Percentage — Successive Percentage Changes — difficulty 5
  {
    question: 'A price increases by 20% and then decreases by 20%. What is the net change?',
    answer: '4% decrease',
    options: ['No change', '4% decrease', '4% increase', '2% decrease'],
    explanation: 'Net change = 20 - 20 - (20×20)/100 = -4%. So 4% decrease.',
    topic: 'Percentage',
    pattern: 'Successive Percentage Changes',
    difficulty: 5,
  },
  // Percentage — Successive Percentage Changes — difficulty 6
  {
    question: 'A value is increased by 10% and then by 10% again. What is the total increase?',
    answer: '21%',
    options: ['20%', '21%', '22%', '19%'],
    explanation: 'Total = 10 + 10 + (10×10)/100 = 21%.',
    topic: 'Percentage',
    pattern: 'Successive Percentage Changes',
    difficulty: 6,
  },
  // Percentage — Basic Percentage — difficulty 1
  {
    question: 'What is 25% of 200?',
    answer: '50',
    options: ['25', '50', '75', '100'],
    explanation: '25% of 200 = (25/100) × 200 = 50.',
    topic: 'Percentage',
    pattern: 'Basic Percentage Calculation',
    difficulty: 1,
  },
  // Percentage — Basic Percentage Calculation — difficulty 2
  {
    question: 'What is 10% of 500?',
    answer: '50',
    options: ['5', '50', '100', '500'],
    explanation: '10% of 500 = (10/100) × 500 = 50.',
    topic: 'Percentage',
    pattern: 'Basic Percentage Calculation',
    difficulty: 2,
  },
  // Problems on Ages — Present Age from a Given Ratio — difficulty 4
  {
    question: 'A and B have ages in ratio 3:5. Sum of their ages is 40. Find A\'s age.',
    answer: '15',
    options: ['10', '15', '20', '25'],
    explanation: '3x + 5x = 40 → x = 5. A\'s age = 3×5 = 15.',
    topic: 'Problems on Ages',
    pattern: 'Present Age from a Given Ratio',
    difficulty: 4,
  },
  // Problems on Ages — Sum of Present Ages Given — difficulty 3
  {
    question: 'Sum of ages of X and Y is 50. X is 10 years older. Find Y\'s age.',
    answer: '20',
    options: ['15', '20', '25', '30'],
    explanation: 'X + Y = 50, X - Y = 10 → Y = 20.',
    topic: 'Problems on Ages',
    pattern: 'Sum of Present Ages Given',
    difficulty: 3,
  },
  // Algebra — Linear Equations & Systems of Equations — difficulty 1
  {
    question: 'Solve: 2x + 3 = 7',
    answer: 'x = 2',
    options: ['x = 1', 'x = 2', 'x = 3', 'x = 4'],
    explanation: '2x = 7 - 3 = 4, x = 2.',
    topic: 'Algebra',
    pattern: 'Linear Equations & Systems of Equations',
    difficulty: 1,
  },
  // Algebra — Linear Equations & Systems of Equations — difficulty 2
  {
    question: 'If 3x - 6 = 9, what is x?',
    answer: 'x = 5',
    options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
    explanation: '3x = 15, x = 5.',
    topic: 'Algebra',
    pattern: 'Linear Equations & Systems of Equations',
    difficulty: 2,
  },
  // Probability — Basic Probability — difficulty 3
  {
    question: 'A fair die is rolled. What is the probability of getting 4?',
    answer: '1/6',
    options: ['1/2', '1/4', '1/6', '1/3'],
    explanation: 'Only 1 favorable outcome out of 6 total → 1/6.',
    topic: 'Probability',
    pattern: 'Coin Toss Problems',
    difficulty: 3,
  },
  // Probability — Basic Probability — difficulty 4
  {
    question: 'Two fair coins are tossed. Probability of getting exactly one head?',
    answer: '1/2',
    options: ['1/4', '1/2', '3/4', '1'],
    explanation: 'Sample space: {HH, HT, TH, TT}. Favorable: {HT, TH} = 2/4 = 1/2.',
    topic: 'Probability',
    pattern: 'Coin Toss Problems',
    difficulty: 4,
  },
];

/**
 * Seed the test database with representative questions.
 * Returns the inserted documents (with _id).
 */
const seedQuestions = async () => {
  const inserted = await Question.insertMany(SEED_QUESTIONS, { ordered: true });
  return inserted;
};

// ── Phase 3 seed helpers ───────────────────────────────────────────────────

const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const Attempt = require('../../src/models/attemptModel');
const StudentProgress = require('../../src/models/studentProgressModel');

const seedUser = async (userId = 'test_student_001', name = 'Test Student') => {
  return User.create({ userId, name, email: `${userId}@test.example` });
};

const seedGoal = async (userId, overrides = {}) => {
  return Goal.create({
    userId,
    title: 'Test Goal',
    type: 'competitive',
    status: 'active',
    ...overrides,
  });
};

const seedStudyPlan = async (userId, goalId, overrides = {}) => {
  return StudyPlan.create({
    userId,
    goalId,
    name: 'Test Study Plan',
    scope: 'short',
    phase: 'foundation',
    status: 'active',
    targets: [
      { topic: 'Percentage', pattern: 'Basic Percentage Calculation', targetQuestions: 10 },
    ],
    ...overrides,
  });
};

const seedAttempt = async (attrs) => {
  return Attempt.create({
    userId: attrs.userId,
    questionId: attrs.questionId,
    topic: attrs.topic || 'Percentage',
    pattern: attrs.pattern || 'Basic Percentage Calculation',
    difficulty: attrs.difficulty || 1,
    selectedAnswer: attrs.selectedAnswer || '50',
    correctAnswer: attrs.correctAnswer || '50',
    isCorrect: attrs.isCorrect !== undefined ? attrs.isCorrect : true,
    timeTaken: attrs.timeTaken || 30,
    source: attrs.source || 'practice',
    sessionId: attrs.sessionId,
    attemptedAt: attrs.attemptedAt || new Date(),
  });
};

const seedProgress = async (attrs) => {
  return StudentProgress.create({
    userId: attrs.userId,
    topic: attrs.topic || 'Percentage',
    pattern: attrs.pattern || 'Basic Percentage Calculation',
    attempts: attrs.attempts || 0,
    correct: attrs.correct || 0,
    incorrect: attrs.incorrect || 0,
    accuracy: attrs.accuracy || 0,
    totalTimeSpent: attrs.totalTimeSpent || 0,
    averageTime: attrs.averageTime || 0,
    mastery: 0,
    highestDifficultyMastered: 0,
    consecutiveCorrect: attrs.consecutiveCorrect || 0,
    consecutiveIncorrect: attrs.consecutiveIncorrect || 0,
  });
};

module.exports = {
  seedQuestions,
  SEED_QUESTIONS,
  seedUser,
  seedGoal,
  seedStudyPlan,
  seedAttempt,
  seedProgress,
};
