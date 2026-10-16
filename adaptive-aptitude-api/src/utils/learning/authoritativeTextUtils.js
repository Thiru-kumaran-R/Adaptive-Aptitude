'use strict';

/**
 * authoritativeTextUtils.js — Pure Authoritative Text Bounding Utilities
 */

const MAX_HINT_CHARS = 600;

/**
 * Pure, authoritative Level-5 hint composer.
 * Reused identically across FakeLLMProvider and deterministic fallback generation.
 * Guarantees Question.answer is NEVER truncated, modified, or re-keyed.
 * Safely bounds storedExplanation into remaining Section 8.2 DTO budget.
 *
 * @param {Object} params
 * @param {string} params.answer - Canonical answer string
 * @param {string} [params.explanation] - Canonical explanation string
 * @param {number} [params.maxLength] - Maximum hint length (default 600)
 * @returns {string} Composed Level-5 hint string
 */
function composeAuthorizedLevel5Hint({ answer, explanation, maxLength = MAX_HINT_CHARS }) {
  const cleanAnswer = String(answer || '').trim();

  if (!cleanAnswer) {
    throw new Error('LEVEL5_FALLBACK_ASSEMBLY_FAILED: canonical answer missing');
  }

  const prefix = `Canonical answer: ${cleanAnswer}.`;

  if (prefix.length > maxLength) {
    throw new Error('LEVEL5_FALLBACK_ASSEMBLY_FAILED: canonical answer exceeds hint DTO capacity');
  }

  const cleanExplanation = String(explanation || '').trim();

  if (!cleanExplanation) {
    return prefix;
  }

  const separator = ' ';
  const remaining = maxLength - prefix.length - separator.length;

  if (remaining <= 0) {
    return prefix;
  }

  const boundedExplanation =
    cleanExplanation.length <= remaining
      ? cleanExplanation
      : cleanExplanation.slice(0, Math.max(0, remaining - 1)) + '…';

  return prefix + separator + boundedExplanation;
}

/**
 * Helper to compose Level-5 hint from question object.
 *
 * @param {Object} question
 * @returns {string}
 */
function composeLevel5Hint(question) {
  return composeAuthorizedLevel5Hint({
    answer: question.answer,
    explanation: question.explanation,
    maxLength: MAX_HINT_CHARS,
  });
}

/**
 * Pure utility that performs deterministic DTO length bounding without
 * inventing content, summarizing, compressing, or altering factual meaning.
 *
 * @param {string} value - Stored authoritative text
 * @param {number} maxLength - Schema maxLength limit
 * @returns {string} Bounded text
 */
function boundAuthoritativeText(value, maxLength) {
  const text = String(value || '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  if (maxLength <= 1) {
    return text.slice(0, maxLength);
  }

  return text.slice(0, maxLength - 1) + '…';
}

module.exports = {
  MAX_HINT_CHARS,
  composeAuthorizedLevel5Hint,
  composeLevel5Hint,
  boundAuthoritativeText,
};
