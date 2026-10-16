'use strict';

/**
 * tests/learning/learningSchemaCompiler.test.js
 *
 * Tests the pure Draft-07 schema validator, non-mutating Gemini wire compiler,
 * and schema conformance for all six task contracts.
 */

const {
  TASK_SCHEMAS,
  validateDraft07Schema,
  toGeminiStructuredOutputSchema,
} = require('../../src/utils/learning/learningSchemaUtils');

describe('Phase 7: Draft-07 Schema Validation & Gemini Wire Compiler', () => {
  describe('toGeminiStructuredOutputSchema (Pure & Non-Mutating Compiler)', () => {
    it('compiles all six task schemas into wire schemas', () => {
      const taskTypes = Object.keys(TASK_SCHEMAS);
      expect(taskTypes.length).toBe(6);

      for (const task of taskTypes) {
        const serverSchema = TASK_SCHEMAS[task];
        const wireSchema = toGeminiStructuredOutputSchema(serverSchema);

        expect(wireSchema).toBeDefined();
        expect(typeof wireSchema).toBe('object');
        expect(wireSchema).not.toBe(serverSchema); // wireSchema !== serverSchema by reference
        expect(wireSchema.$schema).toBeUndefined(); // Strips $schema
        expect(wireSchema.$id).toBeUndefined(); // Strips $id
        expect(wireSchema.type).toBe('object');
        expect(wireSchema.properties).toBeDefined();
        expect(wireSchema.required).toBeDefined();
      }
    });

    it('guarantees server schema is never mutated and remains deep equal', () => {
      for (const [task, serverSchema] of Object.entries(TASK_SCHEMAS)) {
        const snapshotBefore = JSON.stringify(serverSchema);
        const wire = toGeminiStructuredOutputSchema(serverSchema);
        const snapshotAfter = JSON.stringify(serverSchema);

        expect(snapshotAfter).toBe(snapshotBefore);
        expect(serverSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
        expect(wire.$schema).toBeUndefined();
      }
    });

    it('preserves nullable JSON Schema unions in wire schema', () => {
      const tutorWire = toGeminiStructuredOutputSchema(TASK_SCHEMAS.concept_tutor);
      expect(tutorWire.properties.formulaSummary.type).toEqual(['string', 'null']);
      expect(tutorWire.properties.workedExample.type).toEqual(['object', 'null']);

      const attemptWire = toGeminiStructuredOutputSchema(TASK_SCHEMAS.explain_attempt);
      expect(attemptWire.properties.confidence.type).toEqual(['number', 'null']);

      const planWire = toGeminiStructuredOutputSchema(TASK_SCHEMAS.explain_plan);
      expect(planWire.properties.revisionSummary.type).toEqual(['string', 'null']);
    });
  });

  describe('validateDraft07Schema (Authoritative Local Validator)', () => {
    it('validates a schema-valid concept_tutor payload', () => {
      const payload = {
        topic: 'Algebra',
        pattern: 'Linear Equations',
        conceptExplanation: 'Explanation of linear equations grounded in curriculum.',
        formulaSummary: 'ax + b = 0',
        workedExample: {
          setup: 'Solve 2x + 4 = 10',
          solutionSteps: ['Subtract 4 from both sides: 2x = 6', 'Divide by 2: x = 3'],
          finalResult: 'x = 3',
        },
        keyTakeaway: 'Isolate the variable systematically.',
      };

      const res = validateDraft07Schema(payload, TASK_SCHEMAS.concept_tutor);
      expect(res.valid).toBe(true);
      expect(res.errors).toEqual([]);
    });

    it('rejects concept_tutor payload missing required field', () => {
      const payload = {
        topic: 'Algebra',
        pattern: 'Linear Equations',
        conceptExplanation: 'Explanation',
        // formulaSummary missing
        workedExample: null,
        keyTakeaway: 'Takeaway',
      };

      const res = validateDraft07Schema(payload, TASK_SCHEMAS.concept_tutor);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('formulaSummary'))).toBe(true);
    });

    it('rejects payload with additionalProperties when additionalProperties: false', () => {
      const payload = {
        topic: 'Algebra',
        pattern: 'Linear Equations',
        conceptExplanation: 'Explanation',
        formulaSummary: null,
        workedExample: null,
        keyTakeaway: 'Takeaway',
        unauthorizedField: 'not allowed',
      };

      const res = validateDraft07Schema(payload, TASK_SCHEMAS.concept_tutor);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('unauthorizedField'))).toBe(true);
    });

    it('rejects string exceeding maxLength', () => {
      const payload = {
        hintLevel: 1,
        hint: 'A'.repeat(601), // maxLength is 600
        revealsAnswer: false,
        nextAction: 'try_calculation',
      };

      const res = validateDraft07Schema(payload, TASK_SCHEMAS.hint);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('maxLength'))).toBe(true);
    });

    it('rejects number outside minimum or maximum', () => {
      const payload = {
        hintLevel: 0, // minimum is 1
        hint: 'Check the problem statement.',
        revealsAnswer: false,
        nextAction: 'try_calculation',
      };

      const res = validateDraft07Schema(payload, TASK_SCHEMAS.hint);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('minimum'))).toBe(true);
    });

    it('rejects invalid enum value', () => {
      const payload = {
        hintLevel: 1,
        hint: 'Check the problem statement.',
        revealsAnswer: false,
        nextAction: 'invalid_action',
      };

      const res = validateDraft07Schema(payload, TASK_SCHEMAS.hint);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('enum'))).toBe(true);
    });

    it('rejects array exceeding maxItems', () => {
      const payload = {
        masteryInterpretation: 'Interpretation',
        strengths: ['s1', 's2', 's3', 's4', 's5'], // maxItems is 4
        weaknesses: [],
        recommendedAction: 'Keep practicing',
      };

      const res = validateDraft07Schema(payload, TASK_SCHEMAS.explain_progress);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('maxItems'))).toBe(true);
    });
  });
});
