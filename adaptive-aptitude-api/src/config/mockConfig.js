'use strict';

/**
 * mockConfig.js — Central Configuration & Complete Error-Code Registry for Phase 6
 *
 * Implements the verified constants, error codes, and HTTP mappings according to
 * the authoritative Phase 6 specification.
 * Zero magic numbers; zero undocumented string literals.
 */

module.exports = Object.freeze({
  MOCK_ALGORITHM_VERSION: 'v1',

  MOCK_MODES: Object.freeze({
    STANDARD: 'standard',
    DIAGNOSTIC: 'diagnostic',
  }),

  NAVIGATION_POLICIES: Object.freeze({
    FREE: 'free',
    SECTION_LOCKED: 'section_locked',
  }),

  SESSION_STATUS: Object.freeze({
    CREATED: 'created',
    STARTED: 'started',
    SUBMITTED: 'submitted',
    EXPIRED: 'expired',
    ABANDONED: 'abandoned',
  }),

  FINALIZATION_STATE: Object.freeze({
    IDLE: 'idle',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
  }),

  SECTION_STATUS: Object.freeze({
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
  }),

  BLUEPRINT_STATUS: Object.freeze({
    ACTIVE: 'active',
  }),

  RESPONSE_STATUS: Object.freeze({
    VIEWED: 'viewed',
    ANSWERED: 'answered',
  }),

  DIFFICULTY_BANDS: Object.freeze({
    EASY: Object.freeze({ min: 1, max: 3, label: 'easy' }),
    MEDIUM: Object.freeze({ min: 4, max: 7, label: 'medium' }),
    HARD: Object.freeze({ min: 8, max: 10, label: 'hard' }),
  }),

  DEFAULT_DIFFICULTY_DISTRIBUTION: Object.freeze({
    easy: 0.30,
    medium: 0.50,
    hard: 0.20,
  }),

  MOCK_RECENT_QUESTION_EXCLUSION_LIMIT: 50,

  FINALIZATION_LEASE: Object.freeze({
    DURATION_MS: 30000, // 30 seconds initial lease
    HEARTBEAT_INTERVAL_MS: 5000, // Renew every 5 seconds or every 5 questions
  }),

  SESSION_LIMITS: Object.freeze({
    MIN_QUESTIONS: 1,
    MAX_QUESTIONS: 200,
    MIN_DURATION_MINUTES: 1,
    MAX_DURATION_MINUTES: 360, // 6 hours
    MAX_ALLOWED_TIME_TAKEN_SECONDS: 21600, // 6 hours cap for client time reporting
    PACING_TOLERANCE_SECONDS: 5, // Client transit/clock skew tolerance strictly for pacing metadata
  }),

  DIAGNOSTIC_THRESHOLDS: Object.freeze({
    WEAK_MASTERY_UPPER_BOUND: 0.70,
    DEVELOPING_MASTERY_UPPER_BOUND: 0.85,
  }),

  DEFAULT_GLOBAL_SCORING: Object.freeze({
    correctMarks: 1.0,
    incorrectMarks: 0.0,
    unansweredMarks: 0.0,
  }),

  MOCK_ERROR_CODES: Object.freeze({
    MOCK_BLUEPRINT_NOT_FOUND: 'MOCK_BLUEPRINT_NOT_FOUND',
    INVALID_BLUEPRINT: 'INVALID_BLUEPRINT',
    MOCK_SCOPE_REQUIRED: 'MOCK_SCOPE_REQUIRED',
    INVALID_TOPIC: 'INVALID_TOPIC',
    INVALID_PATTERN: 'INVALID_PATTERN',
    INVALID_SECTION_SCOPE: 'INVALID_SECTION_SCOPE',
    INVALID_DIFFICULTY_DISTRIBUTION: 'INVALID_DIFFICULTY_DISTRIBUTION',
    INVALID_SCORING: 'INVALID_SCORING',
    INVALID_SECTION_TIMING: 'INVALID_SECTION_TIMING',
    INSUFFICIENT_QUESTIONS_FOR_MOCK: 'INSUFFICIENT_QUESTIONS_FOR_MOCK',
    MOCK_SESSION_NOT_FOUND: 'MOCK_SESSION_NOT_FOUND',
    MOCK_SESSION_EXPIRED: 'MOCK_SESSION_EXPIRED',
    INVALID_SESSION_STATE: 'INVALID_SESSION_STATE',
    QUESTION_NOT_IN_SESSION: 'QUESTION_NOT_IN_SESSION',
    QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND', // Centralized (404)
    INVALID_OPTION: 'INVALID_OPTION',
    INVALID_TIME_TAKEN: 'INVALID_TIME_TAKEN',
    RESPONSE_FROZEN: 'RESPONSE_FROZEN',
    SECTION_LOCKED: 'SECTION_LOCKED',
    SECTION_NOT_ACTIVE: 'SECTION_NOT_ACTIVE',
    FINALIZATION_IN_PROGRESS: 'FINALIZATION_IN_PROGRESS',
    FINALIZATION_LEASE_LOST: 'FINALIZATION_LEASE_LOST',
    FINALIZATION_EXECUTION_FAILED: 'FINALIZATION_EXECUTION_FAILED', // Centralized (500)
    SESSION_STATE_CONFLICT: 'SESSION_STATE_CONFLICT',
    MOCK_SESSION_NOT_TERMINAL: 'MOCK_SESSION_NOT_TERMINAL',
    RESULT_INCOMPLETE_FINALIZATION: 'RESULT_INCOMPLETE_FINALIZATION', // Centralized (500)
    RESULT_INTEGRITY_ERROR: 'RESULT_INTEGRITY_ERROR', // Centralized (500)
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    FORBIDDEN: 'FORBIDDEN',
  }),

  MOCK_HTTP_STATUS_MAP: Object.freeze({
    // 400 Bad Request — Malformed client requests / syntax / bounds violations
    INVALID_BLUEPRINT: 400,
    MOCK_SCOPE_REQUIRED: 400,
    INVALID_TOPIC: 400,
    INVALID_PATTERN: 400,
    INVALID_SECTION_SCOPE: 400,
    INVALID_DIFFICULTY_DISTRIBUTION: 400,
    INVALID_SCORING: 400,
    INVALID_SECTION_TIMING: 400,
    INSUFFICIENT_QUESTIONS_FOR_MOCK: 400,
    INVALID_SESSION_STATE: 400,
    QUESTION_NOT_IN_SESSION: 400,
    INVALID_OPTION: 400,
    INVALID_TIME_TAKEN: 400,
    MOCK_SESSION_NOT_TERMINAL: 400,

    // 403 Forbidden — Access control & ownership mismatch
    FORBIDDEN: 403,

    // 404 Not Found — Resource absence
    MOCK_BLUEPRINT_NOT_FOUND: 404,
    MOCK_SESSION_NOT_FOUND: 404,
    QUESTION_NOT_FOUND: 404,
    USER_NOT_FOUND: 404,

    // 409 Conflict — Lifecycle state races, lock barriers & lease contention
    MOCK_SESSION_EXPIRED: 409,
    RESPONSE_FROZEN: 409,
    SECTION_LOCKED: 409,
    SECTION_NOT_ACTIVE: 409,
    FINALIZATION_IN_PROGRESS: 409,
    FINALIZATION_LEASE_LOST: 409,
    SESSION_STATE_CONFLICT: 409,

    // 500 Internal Server Error — Worker execution failure & persisted data invariant violations
    FINALIZATION_EXECUTION_FAILED: 500,
    RESULT_INCOMPLETE_FINALIZATION: 500,
    RESULT_INTEGRITY_ERROR: 500,
  }),
});
