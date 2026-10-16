'use strict';

/**
 * learningSchemaUtils.js — Authoritative Draft-07 Schemas, Local Validator & Gemini Wire Compiler
 */

const CONCEPT_TUTOR_SCHEMA = Object.freeze({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['topic', 'pattern', 'conceptExplanation', 'formulaSummary', 'workedExample', 'keyTakeaway'],
  properties: {
    topic: { type: 'string' },
    pattern: { type: 'string' },
    conceptExplanation: { type: 'string', maxLength: 1000 },
    formulaSummary: { type: ['string', 'null'], maxLength: 300 },
    workedExample: {
      type: ['object', 'null'],
      required: ['setup', 'solutionSteps', 'finalResult'],
      properties: {
        setup: { type: 'string' },
        solutionSteps: { type: 'array', items: { type: 'string' } },
        finalResult: { type: 'string' },
      },
    },
    keyTakeaway: { type: 'string', maxLength: 200 },
  },
  additionalProperties: false,
});

const HINT_SCHEMA = Object.freeze({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['hintLevel', 'hint', 'revealsAnswer', 'nextAction'],
  properties: {
    hintLevel: { type: 'integer', minimum: 1, maximum: 5 },
    hint: { type: 'string', maxLength: 600 },
    revealsAnswer: { type: 'boolean' },
    nextAction: {
      type: 'string',
      enum: ['try_calculation', 'review_formula', 'check_options', 'view_explanation'],
    },
  },
  additionalProperties: false,
});

const EXPLAIN_ATTEMPT_SCHEMA = Object.freeze({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['conceptSummary', 'mistakeExplanation', 'correctApproach', 'revisionSuggestion', 'confidence'],
  properties: {
    conceptSummary: { type: 'string', maxLength: 400 },
    mistakeExplanation: { type: 'string', maxLength: 800 },
    correctApproach: { type: 'string', maxLength: 800 },
    revisionSuggestion: { type: 'string', maxLength: 200 },
    confidence: { type: ['number', 'null'], minimum: 0.0, maximum: 1.0 },
  },
  additionalProperties: false,
});

const EXPLAIN_PROGRESS_SCHEMA = Object.freeze({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['masteryInterpretation', 'strengths', 'weaknesses', 'recommendedAction'],
  properties: {
    masteryInterpretation: { type: 'string', maxLength: 500 },
    strengths: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    weaknesses: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    recommendedAction: { type: 'string', maxLength: 300 },
  },
  additionalProperties: false,
});

const MOCK_REVIEW_SCHEMA = Object.freeze({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['overallScoreInterpretation', 'sectionDiagnostics', 'pacingObservations', 'priorityRevisionPatterns'],
  properties: {
    overallScoreInterpretation: { type: 'string', maxLength: 600 },
    sectionDiagnostics: {
      type: 'array',
      items: {
        type: 'object',
        required: ['sectionId', 'diagnosticMessage', 'performanceTier'],
        properties: {
          sectionId: { type: 'string' },
          diagnosticMessage: { type: 'string' },
          performanceTier: { type: ['string', 'null'], enum: ['strong', 'competent', 'needs_focus', null] },
        },
      },
    },
    pacingObservations: { type: 'string', maxLength: 500 },
    priorityRevisionPatterns: { type: 'array', items: { type: 'string' }, maxItems: 5 },
  },
  additionalProperties: false,
});

const EXPLAIN_PLAN_SCHEMA = Object.freeze({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: [
    'planId',
    'targetDate',
    'objectiveSummary',
    'schedulingReasons',
    'revisionSummary',
    'recommendedAction',
  ],
  properties: {
    planId: { type: 'string' },
    targetDate: { type: 'string' },
    objectiveSummary: { type: 'string', maxLength: 600 },
    schedulingReasons: {
      type: 'array',
      maxItems: 6,
      items: { type: 'string' },
    },
    revisionSummary: {
      type: ['string', 'null'],
      maxLength: 500,
    },
    recommendedAction: { type: 'string', maxLength: 300 },
  },
  additionalProperties: false,
});

const TASK_SCHEMAS = Object.freeze({
  concept_tutor: CONCEPT_TUTOR_SCHEMA,
  hint: HINT_SCHEMA,
  explain_attempt: EXPLAIN_ATTEMPT_SCHEMA,
  explain_progress: EXPLAIN_PROGRESS_SCHEMA,
  explain_plan: EXPLAIN_PLAN_SCHEMA,
  mock_review: MOCK_REVIEW_SCHEMA,
});

/**
 * Pure Draft-07 validator for JSON Schema contracts.
 * Recursively validates data against schema keywords.
 *
 * @param {*} data
 * @param {Object} schema
 * @param {string} [path='root']
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateDraft07Schema(data, schema, path = 'root') {
  const errors = [];

  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] };
  }

  // 1. Type check (supports single type or union array, e.g. ["string", "null"])
  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = getJsonType(data);

    const matchesType = allowedTypes.some((expected) => {
      if (expected === 'integer') {
        return typeof data === 'number' && Number.isInteger(data);
      }
      return expected === actualType;
    });

    if (!matchesType) {
      errors.push(`${path}: expected type ${JSON.stringify(schema.type)}, received ${actualType}`);
      return { valid: false, errors };
    }
  }

  // If value is null and null is allowed, nullable fields do not need further constraint checks
  if (data === null) {
    return { valid: true, errors: [] };
  }

  // 2. Enum check
  if (schema.enum !== undefined && Array.isArray(schema.enum)) {
    const matchesEnum = schema.enum.some((val) => val === data);
    if (!matchesEnum) {
      errors.push(`${path}: value ${JSON.stringify(data)} does not match enum ${JSON.stringify(schema.enum)}`);
    }
  }

  // 3. String constraints
  if (typeof data === 'string') {
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push(`${path}: string length ${data.length} exceeds maxLength ${schema.maxLength}`);
    }
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push(`${path}: string length ${data.length} is less than minLength ${schema.minLength}`);
    }
  }

  // 4. Number / Integer constraints
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push(`${path}: number ${data} is less than minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push(`${path}: number ${data} exceeds maximum ${schema.maximum}`);
    }
  }

  // 5. Object constraints
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    // Required properties
    if (Array.isArray(schema.required)) {
      for (const reqKey of schema.required) {
        if (data[reqKey] === undefined) {
          errors.push(`${path}: missing required property "${reqKey}"`);
        }
      }
    }

    // Additional properties
    if (schema.additionalProperties === false) {
      const allowedKeys = new Set(Object.keys(schema.properties || {}));
      for (const actualKey of Object.keys(data)) {
        if (!allowedKeys.has(actualKey)) {
          errors.push(`${path}: additional property "${actualKey}" is not allowed`);
        }
      }
    }

    // Property schemas
    if (schema.properties) {
      for (const [propKey, propSchema] of Object.entries(schema.properties)) {
        if (data[propKey] !== undefined) {
          const res = validateDraft07Schema(data[propKey], propSchema, `${path}.${propKey}`);
          if (!res.valid) {
            errors.push(...res.errors);
          }
        }
      }
    }
  }

  // 6. Array constraints
  if (Array.isArray(data)) {
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push(`${path}: array length ${data.length} exceeds maxItems ${schema.maxItems}`);
    }
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(`${path}: array length ${data.length} is less than minItems ${schema.minItems}`);
    }
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const res = validateDraft07Schema(data[i], schema.items, `${path}[${i}]`);
        if (!res.valid) {
          errors.push(...res.errors);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to determine JSON type of a JavaScript value.
 *
 * @param {*} val
 * @returns {'string'|'number'|'boolean'|'object'|'array'|'null'|'undefined'}
 */
function getJsonType(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

/**
 * Pure, non-mutating compiler from Draft-07 server schema to Gemini provider wire schema.
 *
 * Guarantees:
 * - wireSchema !== serverSchema (different object reference)
 * - serverSchema remains byte- and deep-equal to pre-compilation form
 * - Strips server metadata ($schema, $id, title, description)
 * - Preserves structural schema constraints (type, properties, required, items, enum, minimum, maximum, etc.)
 *
 * @param {Object} serverSchema
 * @returns {Object} providerWireSchema
 */
function toGeminiStructuredOutputSchema(serverSchema) {
  if (!serverSchema || typeof serverSchema !== 'object') {
    return serverSchema;
  }

  const wire = {};

  for (const [key, value] of Object.entries(serverSchema)) {
    // Strip server-specific metadata
    if (key === '$schema' || key === '$id' || key === 'title' || key === 'description') {
      continue;
    }

    if (key === 'properties' && value && typeof value === 'object') {
      wire.properties = {};
      for (const [propKey, propVal] of Object.entries(value)) {
        wire.properties[propKey] = toGeminiStructuredOutputSchema(propVal);
      }
    } else if (key === 'items' && value && typeof value === 'object') {
      wire.items = toGeminiStructuredOutputSchema(value);
    } else if (Array.isArray(value)) {
      wire[key] = [...value];
    } else if (value && typeof value === 'object') {
      wire[key] = toGeminiStructuredOutputSchema(value);
    } else {
      wire[key] = value;
    }
  }

  return wire;
}

module.exports = {
  CONCEPT_TUTOR_SCHEMA,
  HINT_SCHEMA,
  EXPLAIN_ATTEMPT_SCHEMA,
  EXPLAIN_PROGRESS_SCHEMA,
  MOCK_REVIEW_SCHEMA,
  EXPLAIN_PLAN_SCHEMA,
  TASK_SCHEMAS,
  validateDraft07Schema,
  toGeminiStructuredOutputSchema,
};
