'use strict';

/**
 * tests/mock/mockBlueprintValidation.test.js
 *
 * Verifies Phase 6 blueprint validation, explicit scope forms, section timing rules,
 * difficulty distribution checks, and canonical SHA-256 fingerprint generation.
 */

const {
  validateSectionScope,
  validateDifficultyDistribution,
  validateScoring,
  computeBlueprintFingerprint,
  validateAndNormalizeBlueprint,
} = require('../../src/services/mock/mockBlueprintValidationService');
const { MOCK_MODES, NAVIGATION_POLICIES } = require('../../src/config/mockConfig');

describe('Phase 6: Blueprint Validation & Fingerprint Engine', () => {
  describe('Explicit Section Scope Matrix', () => {
    it('accepts valid Scope 1: Topics only', () => {
      const scope = { topics: ['Percentage', 'Average'] };
      const validated = validateSectionScope(scope, 0);
      expect(validated.allCanonicalPatterns).toBe(false);
      expect(validated.topics).toEqual(['Percentage', 'Average']);
      expect(validated.patterns).toEqual([]);
    });

    it('accepts valid Scope 2: Patterns only (genuine patterns-only)', () => {
      const scope = { patterns: ['Successive Percentage Changes', 'Basic Arithmetic Mean & Missing Observations'] };
      const validated = validateSectionScope(scope, 0);
      expect(validated.allCanonicalPatterns).toBe(false);
      expect(validated.patterns).toEqual(['Successive Percentage Changes', 'Basic Arithmetic Mean & Missing Observations']);
      expect(validated.topics).toEqual([]);
    });

    it('accepts valid Scope 3: Topics + Patterns (patterns belong to supplied topics)', () => {
      const scope = {
        topics: ['Percentage'],
        patterns: ['Successive Percentage Changes'],
      };
      const validated = validateSectionScope(scope, 0);
      expect(validated.allCanonicalPatterns).toBe(false);
      expect(validated.topics).toEqual(['Percentage']);
      expect(validated.patterns).toEqual(['Successive Percentage Changes']);
    });

    it('rejects Scope 3 when pattern does not belong to any supplied topic', () => {
      const scope = {
        topics: ['Percentage'],
        patterns: ['Basic Arithmetic Mean & Missing Observations'], // belongs to Average, not Percentage
      };
      expect(() => validateSectionScope(scope, 0)).toThrow();
      try {
        validateSectionScope(scope, 0);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_SECTION_SCOPE');
      }
    });

    it('accepts valid Scope 4: All canonical patterns (topics/patterns omitted)', () => {
      const scope = { allCanonicalPatterns: true };
      const validated = validateSectionScope(scope, 0);
      expect(validated.allCanonicalPatterns).toBe(true);
      expect(validated.topics).toEqual([]);
      expect(validated.patterns).toEqual([]);
    });

    it('rejects Scope 4 when topics or patterns are provided alongside allCanonicalPatterns: true', () => {
      const scope = {
        allCanonicalPatterns: true,
        topics: ['Percentage'],
      };
      expect(() => validateSectionScope(scope, 0)).toThrow();
      try {
        validateSectionScope(scope, 0);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_SECTION_SCOPE');
      }
    });

    it('rejects empty or omitted scope with 400 MOCK_SCOPE_REQUIRED', () => {
      expect(() => validateSectionScope({}, 0)).toThrow();
      try {
        validateSectionScope({}, 0);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('MOCK_SCOPE_REQUIRED');
      }
    });

    it('rejects non-canonical topic with 400 INVALID_TOPIC', () => {
      const scope = { topics: ['NonExistentTopic123'] };
      try {
        validateSectionScope(scope, 0);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_TOPIC');
      }
    });

    it('rejects non-canonical pattern with 400 INVALID_PATTERN', () => {
      const scope = { patterns: ['NonExistentPattern456'] };
      try {
        validateSectionScope(scope, 0);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_PATTERN');
      }
    });
  });

  describe('Difficulty Distribution Validation', () => {
    it('accepts valid weights summing to 1.0', () => {
      const dist = { easy: 0.25, medium: 0.50, hard: 0.25 };
      const result = validateDifficultyDistribution(dist, 0);
      expect(result).toEqual({ easy: 0.25, medium: 0.50, hard: 0.25 });
    });

    it('defaults to 0.30 / 0.50 / 0.20 when null or undefined', () => {
      const result = validateDifficultyDistribution(null, 0);
      expect(result).toEqual({ easy: 0.30, medium: 0.50, hard: 0.20 });
    });

    it('rejects weights not summing to 1.0 with 400 INVALID_DIFFICULTY_DISTRIBUTION', () => {
      const dist = { easy: 0.30, medium: 0.30, hard: 0.30 };
      expect(() => validateDifficultyDistribution(dist, 0)).toThrow();
      try {
        validateDifficultyDistribution(dist, 0);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_DIFFICULTY_DISTRIBUTION');
      }
    });

    it('rejects negative or out-of-bound weights', () => {
      const dist = { easy: -0.1, medium: 0.8, hard: 0.3 };
      try {
        validateDifficultyDistribution(dist, 0);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_DIFFICULTY_DISTRIBUTION');
      }
    });
  });

  describe('Scoring Validation', () => {
    it('accepts valid signed scoring rules', () => {
      const scoring = { correctMarks: 2.0, incorrectMarks: -0.5, unansweredMarks: -0.25 };
      const validated = validateScoring(scoring);
      expect(validated).toEqual({ correctMarks: 2.0, incorrectMarks: -0.5, unansweredMarks: -0.25 });
    });

    it('rejects non-positive correctMarks (<= 0)', () => {
      try {
        validateScoring({ correctMarks: 0, incorrectMarks: 0, unansweredMarks: 0 });
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_SCORING');
      }
    });

    it('rejects positive incorrectMarks (> 0)', () => {
      try {
        validateScoring({ correctMarks: 1.0, incorrectMarks: 0.5, unansweredMarks: 0 });
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_SCORING');
      }
    });

    it('rejects positive unansweredMarks (> 0)', () => {
      try {
        validateScoring({ correctMarks: 1.0, incorrectMarks: 0, unansweredMarks: 0.5 });
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_SCORING');
      }
    });
  });

  describe('Section Timing & Navigation Policy Reconciliation', () => {
    const baseBlueprint = {
      title: 'Test Blueprint',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      durationMinutes: 60,
      sections: [
        {
          sectionId: 'sec-1',
          questionCount: 10,
          scope: { topics: ['Percentage'] },
        },
      ],
    };

    it('rejects free navigation when section duration is specified', () => {
      const bp = {
        ...baseBlueprint,
        sections: [
          {
            ...baseBlueprint.sections[0],
            durationMinutes: 30, // forbidden for free navigation
          },
        ],
      };
      try {
        validateAndNormalizeBlueprint(bp);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_SECTION_TIMING');
      }
    });

    it('accepts section_locked when all sections are untimed (durationMinutes: null)', () => {
      const bp = {
        ...baseBlueprint,
        navigationPolicy: NAVIGATION_POLICIES.SECTION_LOCKED,
        sections: [
          {
            sectionId: 'sec-1',
            questionCount: 10,
            durationMinutes: null,
            scope: { topics: ['Percentage'] },
          },
          {
            sectionId: 'sec-2',
            questionCount: 10,
            durationMinutes: null,
            scope: { topics: ['Average'] },
          },
        ],
      };
      const normalized = validateAndNormalizeBlueprint(bp);
      expect(normalized.sections[0].durationMinutes).toBeNull();
      expect(normalized.sections[1].durationMinutes).toBeNull();
    });

    it('rejects partial section timing in section_locked mode', () => {
      const bp = {
        ...baseBlueprint,
        navigationPolicy: NAVIGATION_POLICIES.SECTION_LOCKED,
        sections: [
          {
            sectionId: 'sec-1',
            questionCount: 10,
            durationMinutes: 20,
            scope: { topics: ['Percentage'] },
          },
          {
            sectionId: 'sec-2',
            questionCount: 10,
            durationMinutes: null, // Partial timing forbidden
            scope: { topics: ['Average'] },
          },
        ],
      };
      try {
        validateAndNormalizeBlueprint(bp);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_SECTION_TIMING');
      }
    });

    it('accepts section_locked when sum(section durations) <= global duration', () => {
      const bp = {
        ...baseBlueprint,
        navigationPolicy: NAVIGATION_POLICIES.SECTION_LOCKED,
        durationMinutes: 60,
        sections: [
          {
            sectionId: 'sec-1',
            questionCount: 10,
            durationMinutes: 20,
            scope: { topics: ['Percentage'] },
          },
          {
            sectionId: 'sec-2',
            questionCount: 10,
            durationMinutes: 30, // 20 + 30 = 50 <= 60 (Accepted!)
            scope: { topics: ['Average'] },
          },
        ],
      };
      const normalized = validateAndNormalizeBlueprint(bp);
      expect(normalized.sections[0].durationMinutes).toBe(20);
      expect(normalized.sections[1].durationMinutes).toBe(30);
    });

    it('rejects section_locked when sum(section durations) > global duration', () => {
      const bp = {
        ...baseBlueprint,
        navigationPolicy: NAVIGATION_POLICIES.SECTION_LOCKED,
        durationMinutes: 40,
        sections: [
          {
            sectionId: 'sec-1',
            questionCount: 10,
            durationMinutes: 25,
            scope: { topics: ['Percentage'] },
          },
          {
            sectionId: 'sec-2',
            questionCount: 10,
            durationMinutes: 25, // 25 + 25 = 50 > 40 (Rejected!)
            scope: { topics: ['Average'] },
          },
        ],
      };
      try {
        validateAndNormalizeBlueprint(bp);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_SECTION_TIMING');
      }
    });
  });

  describe('Server-Derived Fields & Canonical Fingerprint', () => {
    it('assigns section.order strictly based on array index', () => {
      const bp = {
        title: 'Order Test',
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        sections: [
          { sectionId: 'sec-b', questionCount: 5, scope: { topics: ['Percentage'] }, order: 99 },
          { sectionId: 'sec-a', questionCount: 5, scope: { topics: ['Average'] }, order: 4 },
        ],
      };
      const normalized = validateAndNormalizeBlueprint(bp);
      expect(normalized.sections[0].order).toBe(0);
      expect(normalized.sections[1].order).toBe(1);
    });

    it('derives totalQuestions as sum of section question counts', () => {
      const bp = {
        title: 'Sum Test',
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        sections: [
          { sectionId: 'sec-1', questionCount: 12, scope: { topics: ['Percentage'] } },
          { sectionId: 'sec-2', questionCount: 18, scope: { topics: ['Average'] } },
        ],
      };
      const normalized = validateAndNormalizeBlueprint(bp);
      expect(normalized.totalQuestions).toBe(30);
    });

    it('resolves effectiveExcludeRecentQuestions correctly for standard vs diagnostic', () => {
      const stdBp = {
        title: 'Std',
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        sections: [{ sectionId: 's1', questionCount: 10, scope: { topics: ['Percentage'] } }],
      };
      expect(validateAndNormalizeBlueprint(stdBp).effectiveExcludeRecentQuestions).toBe(false);

      const diagBp = {
        ...stdBp,
        mode: MOCK_MODES.DIAGNOSTIC,
      };
      expect(validateAndNormalizeBlueprint(diagBp).effectiveExcludeRecentQuestions).toBe(true);

      const overrideBp = {
        ...stdBp,
        mode: MOCK_MODES.STANDARD,
        excludeRecentQuestions: true, // explicit override
      };
      expect(validateAndNormalizeBlueprint(overrideBp).effectiveExcludeRecentQuestions).toBe(true);

      const diagFalseBp = {
        ...stdBp,
        mode: MOCK_MODES.DIAGNOSTIC,
        excludeRecentQuestions: false, // explicit override
      };
      expect(validateAndNormalizeBlueprint(diagFalseBp).effectiveExcludeRecentQuestions).toBe(false);
    });

    it('produces identical deterministic SHA-256 fingerprint for identical blueprints', () => {
      const bp1 = {
        title: 'BP1',
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        sections: [{ sectionId: 's1', questionCount: 10, scope: { topics: ['Percentage'] } }],
      };
      const bp2 = {
        title: 'Different Title Still Has Same Fingerprint Content',
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        sections: [{ sectionId: 's1', questionCount: 10, scope: { topics: ['Percentage'] } }],
      };
      const fp1 = computeBlueprintFingerprint(bp1);
      const fp2 = computeBlueprintFingerprint(bp2);
      expect(fp1).toBe(fp2);
      expect(typeof fp1).toBe('string');
      expect(fp1).toHaveLength(64); // SHA-256 hex
    });

    it('produces different fingerprints when section order or scope differs', () => {
      const bpA = {
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        sections: [
          { sectionId: 's1', questionCount: 5, scope: { topics: ['Percentage'] } },
          { sectionId: 's2', questionCount: 5, scope: { topics: ['Average'] } },
        ],
      };
      const bpB = {
        mode: MOCK_MODES.STANDARD,
        durationMinutes: 60,
        sections: [
          { sectionId: 's2', questionCount: 5, scope: { topics: ['Average'] } },
          { sectionId: 's1', questionCount: 5, scope: { topics: ['Percentage'] } },
        ],
      };
      expect(computeBlueprintFingerprint(bpA)).not.toBe(computeBlueprintFingerprint(bpB));
    });
  });
});
