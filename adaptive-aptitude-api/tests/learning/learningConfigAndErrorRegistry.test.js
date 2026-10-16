'use strict';

/**
 * tests/learning/learningConfigAndErrorRegistry.test.js
 *
 * Tests dynamic error registry completeness, HTTP status mappings,
 * algorithm versioning, runtime limits, and prompt versions.
 */

const {
  PHASE7_ALGORITHM_VERSION,
  LEARNING_LLM_RUNTIME,
  LEARNING_CACHE_ENABLED,
  LEARNING_RATE_LIMITS,
  LEARNING_TASK_TYPES,
  LEARNING_ERROR_CODES,
  LEARNING_HTTP_STATUS_MAP,
} = require('../../src/config/learningConfig');

const { PROMPT_VERSIONS } = require('../../src/config/prompts/promptVersions');

describe('Phase 7: Learning Config & Dynamic Error Registry Consistency', () => {
  describe('Constants & Runtime Boundaries', () => {
    it('enforces PHASE7_ALGORITHM_VERSION = "v1"', () => {
      expect(PHASE7_ALGORITHM_VERSION).toBe('v1');
    });

    it('enforces LEARNING_LLM_RUNTIME invariants (8000ms timeout, 600 maxOutputTokens, 4 turns)', () => {
      expect(LEARNING_LLM_RUNTIME.timeoutMs).toBe(8000);
      expect(LEARNING_LLM_RUNTIME.maxOutputTokens).toBe(600);
      expect(LEARNING_LLM_RUNTIME.maxConversationTurns).toBe(4);
      expect(Object.isFrozen(LEARNING_LLM_RUNTIME)).toBe(true);
    });

    it('enforces LEARNING_CACHE_ENABLED = false in V1', () => {
      expect(LEARNING_CACHE_ENABLED).toBe(false);
    });

    it('enforces process-local rate limits (30 req/hr, 2 concurrent)', () => {
      expect(LEARNING_RATE_LIMITS.maxRequestsPerHour).toBe(30);
      expect(LEARNING_RATE_LIMITS.maxConcurrentRequests).toBe(2);
      expect(Object.isFrozen(LEARNING_RATE_LIMITS)).toBe(true);
    });

    it('defines exactly the six canonical task types', () => {
      const types = Object.values(LEARNING_TASK_TYPES);
      expect(types).toEqual([
        'concept_tutor',
        'hint',
        'explain_attempt',
        'explain_progress',
        'explain_plan',
        'mock_review',
      ]);
      expect(Object.isFrozen(LEARNING_TASK_TYPES)).toBe(true);
    });

    it('enforces immutable prompt versions across all six tasks', () => {
      expect(PROMPT_VERSIONS.PHASE7_ALGORITHM_VERSION).toBe('v1');
      expect(PROMPT_VERSIONS.TUTOR_PROMPT_VERSION).toBe('v1.0.0');
      expect(PROMPT_VERSIONS.HINT_PROMPT_VERSION).toBe('v1.0.0');
      expect(PROMPT_VERSIONS.MISTAKE_PROMPT_VERSION).toBe('v1.0.0');
      expect(PROMPT_VERSIONS.PROGRESS_PROMPT_VERSION).toBe('v1.0.0');
      expect(PROMPT_VERSIONS.PLAN_PROMPT_VERSION).toBe('v1.0.0');
      expect(PROMPT_VERSIONS.MOCK_REVIEW_PROMPT_VERSION).toBe('v1.0.0');
      expect(Object.isFrozen(PROMPT_VERSIONS)).toBe(true);
    });
  });

  describe('Dynamic Error Registry Consistency', () => {
    it('guarantees every error in LEARNING_ERROR_CODES has an HTTP status in LEARNING_HTTP_STATUS_MAP', () => {
      const errorKeys = Object.keys(LEARNING_ERROR_CODES);
      expect(errorKeys.length).toBeGreaterThanOrEqual(20);

      for (const key of errorKeys) {
        const code = LEARNING_ERROR_CODES[key];
        expect(code).toBe(key); // Machine-readable key matches code string
        const status = LEARNING_HTTP_STATUS_MAP[code];
        expect(typeof status).toBe('number');
        expect(status >= 400 && status <= 504).toBe(true);
      }
    });

    it('guarantees every status map entry corresponds to an existing error code', () => {
      const mapKeys = Object.keys(LEARNING_HTTP_STATUS_MAP);
      for (const code of mapKeys) {
        expect(LEARNING_ERROR_CODES[code]).toBe(code);
      }
    });

    it('strictly forbids generic INVALID_REQUEST error code', () => {
      expect(LEARNING_ERROR_CODES.INVALID_REQUEST).toBeUndefined();
      expect(LEARNING_HTTP_STATUS_MAP.INVALID_REQUEST).toBeUndefined();
    });

    it('verifies specific critical error code status mappings', () => {
      expect(LEARNING_HTTP_STATUS_MAP.VALIDATION_ERROR).toBe(400);
      expect(LEARNING_HTTP_STATUS_MAP.INVALID_HINT_LEVEL).toBe(400);
      expect(LEARNING_HTTP_STATUS_MAP.INVALID_TASK_TYPE).toBe(400);
      expect(LEARNING_HTTP_STATUS_MAP.MOCK_SESSION_ABANDONED).toBe(400);
      expect(LEARNING_HTTP_STATUS_MAP.ACTIVE_MOCK_ANSWER_LEAKAGE_PROHIBITED).toBe(403);
      expect(LEARNING_HTTP_STATUS_MAP.ANSWER_REVEAL_LOCKED_ATTEMPT_REQUIRED).toBe(403);
      expect(LEARNING_HTTP_STATUS_MAP.FORBIDDEN).toBe(403);
      expect(LEARNING_HTTP_STATUS_MAP.QUESTION_NOT_FOUND).toBe(404);
      expect(LEARNING_HTTP_STATUS_MAP.ATTEMPT_NOT_FOUND).toBe(404);
      expect(LEARNING_HTTP_STATUS_MAP.MOCK_SESSION_NOT_FOUND).toBe(404);
      expect(LEARNING_HTTP_STATUS_MAP.STUDY_PLAN_NOT_FOUND).toBe(404);
      expect(LEARNING_HTTP_STATUS_MAP.DAILY_OBJECTIVE_NOT_FOUND).toBe(404);
      expect(LEARNING_HTTP_STATUS_MAP.USER_NOT_FOUND).toBe(404);
      expect(LEARNING_HTTP_STATUS_MAP.MOCK_SESSION_NOT_TERMINAL).toBe(409);
      expect(LEARNING_HTTP_STATUS_MAP.FINALIZATION_IN_PROGRESS).toBe(409);
      expect(LEARNING_HTTP_STATUS_MAP.LEARNING_RATE_LIMIT_EXCEEDED).toBe(429);
      expect(LEARNING_HTTP_STATUS_MAP.LLM_INVALID_STRUCTURED_OUTPUT).toBe(502);
      expect(LEARNING_HTTP_STATUS_MAP.HALLUCINATION_GUARD_TRIGGERED).toBe(502);
      expect(LEARNING_HTTP_STATUS_MAP.LLM_CANONICAL_TRUTH_CONFLICT).toBe(502);
      expect(LEARNING_HTTP_STATUS_MAP.LLM_PROVIDER_UNAVAILABLE).toBe(503);
      expect(LEARNING_HTTP_STATUS_MAP.LLM_PROVIDER_TIMEOUT).toBe(504);
      expect(LEARNING_HTTP_STATUS_MAP.LEARNING_CONTEXT_GENERATION_FAILED).toBe(500);
    });
  });
});
