'use strict';

/**
 * tests/learning/fakeLLMProvider.test.js
 *
 * Tests the FakeLLMProvider test harness, schema and semantic validity of defaults,
 * error enforcement on missing context, and capability reporting.
 */

const FakeLLMProvider = require('../../src/providers/learning/fakeLLMProvider');
const { validatePipeline } = require('../../src/services/learning/responseValidator');

describe('Phase 7: FakeLLMProvider Harness', () => {
  let provider;

  beforeEach(() => {
    provider = new FakeLLMProvider();
  });

  it('declares zero-retention capability support', () => {
    expect(provider.getCapabilities().supportsZeroRetention).toBe(true);
  });

  describe('Schema and Semantic Validity of Defaults', () => {
    it('returns valid default for concept_tutor when given valid context', async () => {
      const context = {
        topicContext: { topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations' },
      };
      const result = await provider.generate({
        taskType: 'concept_tutor',
        context,
      });

      expect(result.model).toBe('fake-llm-v1');
      const val = validatePipeline(result.content, 'concept_tutor', context);
      expect(val.valid).toBe(true);
    });

    it('returns valid default for hint across levels 1..5', async () => {
      const question = {
        question: 'Solve for x: 2x = 10',
        answer: '5',
        explanation: 'Divide by 2 to get 5.',
        pattern: 'Linear Equations',
      };

      for (let level = 1; level <= 5; level++) {
        const context = {
          taskInputContext: { hintLevel: level },
          questionContext: {
            questionId: 'q1',
            questionText: 'Solve for x: 2x = 10',
            options: ['2', '4', '5', '10'],
            correctAnswer: level === 5 ? '5' : null,
            storedExplanation: level === 5 ? 'Divide by 2 to get 5.' : null,
          },
          topicContext: { topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations' },
        };

        const result = await provider.generate({
          taskType: 'hint',
          context,
        });

        expect(result.content.hintLevel).toBe(level);
        expect(result.content.hint.length).toBeLessThanOrEqual(600);
        const val = validatePipeline(result.content, 'hint', context, question);
        expect(val.valid).toBe(true);
      }
    });

    it('returns valid default for explain_attempt branching on correctness', async () => {
      // Correct attempt
      const correctContext = {
        attemptContext: { isCorrect: true },
        topicContext: { topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations' },
      };
      const correctRes = await provider.generate({
        taskType: 'explain_attempt',
        context: correctContext,
      });
      const valCorrect = validatePipeline(correctRes.content, 'explain_attempt', correctContext);
      expect(valCorrect.valid).toBe(true);
      expect(correctRes.content.mistakeExplanation).toContain('matches the canonical answer');

      // Incorrect attempt
      const incorrectContext = {
        attemptContext: { isCorrect: false },
        topicContext: { topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations' },
      };
      const incorrectRes = await provider.generate({
        taskType: 'explain_attempt',
        context: incorrectContext,
      });
      const valIncorrect = validatePipeline(incorrectRes.content, 'explain_attempt', incorrectContext);
      expect(valIncorrect.valid).toBe(true);
      expect(incorrectRes.content.mistakeExplanation).toContain('differs from the canonical answer');
    });

    it('returns valid default for explain_progress', async () => {
      const context = {
        progressContext: { mastery: 0.8, masteryLabel: 'proficient' },
      };
      const result = await provider.generate({
        taskType: 'explain_progress',
        context,
      });
      const val = validatePipeline(result.content, 'explain_progress', context);
      expect(val.valid).toBe(true);
    });

    it('returns valid default for explain_plan', async () => {
      const context = {
        planningContext: {
          planId: 'plan_123',
          targetDate: '2026-10-15',
          revisionItem: null,
        },
      };
      const result = await provider.generate({
        taskType: 'explain_plan',
        context,
      });
      const val = validatePipeline(result.content, 'explain_plan', context);
      expect(val.valid).toBe(true);
    });

    it('returns valid default for mock_review', async () => {
      const context = {
        mockAnalyticsContext: {
          rawScore: 50,
          sectionBreakdown: [],
        },
      };
      const result = await provider.generate({
        taskType: 'mock_review',
        context,
      });
      const val = validatePipeline(result.content, 'mock_review', context);
      expect(val.valid).toBe(true);
    });
  });

  describe('Context Error Enforcement', () => {
    it('throws FAKE_PROVIDER_CONTEXT_ERROR when concept_tutor context is missing topic/pattern', async () => {
      await expect(
        provider.generate({
          taskType: 'concept_tutor',
          context: {},
        })
      ).rejects.toThrow('FAKE_PROVIDER_CONTEXT_ERROR');
    });

    it('throws FAKE_PROVIDER_CONTEXT_ERROR when Level 5 hint is missing correctAnswer', async () => {
      const context = {
        taskInputContext: { hintLevel: 5 },
        questionContext: {
          questionId: 'q1',
          correctAnswer: null, // missing!
        },
        topicContext: { topic: 'Algebra', pattern: 'Linear Equations' },
      };

      await expect(
        provider.generate({
          taskType: 'hint',
          context,
        })
      ).rejects.toThrow('FAKE_PROVIDER_CONTEXT_ERROR: Level-5 correctAnswer required');
    });

    it('throws FAKE_PROVIDER_CONTEXT_ERROR when explain_plan is missing planId or targetDate', async () => {
      await expect(
        provider.generate({
          taskType: 'explain_plan',
          context: {},
        })
      ).rejects.toThrow('FAKE_PROVIDER_CONTEXT_ERROR');
    });
  });

  describe('Canned Responses & Invocation Logging', () => {
    it('returns explicit canned response set via setResponse', async () => {
      provider.setResponse('concept_tutor', {
        topic: 'Custom',
        pattern: 'Pattern',
        conceptExplanation: 'Custom explanation',
        formulaSummary: null,
        workedExample: null,
        keyTakeaway: 'Custom takeaway',
      });

      const res = await provider.generate({
        taskType: 'concept_tutor',
        context: {},
      });

      expect(res.content.conceptExplanation).toBe('Custom explanation');
      expect(provider.invocationLog.length).toBe(1);
    });
  });
});
