'use strict';

/**
 * responseValidator.js — Universal Local Draft-07 Schema & Semantic Truth Validation
 *
 * Implements authoritative local server-side validation pipeline:
 * 1. JSON Schema validation (Draft-07 via learningSchemaUtils)
 * 2. Task-specific semantic and platform truth validation
 * 3. Content-level hint leakage and hallucination guards
 */

const { TASK_SCHEMAS, validateDraft07Schema } = require('../../utils/learning/learningSchemaUtils');
const { validateHintContentLeakage } = require('../../utils/learning/hintLeakageUtils');
const { topicExists, patternExists } = require('../patternRegistryService');
const { LEARNING_ERROR_CODES } = require('../../config/learningConfig');
const LearningError = require('../../utils/learning/LearningError');

/**
 * Validates model output against the authoritative Draft-07 JSON Schema for the task.
 *
 * @param {Object} data - Parsed model completion
 * @param {string} taskType - Canonical task type
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSchema(data, taskType) {
  const schema = TASK_SCHEMAS[taskType];
  if (!schema) {
    return {
      valid: false,
      errors: [`No registered schema for taskType: "${taskType}"`],
    };
  }

  return validateDraft07Schema(data, schema);
}

/**
 * Validates task-specific semantic truth and platform alignment.
 *
 * @param {Object} data - Parsed and schema-valid completion
 * @param {string} taskType - Canonical task type
 * @param {Object} context - Grounded canonical context
 * @param {Object} [rawQuestion] - Raw Phase 2 Question document (for hint/attempt leakage)
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateSemantics(data, taskType, context = {}, rawQuestion = null) {
  if (!data || typeof data !== 'object') {
    return { valid: false, reason: 'Output must be a non-null object.' };
  }

  switch (taskType) {
    case 'concept_tutor': {
      const expectedTopic = context.topicContext?.topic;
      const expectedPattern = context.topicContext?.pattern;

      if (expectedTopic && data.topic !== expectedTopic) {
        return { valid: false, reason: `Topic mismatch: expected "${expectedTopic}", received "${data.topic}".` };
      }
      if (expectedPattern && data.pattern !== expectedPattern) {
        return { valid: false, reason: `Pattern mismatch: expected "${expectedPattern}", received "${data.pattern}".` };
      }
      if (!topicExists(data.topic)) {
        return { valid: false, reason: `Invalid canonical topic "${data.topic}".` };
      }
      if (!patternExists(data.pattern)) {
        return { valid: false, reason: `Invalid canonical pattern "${data.pattern}".` };
      }
      return { valid: true };
    }

    case 'hint': {
      const expectedLevel = context.taskInputContext?.hintLevel;
      if (data.hintLevel !== expectedLevel) {
        return {
          valid: false,
          reason: `Hint level mismatch: expected ${expectedLevel}, received ${data.hintLevel}.`,
        };
      }

      const q = rawQuestion || {
        answer: context.questionContext?.correctAnswer,
        explanation: context.questionContext?.storedExplanation,
        options: context.questionContext?.options || [],
      };

      if (expectedLevel >= 1 && expectedLevel <= 4) {
        if (data.revealsAnswer !== false) {
          return { valid: false, reason: 'Levels 1–4 hint must have revealsAnswer === false.' };
        }

        // Multi-representation leakage check
        const isSafe = validateHintContentLeakage(data.hint, false, q);
        if (!isSafe) {
          return { valid: false, reason: 'Hint text contains answer leakage or reveal phrasing.' };
        }
      } else if (expectedLevel === 5) {
        if (data.revealsAnswer !== true) {
          return { valid: false, reason: 'Level 5 hint must have revealsAnswer === true.' };
        }
        if (q.answer) {
          const normAnswer = String(q.answer).toLowerCase().trim();
          const normHint = String(data.hint || '').toLowerCase();
          if (!normHint.includes(normAnswer)) {
            return {
              valid: false,
              reason: 'Level 5 hint must faithfully include or reference the canonical answer.',
            };
          }
        }
      }
      return { valid: true };
    }

    case 'explain_attempt': {
      const isCorrect = context.attemptContext?.isCorrect;
      if (isCorrect === true) {
        // Correct attempt: should not claim mismatch or wrong answer
        const mistakeText = String(data.mistakeExplanation || '').toLowerCase();
        if (mistakeText.includes('differ') || mistakeText.includes('incorrect') || mistakeText.includes('wrong')) {
          return { valid: false, reason: 'Attempt was correct but mistakeExplanation claims error.' };
        }
      } else if (isCorrect === false) {
        // Incorrect attempt: should not claim match or fully correct
        const mistakeText = String(data.mistakeExplanation || '').toLowerCase();
        if (mistakeText.includes('matches the canonical') || mistakeText.includes('applied correctly')) {
          return { valid: false, reason: 'Attempt was incorrect but mistakeExplanation claims success.' };
        }
      }

      if (data.revisionSuggestion && typeof data.revisionSuggestion === 'string') {
        const suggestion = data.revisionSuggestion.trim();
        if (suggestion && !patternExists(suggestion)) {
          return { valid: false, reason: `revisionSuggestion "${suggestion}" is not a canonical pattern.` };
        }
      }
      return { valid: true };
    }

    case 'explain_progress': {
      return { valid: true };
    }

    case 'explain_plan': {
      const expectedPlanId = context.planningContext?.planId;
      const expectedTargetDate = context.planningContext?.targetDate;

      if (expectedPlanId && String(data.planId) !== String(expectedPlanId)) {
        return {
          valid: false,
          reason: `planId mismatch: expected "${expectedPlanId}", received "${data.planId}".`,
        };
      }
      if (expectedTargetDate && String(data.targetDate) !== String(expectedTargetDate)) {
        return {
          valid: false,
          reason: `targetDate mismatch: expected "${expectedTargetDate}", received "${data.targetDate}".`,
        };
      }

      // If no revision item exists, revisionSummary must be null
      if (context.planningContext?.revisionItem === null && data.revisionSummary !== null) {
        return {
          valid: false,
          reason: 'revisionSummary must be null when no revision is scheduled on targetDate.',
        };
      }
      return { valid: true };
    }

    case 'mock_review': {
      const allowedSectionIds = new Set(
        (context.mockAnalyticsContext?.sectionBreakdown || []).map((s) => String(s.sectionId))
      );

      if (Array.isArray(data.sectionDiagnostics)) {
        for (const diag of data.sectionDiagnostics) {
          if (!allowedSectionIds.has(String(diag.sectionId))) {
            return {
              valid: false,
              reason: `sectionDiagnostics contains unknown sectionId: "${diag.sectionId}".`,
            };
          }
        }
      }
      return { valid: true };
    }

    default:
      return { valid: true };
  }
}

/**
 * Validates a response through the full local pipeline.
 *
 * @param {Object} data
 * @param {string} taskType
 * @param {Object} context
 * @param {Object} [rawQuestion]
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validatePipeline(data, taskType, context = {}, rawQuestion = null) {
  const schemaRes = validateSchema(data, taskType);
  if (!schemaRes.valid) {
    return {
      valid: false,
      errors: schemaRes.errors,
      failureType: 'invalid_output',
    };
  }

  const semanticRes = validateSemantics(data, taskType, context, rawQuestion);
  if (!semanticRes.valid) {
    return {
      valid: false,
      errors: [semanticRes.reason || 'Semantic validation failed.'],
      failureType: 'hallucination_guard',
    };
  }

  return { valid: true, errors: [] };
}

module.exports = {
  validateSchema,
  validateSemantics,
  validatePipeline,
};
