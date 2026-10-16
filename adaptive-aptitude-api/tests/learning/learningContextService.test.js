'use strict';

/**
 * tests/learning/learningContextService.test.js
 *
 * Tests the deny-by-default context hydration, nullable difficultyBand,
 * question stem bounds, and 8KB serialization boundary.
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const { hydrateContext, getDifficultyBand, MAX_CONTEXT_BYTES } = require('../../src/services/learning/learningContextService');
const { scrubContextForPrompt, sanitizeConversationHistory, sanitizeStudentMessage } = require('../../src/services/learning/promptService');
const Question = require('../../src/models/questionModel');

describe('Phase 7: learningContextService & Minimization Rules', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearAllTestCollections();
  });

  describe('getDifficultyBand', () => {
    it('maps integer difficulties 1..10 accurately', () => {
      expect(getDifficultyBand(1)).toBe('easy');
      expect(getDifficultyBand(2)).toBe('easy');
      expect(getDifficultyBand(3)).toBe('easy');
      expect(getDifficultyBand(4)).toBe('medium');
      expect(getDifficultyBand(5)).toBe('medium');
      expect(getDifficultyBand(6)).toBe('medium');
      expect(getDifficultyBand(7)).toBe('medium');
      expect(getDifficultyBand(8)).toBe('hard');
      expect(getDifficultyBand(9)).toBe('hard');
      expect(getDifficultyBand(10)).toBe('hard');
      expect(getDifficultyBand(null)).toBeNull();
      expect(getDifficultyBand(undefined)).toBeNull();
    });
  });

  describe('Deny-by-Default Hydration Allowlist', () => {
    it('concept_tutor hydrates topicContext with difficultyBand: null, and leaves other slices null', async () => {
      const context = await hydrateContext({
        userId: 'user_ctx_1',
        taskType: 'concept_tutor',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
      });

      expect(context.topicContext).toBeDefined();
      expect(context.topicContext.topic).toBe('Algebra');
      expect(context.topicContext.pattern).toBe('Linear Equations & Systems of Equations');
      expect(context.topicContext.difficultyBand).toBeNull(); // strictly null for tutor!
      expect(context.questionContext).toBeNull();
      expect(context.attemptContext).toBeNull();
      expect(context.planningContext).toBeNull();
      expect(context.mockAnalyticsContext).toBeNull();
    });

    it('hint hydrates questionContext, masks answers for levels 1..4, and sets difficultyBand from question', async () => {
      const q = await Question.create({
        question: 'Solve for x: 3x + 9 = 24',
        options: ['3', '5', '7', '9'],
        answer: '5',
        explanation: '3x = 15 => x = 5.',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        difficulty: 5,
      });

      // Level 2 hint
      const contextL2 = await hydrateContext({
        userId: 'user_ctx_1',
        taskType: 'hint',
        hintLevel: 2,
        questionId: String(q._id),
      });

      expect(contextL2.topicContext.difficultyBand).toBe('medium'); // 5 -> medium
      expect(contextL2.questionContext).toBeDefined();
      expect(contextL2.questionContext.correctAnswer).toBeNull(); // masked for level 2!
      expect(contextL2.questionContext.storedExplanation).toBeNull(); // masked for level 2!
      expect(contextL2.planningContext).toBeNull();
      expect(contextL2.mockAnalyticsContext).toBeNull();

      // Level 5 hint
      const contextL5 = await hydrateContext({
        userId: 'user_ctx_1',
        taskType: 'hint',
        hintLevel: 5,
        questionId: String(q._id),
      });

      expect(contextL5.questionContext.correctAnswer).toBe('5'); // populated for level 5!
      expect(contextL5.questionContext.storedExplanation).toBe('3x = 15 => x = 5.');
    });

    it('enforces post-minimization 8KB bound', async () => {
      const q = await Question.create({
        question: 'Q'.repeat(1000),
        options: ['A', 'B', 'C', 'D'],
        answer: 'A',
        explanation: 'E'.repeat(500),
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        difficulty: 2,
      });

      const context = await hydrateContext({
        userId: 'user_ctx_1',
        taskType: 'hint',
        hintLevel: 1,
        questionId: String(q._id),
      });

      const serialized = JSON.stringify(context);
      expect(Buffer.byteLength(serialized, 'utf8')).toBeLessThanOrEqual(MAX_CONTEXT_BYTES);
    });
  });

  describe('PII Scrubbing and Untrusted Input Sanitization', () => {
    it('scrubContextForPrompt strips userId from prompt payload', () => {
      const rawContext = {
        userId: 'secret_user_id',
        taskType: 'concept_tutor',
        topicContext: { topic: 'Algebra' },
      };

      const scrubbed = scrubContextForPrompt(rawContext);
      expect(scrubbed.userId).toBeUndefined();
      expect(scrubbed.topicContext.topic).toBe('Algebra');
    });

    it('sanitizeConversationHistory bounds to 4 turns and clamps turn text to 500 chars', () => {
      const longText = 'T'.repeat(800);
      const history = [
        { role: 'user', text: 'turn 1' },
        { role: 'assistant', text: 'turn 2' },
        { role: 'user', text: 'turn 3' },
        { role: 'assistant', text: 'turn 4' },
        { role: 'user', text: 'turn 5' },
        { role: 'assistant', text: longText },
      ];

      const sanitized = sanitizeConversationHistory(history);
      expect(sanitized.length).toBe(4); // max 4 turns
      expect(sanitized[3].role).toBe('assistant');
      expect(sanitized[3].text.length).toBe(500);
    });

    it('sanitizeStudentMessage clamps user query to 500 chars', () => {
      const query = 'Q'.repeat(600);
      const sanitized = sanitizeStudentMessage(query);
      expect(sanitized.length).toBe(500);
    });
  });
});
