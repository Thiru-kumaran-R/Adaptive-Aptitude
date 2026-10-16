'use strict';

/**
 * tests/learning/fallbackService.test.js
 *
 * Tests the pure Level-5 hint composer, authoritative text bounding,
 * and deterministic fallback builders across all six tasks.
 */

const {
  composeAuthorizedLevel5Hint,
  boundAuthoritativeText,
} = require('../../src/utils/learning/authoritativeTextUtils');

const {
  buildTutorFallback,
  buildHintFallback,
  buildAttemptExplanationFallback,
  buildProgressFallback,
  buildPlanFallback,
  buildMockReviewFallback,
} = require('../../src/services/learning/fallbackService');

const {
  TASK_SCHEMAS,
  validateDraft07Schema,
} = require('../../src/utils/learning/learningSchemaUtils');

describe('Phase 7: Fallback Service & Text Bounding Utilities', () => {
  describe('composeAuthorizedLevel5Hint', () => {
    it('preserves short canonical answer exactly', () => {
      const hint = composeAuthorizedLevel5Hint({
        answer: '42',
        explanation: 'Step 1: calculate. Step 2: verify.',
        maxLength: 600,
      });

      expect(hint.startsWith('Canonical answer: 42.')).toBe(true);
      expect(hint.length).toBeLessThanOrEqual(600);
      expect(hint).toContain('Step 1: calculate.');
    });

    it('preserves canonical answer and bounds explanation when total exceeds maxLength', () => {
      const longExplanation = 'E'.repeat(700);
      const hint = composeAuthorizedLevel5Hint({
        answer: 'Option C',
        explanation: longExplanation,
        maxLength: 600,
      });

      expect(hint.startsWith('Canonical answer: Option C.')).toBe(true);
      expect(hint.length).toBeLessThanOrEqual(600);
      expect(hint.endsWith('…')).toBe(true);
    });

    it('throws LEVEL5_FALLBACK_ASSEMBLY_FAILED if canonical answer itself exceeds maxLength', () => {
      const hugeAnswer = 'A'.repeat(600); // prefix will be "Canonical answer: AAAAA... (618 chars)"
      expect(() => {
        composeAuthorizedLevel5Hint({
          answer: hugeAnswer,
          explanation: 'Some explanation',
          maxLength: 600,
        });
      }).toThrow('LEVEL5_FALLBACK_ASSEMBLY_FAILED: canonical answer exceeds hint DTO capacity');
    });

    it('throws LEVEL5_FALLBACK_ASSEMBLY_FAILED if canonical answer is empty', () => {
      expect(() => {
        composeAuthorizedLevel5Hint({
          answer: '',
          explanation: 'Some explanation',
          maxLength: 600,
        });
      }).toThrow('LEVEL5_FALLBACK_ASSEMBLY_FAILED: canonical answer missing');
    });
  });

  describe('boundAuthoritativeText', () => {
    it('bounds text accurately at maxLength - 1, maxLength, and maxLength + 1', () => {
      const maxLength = 10;

      // maxLength - 1 (9 chars)
      const text9 = '123456789';
      expect(boundAuthoritativeText(text9, maxLength)).toBe('123456789');

      // maxLength (10 chars)
      const text10 = '1234567890';
      expect(boundAuthoritativeText(text10, maxLength)).toBe('1234567890');

      // maxLength + 1 (11 chars) -> sliced to 9 + '…'
      const text11 = '12345678901';
      const bounded11 = boundAuthoritativeText(text11, maxLength);
      expect(bounded11.length).toBe(10);
      expect(bounded11).toBe('123456789…');
    });

    it('returns empty string if value is null or undefined', () => {
      expect(boundAuthoritativeText(null, 10)).toBe('');
      expect(boundAuthoritativeText(undefined, 10)).toBe('');
    });
  });

  describe('Fallback Builders Schema Conformance', () => {
    it('buildTutorFallback conforms to Section 8.1 schema', () => {
      const fallback = buildTutorFallback({ topic: 'Percentage', pattern: 'Basic Percentage' });
      const res = validateDraft07Schema(fallback, TASK_SCHEMAS.concept_tutor);
      expect(res.valid).toBe(true);
      expect(fallback.formulaSummary).toBeNull();
      expect(fallback.workedExample).toBeNull();
    });

    it('buildHintFallback conforms to Section 8.2 schema for all levels 1..5', () => {
      const question = {
        question: 'Solve for x: 2x = 10',
        answer: '5',
        explanation: 'Divide by 2 to get 5.',
        pattern: 'Linear Equations',
      };

      for (let level = 1; level <= 5; level++) {
        const fallback = buildHintFallback({
          hintLevel: level,
          question,
          topicContext: { pattern: 'Linear Equations' },
        });

        const res = validateDraft07Schema(fallback, TASK_SCHEMAS.hint);
        expect(res.valid).toBe(true);
        expect(fallback.hintLevel).toBe(level);
        expect(fallback.hint.length).toBeLessThanOrEqual(600);

        if (level === 5) {
          expect(fallback.revealsAnswer).toBe(true);
          expect(fallback.nextAction).toBe('view_explanation');
          expect(fallback.hint).toContain('Canonical answer: 5.');
        } else {
          expect(fallback.revealsAnswer).toBe(false);
        }
      }
    });

    it('buildAttemptExplanationFallback conforms to Section 8.3 schema for correct and incorrect attempts', () => {
      const question = {
        question: 'What is 10 + 20?',
        answer: '30',
        explanation: 'Add 10 and 20 to get 30.',
        pattern: 'Addition',
      };

      // Correct attempt
      const correctAttempt = { isCorrect: true, selectedAnswer: '30' };
      const fallbackCorrect = buildAttemptExplanationFallback({
        attempt: correctAttempt,
        question,
        topicContext: { pattern: 'Addition' },
      });
      const resCorrect = validateDraft07Schema(fallbackCorrect, TASK_SCHEMAS.explain_attempt);
      expect(resCorrect.valid).toBe(true);
      expect(fallbackCorrect.mistakeExplanation).toContain('matches the canonical answer');
      expect(fallbackCorrect.correctApproach.length).toBeLessThanOrEqual(800);

      // Incorrect attempt
      const incorrectAttempt = { isCorrect: false, selectedAnswer: '25' };
      const fallbackIncorrect = buildAttemptExplanationFallback({
        attempt: incorrectAttempt,
        question,
        topicContext: { pattern: 'Addition' },
      });
      const resIncorrect = validateDraft07Schema(fallbackIncorrect, TASK_SCHEMAS.explain_attempt);
      expect(resIncorrect.valid).toBe(true);
      expect(fallbackIncorrect.mistakeExplanation).toContain('differs from the canonical answer');
    });

    it('buildAttemptExplanationFallback bounds long question explanation to <= 800', () => {
      const longQ = {
        question: 'Question',
        answer: 'A',
        explanation: 'Z'.repeat(1200),
        pattern: 'Pattern',
      };
      const fallback = buildAttemptExplanationFallback({
        attempt: { isCorrect: false, selectedAnswer: 'B' },
        question: longQ,
        topicContext: { pattern: 'Pattern' },
      });
      expect(fallback.correctApproach.length).toBeLessThanOrEqual(800);
      expect(fallback.correctApproach.endsWith('…')).toBe(true);
    });

    it('buildProgressFallback conforms to Section 8.4 schema', () => {
      const progressContext = {
        mastery: 0.75,
        masteryLabel: 'proficient',
        recentAccuracy: 80,
        totalAttempts: 10,
        consecutiveCorrect: 4,
        consecutiveIncorrect: 0,
      };

      const fallback = buildProgressFallback({
        progressContext,
        topicContext: { pattern: 'Linear Equations' },
      });

      const res = validateDraft07Schema(fallback, TASK_SCHEMAS.explain_progress);
      expect(res.valid).toBe(true);
      expect(fallback.masteryInterpretation).toContain('0.75 (proficient)');
      expect(fallback.strengths.length).toBeGreaterThan(0);
    });

    it('buildPlanFallback conforms to Section 8.6 schema', () => {
      const studyPlan = { _id: '66a1234567890abcdef12345' };
      const dailyObjective = {
        date: new Date('2026-10-15T00:00:00.000Z'),
        patterns: [
          { pattern: 'Linear Equations', targetQuestions: 15, completedQuestions: 5 },
          { pattern: 'Quadratic Equations', targetQuestions: 15, completedQuestions: 10 },
        ],
      };

      const fallback = buildPlanFallback({
        studyPlan,
        dailyObjective,
        revisionItem: { stage: 1, nextReviewDate: new Date('2026-10-18T00:00:00.000Z') },
      });

      const res = validateDraft07Schema(fallback, TASK_SCHEMAS.explain_plan);
      expect(res.valid).toBe(true);
      expect(fallback.planId).toBe('66a1234567890abcdef12345');
      expect(fallback.targetDate).toBe('2026-10-15');
      expect(fallback.objectiveSummary).toContain('30 questions (15 completed)');
      expect(fallback.revisionSummary).toContain('Stage 1 revision due on 2026-10-18');
    });

    it('buildMockReviewFallback conforms to Section 8.5 schema', () => {
      const mockSession = {
        sectionStates: [
          { sectionId: 'sec_1', order: 1 },
          { sectionId: 'sec_2', order: 2 },
        ],
      };
      const resultSummary = {
        rawScore: 85,
        maxPossibleScore: 100,
        percentage: 85,
        accuracy: 90,
        sections: [
          { sectionId: 'sec_1', rawScore: 40, accuracy: 80 },
          { sectionId: 'sec_2', rawScore: 45, accuracy: 100 },
        ],
      };

      const fallback = buildMockReviewFallback({ mockSession, resultSummary });
      const res = validateDraft07Schema(fallback, TASK_SCHEMAS.mock_review);
      expect(res.valid).toBe(true);
      expect(fallback.overallScoreInterpretation).toContain('85/100 (85%)');
      expect(fallback.sectionDiagnostics.length).toBe(2);
      expect(fallback.sectionDiagnostics[0].performanceTier).toBeNull();
    });
  });
});
