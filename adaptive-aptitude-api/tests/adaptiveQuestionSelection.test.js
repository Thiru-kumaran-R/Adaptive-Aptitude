'use strict';

/**
 * tests/adaptiveQuestionSelection.test.js
 *
 * Tests for Phase 4 Deterministic Question Selection:
 *   - Exact target difficulty selection
 *   - Outward difficulty fallback (downward & upward)
 *   - Deterministic selection for multiple equally eligible questions (_id ascending)
 *   - Recent question exclusion (up to 20 IDs)
 *   - Deterministic exclusion relaxation (least recently attempted)
 *   - Zero answer leakage verification
 *   - True NO_QUESTION_AVAILABLE error handling
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('./helpers/dbSetup');
const Question = require('../src/models/questionModel');
const Attempt = require('../src/models/attemptModel');
const questionSelectionService = require('../src/services/adaptive/questionSelectionService');

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

describe('Adaptive Question Selection Service (Phase 4 V1)', () => {
  const userId = 'question_sel_user';
  const topic = 'Percentage';
  const pattern = 'Basic Percentage Calculation';

  it('QS1: generates correct outward difficulty sequence', () => {
    const seq5 = questionSelectionService.getOutwardDifficultySequence(5);
    expect(seq5).toEqual([5, 4, 6, 3, 7, 2, 8, 1, 9, 10]);

    const seq1 = questionSelectionService.getOutwardDifficultySequence(1);
    expect(seq1).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const seq10 = questionSelectionService.getOutwardDifficultySequence(10);
    expect(seq10).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('QS2: selects question with exact target difficulty when available', async () => {
    const q = await Question.create({
      question: 'What is 10% of 50?',
      answer: '5',
      options: ['5', '10', '15', '20'],
      explanation: '10% of 50 is 5',
      topic,
      pattern,
      difficulty: 4,
    });

    const result = await questionSelectionService.selectQuestion(userId, topic, pattern, 4);

    expect(result.selectedDifficulty).toBe(4);
    expect(result.fallbackUsed).toBe(false);
    expect(result.question._id.toString()).toBe(q._id.toString());
  });

  it('QS3: outward fallback downward (target = 5, level 5 absent, level 4 present)', async () => {
    const q4 = await Question.create({
      question: 'What is 20% of 60?',
      answer: '12',
      options: ['10', '12', '14', '16'],
      explanation: '20% of 60 is 12',
      topic,
      pattern,
      difficulty: 4,
    });
    const q6 = await Question.create({
      question: 'What is 20% of 80?',
      answer: '16',
      options: ['12', '14', '16', '18'],
      explanation: '20% of 80 is 16',
      topic,
      pattern,
      difficulty: 6,
    });

    const result = await questionSelectionService.selectQuestion(userId, topic, pattern, 5);

    // Sequence for 5: [5, 4, 6...]. 4 is checked before 6!
    expect(result.selectedDifficulty).toBe(4);
    expect(result.fallbackUsed).toBe(true);
    expect(result.reasonCodes).toContain('DIFFICULTY_FALLBACK');
    expect(result.question._id.toString()).toBe(q4._id.toString());
  });

  it('QS4: outward fallback upward (target = 5, levels 5 and 4 absent, level 6 present)', async () => {
    const q6 = await Question.create({
      question: 'What is 30% of 90?',
      answer: '27',
      options: ['20', '25', '27', '30'],
      explanation: '30% of 90 is 27',
      topic,
      pattern,
      difficulty: 6,
    });

    const result = await questionSelectionService.selectQuestion(userId, topic, pattern, 5);

    expect(result.selectedDifficulty).toBe(6);
    expect(result.fallbackUsed).toBe(true);
    expect(result.reasonCodes).toContain('DIFFICULTY_FALLBACK');
    expect(result.question._id.toString()).toBe(q6._id.toString());
  });

  it('QS5: deterministically selects lowest _id when multiple equally eligible questions exist', async () => {
    const qB = await Question.create({
      _id: new mongoose.Types.ObjectId('660000000000000000000002'),
      question: 'Question B',
      answer: '1',
      options: ['1', '2', '3', '4'],
      explanation: 'Expl B',
      topic,
      pattern,
      difficulty: 3,
    });
    const qA = await Question.create({
      _id: new mongoose.Types.ObjectId('660000000000000000000001'),
      question: 'Question A',
      answer: '1',
      options: ['1', '2', '3', '4'],
      explanation: 'Expl A',
      topic,
      pattern,
      difficulty: 3,
    });

    const result1 = await questionSelectionService.selectQuestion(userId, topic, pattern, 3);
    const result2 = await questionSelectionService.selectQuestion(userId, topic, pattern, 3);

    // Must deterministically pick Question A both times
    expect(result1.question._id.toString()).toBe(qA._id.toString());
    expect(result2.question._id.toString()).toBe(qA._id.toString());
  });

  it('QS6: excludes recently attempted question IDs', async () => {
    const q1 = await Question.create({
      question: 'Question 1',
      answer: '1',
      options: ['1', '2', '3', '4'],
      explanation: 'Expl',
      topic,
      pattern,
      difficulty: 3,
    });
    const q2 = await Question.create({
      question: 'Question 2',
      answer: '2',
      options: ['1', '2', '3', '4'],
      explanation: 'Expl',
      topic,
      pattern,
      difficulty: 3,
    });

    // Mark q1 as recently attempted
    await Attempt.create({
      userId,
      questionId: q1._id,
      topic,
      pattern,
      difficulty: 3,
      selectedAnswer: '1',
      correctAnswer: '1',
      isCorrect: true,
      timeTaken: 10,
      source: 'practice',
    });

    const result = await questionSelectionService.selectQuestion(userId, topic, pattern, 3);

    expect(result.question._id.toString()).toBe(q2._id.toString());
    expect(result.reasonCodes).toContain('RECENT_QUESTION_EXCLUDED');
  });

  it('QS7: relaxes exclusion when all questions in pattern were recently attempted and picks least recent', async () => {
    const qOld = await Question.create({
      question: 'Older Question',
      answer: '1',
      options: ['1', '2', '3', '4'],
      explanation: 'Expl',
      topic,
      pattern,
      difficulty: 3,
    });
    const qNew = await Question.create({
      question: 'Newer Question',
      answer: '2',
      options: ['1', '2', '3', '4'],
      explanation: 'Expl',
      topic,
      pattern,
      difficulty: 3,
    });

    // Attempt qOld 10 minutes ago
    await Attempt.create({
      userId,
      questionId: qOld._id,
      topic,
      pattern,
      difficulty: 3,
      selectedAnswer: '1',
      correctAnswer: '1',
      isCorrect: true,
      timeTaken: 10,
      source: 'practice',
      attemptedAt: new Date(Date.now() - 600000),
    });

    // Attempt qNew 1 minute ago
    await Attempt.create({
      userId,
      questionId: qNew._id,
      topic,
      pattern,
      difficulty: 3,
      selectedAnswer: '2',
      correctAnswer: '2',
      isCorrect: true,
      timeTaken: 10,
      source: 'practice',
      attemptedAt: new Date(Date.now() - 60000),
    });

    const result = await questionSelectionService.selectQuestion(userId, topic, pattern, 3);

    expect(result.question._id.toString()).toBe(qOld._id.toString());
    expect(result.reasonCodes).toContain('RECENT_EXCLUSION_RELAXED');
  });

  it('QS8: ZERO answer leakage — response question does not contain answer, correctAnswer, or explanation', async () => {
    await Question.create({
      question: 'Secret Question',
      answer: 'Secret Answer',
      options: ['Option 1', 'Option 2', 'Secret Answer', 'Option 4'],
      explanation: 'Secret Explanation',
      topic,
      pattern,
      difficulty: 2,
    });

    const result = await questionSelectionService.selectQuestion(userId, topic, pattern, 2);
    const q = result.question;

    expect(q.answer).toBeUndefined();
    expect(q.correctAnswer).toBeUndefined();
    expect(q.explanation).toBeUndefined();

    // Check recursive keys
    const jsonStr = JSON.stringify(q);
    expect(jsonStr.includes('answer')).toBe(false);
    expect(jsonStr.includes('correctAnswer')).toBe(false);
    expect(jsonStr.includes('explanation')).toBe(false);

    // Verify allowed fields
    expect(q._id).toBeDefined();
    expect(q.question).toBe('Secret Question');
    expect(q.options).toHaveLength(4);
    expect(q.topic).toBe(topic);
    expect(q.pattern).toBe(pattern);
    expect(q.difficulty).toBe(2);
  });

  it('QS9: throws NO_QUESTION_AVAILABLE when pattern has zero questions in database', async () => {
    // No questions created in database for this pattern
    await expect(
      questionSelectionService.selectQuestion(userId, topic, pattern, 2)
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'NO_QUESTION_AVAILABLE',
    });
  });
});
