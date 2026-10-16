'use strict';

/**
 * tests/learning/responseValidator.test.js
 *
 * Tests the local response validator:
 * - JSON Schema validation as authoritative security boundary
 * - Task-specific semantic truth validation
 * - Content leakage detection in hint validation
 */

const {
  validateSchema,
  validateSemantics,
  validatePipeline,
} = require('../../src/services/learning/responseValidator');

describe('Phase 7: responseValidator & Local Validation Pipeline', () => {
  describe('Schema Validation', () => {
    it('validates a correct concept_tutor payload', () => {
      const payload = {
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        conceptExplanation: 'Concept explanation grounded in curriculum.',
        formulaSummary: null,
        workedExample: null,
        keyTakeaway: 'Key takeaway message.',
      };
      const res = validateSchema(payload, 'concept_tutor');
      expect(res.valid).toBe(true);
    });

    it('rejects a concept_tutor payload with missing required field', () => {
      const payload = {
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        // conceptExplanation missing!
        formulaSummary: null,
        workedExample: null,
        keyTakeaway: 'Key takeaway message.',
      };
      const res = validateSchema(payload, 'concept_tutor');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('conceptExplanation'))).toBe(true);
    });
  });

  describe('Task-Specific Semantic Validation', () => {
    describe('concept_tutor', () => {
      it('rejects topic or pattern mismatch with context', () => {
        const context = {
          topicContext: { topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations' },
        };
        const payload = {
          topic: 'Percentage', // Mismatched!
          pattern: 'Linear Equations & Systems of Equations',
          conceptExplanation: 'Explanation',
          formulaSummary: null,
          workedExample: null,
          keyTakeaway: 'Takeaway',
        };
        const res = validateSemantics(payload, 'concept_tutor', context);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('Topic mismatch');
      });
    });

    describe('hint', () => {
      const q = {
        question: 'Solve for x: 2x = 10',
        answer: '5',
        explanation: 'x = 5',
        options: ['2', '4', '5', '10'],
      };

      it('rejects hintLevel mismatch with context', () => {
        const context = {
          taskInputContext: { hintLevel: 2 },
          questionContext: { correctAnswer: null },
        };
        const payload = {
          hintLevel: 1, // Mismatched!
          hint: 'Think about division.',
          revealsAnswer: false,
          nextAction: 'try_calculation',
        };
        const res = validateSemantics(payload, 'hint', context, q);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('Hint level mismatch');
      });

      it('rejects Level 1-4 hint when revealsAnswer is true', () => {
        const context = {
          taskInputContext: { hintLevel: 2 },
          questionContext: { correctAnswer: null },
        };
        const payload = {
          hintLevel: 2,
          hint: 'Think about division.',
          revealsAnswer: true, // Forbidden for level 2!
          nextAction: 'try_calculation',
        };
        const res = validateSemantics(payload, 'hint', context, q);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('revealsAnswer === false');
      });

      it('rejects Level 1-4 hint when text leaks answer', () => {
        const context = {
          taskInputContext: { hintLevel: 2 },
          questionContext: { correctAnswer: null },
        };
        const payload = {
          hintLevel: 2,
          hint: 'The answer is 5.', // Answer leak!
          revealsAnswer: false,
          nextAction: 'try_calculation',
        };
        const res = validateSemantics(payload, 'hint', context, q);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('answer leakage');
      });

      it('rejects Level 5 hint when revealsAnswer is false', () => {
        const context = {
          taskInputContext: { hintLevel: 5 },
          questionContext: { correctAnswer: '5' },
        };
        const payload = {
          hintLevel: 5,
          hint: 'Canonical answer: 5.',
          revealsAnswer: false, // Must be true!
          nextAction: 'view_explanation',
        };
        const res = validateSemantics(payload, 'hint', context, q);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('revealsAnswer === true');
      });
    });

    describe('explain_attempt', () => {
      it('rejects incorrect attempt claiming student matched canonical answer', () => {
        const context = {
          attemptContext: { isCorrect: false },
        };
        const payload = {
          conceptSummary: 'Summary',
          mistakeExplanation: 'Your response matches the canonical answer perfectly.', // Contradicts isCorrect: false!
          correctApproach: 'Approach',
          revisionSuggestion: 'Linear Equations & Systems of Equations',
          confidence: null,
        };
        const res = validateSemantics(payload, 'explain_attempt', context);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('Attempt was incorrect');
      });
    });

    describe('explain_plan', () => {
      it('rejects planId mismatch with context', () => {
        const context = {
          planningContext: { planId: 'plan_1', targetDate: '2026-10-15', revisionItem: null },
        };
        const payload = {
          planId: 'plan_foreign', // Mismatch!
          targetDate: '2026-10-15',
          objectiveSummary: 'Summary',
          schedulingReasons: [],
          revisionSummary: null,
          recommendedAction: 'Action',
        };
        const res = validateSemantics(payload, 'explain_plan', context);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('planId mismatch');
      });

      it('rejects non-null revisionSummary when no revisionItem exists in context', () => {
        const context = {
          planningContext: { planId: 'plan_1', targetDate: '2026-10-15', revisionItem: null },
        };
        const payload = {
          planId: 'plan_1',
          targetDate: '2026-10-15',
          objectiveSummary: 'Summary',
          schedulingReasons: [],
          revisionSummary: 'Fabricated revision summary!', // Must be null!
          recommendedAction: 'Action',
        };
        const res = validateSemantics(payload, 'explain_plan', context);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('revisionSummary must be null');
      });
    });

    describe('mock_review', () => {
      it('rejects diagnostic containing sectionId not in session sectionStates', () => {
        const context = {
          mockAnalyticsContext: {
            sectionBreakdown: [{ sectionId: 'sec_quant' }, { sectionId: 'sec_verbal' }],
          },
        };
        const payload = {
          overallScoreInterpretation: 'Score interpretation',
          sectionDiagnostics: [
            { sectionId: 'sec_invented', diagnosticMessage: 'Msg', performanceTier: null },
          ],
          pacingObservations: 'Pacing',
          priorityRevisionPatterns: [],
        };
        const res = validateSemantics(payload, 'mock_review', context);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('unknown sectionId');
      });
    });
  });

  describe('Full Pipeline Integration (validatePipeline)', () => {
    it('returns failureType = "invalid_output" on JSON schema failure', () => {
      const res = validatePipeline({ invalid: true }, 'concept_tutor');
      expect(res.valid).toBe(false);
      expect(res.failureType).toBe('invalid_output');
    });

    it('returns failureType = "hallucination_guard" on semantic failure', () => {
      const context = {
        topicContext: { topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations' },
      };
      const schemaValidPayload = {
        topic: 'NonExistentTopic', // Semantic failure!
        pattern: 'Linear Equations & Systems of Equations',
        conceptExplanation: 'Explanation',
        formulaSummary: null,
        workedExample: null,
        keyTakeaway: 'Takeaway',
      };
      const res = validatePipeline(schemaValidPayload, 'concept_tutor', context);
      expect(res.valid).toBe(false);
      expect(res.failureType).toBe('hallucination_guard');
    });
  });
});
