'use strict';

/**
 * tests/model_validation.test.js
 *
 * Unit tests for Mongoose Question model schema validation rules.
 * Verifies that the schema strictly enforces:
 *  - question is a non-empty string
 *  - answer is non-empty and matches one of the four options (answer ∈ options)
 *  - explanation is non-empty
 *  - options is an array of exactly 4 non-empty strings
 *  - topic is non-empty and exists in canonical registry
 *  - pattern is non-empty and exists in canonical registry
 *  - pattern belongs to the stored topic
 *  - difficulty exists, is an integer, >= 1 and <= 10
 */

const Question = require('../src/models/questionModel');

describe('Question Model Schema Validation', () => {
  const validQuestionData = {
    question: 'What is 15% of 200?',
    answer: '30',
    options: ['20', '25', '30', '35'],
    explanation: '15% of 200 = 0.15 * 200 = 30.',
    topic: 'Percentage',
    pattern: 'Basic Percentage Calculation',
    difficulty: 2,
  };

  it('validates a well-formed question document without errors', async () => {
    const q = new Question(validQuestionData);
    const err = q.validateSync();
    expect(err).toBeUndefined();
  });

  describe('Question text validation', () => {
    it('fails when question is missing', () => {
      const q = new Question({ ...validQuestionData, question: undefined });
      const err = q.validateSync();
      expect(err.errors.question).toBeDefined();
    });

    it('fails when question is empty string or only whitespace', () => {
      const q = new Question({ ...validQuestionData, question: '   ' });
      const err = q.validateSync();
      expect(err.errors.question).toBeDefined();
    });
  });

  describe('Answer validation and answer ∈ options consistency', () => {
    it('fails when answer is missing', () => {
      const q = new Question({ ...validQuestionData, answer: undefined });
      const err = q.validateSync();
      expect(err.errors.answer).toBeDefined();
    });

    it('fails when answer is empty string', () => {
      const q = new Question({ ...validQuestionData, answer: '' });
      const err = q.validateSync();
      expect(err.errors.answer).toBeDefined();
    });

    it('fails when answer does not match any of the four options', () => {
      const q = new Question({
        ...validQuestionData,
        answer: '99', // Not in ['20', '25', '30', '35']
      });
      const err = q.validateSync();
      expect(err.errors.answer).toBeDefined();
      expect(err.errors.answer.message).toMatch(/answer must match one of the four options/);
    });

    it('passes when answer exactly matches one of the options', () => {
      const q = new Question({
        ...validQuestionData,
        answer: '35',
      });
      expect(q.validateSync()).toBeUndefined();
    });
  });

  describe('Options array validation', () => {
    it('fails when options array has fewer than 4 elements', () => {
      const q = new Question({
        ...validQuestionData,
        options: ['10', '20', '30'],
      });
      const err = q.validateSync();
      expect(err.errors.options).toBeDefined();
    });

    it('fails when options array has more than 4 elements', () => {
      const q = new Question({
        ...validQuestionData,
        options: ['10', '20', '30', '40', '50'],
      });
      const err = q.validateSync();
      expect(err.errors.options).toBeDefined();
    });

    it('fails when an option is an empty string', () => {
      const q = new Question({
        ...validQuestionData,
        options: ['10', '20', '  ', '30'],
      });
      const err = q.validateSync();
      expect(err.errors.options).toBeDefined();
    });
  });

  describe('Explanation validation', () => {
    it('fails when explanation is missing', () => {
      const q = new Question({ ...validQuestionData, explanation: undefined });
      const err = q.validateSync();
      expect(err.errors.explanation).toBeDefined();
    });

    it('fails when explanation is empty string', () => {
      const q = new Question({ ...validQuestionData, explanation: '  ' });
      const err = q.validateSync();
      expect(err.errors.explanation).toBeDefined();
    });
  });

  describe('Topic and Pattern canonical validation', () => {
    it('fails when topic is not in the canonical registry', () => {
      const q = new Question({
        ...validQuestionData,
        topic: 'NonExistentTopic',
      });
      const err = q.validateSync();
      expect(err.errors.topic).toBeDefined();
      expect(err.errors.topic.message).toMatch(/canonical registry/);
    });

    it('fails when pattern is not in the canonical registry', () => {
      const q = new Question({
        ...validQuestionData,
        pattern: 'NonExistentPattern',
      });
      const err = q.validateSync();
      expect(err.errors.pattern).toBeDefined();
    });

    it('fails when pattern exists but does not belong to the topic', () => {
      // "Coin Toss Problems" is in Probability, not Percentage
      const q = new Question({
        ...validQuestionData,
        topic: 'Percentage',
        pattern: 'Coin Toss Problems',
      });
      const err = q.validateSync();
      expect(err.errors.pattern).toBeDefined();
      expect(err.errors.pattern.message).toMatch(/pattern must belong to the stored topic/);
    });
  });

  describe('Difficulty validation', () => {
    it('fails when difficulty is missing', () => {
      const q = new Question({ ...validQuestionData, difficulty: undefined });
      const err = q.validateSync();
      expect(err.errors.difficulty).toBeDefined();
    });

    it('fails when difficulty is less than 1', () => {
      const q = new Question({ ...validQuestionData, difficulty: 0 });
      const err = q.validateSync();
      expect(err.errors.difficulty).toBeDefined();
    });

    it('fails when difficulty is greater than 10', () => {
      const q = new Question({ ...validQuestionData, difficulty: 11 });
      const err = q.validateSync();
      expect(err.errors.difficulty).toBeDefined();
    });

    it('fails when difficulty is a non-integer float', () => {
      const q = new Question({ ...validQuestionData, difficulty: 3.5 });
      const err = q.validateSync();
      expect(err.errors.difficulty).toBeDefined();
      expect(err.errors.difficulty.message).toMatch(/integer/);
    });

    it('passes for every integer from 1 to 10', () => {
      for (let d = 1; d <= 10; d++) {
        const q = new Question({ ...validQuestionData, difficulty: d });
        expect(q.validateSync()).toBeUndefined();
      }
    });
  });
});
